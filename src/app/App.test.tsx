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
    expect(screen.getByRole('img', { name: 'GitPulse' })).toBeInTheDocument()
    expect(screen.getByText(/Turn GitHub activity into sound/i)).toBeInTheDocument()
    expect(screen.getByText('Visual field')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'GitPulse profile' })).toBeInTheDocument()
  })

  it('prioritizes the contribution audio instrument before the visual field', () => {
    render(<App />)

    const contributionSection = screen.getByRole('heading', {
      name: 'Contribution signal grid',
    })
    const visualField = screen.getByText('Visual field')

    expect(
      contributionSection.compareDocumentPosition(visualField) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
  })

  it('maps a clicked contribution grid date to the shared audio playhead', async () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: /Use demo data/i }))

    await waitFor(() => expect(useGitPulseStore.getState().selectedStartDate).toBeTruthy())
    const loopStartDate = useGitPulseStore.getState().selectedStartDate
    const contributionTiles = await screen.findAllByRole('button', {
      name: /Select contribution day/i,
    })

    expect(screen.getAllByText('Quiet')).toHaveLength(1)

    const targetTile = contributionTiles.find((tile) => {
      const date = tile.getAttribute('data-date')

      return date && date !== loopStartDate
    })
    const targetDate = targetTile?.getAttribute('data-date')

    expect(targetTile).toBeDefined()
    expect(targetDate).toBeTruthy()

    fireEvent.click(targetTile!)

    await waitFor(() => {
      expect(useGitPulseStore.getState().currentPlayheadDate).toBe(targetDate)
    })
    expect(useGitPulseStore.getState().selectedStartDate).toBe(loopStartDate)
  })
})
