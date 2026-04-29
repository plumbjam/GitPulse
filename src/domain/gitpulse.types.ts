export type GitPulseIdentityRole = 'personal' | 'work' | 'other'

export type GitPulseIdentityStatus = 'idle' | 'loading' | 'success' | 'error'

export type GitPulseDatasetMode = 'demo' | 'live'

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
  summary: GitPulseSummary
  generatedAt: string
  mode: GitPulseDatasetMode
}

export type GitPulseIdentityDataset = {
  identity: GitPulseIdentity
  repos: GitPulseRepo[]
  days: GitPulseActivityDay[]
  mode: GitPulseDatasetMode
  warnings: string[]
}
