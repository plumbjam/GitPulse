import { describe, expect, it } from 'vitest'
import type { GitPulseContributionDay } from '@/domain/gitpulse.types'
import {
  contributionFixtureRange,
  createFixtureContributionCalendarAlice,
  createFixtureContributionCalendarBob,
  fixtureGitHubContributionCalendarAlice,
  fixtureGitHubContributionCalendarMissingUser,
} from './githubContributionFixtures'
import { getContributionIntensity, mergeContributionCalendars } from './githubContributionMerge'
import { normaliseGitHubContributionCalendarResult } from './githubContributionNormaliser'

describe('contribution calendar pipeline', () => {
  it('calculates contribution intensity levels deterministically', () => {
    expect(getContributionIntensity(0)).toBe(0)
    expect(getContributionIntensity(1)).toBe(1)
    expect(getContributionIntensity(2)).toBe(2)
    expect(getContributionIntensity(5)).toBe(3)
    expect(getContributionIntensity(10)).toBe(4)
  })

  it('normalises a GraphQL contribution calendar response', () => {
    const result = normaliseGitHubContributionCalendarResult('alice', {
      payload: fixtureGitHubContributionCalendarAlice,
      range: contributionFixtureRange,
    })

    expect(result.status).toBe('success')
    expect(result.calendar).toMatchObject({
      from: '2026-04-01',
      to: '2026-04-07',
      totalContributions: 8,
      sourceUsernames: ['alice'],
      dataSource: 'graphql',
    })

    const peakDay = result.calendar?.days.find((day) => day.date === '2026-04-05')

    expect(peakDay).toMatchObject({
      contributionCount: 5,
      intensity: 3,
      sourceUsernames: ['alice'],
      perIdentityCounts: {
        alice: 5,
      },
    })
  })

  it('handles a missing GraphQL user response gracefully', () => {
    const result = normaliseGitHubContributionCalendarResult('missing-user', {
      payload: fixtureGitHubContributionCalendarMissingUser,
      range: contributionFixtureRange,
    })

    expect(result).toEqual({
      username: 'missing-user',
      status: 'error',
      errorMessage: 'User not found.',
    })
  })

  it('merges calendars, fills missing days, and preserves per-identity counts', () => {
    const mergedCalendar = mergeContributionCalendars([
      createFixtureContributionCalendarAlice(),
      createFixtureContributionCalendarBob(),
    ])

    expect(mergedCalendar.from).toBe('2026-04-01')
    expect(mergedCalendar.to).toBe('2026-04-05')
    expect(mergedCalendar.days).toHaveLength(5)
    expect(mergedCalendar.totalContributions).toBe(16)
    expect(mergedCalendar.dataSource).toBe('mixed')
    expect(mergedCalendar.sourceUsernames).toEqual(['alice', 'alice-work'])

    const mergedPeakDay = mergedCalendar.days.find((day) => day.date === '2026-04-03')
    const filledQuietDay = mergedCalendar.days.find((day) => day.date === '2026-04-04')

    expect(mergedPeakDay).toMatchObject({
      contributionCount: 12,
      intensity: 4,
      perIdentityCounts: {
        alice: 5,
        'alice-work': 7,
      },
    })
    expect(filledQuietDay).toMatchObject({
      contributionCount: 0,
      intensity: 0,
    })
    expect(getPositiveBreakdownKeys(mergedPeakDay)).toEqual(['alice', 'alice-work'])
  })
})

function getPositiveBreakdownKeys(day?: GitPulseContributionDay) {
  return Object.entries(day?.perIdentityCounts ?? {})
    .filter(([, count]) => count > 0)
    .map(([username]) => username)
    .sort((left, right) => left.localeCompare(right))
}
