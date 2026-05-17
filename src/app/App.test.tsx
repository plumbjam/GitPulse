import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { useGitPulseStore } from '@/store/useGitPulseStore'
import App from './App'

const initialStoreState = useGitPulseStore.getState()

describe('App', () => {
  beforeEach(() => {
    sessionStorage.clear()
    useGitPulseStore.setState(initialStoreState, true)
  })

  it('renders the GitPulse shell headline', () => {
    render(<App />)
    expect(screen.getByText('GitPulse')).toBeInTheDocument()
    expect(screen.getByText(/Turn GitHub activity into sound/i)).toBeInTheDocument()
  })

  it('maps a clicked contribution grid date to the shared audio playhead', async () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: /Use demo data/i }))

    const contributionTiles = await screen.findAllByRole('button', {
      name: /Select contribution day/i,
    })
    const targetTile = contributionTiles.find((tile) => tile.getAttribute('data-date'))
    const targetDate = targetTile?.getAttribute('data-date')

    expect(targetTile).toBeDefined()
    expect(targetDate).toBeTruthy()

    fireEvent.click(targetTile!)

    await waitFor(() => {
      expect(useGitPulseStore.getState().currentPlayheadDate).toBe(targetDate)
    })
    expect(useGitPulseStore.getState().selectedStartDate).toBe(targetDate)
  })
})
