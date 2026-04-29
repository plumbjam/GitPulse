import type {
  GitPulseActivityDay,
  GitPulseIdentityDataset,
  GitPulseIdentityRole,
  GitPulseRepo,
} from '@/domain/gitpulse.types'
import { createGitHubClientErrorMessage } from './githubErrors'
import type {
  GitHubIdentityFetchResult,
  GitHubIdentityRawDataset,
  GitHubRepoLanguageSnapshot,
} from './github.types'

export function normaliseGitHubFetchResult(
  result: GitHubIdentityFetchResult,
  role: GitPulseIdentityRole = 'other',
): GitPulseIdentityDataset {
  if (result.status === 'error') {
    return createErroredGitHubIdentityDataset(
      result.username,
      createGitHubClientErrorMessage(result.error),
      role,
    )
  }

  return normaliseGitHubIdentityDataset(result.data, role)
}

export function normaliseGitHubIdentityDataset(
  rawDataset: GitHubIdentityRawDataset,
  role: GitPulseIdentityRole = 'other',
): GitPulseIdentityDataset {
  const repos = rawDataset.repos.map((snapshot) =>
    normaliseGitHubRepo(snapshot, rawDataset.user.login),
  )
  const warningMessage = rawDataset.warnings.join(' ')

  return {
    identity: {
      id: createGitPulseIdentityId(rawDataset.user.login),
      username: rawDataset.user.login,
      displayName: rawDataset.user.name ?? undefined,
      avatarUrl: rawDataset.user.avatar_url,
      profileUrl: rawDataset.user.html_url,
      source: 'github',
      role,
      status: 'success',
      warningMessage: warningMessage || undefined,
    },
    repos,
    days: buildApproximateActivityDays(repos),
    mode: 'live',
    warnings: [...rawDataset.warnings],
  }
}

export function createLoadingGitHubIdentityDataset(
  username: string,
  role: GitPulseIdentityRole = 'other',
): GitPulseIdentityDataset {
  return {
    identity: {
      id: createGitPulseIdentityId(username),
      username,
      source: 'github',
      role,
      status: 'loading',
    },
    repos: [],
    days: [],
    mode: 'live',
    warnings: [],
  }
}

export function createErroredGitHubIdentityDataset(
  username: string,
  errorMessage: string,
  role: GitPulseIdentityRole = 'other',
): GitPulseIdentityDataset {
  return {
    identity: {
      id: createGitPulseIdentityId(username),
      username,
      profileUrl: `https://github.com/${username}`,
      source: 'github',
      role,
      status: 'error',
      errorMessage,
    },
    repos: [],
    days: [],
    mode: 'live',
    warnings: [],
  }
}

export function buildApproximateActivityDays(repos: GitPulseRepo[]): GitPulseActivityDay[] {
  const dayMap = new Map<
    string,
    {
      activityScore: number
      repoTouches: Set<string>
      sourceUsernames: Set<string>
    }
  >()

  for (const repo of repos) {
    const date = repo.pushedAt.slice(0, 10)
    const dayEntry = dayMap.get(date) ?? {
      activityScore: 0,
      repoTouches: new Set<string>(),
      sourceUsernames: new Set<string>(),
    }

    // Stage 2 uses pushed repositories as an approximate activity timeline, not true commit history.
    dayEntry.activityScore += 10 + Math.min(25, repo.stars + repo.forks)
    dayEntry.repoTouches.add(repo.fullName)
    repo.sourceUsernames.forEach((username) => dayEntry.sourceUsernames.add(username))

    dayMap.set(date, dayEntry)
  }

  return [...dayMap.entries()]
    .map(([date, entry]) => ({
      date,
      activityScore: Math.min(100, entry.activityScore),
      repoTouches: [...entry.repoTouches].sort((left, right) => left.localeCompare(right)),
      sourceUsernames: [...entry.sourceUsernames].sort((left, right) => left.localeCompare(right)),
    }))
    .sort((left, right) => left.date.localeCompare(right.date))
}

export function createGitPulseIdentityId(username: string) {
  return `github:${username.trim().toLowerCase()}`
}

function normaliseGitHubRepo(
  snapshot: GitHubRepoLanguageSnapshot,
  sourceUsername: string,
): GitPulseRepo {
  const normalisedLanguages = { ...snapshot.languages }
  const pushedAt = normaliseIsoDate(snapshot.repo.pushed_at, snapshot.repo.updated_at)
  const createdAt = normaliseIsoDate(snapshot.repo.created_at, snapshot.repo.created_at)
  const updatedAt = normaliseIsoDate(snapshot.repo.updated_at, snapshot.repo.created_at)

  return {
    id: snapshot.repo.id
      ? `repo:${snapshot.repo.id}`
      : `repo:${snapshot.repo.full_name.toLowerCase()}`,
    githubId: snapshot.repo.id,
    name: snapshot.repo.name,
    fullName: snapshot.repo.full_name,
    owner: snapshot.repo.owner.login,
    url: snapshot.repo.html_url,
    description: snapshot.repo.description ?? undefined,
    primaryLanguage:
      getDominantLanguageFromBytes(normalisedLanguages) ?? snapshot.repo.language ?? undefined,
    languages: normalisedLanguages,
    stars: snapshot.repo.stargazers_count,
    forks: snapshot.repo.forks_count,
    openIssues: snapshot.repo.open_issues_count,
    createdAt,
    updatedAt,
    pushedAt,
    isFork: snapshot.repo.fork,
    isArchived: snapshot.repo.archived,
    sourceUsernames: [sourceUsername],
  }
}

function getDominantLanguageFromBytes(languages: Record<string, number>) {
  return Object.entries(languages).sort((left, right) => right[1] - left[1])[0]?.[0]
}

function normaliseIsoDate(value: string | null, fallbackValue: string) {
  return new Date(value ?? fallbackValue).toISOString()
}
