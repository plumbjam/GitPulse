import { describe, expect, it, vi } from 'vitest'
import {
  buildGitHubAuthorizeUrl,
  exchangeGitHubOAuthCode,
  parseGitHubOAuthCallback,
  removeGitHubOAuthCallbackParams,
} from './githubOAuth'

describe('github oauth helpers', () => {
  it('builds a GitHub authorize URL with client ID, redirect URI, state, and scope', () => {
    const authorizeUrl = new URL(
      buildGitHubAuthorizeUrl({
        clientId: 'client-123',
        redirectUri: 'https://plumbjam.github.io/GitPulse/',
        state: 'state-123',
      }),
    )

    expect(authorizeUrl.origin).toBe('https://github.com')
    expect(authorizeUrl.pathname).toBe('/login/oauth/authorize')
    expect(authorizeUrl.searchParams.get('client_id')).toBe('client-123')
    expect(authorizeUrl.searchParams.get('redirect_uri')).toBe(
      'https://plumbjam.github.io/GitPulse/',
    )
    expect(authorizeUrl.searchParams.get('state')).toBe('state-123')
    expect(authorizeUrl.searchParams.get('scope')).toBe('read:user')
  })

  it('parses successful GitHub OAuth callback params', () => {
    expect(parseGitHubOAuthCallback('?code=abc&state=state-123')).toEqual({
      type: 'success',
      code: 'abc',
      state: 'state-123',
    })
  })

  it('parses GitHub OAuth error callback params', () => {
    expect(parseGitHubOAuthCallback('?error=access_denied&error_description=Nope')).toEqual({
      type: 'error',
      error: 'access_denied',
      errorDescription: 'Nope',
    })
  })

  it('exchanges a code through the configured broker URL', async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          accessToken: 'gh-oauth',
          tokenType: 'bearer',
          scope: 'read:user',
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      ),
    )

    await expect(
      exchangeGitHubOAuthCode({
        brokerUrl: 'https://worker.example.com/oauth/github/exchange',
        code: 'code-123',
        redirectUri: 'https://plumbjam.github.io/GitPulse/',
        fetcher,
      }),
    ).resolves.toEqual({
      accessToken: 'gh-oauth',
      tokenType: 'bearer',
      scope: 'read:user',
    })

    expect(fetcher).toHaveBeenCalledWith(
      'https://worker.example.com/oauth/github/exchange',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          code: 'code-123',
          redirectUri: 'https://plumbjam.github.io/GitPulse/',
        }),
      }),
    )
  })

  it('removes OAuth callback params from the URL', () => {
    expect(
      removeGitHubOAuthCallbackParams(
        'https://plumbjam.github.io/GitPulse/?code=abc&state=state-123&users=alice#top',
      ),
    ).toBe('/GitPulse/?users=alice#top')
  })
})
