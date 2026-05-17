import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { GitPulseContributionCalendar, GitPulseContributionDay } from '@/domain/gitpulse.types'
import { ContributionSignalGrid } from './ContributionSignalGrid'

describe('ContributionSignalGrid', () => {
  it('calls the date selection callback when a contribution tile is clicked', () => {
    const onSelectDate = vi.fn()

    render(<ContributionSignalGrid calendar={createCalendar()} onSelectDate={onSelectDate} />)

    fireEvent.click(
      screen.getByRole('button', {
        name: /Select contribution day 02 May 2026, 3 contributions/i,
      }),
    )

    expect(onSelectDate).toHaveBeenCalledWith('2026-05-02')
  })

  it('marks the selected contribution tile separately from playback activity', () => {
    render(
      <ContributionSignalGrid
        activeDate="2026-05-03"
        calendar={createCalendar()}
        onSelectDate={() => undefined}
        selectedDate="2026-05-02"
      />,
    )

    expect(
      screen.getByRole('button', {
        name: /Select contribution day 02 May 2026, 3 contributions/i,
      }),
    ).toHaveAttribute('aria-pressed', 'true')
    expect(
      screen.getByRole('button', {
        name: /Select contribution day 03 May 2026, 0 contributions/i,
      }),
    ).toHaveClass('scale-125')
  })
})

function createCalendar(): GitPulseContributionCalendar {
  const days = [
    createContributionDay('2026-05-01', 0),
    createContributionDay('2026-05-02', 3),
    createContributionDay('2026-05-03', 0),
  ]

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
    intensity: contributionCount > 0 ? 2 : 0,
    sourceUsernames: ['alice'],
    perIdentityCounts: {
      alice: contributionCount,
    },
    dataSource: 'graphql',
  }
}
