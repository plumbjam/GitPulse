import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import worker from '../src/index'

const origin = 'https://gitpulse.example'
const redirectUri = `${origin}/GitPulse/`
const env = {
  GITHUB_CLIENT_ID: 'test-client',
  GITHUB_CLIENT_SECRET: 'test-secret',
  ALLOWED_ORIGIN: origin,
  ALLOWED_REDIRECT_URIS: redirectUri,
}

function request(options: { method?: string; origin?: string; path?: string; body?: string } = {}) {
  const method = options.method ?? 'POST'
  return new Request(`https://broker.example${options.path ?? '/oauth/github/exchange'}`, {
    method,
    headers: { Origin: options.origin ?? origin, 'Content-Type': 'application/json' },
    ...(method === 'POST'
      ? { body: options.body ?? JSON.stringify({ code: 'test-code', redirectUri }) }
      : {}),
  })
}

describe('OAuth Worker broker', () => {
  const upstream = vi.fn<typeof fetch>()
  beforeEach(() => {
    upstream.mockReset().mockRejectedValue(new Error('Unexpected upstream call'))
    vi.stubGlobal('fetch', upstream)
  })
  afterEach(() => vi.unstubAllGlobals())

  it.each([
    { method: 'GET', status: 405 },
    { path: '/missing', status: 404 },
    { origin: 'https://untrusted.example', status: 403 },
    { body: '{invalid', status: 400 },
    { body: '{}', status: 400 },
    { body: JSON.stringify({ code: 'test', redirectUri: `${origin}/other` }), status: 400 },
    {
      body: JSON.stringify({ code: 'test', redirectUri: 'https://untrusted.example/' }),
      status: 400,
    },
  ])('rejects invalid requests before contacting upstream: %j', async ({ status, ...options }) => {
    const response = await worker.fetch(request(options), env)
    expect(response.status).toBe(status)
    expect(upstream).not.toHaveBeenCalled()
  })

  it('answers allowed preflights without exchanging a code', async () => {
    const response = await worker.fetch(request({ method: 'OPTIONS' }), env)
    expect(response.status).toBe(204)
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe(origin)
    expect(upstream).not.toHaveBeenCalled()
  })

  it('does not grant CORS access to an untrusted preflight', async () => {
    const response = await worker.fetch(
      request({ method: 'OPTIONS', origin: 'https://untrusted.example' }),
      env,
    )
    expect(response.headers.get('Access-Control-Allow-Origin')).not.toBe(
      'https://untrusted.example',
    )
    expect(upstream).not.toHaveBeenCalled()
  })

  it('rejects a missing broker configuration locally', async () => {
    const response = await worker.fetch(request(), { ...env, GITHUB_CLIENT_SECRET: '' })
    expect(response.status).toBe(500)
    expect(upstream).not.toHaveBeenCalled()
  })

  it('exchanges a code with the configured redirect and returns the session', async () => {
    upstream.mockResolvedValueOnce(
      Response.json({ access_token: 'test-token', token_type: 'bearer', scope: 'read:user' }),
    )
    const response = await worker.fetch(request(), env)
    expect(response.status).toBe(200)
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe(origin)
    expect(await response.json()).toEqual({
      accessToken: 'test-token',
      tokenType: 'bearer',
      scope: 'read:user',
    })
    expect(upstream).toHaveBeenCalledOnce()
    const [url, init] = upstream.mock.calls[0]
    expect(url).toBe('https://github.com/login/oauth/access_token')
    expect(init?.method).toBe('POST')
    expect(new URLSearchParams(init?.body as URLSearchParams).get('redirect_uri')).toBe(redirectUri)
    expect(new URLSearchParams(init?.body as URLSearchParams).get('client_secret')).toBe(
      'test-secret',
    )
  })

  it('returns code exchange errors as JSON', async () => {
    upstream.mockResolvedValueOnce(
      Response.json({ error: 'bad_verification_code', error_description: 'The code has expired.' }),
    )
    const response = await worker.fetch(request(), env)
    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'The code has expired.' })
  })

  it.each(['invalid JSON', 'null'])('handles an unreadable upstream payload: %s', async (body) => {
    upstream.mockResolvedValueOnce(new Response(body))
    const response = await worker.fetch(request(), env)
    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({
      error: 'GitHub returned an unreadable OAuth response.',
    })
  })

  it.each(['network', 'HTTP'])(
    'returns a safe CORS response on upstream %s failure',
    async (failure) => {
      if (failure === 'network')
        upstream.mockRejectedValueOnce(new Error('Internal transport details'))
      else upstream.mockResolvedValueOnce(new Response('Upstream failed', { status: 503 }))
      const response = await worker.fetch(request(), env)
      expect(response.status).toBe(502)
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe(origin)
      expect(await response.json()).toEqual({
        error: 'GitHub OAuth is temporarily unavailable. Please try again.',
      })
    },
  )
})
