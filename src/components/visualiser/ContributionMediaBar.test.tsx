import { render, screen } from '@testing-library/react'
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

  it('renders one media segment per audio pattern step', () => {
    const pattern = createTestPattern(73)

    render(<ContributionMediaBar pattern={pattern} />)

    expect(screen.getByLabelText('Contribution audio timeline').children).toHaveLength(73)
    expect(screen.getByText(/73 contribution steps - 19 bars/)).toBeInTheDocument()
    expect(screen.getByText(/Step 1\/73/)).toBeInTheDocument()
  })

  it('uses the active store step as the visible playhead while playing', () => {
    const pattern = createTestPattern(73)

    useGitPulseStore.setState({
      isAudioPlaying: true,
      activeAudioStepIndex: 10,
      activeAudioDate: pattern.steps[10].date,
    })

    render(<ContributionMediaBar pattern={pattern} />)

    const timeline = screen.getByLabelText('Contribution audio timeline')

    expect(screen.getByText(/Step 11\/73/)).toBeInTheDocument()
    expect(timeline.children[10]).toHaveClass('scale-y-110')
  })
})

function createTestPattern(dayCount: number) {
  return createAudioPatternFromCalendar(createCalendar(dayCount), {
    mood: 'futuristic',
    bpm: 118,
    dominantLanguages: ['TypeScript'],
  })
}

function createCalendar(dayCount: number): GitPulseContributionCalendar {
  const days = Array.from({ length: dayCount }, (_, index) =>
    createContributionDay(addUtcDays('2026-01-01', index), index % 5),
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
    intensity: contributionCount as GitPulseContributionDay['intensity'],
    sourceUsernames: ['alice'],
    perIdentityCounts: {
      alice: contributionCount,
    },
    dataSource: 'graphql',
  }
}

function addUtcDays(isoDate: string, days: number) {
  const date = new Date(`${isoDate}T00:00:00.000Z`)

  date.setUTCDate(date.getUTCDate() + days)

  return date.toISOString().slice(0, 10)
}
