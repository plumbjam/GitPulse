type Env = {
  GITHUB_CLIENT_ID: string
  GITHUB_CLIENT_SECRET: string
  ALLOWED_ORIGIN?: string
  ALLOWED_REDIRECT_URIS?: string
}

type GitHubTokenResponse = {
  access_token?: string
  token_type?: string
  scope?: string
  error?: string
  error_description?: string
}

const EXCHANGE_PATH = '/oauth/github/exchange'
const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token'

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin')

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: buildCorsHeaders(env, origin),
      })
    }

    const url = new URL(request.url)

    if (url.pathname !== EXCHANGE_PATH) {
      return jsonResponse({ error: 'Not found.' }, 404, env, origin)
    }

    if (request.method !== 'POST') {
      return jsonResponse({ error: 'Use POST for GitHub OAuth token exchange.' }, 405, env, origin)
    }

    if (!isOriginAllowed(env, origin)) {
      return jsonResponse({ error: 'This origin is not allowed.' }, 403, env, origin)
    }

    if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
      return jsonResponse({ error: 'GitHub OAuth broker is not configured.' }, 500, env, origin)
    }

    const body = await readExchangeRequestBody(request)

    if (!body.code || !body.redirectUri) {
      return jsonResponse({ error: 'Missing OAuth code or redirect URI.' }, 400, env, origin)
    }

    if (!isRedirectUriAllowed(env, body.redirectUri)) {
      return jsonResponse({ error: 'This redirect URI is not allowed.' }, 400, env, origin)
    }

    const tokenResponse = await exchangeCodeWithGitHub(env, body.code, body.redirectUri)

    if (tokenResponse.error || !tokenResponse.access_token) {
      return jsonResponse(
        {
          error:
            tokenResponse.error_description ||
            'GitHub did not return a usable access token. Please try again.',
        },
        400,
        env,
        origin,
      )
    }

    return jsonResponse(
      {
        accessToken: tokenResponse.access_token,
        tokenType: tokenResponse.token_type || 'bearer',
        scope: tokenResponse.scope || '',
      },
      200,
      env,
      origin,
    )
  },
}

async function readExchangeRequestBody(request: Request) {
  try {
    const body = (await request.json()) as Partial<{ code: string; redirectUri: string }>

    return {
      code: body.code?.trim() ?? '',
      redirectUri: body.redirectUri?.trim() ?? '',
    }
  } catch {
    return {
      code: '',
      redirectUri: '',
    }
  }
}

async function exchangeCodeWithGitHub(env: Env, code: string, redirectUri: string) {
  const response = await fetch(GITHUB_TOKEN_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: redirectUri,
    }),
  })

  try {
    return (await response.json()) as GitHubTokenResponse
  } catch {
    return {
      error: 'invalid_response',
      error_description: 'GitHub returned an unreadable OAuth response.',
    } satisfies GitHubTokenResponse
  }
}

function isOriginAllowed(env: Env, origin: string | null) {
  if (!env.ALLOWED_ORIGIN || !origin) {
    return true
  }

  return origin === env.ALLOWED_ORIGIN
}

function isRedirectUriAllowed(env: Env, redirectUri: string) {
  const allowedRedirectUris = parseCommaSeparatedList(env.ALLOWED_REDIRECT_URIS)

  if (allowedRedirectUris.length) {
    return allowedRedirectUris.includes(redirectUri)
  }

  if (!env.ALLOWED_ORIGIN) {
    return true
  }

  try {
    return new URL(redirectUri).origin === env.ALLOWED_ORIGIN
  } catch {
    return false
  }
}

function buildCorsHeaders(env: Env, origin: string | null) {
  const allowOrigin = isOriginAllowed(env, origin)
    ? origin || env.ALLOWED_ORIGIN || '*'
    : env.ALLOWED_ORIGIN || 'null'

  return {
    'Access-Control-Allow-Headers': 'Content-Type, Accept',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Origin': allowOrigin,
    Vary: 'Origin',
  }
}

function jsonResponse(body: unknown, status: number, env: Env, origin: string | null) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...buildCorsHeaders(env, origin),
      'Content-Type': 'application/json; charset=utf-8',
    },
  })
}

function parseCommaSeparatedList(value: string | undefined) {
  return (value ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
}
