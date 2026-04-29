export type GitHubClientErrorCode =
  | 'invalid_username'
  | 'not_found'
  | 'rate_limited'
  | 'network_error'
  | 'http_error'

type GitHubClientErrorOptions = {
  code: GitHubClientErrorCode
  message?: string
  username?: string
  status?: number
}

export class GitHubClientError extends Error {
  code: GitHubClientErrorCode
  username?: string
  status?: number

  constructor({ code, message, username, status }: GitHubClientErrorOptions) {
    super(message ?? createGitHubClientErrorMessage({ code, username, status }))
    this.name = 'GitHubClientError'
    this.code = code
    this.username = username
    this.status = status
  }
}

export function isGitHubClientError(value: unknown): value is GitHubClientError {
  return value instanceof GitHubClientError
}

export function createGitHubClientErrorMessage(error: {
  code: GitHubClientErrorCode
  username?: string
  status?: number
}) {
  switch (error.code) {
    case 'invalid_username':
      return 'Enter a valid GitHub username.'
    case 'not_found':
      return 'User not found.'
    case 'rate_limited':
      return 'GitHub rate limit reached. Try again later.'
    case 'network_error':
      return 'Network error while contacting GitHub.'
    case 'http_error':
    default:
      if (error.status) {
        return `GitHub request failed (${error.status}).`
      }

      return 'GitHub request failed.'
  }
}

export function toGitHubClientError(error: unknown, username?: string) {
  if (isGitHubClientError(error)) {
    return error
  }

  return new GitHubClientError({
    code: 'network_error',
    username,
  })
}
