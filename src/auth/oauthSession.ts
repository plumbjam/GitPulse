export const GITHUB_OAUTH_SESSION_STORAGE_KEY = 'gitpulse.oauth.token'

type OAuthStorage = Pick<Storage, 'getItem' | 'removeItem' | 'setItem'>

export type GitHubOAuthSession = {
  accessToken: string
  tokenType: string
  scope: string
  connectedAt: string
}

export function saveGitHubOAuthSession(
  session: Omit<GitHubOAuthSession, 'connectedAt'> & { connectedAt?: string },
  storage = getSessionStorage(),
) {
  if (!storage || !session.accessToken.trim()) {
    return
  }

  storage.setItem(
    GITHUB_OAUTH_SESSION_STORAGE_KEY,
    JSON.stringify({
      accessToken: session.accessToken.trim(),
      tokenType: session.tokenType || 'bearer',
      scope: session.scope || '',
      connectedAt: session.connectedAt ?? new Date().toISOString(),
    } satisfies GitHubOAuthSession),
  )
}

export function loadGitHubOAuthSession(storage = getSessionStorage()) {
  if (!storage) {
    return undefined
  }

  const rawSession = storage.getItem(GITHUB_OAUTH_SESSION_STORAGE_KEY)

  if (!rawSession) {
    return undefined
  }

  try {
    const parsedSession = JSON.parse(rawSession) as Partial<GitHubOAuthSession>

    if (!parsedSession.accessToken?.trim()) {
      clearGitHubOAuthSession(storage)
      return undefined
    }

    return {
      accessToken: parsedSession.accessToken.trim(),
      tokenType: parsedSession.tokenType || 'bearer',
      scope: parsedSession.scope || '',
      connectedAt: parsedSession.connectedAt || new Date().toISOString(),
    } satisfies GitHubOAuthSession
  } catch {
    clearGitHubOAuthSession(storage)
    return undefined
  }
}

export function clearGitHubOAuthSession(storage = getSessionStorage()) {
  storage?.removeItem(GITHUB_OAUTH_SESSION_STORAGE_KEY)
}

function getSessionStorage(): OAuthStorage | undefined {
  try {
    return globalThis.sessionStorage
  } catch {
    return undefined
  }
}
