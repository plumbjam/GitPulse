import type {
  GitPulseDataset,
  GitPulseDatasetMode,
  GitPulseIdentity,
  GitPulseIdentityDataset,
  GitPulseLanguageStat,
  GitPulseRepo,
  GitPulseSummary,
} from '@/domain/gitpulse.types'
import { buildApproximateActivityDays } from './githubNormaliser'

const ACTIVE_REPO_WINDOW_DAYS = 180
const DORMANT_REPO_WINDOW_DAYS = 365
const LANGUAGE_FALLBACK_BYTES = 1

export function createEmptyGitPulseDataset(mode: GitPulseDatasetMode = 'demo'): GitPulseDataset {
  return {
    identities: [],
    profileMode: 'single',
    repos: [],
    days: [],
    summary: {
      totalIdentities: 0,
      successfulIdentities: 0,
      failedIdentities: 0,
      totalRepos: 0,
      activeRepos: 0,
      dormantRepos: 0,
      totalStars: 0,
      totalForks: 0,
      dominantLanguages: [],
      languageStats: [],
      activityScore: 0,
      consistencyScore: 0,
      burstinessScore: 0,
    },
    generatedAt: new Date().toISOString(),
    mode,
  }
}

export function mergeIdentityDatasets(
  identityDatasets: GitPulseIdentityDataset[],
  options: {
    generatedAt?: string
    mode?: GitPulseDatasetMode
  } = {},
): GitPulseDataset {
  if (!identityDatasets.length) {
    return {
      ...createEmptyGitPulseDataset(options.mode ?? 'demo'),
      generatedAt: options.generatedAt ?? new Date().toISOString(),
    }
  }

  const mode =
    options.mode ?? (identityDatasets.some((dataset) => dataset.mode === 'live') ? 'live' : 'demo')
  const identities = identityDatasets.map((dataset) => dataset.identity)
  const mergedRepos = mergeRepos(identityDatasets.flatMap((dataset) => dataset.repos))
  const days = buildApproximateActivityDays(mergedRepos)
  const summary = buildSummary(identities, mergedRepos, days)

  return {
    identities,
    profileMode: summary.successfulIdentities > 1 ? 'merged' : 'single',
    repos: mergedRepos,
    days,
    summary,
    generatedAt: options.generatedAt ?? new Date().toISOString(),
    mode,
  }
}

function mergeRepos(repos: GitPulseRepo[]) {
  const repoMap = new Map<string, GitPulseRepo>()

  for (const repo of repos) {
    const repoKey = getRepoKey(repo)
    const existingRepo = repoMap.get(repoKey)

    if (!existingRepo) {
      repoMap.set(repoKey, {
        ...repo,
        languages: { ...repo.languages },
        sourceUsernames: [...repo.sourceUsernames],
      })
      continue
    }

    const mergedLanguages = mergeLanguageMaps(existingRepo.languages, repo.languages)
    const sourceUsernames = mergeUniqueStrings(existingRepo.sourceUsernames, repo.sourceUsernames)

    repoMap.set(repoKey, {
      ...existingRepo,
      description: existingRepo.description ?? repo.description,
      primaryLanguage:
        getDominantLanguageName(mergedLanguages) ??
        existingRepo.primaryLanguage ??
        repo.primaryLanguage,
      languages: mergedLanguages,
      stars: Math.max(existingRepo.stars, repo.stars),
      forks: Math.max(existingRepo.forks, repo.forks),
      openIssues: Math.max(existingRepo.openIssues ?? 0, repo.openIssues ?? 0),
      createdAt:
        existingRepo.createdAt.localeCompare(repo.createdAt) <= 0
          ? existingRepo.createdAt
          : repo.createdAt,
      updatedAt:
        existingRepo.updatedAt.localeCompare(repo.updatedAt) >= 0
          ? existingRepo.updatedAt
          : repo.updatedAt,
      pushedAt:
        existingRepo.pushedAt.localeCompare(repo.pushedAt) >= 0
          ? existingRepo.pushedAt
          : repo.pushedAt,
      isFork: existingRepo.isFork || repo.isFork,
      isArchived: existingRepo.isArchived || repo.isArchived,
      sourceUsernames,
    })
  }

  return [...repoMap.values()].sort((left, right) => right.pushedAt.localeCompare(left.pushedAt))
}

function buildSummary(
  identities: GitPulseIdentity[],
  repos: GitPulseRepo[],
  days: GitPulseDataset['days'],
): GitPulseSummary {
  const successfulIdentities = identities.filter((identity) => identity.status === 'success').length
  const failedIdentities = identities.filter((identity) => identity.status === 'error').length
  const totalStars = repos.reduce((sum, repo) => sum + repo.stars, 0)
  const totalForks = repos.reduce((sum, repo) => sum + repo.forks, 0)
  const activeRepos = repos.filter(
    (repo) => getAgeInDays(repo.pushedAt) <= ACTIVE_REPO_WINDOW_DAYS,
  ).length
  const dormantRepos = repos.filter(
    (repo) => getAgeInDays(repo.pushedAt) > DORMANT_REPO_WINDOW_DAYS,
  ).length
  const languageStats = buildLanguageStats(repos)
  const mostRecentPushAt = repos[0]?.pushedAt

  return {
    totalIdentities: identities.length,
    successfulIdentities,
    failedIdentities,
    totalRepos: repos.length,
    activeRepos,
    dormantRepos,
    totalStars,
    totalForks,
    dominantLanguages: languageStats.slice(0, 5).map((stat) => stat.name),
    languageStats,
    mostRecentPushAt,
    activityScore: calculateActivityScore(
      repos,
      activeRepos,
      totalStars,
      totalForks,
      mostRecentPushAt,
    ),
    consistencyScore: calculateConsistencyScore(days),
    burstinessScore: calculateBurstinessScore(days),
  }
}

function buildLanguageStats(repos: GitPulseRepo[]): GitPulseLanguageStat[] {
  const languageMap = new Map<
    string,
    {
      bytes: number
      repoIds: Set<string>
      sourceUsernames: Set<string>
    }
  >()

  for (const repo of repos) {
    const languageEntries: Array<[string, number]> =
      Object.entries(repo.languages).length > 0
        ? Object.entries(repo.languages)
        : repo.primaryLanguage
          ? [[repo.primaryLanguage, LANGUAGE_FALLBACK_BYTES]]
          : []

    for (const [languageName, bytes] of languageEntries) {
      const languageEntry = languageMap.get(languageName) ?? {
        bytes: 0,
        repoIds: new Set<string>(),
        sourceUsernames: new Set<string>(),
      }

      languageEntry.bytes += bytes
      languageEntry.repoIds.add(repo.id)
      repo.sourceUsernames.forEach((username) => languageEntry.sourceUsernames.add(username))
      languageMap.set(languageName, languageEntry)
    }
  }

  return [...languageMap.entries()]
    .map(([name, entry]) => ({
      name,
      bytes: entry.bytes,
      repoCount: entry.repoIds.size,
      sourceUsernames: [...entry.sourceUsernames].sort((left, right) => left.localeCompare(right)),
    }))
    .sort((left, right) => {
      if (right.bytes !== left.bytes) {
        return right.bytes - left.bytes
      }

      if (right.repoCount !== left.repoCount) {
        return right.repoCount - left.repoCount
      }

      return left.name.localeCompare(right.name)
    })
}

function calculateActivityScore(
  repos: GitPulseRepo[],
  activeRepos: number,
  totalStars: number,
  totalForks: number,
  mostRecentPushAt?: string,
) {
  if (!repos.length) {
    return 0
  }

  // Stage 2 keeps this intentionally approximate because it feeds future creative mappings, not analytics.
  const recencyComponent = mostRecentPushAt
    ? Math.max(0, 40 - Math.floor(getAgeInDays(mostRecentPushAt) / 3))
    : 0
  const breadthComponent = Math.min(35, activeRepos * 4 + Math.min(repos.length, 7))
  const tractionComponent = Math.min(25, Math.round(Math.log10(totalStars + totalForks + 1) * 10))

  return clamp(Math.round(recencyComponent + breadthComponent + tractionComponent), 0, 100)
}

function calculateConsistencyScore(days: GitPulseDataset['days']) {
  if (days.length <= 1) {
    return days.length === 1 ? 100 : 0
  }

  const firstDay = new Date(days[0].date)
  const lastDay = new Date(days[days.length - 1].date)
  const spanInDays = Math.max(
    1,
    Math.round((lastDay.getTime() - firstDay.getTime()) / 86400000) + 1,
  )

  return clamp(Math.round((days.length / spanInDays) * 100), 0, 100)
}

function calculateBurstinessScore(days: GitPulseDataset['days']) {
  if (!days.length) {
    return 0
  }

  const averageScore = days.reduce((sum, day) => sum + day.activityScore, 0) / days.length
  const peakScore = Math.max(...days.map((day) => day.activityScore))

  if (averageScore === 0) {
    return 0
  }

  return clamp(Math.round((peakScore / averageScore - 1) * 40), 0, 100)
}

function getRepoKey(repo: GitPulseRepo) {
  return repo.githubId ? `github:${repo.githubId}` : repo.fullName.toLowerCase()
}

function mergeLanguageMaps(
  existingLanguages: Record<string, number>,
  incomingLanguages: Record<string, number>,
) {
  const mergedLanguages = { ...existingLanguages }

  for (const [languageName, bytes] of Object.entries(incomingLanguages)) {
    mergedLanguages[languageName] = Math.max(mergedLanguages[languageName] ?? 0, bytes)
  }

  return mergedLanguages
}

function getDominantLanguageName(languages: Record<string, number>) {
  return Object.entries(languages).sort((left, right) => right[1] - left[1])[0]?.[0]
}

function mergeUniqueStrings(existingValues: string[], incomingValues: string[]) {
  const mergedValues = [...existingValues]
  const seenValues = new Set(existingValues.map((value) => value.toLowerCase()))

  for (const value of incomingValues) {
    const lowerValue = value.toLowerCase()

    if (!seenValues.has(lowerValue)) {
      seenValues.add(lowerValue)
      mergedValues.push(value)
    }
  }

  return mergedValues
}

function getAgeInDays(isoDate: string) {
  return Math.max(0, Math.floor((Date.now() - new Date(isoDate).getTime()) / 86400000))
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}
