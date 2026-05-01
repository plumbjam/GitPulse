import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { useGitPulseStore } from '@/store/useGitPulseStore'
import { GitHubConnectionPanel } from './GitHubConnectionPanel'

const initialStoreState = useGitPulseStore.getState()

describe('GitHubConnectionPanel', () => {
  beforeEach(() => {
    sessionStorage.clear()
    useGitPulseStore.setState(initialStoreState, true)
  })

  it('shows GitHub login as the primary action and keeps manual token as advanced fallback', () => {
    render(<GitHubConnectionPanel />)

    expect(screen.getByRole('button', { name: /Log in with GitHub/i })).toBeInTheDocument()
    expect(screen.getByText(/Advanced: use a token manually/i)).toBeInTheDocument()
  })
})
