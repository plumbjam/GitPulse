import type { GitPulseMood } from './mood.types'

export type GitPulseIdentityRole = 'personal' | 'work' | 'other'

export type GitPulseIdentity = {
  id: string
  username: string
  label?: string
  source: 'github'
  role?: GitPulseIdentityRole
}

export type GitPulseRepo = {
  id: string
  name: string
  stars: number
  forks: number
  primaryLanguage?: string
}

export type GitPulseActivityDay = {
  date: string
  commits: number
  pullRequests: number
  issues: number
}

export type GitPulseSummary = {
  totalCommits: number
  activeRepos: number
  dominantLanguage: string
  generatedFrom: 'demo' | 'live'
}

export type GitPulseDataset = {
  identities: GitPulseIdentity[]
  profileMode: 'single' | 'merged'
  repos: GitPulseRepo[]
  days: GitPulseActivityDay[]
  summary: GitPulseSummary
  selectedMood: GitPulseMood
}
