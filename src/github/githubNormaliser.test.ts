import { describe, expect, it } from 'vitest'
import { createFixtureGitHubIdentityAlice, fixtureGitHubUserAlice } from './githubFixtures'
import { normaliseGitHubIdentityDataset } from './githubNormaliser'

describe('normaliseGitHubIdentityDataset', () => {
  it('normalises a GitHub profile into a GitPulse identity', () => {
    const dataset = normaliseGitHubIdentityDataset(createFixtureGitHubIdentityAlice(), 'personal')

    expect(dataset.identity).toMatchObject({
      id: 'github:alice',
      username: fixtureGitHubUserAlice.login,
      displayName: fixtureGitHubUserAlice.name,
      avatarUrl: fixtureGitHubUserAlice.avatar_url,
      profileUrl: fixtureGitHubUserAlice.html_url,
      source: 'github',
      role: 'personal',
      status: 'success',
    })
    expect(dataset.identity.warningMessage).toBe('Could not load languages for some repositories.')
  })

  it('normalises repositories with language payloads', () => {
    const dataset = normaliseGitHubIdentityDataset(createFixtureGitHubIdentityAlice())
    const repo = dataset.repos.find((item) => item.githubId === 9001)

    expect(repo).toMatchObject({
      id: 'repo:9001',
      fullName: 'alice/gitpulse',
      owner: 'alice',
      primaryLanguage: 'TypeScript',
      stars: 42,
      forks: 8,
      isFork: false,
      sourceUsernames: ['alice'],
    })
    expect(repo?.languages).toEqual({
      TypeScript: 21000,
      CSS: 3200,
    })
    expect(repo?.pushedAt).toBe('2026-04-27T09:00:00.000Z')
  })

  it('handles missing language data with a primary-language fallback', () => {
    const dataset = normaliseGitHubIdentityDataset(createFixtureGitHubIdentityAlice())
    const repo = dataset.repos.find((item) => item.githubId === 9003)

    expect(repo?.languages).toEqual({})
    expect(repo?.primaryLanguage).toBe('Markdown')
    expect(repo?.description).toBeUndefined()
  })
})
