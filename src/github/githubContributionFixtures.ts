import type {
  GitHubContributionCalendarGraphqlResponse,
  GitHubContributionCalendarQueryRange,
} from './github.types'
import { buildContributionCalendarFromSparseCounts } from './githubContributionMerge'

export const contributionFixtureRange: GitHubContributionCalendarQueryRange = {
  from: '2026-04-01',
  to: '2026-04-07',
}

export const fixtureGitHubContributionCalendarAlice: GitHubContributionCalendarGraphqlResponse = {
  data: {
    user: {
      login: 'alice',
      contributionsCollection: {
        contributionCalendar: {
          totalContributions: 8,
          weeks: [
            {
              contributionDays: [
                { date: '2026-04-01', contributionCount: 0 },
                { date: '2026-04-02', contributionCount: 1 },
                { date: '2026-04-03', contributionCount: 2 },
                { date: '2026-04-04', contributionCount: 0 },
                { date: '2026-04-05', contributionCount: 5 },
                { date: '2026-04-06', contributionCount: 0 },
                { date: '2026-04-07', contributionCount: 0 },
              ],
            },
          ],
        },
      },
    },
  },
}

export const fixtureGitHubContributionCalendarMissingUser: GitHubContributionCalendarGraphqlResponse =
  {
    data: {
      user: null,
    },
  }

export function createFixtureContributionCalendarAlice() {
  return buildContributionCalendarFromSparseCounts({
    username: 'alice',
    counts: {
      '2026-04-01': 1,
      '2026-04-03': 5,
    },
    from: '2026-04-01',
    to: '2026-04-05',
    dataSource: 'graphql',
  })
}

export function createFixtureContributionCalendarBob() {
  return buildContributionCalendarFromSparseCounts({
    username: 'alice-work',
    counts: {
      '2026-04-02': 2,
      '2026-04-03': 7,
      '2026-04-05': 1,
    },
    from: '2026-04-01',
    to: '2026-04-05',
    dataSource: 'approximate',
  })
}
