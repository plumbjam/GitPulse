import {
  createGitHubClientErrorMessage,
  GitHubClientError,
  isGitHubClientError,
  toGitHubClientError,
} from './githubErrors'
import type {
  GitHubIdentityFetchResult,
  GitHubRepoLanguageSnapshot,
  GitHubRepoLanguagesResponse,
  GitHubRepoResponse,
  GitHubUserResponse,
} from './github.types'

const GITHUB_API_BASE_URL = 'https://api.github.com'
const GITHUB_ACCEPT_HEADER = 'application/vnd.github+json'
const GITHUB_USERNAME_REGEX = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/
const MAX_LANGUAGE_REPOS = 24
const LANGUAGE_FETCH_CONCURRENCY = 6

export function normaliseGitHubUsernameInput(username: string) {
  return username.trim()
}

export function getGitHubUsernameKey(username: string) {
  return normaliseGitHubUsernameInput(username).toLowerCase()
}

export function isValidGitHubUsername(username: string) {
  return GITHUB_USERNAME_REGEX.test(normaliseGitHubUsernameInput(username))
}

export async function fetchGitHubUser(username: string) {
  return fetchGitHubJson<GitHubUserResponse>(`/users/${username}`, username)
}

export async function fetchGitHubRepos(username: string) {
  return fetchGitHubJson<GitHubRepoResponse[]>(
    `/users/${username}/repos?per_page=100&sort=pushed`,
    username,
  )
}

export async function fetchGitHubRepoLanguages(owner: string, repo: string, username?: string) {
  return fetchGitHubJson<GitHubRepoLanguagesResponse>(`/repos/${owner}/${repo}/languages`, username)
}

export async function fetchGitHubIdentityDataset(
  username: string,
): Promise<GitHubIdentityFetchResult> {
  const trimmedUsername = normaliseGitHubUsernameInput(username)

  if (!isValidGitHubUsername(trimmedUsername)) {
    return {
      status: 'error',
      username: trimmedUsername,
      error: new GitHubClientError({
        code: 'invalid_username',
        username: trimmedUsername,
      }),
    }
  }

  try {
    const user = await fetchGitHubUser(trimmedUsername)
    const repos = await fetchGitHubRepos(trimmedUsername)
    const languageSnapshots = await fetchRepoLanguageSnapshots(repos, user.login)

    const warnings = languageSnapshots.some((snapshot) => snapshot.languageStatus === 'error')
      ? ['Could not load languages for some repositories.']
      : []

    return {
      status: 'success',
      username: user.login,
      data: {
        requestedUsername: trimmedUsername,
        user,
        repos: languageSnapshots,
        warnings,
        fetchedAt: new Date().toISOString(),
      },
    }
  } catch (error) {
    return {
      status: 'error',
      username: trimmedUsername,
      error: toGitHubClientError(error, trimmedUsername),
    }
  }
}

async function fetchRepoLanguageSnapshots(repos: GitHubRepoResponse[], username: string) {
  const reposWithLanguages = repos.slice(0, MAX_LANGUAGE_REPOS)
  const reposWithoutLanguages = repos.slice(MAX_LANGUAGE_REPOS)

  const loadedSnapshots = await mapWithConcurrency(
    reposWithLanguages,
    LANGUAGE_FETCH_CONCURRENCY,
    async (repo) => {
      try {
        const languages = await fetchGitHubRepoLanguages(repo.owner.login, repo.name, username)

        return {
          repo,
          languages,
          languageStatus: 'loaded',
        } satisfies GitHubRepoLanguageSnapshot
      } catch {
        return {
          repo,
          languages: {},
          languageStatus: 'error',
        } satisfies GitHubRepoLanguageSnapshot
      }
    },
  )

  const skippedSnapshots = reposWithoutLanguages.map(
    (repo) =>
      ({
        repo,
        languages: {},
        languageStatus: 'skipped',
      }) satisfies GitHubRepoLanguageSnapshot,
  )

  return [...loadedSnapshots, ...skippedSnapshots]
}

async function fetchGitHubJson<T>(path: string, username?: string): Promise<T> {
  let response: Response

  try {
    response = await fetch(`${GITHUB_API_BASE_URL}${path}`, {
      headers: {
        Accept: GITHUB_ACCEPT_HEADER,
      },
    })
  } catch {
    throw new GitHubClientError({
      code: 'network_error',
      username,
    })
  }

  if (!response.ok) {
    const responseMessage = await readGitHubErrorMessage(response)

    if (response.status === 404) {
      throw new GitHubClientError({
        code: 'not_found',
        username,
        status: response.status,
      })
    }

    if (isGitHubRateLimited(response, responseMessage)) {
      throw new GitHubClientError({
        code: 'rate_limited',
        username,
        status: response.status,
      })
    }

    throw new GitHubClientError({
      code: 'http_error',
      username,
      status: response.status,
      message:
        responseMessage &&
        responseMessage !== createGitHubClientErrorMessage({ code: 'http_error' })
          ? responseMessage
          : undefined,
    })
  }

  return (await response.json()) as T
}

async function readGitHubErrorMessage(response: Response) {
  try {
    const payload = (await response.clone().json()) as { message?: string }
    return payload.message
  } catch {
    return undefined
  }
}

function isGitHubRateLimited(response: Response, responseMessage?: string) {
  if (response.status === 429) {
    return true
  }

  if (response.headers.get('x-ratelimit-remaining') === '0') {
    return true
  }

  return (
    response.status === 403 &&
    typeof responseMessage === 'string' &&
    responseMessage.toLowerCase().includes('rate limit')
  )
}

async function mapWithConcurrency<TItem, TResult>(
  items: TItem[],
  concurrency: number,
  mapper: (item: TItem) => Promise<TResult>,
) {
  const results = new Array<TResult>(items.length)
  let nextIndex = 0

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex
      nextIndex += 1
      results[currentIndex] = await mapper(items[currentIndex])
    }
  })

  await Promise.all(workers)
  return results
}

export { isGitHubClientError }
