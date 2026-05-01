import { beforeEach, describe, expect, it } from 'vitest'
import {
  GITHUB_OAUTH_SESSION_STORAGE_KEY,
  clearGitHubOAuthSession,
  loadGitHubOAuthSession,
  saveGitHubOAuthSession,
} from './oauthSession'

describe('oauth session helpers', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it('stores and loads a GitHub OAuth session from sessionStorage', () => {
    saveGitHubOAuthSession({
      accessToken: ' gh-test ',
      tokenType: 'bearer',
      scope: 'read:user',
      connectedAt: '2026-04-29T00:00:00.000Z',
    })

    expect(loadGitHubOAuthSession()).toEqual({
      accessToken: 'gh-test',
      tokenType: 'bearer',
      scope: 'read:user',
      connectedAt: '2026-04-29T00:00:00.000Z',
    })
  })

  it('clears a stored GitHub OAuth session', () => {
    saveGitHubOAuthSession({
      accessToken: 'gh-test',
      tokenType: 'bearer',
      scope: 'read:user',
    })

    clearGitHubOAuthSession()

    expect(sessionStorage.getItem(GITHUB_OAUTH_SESSION_STORAGE_KEY)).toBeNull()
    expect(loadGitHubOAuthSession()).toBeUndefined()
  })
})
