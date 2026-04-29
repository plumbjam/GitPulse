import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createFixtureGitHubIdentityAlice, createFixtureGitHubIdentityBob } from './githubFixtures'
import { mergeIdentityDatasets } from './githubMerge'
import {
  createErroredGitHubIdentityDataset,
  normaliseGitHubIdentityDataset,
} from './githubNormaliser'

describe('mergeIdentityDatasets', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-28T12:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('merges two identities and deduplicates shared repositories', () => {
    const aliceDataset = normaliseGitHubIdentityDataset(
      createFixtureGitHubIdentityAlice(),
      'personal',
    )
    const bobDataset = normaliseGitHubIdentityDataset(createFixtureGitHubIdentityBob(), 'work')
    const mergedDataset = mergeIdentityDatasets([aliceDataset, bobDataset], {
      generatedAt: '2026-04-28T12:00:00.000Z',
      mode: 'live',
    })

    expect(mergedDataset.profileMode).toBe('merged')
    expect(mergedDataset.identities).toHaveLength(2)
    expect(mergedDataset.repos).toHaveLength(4)

    const sharedRepo = mergedDataset.repos.find((repo) => repo.githubId === 9001)

    expect(sharedRepo).toMatchObject({
      fullName: 'alice/gitpulse',
      stars: 45,
      forks: 9,
      pushedAt: '2026-04-28T09:30:00.000Z',
      primaryLanguage: 'TypeScript',
    })
    expect(sharedRepo?.sourceUsernames).toEqual(['alice', 'alice-work'])
    expect(sharedRepo?.languages).toEqual({
      TypeScript: 22000,
      CSS: 3300,
      HTML: 800,
    })
  })

  it('preserves source usernames and failed identity errors', () => {
    const aliceDataset = normaliseGitHubIdentityDataset(createFixtureGitHubIdentityAlice())
    const missingDataset = createErroredGitHubIdentityDataset(
      'missing-user',
      'User not found.',
      'work',
    )
    const mergedDataset = mergeIdentityDatasets([aliceDataset, missingDataset], {
      generatedAt: '2026-04-28T12:00:00.000Z',
      mode: 'live',
    })

    expect(mergedDataset.profileMode).toBe('single')
    expect(mergedDataset.summary.successfulIdentities).toBe(1)
    expect(mergedDataset.summary.failedIdentities).toBe(1)
    expect(
      mergedDataset.identities.find((identity) => identity.username === 'missing-user'),
    ).toMatchObject({
      status: 'error',
      errorMessage: 'User not found.',
    })
    expect(mergedDataset.repos.every((repo) => repo.sourceUsernames.includes('alice'))).toBe(true)
  })

  it('calculates summary metrics from merged repositories', () => {
    const aliceDataset = normaliseGitHubIdentityDataset(
      createFixtureGitHubIdentityAlice(),
      'personal',
    )
    const bobDataset = normaliseGitHubIdentityDataset(createFixtureGitHubIdentityBob(), 'work')
    const mergedDataset = mergeIdentityDatasets([aliceDataset, bobDataset], {
      generatedAt: '2026-04-28T12:00:00.000Z',
      mode: 'live',
    })

    expect(mergedDataset.summary).toMatchObject({
      totalIdentities: 2,
      successfulIdentities: 2,
      failedIdentities: 0,
      totalRepos: 4,
      activeRepos: 3,
      dormantRepos: 1,
      totalStars: 76,
      totalForks: 17,
      mostRecentPushAt: '2026-04-28T09:30:00.000Z',
    })
    expect(mergedDataset.summary.dominantLanguages.slice(0, 3)).toEqual([
      'TypeScript',
      'Python',
      'GLSL',
    ])
    expect(mergedDataset.summary.activityScore).toBeGreaterThan(0)
    expect(mergedDataset.summary.consistencyScore).toBeGreaterThan(0)
    expect(mergedDataset.summary.burstinessScore).toBeGreaterThanOrEqual(0)
    expect(mergedDataset.days.map((day) => day.date)).toEqual([
      '2025-03-01',
      '2026-04-18',
      '2026-04-20',
      '2026-04-28',
    ])
  })

  it('produces single and merged profile modes correctly', () => {
    const aliceDataset = normaliseGitHubIdentityDataset(createFixtureGitHubIdentityAlice())
    const singleDataset = mergeIdentityDatasets([aliceDataset], {
      generatedAt: '2026-04-28T12:00:00.000Z',
      mode: 'live',
    })
    const mergedDataset = mergeIdentityDatasets(
      [aliceDataset, normaliseGitHubIdentityDataset(createFixtureGitHubIdentityBob())],
      {
        generatedAt: '2026-04-28T12:00:00.000Z',
        mode: 'live',
      },
    )

    expect(singleDataset.profileMode).toBe('single')
    expect(mergedDataset.profileMode).toBe('merged')
  })
})
