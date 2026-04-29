export type GitPulseIdentityRole = 'personal' | 'work' | 'other'

export type GitPulseIdentityStatus = 'idle' | 'loading' | 'success' | 'error'

export type GitPulseDatasetMode = 'demo' | 'live'

export type GitPulseContributionDataSource = 'demo' | 'graphql' | 'approximate' | 'mixed'

export type GitPulseContributionIntensity = 0 | 1 | 2 | 3 | 4

export type GitPulseIdentity = {
  id: string
  username: string
  displayName?: string
  avatarUrl?: string
  profileUrl?: string
  source: 'github'
  role?: GitPulseIdentityRole
  status?: GitPulseIdentityStatus
  errorMessage?: string
  warningMessage?: string
}

export type GitPulseRepo = {
  id: string
  githubId?: number
  name: string
  fullName: string
  owner: string
  url: string
  description?: string
  primaryLanguage?: string
  languages: Record<string, number>
  stars: number
  forks: number
  openIssues?: number
  createdAt: string
  updatedAt: string
  pushedAt: string
  isFork: boolean
  isArchived?: boolean
  sourceUsernames: string[]
}

export type GitPulseLanguageStat = {
  name: string
  bytes: number
  repoCount: number
  sourceUsernames: string[]
}

export type GitPulseActivityDay = {
  date: string
  activityScore: number
  repoTouches: string[]
  sourceUsernames: string[]
}

export type GitPulseContributionDay = {
  date: string
  contributionCount: number
  intensity: GitPulseContributionIntensity
  sourceUsernames: string[]
  perIdentityCounts: Record<string, number>
  dataSource: GitPulseContributionDataSource
}

export type GitPulseContributionCalendar = {
  from: string
  to: string
  totalContributions: number
  days: GitPulseContributionDay[]
  sourceUsernames: string[]
  dataSource: GitPulseContributionDataSource
}

export type GitPulseContributionFetchResult = {
  username: string
  status: 'success' | 'error'
  calendar?: GitPulseContributionCalendar
  errorMessage?: string
}

export type GitPulseSummary = {
  totalIdentities: number
  successfulIdentities: number
  failedIdentities: number
  totalRepos: number
  activeRepos: number
  dormantRepos: number
  totalStars: number
  totalForks: number
  dominantLanguages: string[]
  languageStats: GitPulseLanguageStat[]
  mostRecentPushAt?: string
  activityScore: number
  consistencyScore?: number
  burstinessScore?: number
}

export type GitPulseDataset = {
  identities: GitPulseIdentity[]
  profileMode: 'single' | 'merged'
  repos: GitPulseRepo[]
  days: GitPulseActivityDay[]
  contributionCalendar?: GitPulseContributionCalendar
  summary: GitPulseSummary
  generatedAt: string
  mode: GitPulseDatasetMode
}

export type GitPulseIdentityDataset = {
  identity: GitPulseIdentity
  repos: GitPulseRepo[]
  days: GitPulseActivityDay[]
  contributionCalendar?: GitPulseContributionCalendar
  mode: GitPulseDatasetMode
  warnings: string[]
}
