import type {
  GitPulseActivityDay,
  GitPulseContributionCalendar,
  GitPulseContributionDataSource,
  GitPulseContributionDay,
  GitPulseContributionIntensity,
} from '@/domain/gitpulse.types'

const CONTRIBUTION_CALENDAR_WINDOW_DAYS = 364

type ContributionCalendarFactoryOptions = {
  username: string
  counts: Record<string, number>
  from: string
  to: string
  dataSource: GitPulseContributionDataSource
}

export function getContributionIntensity(count: number): GitPulseContributionIntensity {
  if (count <= 0) {
    return 0
  }

  if (count === 1) {
    return 1
  }

  if (count <= 4) {
    return 2
  }

  if (count <= 9) {
    return 3
  }

  return 4
}

export function getDefaultContributionCalendarRange(referenceDate = new Date()) {
  const toDate = toUtcDateOnly(referenceDate)
  const fromDate = new Date(toDate)

  fromDate.setUTCDate(fromDate.getUTCDate() - CONTRIBUTION_CALENDAR_WINDOW_DAYS)

  return {
    from: formatUtcDay(fromDate),
    to: formatUtcDay(toDate),
  }
}

export function buildContributionCalendarFromSparseCounts({
  username,
  counts,
  from,
  to,
  dataSource,
}: ContributionCalendarFactoryOptions): GitPulseContributionCalendar {
  const normalisedUsername = username.trim()
  const days = enumerateContributionDates(from, to).map((date) =>
    createContributionDay({
      date,
      contributionCount: counts[date] ?? 0,
      sourceUsernames: [normalisedUsername],
      perIdentityCounts: {
        [normalisedUsername]: counts[date] ?? 0,
      },
      dataSource,
    }),
  )

  return {
    from,
    to,
    totalContributions: days.reduce((sum, day) => sum + day.contributionCount, 0),
    days,
    sourceUsernames: [normalisedUsername],
    dataSource,
  }
}

export function createApproximateContributionCalendar(
  username: string,
  days: GitPulseActivityDay[],
  range = getDefaultContributionCalendarRange(),
): GitPulseContributionCalendar {
  const counts = days.reduce<Record<string, number>>((calendarCounts, day) => {
    calendarCounts[day.date] =
      (calendarCounts[day.date] ?? 0) + getApproximateContributionCount(day)

    return calendarCounts
  }, {})

  return buildContributionCalendarFromSparseCounts({
    username,
    counts,
    from: range.from,
    to: range.to,
    dataSource: 'approximate',
  })
}

export function fillContributionCalendarRange(
  calendar: GitPulseContributionCalendar,
  range = { from: calendar.from, to: calendar.to },
): GitPulseContributionCalendar {
  const dayMap = new Map(calendar.days.map((day) => [day.date, day]))
  const days = enumerateContributionDates(range.from, range.to).map((date) => {
    const existingDay = dayMap.get(date)

    if (existingDay) {
      return {
        ...existingDay,
        perIdentityCounts: { ...existingDay.perIdentityCounts },
        sourceUsernames: [...existingDay.sourceUsernames],
      }
    }

    return createContributionDay({
      date,
      contributionCount: 0,
      sourceUsernames: [...calendar.sourceUsernames],
      perIdentityCounts: Object.fromEntries(
        calendar.sourceUsernames.map((username) => [username, 0]),
      ),
      dataSource: calendar.dataSource,
    })
  })

  return {
    ...calendar,
    from: range.from,
    to: range.to,
    totalContributions: days.reduce((sum, day) => sum + day.contributionCount, 0),
    days,
    sourceUsernames: [...calendar.sourceUsernames],
  }
}

export function mergeContributionCalendars(
  calendars: GitPulseContributionCalendar[],
): GitPulseContributionCalendar {
  const uniqueCalendars = dedupeContributionCalendars(calendars)

  if (!uniqueCalendars.length) {
    const emptyRange = getDefaultContributionCalendarRange()

    return {
      from: emptyRange.from,
      to: emptyRange.to,
      totalContributions: 0,
      days: [],
      sourceUsernames: [],
      dataSource: 'approximate',
    }
  }

  const from = uniqueCalendars
    .map((calendar) => calendar.from)
    .sort((left, right) => left.localeCompare(right))[0]
  const to = uniqueCalendars
    .map((calendar) => calendar.to)
    .sort((left, right) => right.localeCompare(left))[0]
  const normalisedCalendars = uniqueCalendars.map((calendar) =>
    fillContributionCalendarRange(calendar, { from, to }),
  )
  const dayLookups = normalisedCalendars.map((calendar) => ({
    calendar,
    dayMap: new Map(calendar.days.map((day) => [day.date, day])),
  }))
  const sourceUsernames = mergeUniqueStrings(
    normalisedCalendars.flatMap((calendar) => calendar.sourceUsernames),
  )
  const calendarDataSource = resolveContributionDataSource(
    normalisedCalendars.map((calendar) => calendar.dataSource),
  )
  const mergedDays = enumerateContributionDates(from, to).map((date) => {
    const perIdentityCounts = dayLookups.reduce<Record<string, number>>((counts, lookup) => {
      const day = lookup.dayMap.get(date)

      if (!day) {
        lookup.calendar.sourceUsernames.forEach((username) => {
          counts[username] = counts[username] ?? 0
        })
        return counts
      }

      for (const [username, count] of Object.entries(day.perIdentityCounts)) {
        counts[username] = (counts[username] ?? 0) + count
      }

      return counts
    }, {})
    const contributionCount = Object.values(perIdentityCounts).reduce(
      (sum, count) => sum + count,
      0,
    )

    return createContributionDay({
      date,
      contributionCount,
      sourceUsernames: [...sourceUsernames],
      perIdentityCounts,
      dataSource: resolveContributionDataSource(
        dayLookups.map(
          ({ calendar, dayMap }) => dayMap.get(date)?.dataSource ?? calendar.dataSource,
        ),
      ),
    })
  })

  return {
    from,
    to,
    totalContributions: mergedDays.reduce((sum, day) => sum + day.contributionCount, 0),
    days: mergedDays,
    sourceUsernames,
    dataSource: calendarDataSource,
  }
}

export function resolveContributionDataSource(
  dataSources: GitPulseContributionDataSource[],
): GitPulseContributionDataSource {
  const uniqueSources = [...new Set(dataSources)]

  if (!uniqueSources.length) {
    return 'approximate'
  }

  if (uniqueSources.length === 1) {
    return uniqueSources[0]
  }

  return 'mixed'
}

export function enumerateContributionDates(from: string, to: string) {
  const dates: string[] = []
  const cursor = parseUtcDay(from)
  const endDate = parseUtcDay(to)

  while (cursor.getTime() <= endDate.getTime()) {
    dates.push(formatUtcDay(cursor))
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }

  return dates
}

function createContributionDay(day: {
  date: string
  contributionCount: number
  sourceUsernames: string[]
  perIdentityCounts: Record<string, number>
  dataSource: GitPulseContributionDataSource
}): GitPulseContributionDay {
  return {
    date: day.date,
    contributionCount: day.contributionCount,
    intensity: getContributionIntensity(day.contributionCount),
    sourceUsernames: mergeUniqueStrings(day.sourceUsernames),
    perIdentityCounts: { ...day.perIdentityCounts },
    dataSource: day.dataSource,
  }
}

function getApproximateContributionCount(day: GitPulseActivityDay) {
  if (day.activityScore <= 0) {
    return 0
  }

  // Approximate Stage 2 repo-push activity into a grid-friendly count for tokenless fallback mode.
  return clamp(
    Math.max(day.repoTouches.length, Math.round(day.activityScore / 25) + day.repoTouches.length),
    1,
    20,
  )
}

function dedupeContributionCalendars(calendars: GitPulseContributionCalendar[]) {
  const calendarMap = new Map<string, GitPulseContributionCalendar>()

  for (const calendar of calendars) {
    const key = calendar.sourceUsernames
      .map((username) => username.toLowerCase())
      .sort((left, right) => left.localeCompare(right))
      .join('|')

    calendarMap.set(key, calendar)
  }

  return [...calendarMap.values()]
}

function mergeUniqueStrings(values: string[]) {
  const mergedValues: string[] = []
  const seenValues = new Set<string>()

  for (const value of values) {
    const lowerValue = value.toLowerCase()

    if (!seenValues.has(lowerValue)) {
      seenValues.add(lowerValue)
      mergedValues.push(value)
    }
  }

  return mergedValues
}

function parseUtcDay(date: string) {
  return new Date(`${date}T00:00:00.000Z`)
}

function formatUtcDay(date: Date) {
  return date.toISOString().slice(0, 10)
}

function toUtcDateOnly(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}
