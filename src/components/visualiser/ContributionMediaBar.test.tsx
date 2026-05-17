import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { createAudioPatternFromCalendar } from '@/audio/contributionSequencer'
import type { GitPulseContributionCalendar, GitPulseContributionDay } from '@/domain/gitpulse.types'
import { useGitPulseStore } from '@/store/useGitPulseStore'
import { ContributionMediaBar } from './ContributionMediaBar'

const initialStoreState = useGitPulseStore.getState()

describe('ContributionMediaBar', () => {
  beforeEach(() => {
    useGitPulseStore.setState(initialStoreState, true)
  })

  it('renders one media segment per audio pattern step and defaults to the first active step', async () => {
    const pattern = createTestPattern(73)

    render(<ContributionMediaBar pattern={pattern} />)

    const finalStep = pattern.steps[pattern.steps.length - 1]

    expect(screen.getByLabelText('Contribution audio timeline').children).toHaveLength(73)
    expect(screen.getByText(/73 contribution steps - 19 bars/)).toBeInTheDocument()
    expect(
      screen.getByRole('button', {
        name: new RegExp(`Select audio step 73: ${formatDisplayDate(finalStep.date ?? '')}`),
      }),
    ).toBeInTheDocument()
    await waitFor(() => expect(screen.getAllByText(/Step 2\/73/).length).toBeGreaterThan(0))
    expect(useGitPulseStore.getState()).toMatchObject({
      selectedStartStepIndex: 1,
      selectedStartDate: pattern.steps[1].date,
      currentPlayheadStepIndex: 1,
      currentPlayheadDate: pattern.steps[1].date,
    })
  })

  it('falls back to step 0 when all steps are quiet', async () => {
    const pattern = createTestPatternFromCounts([0, 0, 0])

    render(<ContributionMediaBar pattern={pattern} />)

    await waitFor(() => expect(screen.getAllByText(/Step 1\/3/).length).toBeGreaterThan(0))
    expect(useGitPulseStore.getState()).toMatchObject({
      selectedStartStepIndex: 0,
      selectedStartDate: pattern.steps[0].date,
      currentPlayheadStepIndex: 0,
      currentPlayheadDate: pattern.steps[0].date,
    })
  })

  it('renders horizontal transport controls in the expected order', () => {
    const pattern = createTestPatternFromCounts([0, 1, 2])

    render(<ContributionMediaBar pattern={pattern} />)

    const controls = within(screen.getByRole('group', { name: 'Audio transport controls' }))
      .getAllByRole('button')
      .map((button) => button.getAttribute('aria-label'))

    expect(controls).toEqual([
      'Reset to start',
      'Skip back one contribution day',
      'Play',
      'Stop',
      'Skip forward one contribution day',
    ])
  })

  it('uses the active store step as the visible playhead while playing', async () => {
    const pattern = createTestPattern(73)

    render(<ContributionMediaBar pattern={pattern} />)
    await waitFor(() => expect(useGitPulseStore.getState().selectedStartStepIndex).toBe(1))

    act(() => {
      useGitPulseStore.setState({
        isAudioPlaying: true,
        activeAudioStepIndex: 10,
        activeAudioDate: pattern.steps[10].date,
        currentPlayheadStepIndex: 10,
        currentPlayheadDate: pattern.steps[10].date,
      })
    })

    const stepButton = screen.getByRole('button', { name: /Select audio step 11/i })

    expect(screen.getByText(/Step 11\/73/)).toBeInTheDocument()
    expect(stepButton).toHaveClass('scale-y-110')
  })

  it('cues the current playhead when a media segment is clicked without changing loop start', async () => {
    const pattern = createTestPatternFromCounts([0, 1, 2, 3])

    render(<ContributionMediaBar pattern={pattern} />)
    await waitFor(() => expect(useGitPulseStore.getState().selectedStartStepIndex).toBe(1))

    fireEvent.click(screen.getByRole('button', { name: /Select audio step 4/i }))

    expect(useGitPulseStore.getState()).toMatchObject({
      selectedStartStepIndex: 1,
      selectedStartDate: pattern.steps[1].date,
      currentPlayheadStepIndex: 3,
      currentPlayheadDate: pattern.steps[3].date,
      isAudioPlaying: false,
    })
  })

  it('moves one step with skip controls and clamps at timeline edges', async () => {
    const pattern = createTestPatternFromCounts([0, 1, 2])

    render(<ContributionMediaBar pattern={pattern} />)
    await waitFor(() => expect(useGitPulseStore.getState().selectedStartStepIndex).toBe(1))

    fireEvent.click(screen.getByLabelText('Skip back one contribution day'))
    expect(useGitPulseStore.getState().currentPlayheadStepIndex).toBe(0)
    expect(screen.getByLabelText('Skip back one contribution day')).toBeDisabled()

    fireEvent.click(screen.getByLabelText('Skip forward one contribution day'))
    fireEvent.click(screen.getByLabelText('Skip forward one contribution day'))
    expect(useGitPulseStore.getState().currentPlayheadStepIndex).toBe(2)
    expect(screen.getByLabelText('Skip forward one contribution day')).toBeDisabled()
  })

  it('stops playback and resets the playhead to the first active loop start', async () => {
    const pattern = createTestPatternFromCounts([0, 1, 2, 3, 4])

    render(<ContributionMediaBar pattern={pattern} />)
    await waitFor(() => expect(useGitPulseStore.getState().selectedStartStepIndex).toBe(1))

    fireEvent.click(screen.getByRole('button', { name: /Select audio step 5/i }))
    expect(useGitPulseStore.getState()).toMatchObject({
      selectedStartStepIndex: 1,
      currentPlayheadStepIndex: 4,
    })

    act(() => {
      useGitPulseStore.setState({
        isAudioPlaying: true,
        activeAudioStepIndex: 4,
        activeAudioDate: pattern.steps[4].date,
        currentPlayheadStepIndex: 4,
        currentPlayheadDate: pattern.steps[4].date,
      })
    })
    fireEvent.click(screen.getByLabelText('Stop'))

    expect(useGitPulseStore.getState()).toMatchObject({
      isAudioPlaying: false,
      activeAudioStepIndex: null,
      currentPlayheadStepIndex: 1,
      currentPlayheadDate: pattern.steps[1].date,
    })
  })

  it('resets a cued playhead to the first active loop start', async () => {
    const pattern = createTestPatternFromCounts([0, 1, 2, 3])

    render(<ContributionMediaBar pattern={pattern} />)
    await waitFor(() => expect(useGitPulseStore.getState().selectedStartStepIndex).toBe(1))

    fireEvent.click(screen.getByRole('button', { name: /Select audio step 4/i }))
    expect(useGitPulseStore.getState().currentPlayheadStepIndex).toBe(3)

    fireEvent.click(screen.getByLabelText('Reset to start'))

    expect(useGitPulseStore.getState()).toMatchObject({
      selectedStartStepIndex: 1,
      currentPlayheadStepIndex: 1,
      currentPlayheadDate: pattern.steps[1].date,
    })
  })

  it('pauses playback without resetting the current playhead', async () => {
    const pattern = createTestPatternFromCounts([0, 1, 2, 3, 4])

    render(<ContributionMediaBar pattern={pattern} />)
    await waitFor(() => expect(useGitPulseStore.getState().selectedStartStepIndex).toBe(1))

    act(() => {
      useGitPulseStore.setState({
        isAudioPlaying: true,
        activeAudioStepIndex: 4,
        activeAudioDate: pattern.steps[4].date,
        currentPlayheadStepIndex: 4,
        currentPlayheadDate: pattern.steps[4].date,
      })
    })
    fireEvent.click(screen.getByLabelText('Pause'))

    expect(useGitPulseStore.getState()).toMatchObject({
      isAudioPlaying: false,
      activeAudioStepIndex: null,
      selectedStartStepIndex: 1,
      currentPlayheadStepIndex: 4,
      currentPlayheadDate: pattern.steps[4].date,
    })
  })

  it('toggles the main transport button label between play and pause', async () => {
    const pattern = createTestPatternFromCounts([0, 1, 2])

    render(<ContributionMediaBar pattern={pattern} />)
    await waitFor(() => expect(screen.getByLabelText('Play')).toBeInTheDocument())

    act(() => {
      useGitPulseStore.setState({
        isAudioPlaying: true,
        activeAudioStepIndex: 1,
        activeAudioDate: pattern.steps[1].date,
      })
    })

    expect(screen.getByLabelText('Pause')).toBeInTheDocument()
  })
})

function createTestPattern(dayCount: number) {
  return createTestPatternFromCounts(Array.from({ length: dayCount }, (_, index) => index % 5))
}

function createTestPatternFromCounts(contributionCounts: number[]) {
  return createAudioPatternFromCalendar(createCalendar(contributionCounts), {
    mood: 'futuristic',
    bpm: 118,
    dominantLanguages: ['TypeScript'],
  })
}

function createCalendar(contributionCounts: number[]): GitPulseContributionCalendar {
  const days = contributionCounts.map((contributionCount, index) =>
    createContributionDay(addUtcDays('2026-01-01', index), contributionCount),
  )

  return {
    from: days[0].date,
    to: days[days.length - 1].date,
    totalContributions: days.reduce((sum, day) => sum + day.contributionCount, 0),
    days,
    sourceUsernames: ['alice'],
    dataSource: 'graphql',
  }
}

function createContributionDay(date: string, contributionCount: number): GitPulseContributionDay {
  return {
    date,
    contributionCount,
    intensity: getIntensity(contributionCount),
    sourceUsernames: ['alice'],
    perIdentityCounts: {
      alice: contributionCount,
    },
    dataSource: 'graphql',
  }
}

function getIntensity(contributionCount: number) {
  if (contributionCount <= 0) {
    return 0
  }

  if (contributionCount === 1) {
    return 1
  }

  if (contributionCount <= 4) {
    return contributionCount as GitPulseContributionDay['intensity']
  }

  return 4
}

function addUtcDays(isoDate: string, days: number) {
  const date = new Date(`${isoDate}T00:00:00.000Z`)

  date.setUTCDate(date.getUTCDate() + days)

  return date.toISOString().slice(0, 10)
}

function formatDisplayDate(date: string) {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    timeZone: 'UTC',
    year: 'numeric',
  }).format(new Date(`${date}T00:00:00.000Z`))
}
