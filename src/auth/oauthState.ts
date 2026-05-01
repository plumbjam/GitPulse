export const GITHUB_OAUTH_STATE_STORAGE_KEY = 'gitpulse.oauth.state'

type OAuthStorage = Pick<Storage, 'getItem' | 'removeItem' | 'setItem'>

export function generateOAuthState(storage = getSessionStorage()) {
  const state = createSecureRandomState()

  storage?.setItem(GITHUB_OAUTH_STATE_STORAGE_KEY, state)

  return state
}

export function validateOAuthState(
  returnedState: string | null | undefined,
  storage = getSessionStorage(),
) {
  const expectedState = storage?.getItem(GITHUB_OAUTH_STATE_STORAGE_KEY)

  storage?.removeItem(GITHUB_OAUTH_STATE_STORAGE_KEY)

  return Boolean(returnedState && expectedState && returnedState === expectedState)
}

export function clearOAuthState(storage = getSessionStorage()) {
  storage?.removeItem(GITHUB_OAUTH_STATE_STORAGE_KEY)
}

function createSecureRandomState() {
  const crypto = globalThis.crypto

  if (!crypto?.getRandomValues) {
    throw new Error('Secure random state generation is unavailable in this browser.')
  }

  const bytes = new Uint8Array(24)
  crypto.getRandomValues(bytes)

  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

function getSessionStorage(): OAuthStorage | undefined {
  try {
    return globalThis.sessionStorage
  } catch {
    return undefined
  }
}
