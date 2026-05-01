export const GITHUB_OAUTH_AUTHORIZE_URL = 'https://github.com/login/oauth/authorize'
export const GITHUB_OAUTH_SCOPE = 'read:user'

export type GitHubOAuthRuntimeConfig = {
  clientId: string
  brokerUrl: string
  redirectUri: string
  scope: string
}

export type GitHubOAuthCallback =
  | {
      type: 'none'
    }
  | {
      type: 'success'
      code: string
      state: string
    }
  | {
      type: 'error'
      error: string
      errorDescription?: string
    }

type GitHubOAuthExchangeOptions = {
  brokerUrl: string
  code: string
  redirectUri: string
  fetcher?: typeof fetch
}

type GitHubOAuthExchangePayload = {
  accessToken?: string
  tokenType?: string
  scope?: string
  error?: string
}

export function getGitHubOAuthRuntimeConfig(): GitHubOAuthRuntimeConfig {
  return {
    clientId: import.meta.env.VITE_GITHUB_OAUTH_CLIENT_ID ?? '',
    brokerUrl: import.meta.env.VITE_GITHUB_OAUTH_BROKER_URL ?? '',
    redirectUri: getDefaultOAuthRedirectUri(),
    scope: GITHUB_OAUTH_SCOPE,
  }
}

export function hasGitHubOAuthConfig(
  config: Pick<GitHubOAuthRuntimeConfig, 'brokerUrl' | 'clientId'>,
) {
  return Boolean(config.clientId.trim() && config.brokerUrl.trim())
}

export function buildGitHubAuthorizeUrl(options: {
  clientId: string
  redirectUri: string
  state: string
  scope?: string
}) {
  const authorizeUrl = new URL(GITHUB_OAUTH_AUTHORIZE_URL)

  authorizeUrl.searchParams.set('client_id', options.clientId)
  authorizeUrl.searchParams.set('redirect_uri', options.redirectUri)
  authorizeUrl.searchParams.set('scope', options.scope ?? GITHUB_OAUTH_SCOPE)
  authorizeUrl.searchParams.set('state', options.state)
  authorizeUrl.searchParams.set('allow_signup', 'true')

  return authorizeUrl.toString()
}

export function parseGitHubOAuthCallback(search: string | URLSearchParams): GitHubOAuthCallback {
  const params = search instanceof URLSearchParams ? search : new URLSearchParams(search)
  const error = params.get('error')

  if (error) {
    return {
      type: 'error',
      error,
      errorDescription: params.get('error_description') ?? undefined,
    }
  }

  const code = params.get('code')
  const state = params.get('state')

  if (!code && !state) {
    return {
      type: 'none',
    }
  }

  if (!code || !state) {
    return {
      type: 'error',
      error: 'invalid_callback',
      errorDescription: 'GitHub login returned an incomplete callback.',
    }
  }

  return {
    type: 'success',
    code,
    state,
  }
}

export async function exchangeGitHubOAuthCode({
  brokerUrl,
  code,
  redirectUri,
  fetcher = fetch,
}: GitHubOAuthExchangeOptions) {
  const response = await fetcher(brokerUrl, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      code,
      redirectUri,
    }),
  })
  const payload = (await response.json().catch(() => ({}))) as GitHubOAuthExchangePayload

  if (!response.ok || payload.error) {
    throw new Error(payload.error || 'GitHub login could not be completed.')
  }

  if (!payload.accessToken?.trim()) {
    throw new Error('GitHub login completed without a usable access token.')
  }

  return {
    accessToken: payload.accessToken.trim(),
    tokenType: payload.tokenType || 'bearer',
    scope: payload.scope || '',
  }
}

export function removeGitHubOAuthCallbackParams(currentUrl: string) {
  const url = new URL(currentUrl)

  for (const param of ['code', 'state', 'error', 'error_description', 'error_uri']) {
    url.searchParams.delete(param)
  }

  const query = url.searchParams.toString()

  return `${url.pathname}${query ? `?${query}` : ''}${url.hash}`
}

export function getDefaultOAuthRedirectUri() {
  const location = globalThis.location

  if (!location) {
    return ''
  }

  return `${location.origin}${location.pathname}`
}
