import { createGitHubClientErrorMessage, GitHubClientError } from './githubErrors'
import { getDefaultContributionCalendarRange } from './githubContributionMerge'
import type {
  GitHubContributionCalendarGraphqlResponse,
  GitHubContributionCalendarQueryRange,
  GitHubContributionCalendarQueryResult,
} from './github.types'

const GITHUB_GRAPHQL_API_URL = 'https://api.github.com/graphql'

const GITHUB_CONTRIBUTION_CALENDAR_QUERY = `
  query GitPulseContributionCalendar($login: String!, $from: DateTime!, $to: DateTime!) {
    user(login: $login) {
      login
      contributionsCollection(from: $from, to: $to) {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              date
              contributionCount
            }
          }
        }
      }
    }
  }
`

type GitHubContributionCalendarQueryOptions = {
  range?: GitHubContributionCalendarQueryRange
  referenceDate?: Date
}

export async function fetchGitHubContributionCalendarQuery(
  username: string,
  token: string,
  options: GitHubContributionCalendarQueryOptions = {},
): Promise<GitHubContributionCalendarQueryResult> {
  const trimmedToken = token.trim()

  if (!trimmedToken) {
    throw new GitHubClientError({
      code: 'missing_token',
      username,
    })
  }

  const range = options.range ?? getDefaultContributionCalendarRange(options.referenceDate)
  let response: Response

  try {
    response = await fetch(GITHUB_GRAPHQL_API_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${trimmedToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: GITHUB_CONTRIBUTION_CALENDAR_QUERY,
        variables: {
          login: username,
          from: `${range.from}T00:00:00.000Z`,
          to: `${range.to}T23:59:59.999Z`,
        },
      }),
    })
  } catch {
    throw new GitHubClientError({
      code: 'network_error',
      username,
    })
  }

  const payload = await safeReadGraphqlPayload(response)

  if (!response.ok || payload.errors?.length) {
    const responseMessage = payload.errors?.[0]?.message

    if (
      response.status === 403 ||
      response.status === 429 ||
      response.headers.get('x-ratelimit-remaining') === '0' ||
      (typeof responseMessage === 'string' && responseMessage.toLowerCase().includes('rate limit'))
    ) {
      throw new GitHubClientError({
        code: 'rate_limited',
        username,
        status: response.status || 403,
      })
    }

    throw new GitHubClientError({
      code: 'graphql_error',
      username,
      status: response.status || undefined,
      message:
        responseMessage &&
        responseMessage !== createGitHubClientErrorMessage({ code: 'graphql_error' })
          ? responseMessage
          : undefined,
    })
  }

  return {
    payload,
    range,
  }
}

async function safeReadGraphqlPayload(response: Response) {
  try {
    return (await response.json()) as GitHubContributionCalendarGraphqlResponse
  } catch {
    return {} as GitHubContributionCalendarGraphqlResponse
  }
}
