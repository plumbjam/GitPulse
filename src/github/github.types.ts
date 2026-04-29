import type { GitHubClientError } from './githubErrors'

export type GitHubUserResponse = {
  login: string
  id: number
  name: string | null
  avatar_url: string
  html_url: string
  public_repos: number
}

export type GitHubRepoResponse = {
  id: number
  name: string
  full_name: string
  html_url: string
  description: string | null
  language: string | null
  stargazers_count: number
  forks_count: number
  open_issues_count: number
  created_at: string
  updated_at: string
  pushed_at: string | null
  fork: boolean
  archived: boolean
  owner: {
    login: string
  }
}

export type GitHubRepoLanguagesResponse = Record<string, number>

export type GitHubRepoLanguageStatus = 'loaded' | 'skipped' | 'error'

export type GitHubRepoLanguageSnapshot = {
  repo: GitHubRepoResponse
  languages: GitHubRepoLanguagesResponse
  languageStatus: GitHubRepoLanguageStatus
}

export type GitHubIdentityRawDataset = {
  requestedUsername: string
  user: GitHubUserResponse
  repos: GitHubRepoLanguageSnapshot[]
  warnings: string[]
  fetchedAt: string
}

export type GitHubIdentityFetchSuccess = {
  status: 'success'
  username: string
  data: GitHubIdentityRawDataset
}

export type GitHubIdentityFetchFailure = {
  status: 'error'
  username: string
  error: GitHubClientError
}

export type GitHubIdentityFetchResult = GitHubIdentityFetchSuccess | GitHubIdentityFetchFailure

export type GitHubContributionCalendarDayResponse = {
  date: string
  contributionCount: number
}

export type GitHubContributionCalendarWeekResponse = {
  contributionDays: GitHubContributionCalendarDayResponse[]
}

export type GitHubContributionCalendarResponse = {
  totalContributions: number
  weeks: GitHubContributionCalendarWeekResponse[]
}

export type GitHubContributionCalendarGraphqlResponse = {
  data?: {
    user: {
      login: string
      contributionsCollection: {
        contributionCalendar: GitHubContributionCalendarResponse
      }
    } | null
  }
  errors?: Array<{
    message: string
    type?: string
  }>
}

export type GitHubContributionCalendarQueryRange = {
  from: string
  to: string
}

export type GitHubContributionCalendarQueryResult = {
  payload: GitHubContributionCalendarGraphqlResponse
  range: GitHubContributionCalendarQueryRange
}
