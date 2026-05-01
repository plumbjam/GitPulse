import { beforeEach, describe, expect, it } from 'vitest'
import {
  GITHUB_OAUTH_STATE_STORAGE_KEY,
  generateOAuthState,
  validateOAuthState,
} from './oauthState'

describe('oauth state helpers', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it('generates and stores an expected OAuth state value', () => {
    const state = generateOAuthState()

    expect(state).toHaveLength(48)
    expect(sessionStorage.getItem(GITHUB_OAUTH_STATE_STORAGE_KEY)).toBe(state)
  })

  it('validates a matching state and clears it after use', () => {
    const state = generateOAuthState()

    expect(validateOAuthState(state)).toBe(true)
    expect(sessionStorage.getItem(GITHUB_OAUTH_STATE_STORAGE_KEY)).toBeNull()
  })

  it('rejects a mismatched state and clears it after use', () => {
    generateOAuthState()

    expect(validateOAuthState('wrong-state')).toBe(false)
    expect(sessionStorage.getItem(GITHUB_OAUTH_STATE_STORAGE_KEY)).toBeNull()
  })
})
