import type { GitPulseContributionFetchResult } from '@/domain/gitpulse.types'
import { fillContributionCalendarRange, getContributionIntensity } from './githubContributionMerge'
import type { GitHubContributionCalendarQueryResult } from './github.types'

export function normaliseGitHubContributionCalendarResult(
  username: string,
  queryResult: GitHubContributionCalendarQueryResult,
): GitPulseContributionFetchResult {
  const user = queryResult.payload.data?.user

  if (!user) {
    return {
      username,
      status: 'error',
      errorMessage: 'User not found.',
    }
  }

  const rawCalendar = user.contributionsCollection.contributionCalendar
  const rawDays = rawCalendar.weeks.flatMap((week) => week.contributionDays)

  return {
    username: user.login,
    status: 'success',
    calendar: fillContributionCalendarRange(
      {
        from: queryResult.range.from,
        to: queryResult.range.to,
        totalContributions: rawCalendar.totalContributions,
        days: rawDays.map((day) => ({
          date: day.date.slice(0, 10),
          contributionCount: day.contributionCount,
          intensity: getContributionIntensity(day.contributionCount),
          sourceUsernames: [user.login],
          perIdentityCounts: {
            [user.login]: day.contributionCount,
          },
          dataSource: 'graphql',
        })),
        sourceUsernames: [user.login],
        dataSource: 'graphql',
      },
      queryResult.range,
    ),
  }
}
