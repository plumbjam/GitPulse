import type {
  GitHubIdentityRawDataset,
  GitHubRepoLanguageSnapshot,
  GitHubRepoResponse,
  GitHubUserResponse,
} from './github.types'

const baseDate = '2026-04-28T12:00:00.000Z'

export const fixtureGitHubUserAlice: GitHubUserResponse = {
  login: 'alice',
  id: 101,
  name: 'Alice Aurora',
  avatar_url: 'https://avatars.githubusercontent.com/u/101?v=4',
  html_url: 'https://github.com/alice',
  public_repos: 4,
}

export const fixtureGitHubUserBob: GitHubUserResponse = {
  login: 'alice-work',
  id: 202,
  name: 'Alice Work',
  avatar_url: 'https://avatars.githubusercontent.com/u/202?v=4',
  html_url: 'https://github.com/alice-work',
  public_repos: 3,
}

export const fixtureSharedRepo: GitHubRepoResponse = {
  id: 9001,
  name: 'gitpulse',
  full_name: 'alice/gitpulse',
  html_url: 'https://github.com/alice/gitpulse',
  description: 'GitPulse creative shell',
  language: 'TypeScript',
  stargazers_count: 42,
  forks_count: 8,
  open_issues_count: 3,
  created_at: '2025-01-10T08:00:00.000Z',
  updated_at: '2026-04-27T09:00:00.000Z',
  pushed_at: '2026-04-27T09:00:00.000Z',
  fork: false,
  archived: false,
  owner: {
    login: 'alice',
  },
}

export const fixtureAliceRepos: GitHubRepoLanguageSnapshot[] = [
  {
    repo: fixtureSharedRepo,
    languages: {
      TypeScript: 21000,
      CSS: 3200,
    },
    languageStatus: 'loaded',
  },
  {
    repo: {
      id: 9002,
      name: 'visual-lab',
      full_name: 'alice/visual-lab',
      html_url: 'https://github.com/alice/visual-lab',
      description: 'Shader and motion sketches',
      language: 'GLSL',
      stargazers_count: 16,
      forks_count: 2,
      open_issues_count: 0,
      created_at: '2024-09-12T10:00:00.000Z',
      updated_at: '2026-04-20T10:00:00.000Z',
      pushed_at: '2026-04-20T10:00:00.000Z',
      fork: false,
      archived: false,
      owner: {
        login: 'alice',
      },
    },
    languages: {
      GLSL: 8700,
      TypeScript: 1200,
    },
    languageStatus: 'loaded',
  },
  {
    repo: {
      id: 9003,
      name: 'old-notes',
      full_name: 'alice/old-notes',
      html_url: 'https://github.com/alice/old-notes',
      description: null,
      language: 'Markdown',
      stargazers_count: 4,
      forks_count: 1,
      open_issues_count: 0,
      created_at: '2023-04-01T10:00:00.000Z',
      updated_at: '2025-03-01T10:00:00.000Z',
      pushed_at: '2025-03-01T10:00:00.000Z',
      fork: false,
      archived: false,
      owner: {
        login: 'alice',
      },
    },
    languages: {},
    languageStatus: 'error',
  },
]

export const fixtureBobRepos: GitHubRepoLanguageSnapshot[] = [
  {
    repo: {
      ...fixtureSharedRepo,
      stargazers_count: 45,
      forks_count: 9,
      updated_at: '2026-04-28T09:30:00.000Z',
      pushed_at: '2026-04-28T09:30:00.000Z',
    },
    languages: {
      TypeScript: 22000,
      CSS: 3300,
      HTML: 800,
    },
    languageStatus: 'loaded',
  },
  {
    repo: {
      id: 9010,
      name: 'data-garden',
      full_name: 'alice-work/data-garden',
      html_url: 'https://github.com/alice-work/data-garden',
      description: 'Data sonification experiments',
      language: 'Python',
      stargazers_count: 11,
      forks_count: 5,
      open_issues_count: 1,
      created_at: '2025-06-02T07:00:00.000Z',
      updated_at: '2026-04-18T07:00:00.000Z',
      pushed_at: '2026-04-18T07:00:00.000Z',
      fork: false,
      archived: false,
      owner: {
        login: 'alice-work',
      },
    },
    languages: {
      Python: 12500,
      Jupyter: 2200,
    },
    languageStatus: 'loaded',
  },
]

export function createFixtureGitHubIdentityAlice(): GitHubIdentityRawDataset {
  return {
    requestedUsername: 'alice',
    user: fixtureGitHubUserAlice,
    repos: fixtureAliceRepos.map((snapshot) => ({
      ...snapshot,
      repo: { ...snapshot.repo, owner: { ...snapshot.repo.owner } },
      languages: { ...snapshot.languages },
    })),
    warnings: ['Could not load languages for some repositories.'],
    fetchedAt: baseDate,
  }
}

export function createFixtureGitHubIdentityBob(): GitHubIdentityRawDataset {
  return {
    requestedUsername: 'alice-work',
    user: fixtureGitHubUserBob,
    repos: fixtureBobRepos.map((snapshot) => ({
      ...snapshot,
      repo: { ...snapshot.repo, owner: { ...snapshot.repo.owner } },
      languages: { ...snapshot.languages },
    })),
    warnings: [],
    fetchedAt: baseDate,
  }
}
