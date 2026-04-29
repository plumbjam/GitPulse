import type {
  GitPulseActivityDay,
  GitPulseContributionCalendar,
  GitPulseContributionDataSource,
  GitPulseContributionDay,
  GitPulseDataset,
} from '@/domain/gitpulse.types'
import { getContributionIntensity } from '@/github/githubContributionMerge'
import type { GitPulseAudioMood, GitPulseAudioPattern } from './audio.types'
import { AUDIO_STEPS_PER_BAR } from './moods'
import {
  mapBassNoteForStep,
  mapIntensityToRhythmFlags,
  mapLeadNoteForStep,
  mapStepVelocity,
  resolvePatternBpm,
} from './musicMapping'

type CreateAudioPatternOptions = {
  mood: GitPulseAudioMood
  bpm?: number
}

type SelectContributionRangeOptions = {
  from?: string
  to?: string
  dataSource: GitPulseContributionDataSource
  sourceUsernames: string[]
}

export function sortContributionDaysAscending(days: GitPulseContributionDay[]) {
  return [...days].sort((left, right) => left.date.localeCompare(right.date))
}

export function selectContributionRangeDays(
  days: GitPulseContributionDay[],
  options: SelectContributionRangeOptions,
) {
  const sortedDays = sortContributionDaysAscending(days)

  if (!sortedDays.length) {
    return []
  }

  const dayMap = new Map(sortedDays.map((day) => [day.date, cloneContributionDay(day)]))
  const rangeStartDate = options.from ?? sortedDays[0].date
  const rangeEndDate = options.to ?? sortedDays[sortedDays.length - 1].date
  const rangeDates = enumerateRangeDates(rangeStartDate, rangeEndDate)

  return rangeDates.map(
    (date) =>
      dayMap.get(date) ??
      createSilentContributionDay(date, options.dataSource, options.sourceUsernames),
  )
}

export function calculatePeakContributionCount(
  days: Array<Pick<GitPulseContributionDay, 'contributionCount'>>,
) {
  return days.reduce((peakCount, day) => Math.max(peakCount, day.contributionCount), 0)
}

export function calculateActiveStepCount(
  steps: Array<Pick<GitPulseAudioPattern['steps'][number], 'contributionCount'>>,
) {
  return steps.filter((step) => step.contributionCount > 0).length
}

export function calculateAudioLoopBars(stepCount: number) {
  return Math.ceil(stepCount / AUDIO_STEPS_PER_BAR)
}

export function createAudioPatternFromCalendar(
  calendar: GitPulseContributionCalendar,
  options: CreateAudioPatternOptions & {
    dominantLanguages?: string[]
  },
): GitPulseAudioPattern {
  const selectedDays = selectContributionRangeDays(calendar.days, {
    from: calendar.from,
    to: calendar.to,
    dataSource: calendar.dataSource,
    sourceUsernames: calendar.sourceUsernames,
  })
  const peakContributionCount = calculatePeakContributionCount(selectedDays)
  const bpm = resolvePatternBpm(options.mood, options.bpm)
  const steps = selectedDays.map((day, index) => {
    const rhythm = mapIntensityToRhythmFlags(day.intensity)

    return {
      index,
      bar: Math.floor(index / AUDIO_STEPS_PER_BAR) + 1,
      beat: (index % AUDIO_STEPS_PER_BAR) + 1,
      date: day.date,
      contributionCount: day.contributionCount,
      intensity: day.intensity,
      kick: rhythm.kick,
      snare: rhythm.snare,
      hat: rhythm.hat,
      accent: rhythm.accent,
      bassNote: mapBassNoteForStep(options.mood, index, day.intensity, day.contributionCount),
      leadNote: mapLeadNoteForStep(options.mood, index, day.intensity, day.contributionCount),
      velocity: mapStepVelocity(day.intensity, day.contributionCount, peakContributionCount),
      sourceUsernames: [...day.sourceUsernames],
      dataSource: day.dataSource,
    }
  })

  return {
    mood: options.mood,
    bpm,
    loopBars: calculateAudioLoopBars(steps.length),
    steps,
    summary: {
      source: calendar.dataSource,
      activeSteps: calculateActiveStepCount(steps),
      peakContributionCount,
      dominantLanguages: [...(options.dominantLanguages ?? [])],
    },
  }
}

export function createAudioPatternFromDataset(
  dataset: GitPulseDataset,
  options: CreateAudioPatternOptions,
) {
  const calendar = dataset.contributionCalendar ?? createApproximateFallbackCalendar(dataset)

  if (!calendar) {
    return undefined
  }

  return createAudioPatternFromCalendar(calendar, {
    ...options,
    dominantLanguages: dataset.summary.dominantLanguages,
  })
}

function createApproximateFallbackCalendar(dataset: GitPulseDataset) {
  if (!dataset.days.length) {
    return undefined
  }

  const sortedActivityDays = [...dataset.days].sort((left, right) =>
    left.date.localeCompare(right.date),
  )
  const earliestDate = sortedActivityDays[0]?.date ?? todayUtc()
  const latestDate = sortedActivityDays[sortedActivityDays.length - 1]?.date ?? todayUtc()
  const sourceUsernames = dataset.identities.map((identity) => identity.username)
  const dataSource: GitPulseContributionDataSource =
    dataset.mode === 'demo' ? 'demo' : 'approximate'
  const activityLookup = sortedActivityDays.reduce<Record<string, GitPulseActivityDay>>(
    (lookup, day) => {
      lookup[day.date] = day
      return lookup
    },
    {},
  )
  const rangeDates = enumerateRangeDates(earliestDate, latestDate)
  const days: GitPulseContributionDay[] = rangeDates.map((date) => {
    const activityDay = activityLookup[date]
    const contributionCount = activityDay ? getApproximateContributionCount(activityDay) : 0

    return {
      date,
      contributionCount,
      intensity: getContributionIntensity(contributionCount),
      sourceUsernames:
        (activityDay?.sourceUsernames.length ?? 0)
          ? [...activityDay.sourceUsernames]
          : [...sourceUsernames],
      perIdentityCounts: Object.fromEntries(
        (activityDay?.sourceUsernames.length ? activityDay.sourceUsernames : sourceUsernames).map(
          (username) => [username, contributionCount],
        ),
      ),
      dataSource,
    }
  })

  return {
    from: rangeDates[0],
    to: rangeDates[rangeDates.length - 1],
    totalContributions: days.reduce((sum, day) => sum + day.contributionCount, 0),
    days,
    sourceUsernames,
    dataSource,
  } satisfies GitPulseContributionCalendar
}

function createSilentContributionDay(
  date: string,
  dataSource: GitPulseContributionDataSource,
  sourceUsernames: string[],
): GitPulseContributionDay {
  return {
    date,
    contributionCount: 0,
    intensity: 0,
    sourceUsernames: [...sourceUsernames],
    perIdentityCounts: Object.fromEntries(sourceUsernames.map((username) => [username, 0])),
    dataSource,
  }
}

function cloneContributionDay(day: GitPulseContributionDay): GitPulseContributionDay {
  return {
    ...day,
    sourceUsernames: [...day.sourceUsernames],
    perIdentityCounts: { ...day.perIdentityCounts },
  }
}

function enumerateRangeDates(rangeStartDate: string, rangeEndDate: string) {
  const dates: string[] = []
  const cursor = parseUtcDay(rangeStartDate)
  const endDate = parseUtcDay(rangeEndDate)

  if (cursor.getTime() > endDate.getTime()) {
    return dates
  }

  while (cursor.getTime() <= endDate.getTime()) {
    dates.push(formatUtcDay(cursor))
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }

  return dates
}

function getApproximateContributionCount(day: GitPulseActivityDay) {
  if (day.activityScore <= 0) {
    return 0
  }

  return clamp(
    Math.max(day.repoTouches.length, Math.round(day.activityScore / 25) + day.repoTouches.length),
    1,
    20,
  )
}

function parseUtcDay(date: string) {
  return new Date(`${date}T00:00:00.000Z`)
}

function formatUtcDay(date: Date) {
  return date.toISOString().slice(0, 10)
}

function todayUtc() {
  return formatUtcDay(new Date())
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}
