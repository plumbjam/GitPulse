import type {
  GitPulseContributionCalendar,
  GitPulseIdentityDataset,
  GitPulseRepo,
} from '@/domain/gitpulse.types'
import {
  buildContributionCalendarFromSparseCounts,
  enumerateContributionDates,
  getDefaultContributionCalendarRange,
} from '@/github/githubContributionMerge'
import { mergeIdentityDatasets } from '@/github/githubMerge'
import { buildApproximateActivityDays } from '@/github/githubNormaliser'

const DEMO_GENERATED_AT = '2026-04-29T12:00:00.000Z'

function createDemoReposForSignal(): GitPulseRepo[] {
  return [
    {
      id: 'repo:demo-gitpulse',
      githubId: 7001,
      name: 'gitpulse',
      fullName: 'signal-lab/gitpulse',
      owner: 'signal-lab',
      url: 'https://github.com/signal-lab/gitpulse',
      description: 'Creative coding signature prototype',
      primaryLanguage: 'TypeScript',
      languages: {
        TypeScript: 28000,
        CSS: 5400,
      },
      stars: 142,
      forks: 18,
      openIssues: 4,
      createdAt: '2025-01-05T10:00:00.000Z',
      updatedAt: '2026-04-28T08:15:00.000Z',
      pushedAt: '2026-04-28T08:15:00.000Z',
      isFork: false,
      isArchived: false,
      sourceUsernames: ['signal-lab'],
    },
    {
      id: 'repo:demo-spectrum',
      githubId: 7002,
      name: 'spectrum-console',
      fullName: 'signal-lab/spectrum-console',
      owner: 'signal-lab',
      url: 'https://github.com/signal-lab/spectrum-console',
      description: 'Audio-reactive terminal experiments',
      primaryLanguage: 'Rust',
      languages: {
        Rust: 19000,
        TypeScript: 1200,
      },
      stars: 66,
      forks: 11,
      openIssues: 2,
      createdAt: '2024-11-12T10:00:00.000Z',
      updatedAt: '2026-04-24T12:00:00.000Z',
      pushedAt: '2026-04-24T12:00:00.000Z',
      isFork: false,
      isArchived: false,
      sourceUsernames: ['signal-lab'],
    },
    {
      id: 'repo:demo-archive',
      githubId: 7003,
      name: 'archive-maps',
      fullName: 'signal-lab/archive-maps',
      owner: 'signal-lab',
      url: 'https://github.com/signal-lab/archive-maps',
      description: 'Older archived sketches',
      primaryLanguage: 'Python',
      languages: {
        Python: 8400,
      },
      stars: 21,
      forks: 3,
      openIssues: 0,
      createdAt: '2023-02-18T10:00:00.000Z',
      updatedAt: '2025-01-15T10:00:00.000Z',
      pushedAt: '2025-01-15T10:00:00.000Z',
      isFork: false,
      isArchived: true,
      sourceUsernames: ['signal-lab'],
    },
    {
      id: 'repo:demo-tones',
      githubId: 7004,
      name: 'tone-sketches',
      fullName: 'signal-lab/tone-sketches',
      owner: 'signal-lab',
      url: 'https://github.com/signal-lab/tone-sketches',
      description: 'Short loop studies',
      primaryLanguage: 'JavaScript',
      languages: {
        JavaScript: 9900,
        HTML: 1800,
      },
      stars: 38,
      forks: 6,
      openIssues: 1,
      createdAt: '2025-08-01T10:00:00.000Z',
      updatedAt: '2026-03-29T10:00:00.000Z',
      pushedAt: '2026-03-29T10:00:00.000Z',
      isFork: false,
      isArchived: false,
      sourceUsernames: ['signal-lab'],
    },
  ]
}

function createDemoReposForStudio(): GitPulseRepo[] {
  return [
    {
      id: 'repo:demo-gitpulse-shared',
      githubId: 7001,
      name: 'gitpulse',
      fullName: 'signal-lab/gitpulse',
      owner: 'signal-lab',
      url: 'https://github.com/signal-lab/gitpulse',
      description: 'Creative coding signature prototype',
      primaryLanguage: 'TypeScript',
      languages: {
        TypeScript: 28600,
        CSS: 5600,
        HTML: 900,
      },
      stars: 142,
      forks: 18,
      openIssues: 4,
      createdAt: '2025-01-05T10:00:00.000Z',
      updatedAt: '2026-04-28T08:15:00.000Z',
      pushedAt: '2026-04-28T08:15:00.000Z',
      isFork: false,
      isArchived: false,
      sourceUsernames: ['signal-studio'],
    },
    {
      id: 'repo:demo-visuals',
      githubId: 7010,
      name: 'visual-garden',
      fullName: 'signal-studio/visual-garden',
      owner: 'signal-studio',
      url: 'https://github.com/signal-studio/visual-garden',
      description: 'Motion graphics playground',
      primaryLanguage: 'GLSL',
      languages: {
        GLSL: 15400,
        TypeScript: 4200,
      },
      stars: 55,
      forks: 7,
      openIssues: 0,
      createdAt: '2025-03-18T10:00:00.000Z',
      updatedAt: '2026-04-26T10:00:00.000Z',
      pushedAt: '2026-04-26T10:00:00.000Z',
      isFork: false,
      isArchived: false,
      sourceUsernames: ['signal-studio'],
    },
    {
      id: 'repo:demo-sonic',
      githubId: 7011,
      name: 'sonic-atlas',
      fullName: 'signal-studio/sonic-atlas',
      owner: 'signal-studio',
      url: 'https://github.com/signal-studio/sonic-atlas',
      description: 'Mood mapping experiments',
      primaryLanguage: 'Go',
      languages: {
        Go: 13000,
        JSON: 900,
      },
      stars: 29,
      forks: 5,
      openIssues: 1,
      createdAt: '2024-12-09T10:00:00.000Z',
      updatedAt: '2026-04-12T10:00:00.000Z',
      pushedAt: '2026-04-12T10:00:00.000Z',
      isFork: false,
      isArchived: false,
      sourceUsernames: ['signal-studio'],
    },
    {
      id: 'repo:demo-dormant',
      githubId: 7012,
      name: 'paper-prototypes',
      fullName: 'signal-studio/paper-prototypes',
      owner: 'signal-studio',
      url: 'https://github.com/signal-studio/paper-prototypes',
      description: 'Dormant concept work',
      primaryLanguage: 'Markdown',
      languages: {},
      stars: 9,
      forks: 1,
      openIssues: 0,
      createdAt: '2022-10-12T10:00:00.000Z',
      updatedAt: '2024-05-11T10:00:00.000Z',
      pushedAt: '2024-05-11T10:00:00.000Z',
      isFork: false,
      isArchived: false,
      sourceUsernames: ['signal-studio'],
    },
  ]
}

export function createDemoIdentityDatasets(): GitPulseIdentityDataset[] {
  const signalRepos = createDemoReposForSignal()
  const studioRepos = createDemoReposForStudio()
  const signalContributionCalendar = createDemoContributionCalendar('signal-lab', 3)
  const studioContributionCalendar = createDemoContributionCalendar('signal-studio', 11)

  return [
    {
      identity: {
        id: 'demo:signal-lab',
        username: 'signal-lab',
        displayName: 'Signal Lab',
        profileUrl: 'https://github.com/signal-lab',
        source: 'github',
        role: 'personal',
        status: 'success',
      },
      repos: signalRepos,
      days: buildApproximateActivityDays(signalRepos),
      contributionCalendar: signalContributionCalendar,
      mode: 'demo',
      warnings: [],
    },
    {
      identity: {
        id: 'demo:signal-studio',
        username: 'signal-studio',
        displayName: 'Signal Studio',
        profileUrl: 'https://github.com/signal-studio',
        source: 'github',
        role: 'work',
        status: 'success',
      },
      repos: studioRepos,
      days: buildApproximateActivityDays(studioRepos),
      contributionCalendar: studioContributionCalendar,
      mode: 'demo',
      warnings: [],
    },
  ]
}

export const demoDataset = mergeIdentityDatasets(createDemoIdentityDatasets(), {
  generatedAt: DEMO_GENERATED_AT,
  mode: 'demo',
})

function createDemoContributionCalendar(
  username: string,
  seed: number,
): GitPulseContributionCalendar {
  const range = getDefaultContributionCalendarRange(new Date(DEMO_GENERATED_AT))
  const counts = enumerateContributionDates(range.from, range.to).reduce<Record<string, number>>(
    (calendarCounts, date, index) => {
      const dayOfWeek = getUtcDayOfWeek(date)
      const month = getUtcMonth(date)
      let contributionCount = 0

      if (dayOfWeek > 0 && dayOfWeek < 6 && (index + seed) % 5 === 0) {
        contributionCount += 1 + ((index + seed) % 3)
      }

      if ((index + seed) % 29 === 0) {
        contributionCount += 5
      }

      if ((index + seed) % 71 === 0) {
        contributionCount += 10
      }

      if (month === 11 && dayOfWeek === 2) {
        contributionCount += 4
      }

      if (month === 7 && (index + seed) % 11 === 0) {
        contributionCount = 0
      }

      if (contributionCount > 0) {
        calendarCounts[date] = contributionCount
      }

      return calendarCounts
    },
    {},
  )

  return buildContributionCalendarFromSparseCounts({
    username,
    counts,
    from: range.from,
    to: range.to,
    dataSource: 'demo',
  })
}

function getUtcDayOfWeek(date: string) {
  return new Date(`${date}T00:00:00.000Z`).getUTCDay()
}

function getUtcMonth(date: string) {
  return new Date(`${date}T00:00:00.000Z`).getUTCMonth()
}
