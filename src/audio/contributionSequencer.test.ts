import { describe, expect, it } from 'vitest'
import type {
  GitPulseContributionCalendar,
  GitPulseContributionDay,
  GitPulseDataset,
} from '@/domain/gitpulse.types'
import {
  calculateActiveStepCount,
  calculateAudioLoopBars,
  calculatePeakContributionCount,
  createAudioPatternFromCalendar,
  createAudioPatternFromDataset,
  selectContributionRangeDays,
  sortContributionDaysAscending,
} from './contributionSequencer'

describe('contribution sequencer', () => {
  it('uses the full contribution calendar range without truncating to a fixed window', () => {
    const days = createContributionDays('2026-01-01', 70, (index) => (index % 5 === 0 ? 3 : 0))
    const selectedDays = selectContributionRangeDays(days, {
      from: days[0].date,
      to: days[days.length - 1].date,
      dataSource: 'graphql',
      sourceUsernames: ['alice'],
    })

    expect(selectedDays).toHaveLength(70)
    expect(selectedDays[0].date).toBe(days[0].date)
    expect(selectedDays[selectedDays.length - 1].date).toBe(days[days.length - 1].date)
  })

  it('fills missing dates with zero-contribution days across the selected range', () => {
    const days = createContributionDays('2026-04-05', 3, () => 2)
    const selectedDays = selectContributionRangeDays(days, {
      from: '2026-04-01',
      to: '2026-04-07',
      dataSource: 'demo',
      sourceUsernames: ['signal-lab'],
    })

    expect(selectedDays).toHaveLength(7)
    expect(selectedDays.slice(-3).map((day) => day.date)).toEqual([
      '2026-04-05',
      '2026-04-06',
      '2026-04-07',
    ])
    expect(selectedDays[0]).toMatchObject({
      date: '2026-04-01',
      contributionCount: 0,
      intensity: 0,
    })
  })

  it('sorts contribution days in ascending date order before sequencing', () => {
    const days = [
      createContributionDay('2026-04-07', 1),
      createContributionDay('2026-04-05', 3),
      createContributionDay('2026-04-06', 2),
    ]

    expect(sortContributionDaysAscending(days).map((day) => day.date)).toEqual([
      '2026-04-05',
      '2026-04-06',
      '2026-04-07',
    ])
  })

  it('generates a deterministic dynamic-bar pattern and summary metrics', () => {
    const calendar = createCalendar(
      createContributionDays('2026-02-01', 70, (index) => {
        if (index % 16 === 0) {
          return 12
        }

        if (index % 3 === 0) {
          return 4
        }

        return 0
      }),
    )
    const pattern = createAudioPatternFromCalendar(calendar, {
      mood: 'futuristic',
      bpm: 118,
      dominantLanguages: ['TypeScript', 'CSS'],
    })

    expect(pattern.loopBars).toBe(18)
    expect(pattern.loopBars).toBe(calculateAudioLoopBars(calendar.days.length))
    expect(pattern.steps).toHaveLength(calendar.days.length)
    expect(pattern.summary.activeSteps).toBe(
      calculateActiveStepCount(
        pattern.steps.map((step) => ({ contributionCount: step.contributionCount })),
      ),
    )
    expect(pattern.summary.peakContributionCount).toBe(
      calculatePeakContributionCount(calendar.days),
    )
    expect(pattern.summary.dominantLanguages).toEqual(['TypeScript', 'CSS'])
    expect(pattern.steps[0]).toMatchObject({
      bar: 1,
      beat: 1,
      intensity: 4,
      kick: true,
      snare: true,
      hat: true,
      accent: true,
    })
    expect(pattern.steps[1].bar).toBe(1)
    expect(pattern.steps[4].bar).toBe(2)
  })

  it('preserves quiet contribution days as sequenced rests', () => {
    const calendar = createCalendar([
      createContributionDay('2026-05-01', 5),
      createContributionDay('2026-05-02', 0),
      createContributionDay('2026-05-03', 2),
    ])
    const pattern = createAudioPatternFromCalendar(calendar, {
      mood: 'futuristic',
      bpm: 118,
    })

    expect(pattern.steps[1]).toMatchObject({
      date: '2026-05-02',
      contributionCount: 0,
      intensity: 0,
      kick: false,
      snare: false,
      hat: false,
      accent: false,
    })
  })

  it('builds fallback patterns from the full normalized activity date range', () => {
    const dataset = createDatasetWithActivityDays(['2026-06-01', '2026-06-04'])
    const pattern = createAudioPatternFromDataset(dataset, {
      mood: 'futuristic',
      bpm: 118,
    })

    expect(pattern?.steps).toHaveLength(4)
    expect(pattern?.loopBars).toBe(1)
    expect(pattern?.steps.map((step) => step.date)).toEqual([
      '2026-06-01',
      '2026-06-02',
      '2026-06-03',
      '2026-06-04',
    ])
    expect(pattern?.steps[1]).toMatchObject({
      contributionCount: 0,
      intensity: 0,
      dataSource: 'approximate',
    })
  })
})

function createCalendar(days: GitPulseContributionDay): GitPulseContributionCalendar
function createCalendar(days: GitPulseContributionDay[]): GitPulseContributionCalendar
function createCalendar(days: GitPulseContributionDay | GitPulseContributionDay[]) {
  const dayList = Array.isArray(days) ? days : [days]

  return {
    from: dayList[0].date,
    to: dayList[dayList.length - 1].date,
    totalContributions: dayList.reduce((sum, day) => sum + day.contributionCount, 0),
    days: dayList,
    sourceUsernames: ['alice'],
    dataSource: 'graphql',
  }
}

function createContributionDays(
  startDate: string,
  length: number,
  contributionFactory: (index: number) => number,
) {
  return Array.from({ length }, (_, index) =>
    createContributionDay(addUtcDays(startDate, index), contributionFactory(index)),
  )
}

function createContributionDay(date: string, contributionCount: number): GitPulseContributionDay {
  return {
    date,
    contributionCount,
    intensity: getIntensity(contributionCount),
    sourceUsernames: ['alice'],
    perIdentityCounts: {
      alice: contributionCount,
    },
    dataSource: 'graphql',
  }
}

function createDatasetWithActivityDays(dates: string[]): GitPulseDataset {
  return {
    identities: [
      {
        id: 'alice',
        username: 'alice',
        source: 'github',
        status: 'success',
      },
    ],
    profileMode: 'single',
    repos: [],
    days: dates.map((date, index) => ({
      date,
      activityScore: index === 0 ? 80 : 35,
      repoTouches: ['alice/project'],
      sourceUsernames: ['alice'],
    })),
    summary: {
      totalIdentities: 1,
      successfulIdentities: 1,
      failedIdentities: 0,
      totalRepos: 0,
      activeRepos: 0,
      dormantRepos: 0,
      totalStars: 0,
      totalForks: 0,
      dominantLanguages: ['TypeScript'],
      languageStats: [],
      activityScore: 80,
    },
    generatedAt: '2026-06-04T00:00:00.000Z',
    mode: 'live',
  }
}

function getIntensity(contributionCount: number) {
  if (contributionCount <= 0) {
    return 0
  }

  if (contributionCount === 1) {
    return 1
  }

  if (contributionCount <= 4) {
    return 2
  }

  if (contributionCount <= 9) {
    return 3
  }

  return 4
}

function addUtcDays(isoDate: string, days: number) {
  const date = new Date(`${isoDate}T00:00:00.000Z`)

  date.setUTCDate(date.getUTCDate() + days)

  return date.toISOString().slice(0, 10)
}
