import { useEffect, useRef, type ReactNode } from 'react'
import type { GitPulseContributionCalendar, GitPulseContributionDay } from '@/domain/gitpulse.types'
import { cn } from '@/lib-utils'
import { Card } from '@/components/ui/card'

type ContributionSignalGridProps = {
  calendar?: GitPulseContributionCalendar
  activeDate?: string
  selectedDate?: string
  onSelectDate?: (date: string) => void
  mediaBar?: ReactNode
}

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const CONTRIBUTION_LEGEND = [
  { label: 'Quiet', intensity: 0 },
  { label: 'Pulse', intensity: 1 },
  { label: 'Active', intensity: 2 },
  { label: 'Surge', intensity: 3 },
  { label: 'Overload', intensity: 4 },
] as const

export function ContributionSignalGrid({
  activeDate,
  calendar,
  selectedDate,
  onSelectDate,
  mediaBar,
}: ContributionSignalGridProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!activeDate) {
      return
    }

    const scrollContainer = scrollContainerRef.current
    const activeElement = scrollContainer?.querySelector<HTMLElement>(`[data-date="${activeDate}"]`)

    if (!scrollContainer || !activeElement) {
      return
    }

    if (isElementHorizontallyVisible(scrollContainer, activeElement)) {
      return
    }

    const prefersReducedMotion =
      globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

    activeElement.scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
      block: 'nearest',
      inline: 'center',
    })
  }, [activeDate])

  if (!calendar) {
    return (
      <Card className="space-y-3">
        <h2 className="font-medium">Contribution signal grid</h2>
        <p className="text-sm text-muted-foreground">
          Add a GitHub username or load demo data to render the merged contribution timeline.
        </p>
        {mediaBar}
      </Card>
    )
  }

  const weekColumns = buildContributionWeekColumns(calendar.days)
  const activeContributionDays = calendar.days.filter((day) => day.contributionCount > 0).length

  return (
    <Card className="space-y-4 overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h2 className="font-medium">Contribution signal grid</h2>
          <p className="text-xs text-muted-foreground">
            GitPulse-styled merged calendar view. This becomes the preferred timing source for the
            Stage 3 audio engine.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs text-cyan-100/90 md:text-sm">
          <div className="rounded-md border border-white/10 bg-white/5 px-3 py-2">
            Total: {calendar.totalContributions}
          </div>
          <div className="rounded-md border border-white/10 bg-white/5 px-3 py-2 capitalize">
            Source: {calendar.dataSource}
          </div>
          <div className="rounded-md border border-white/10 bg-white/5 px-3 py-2">
            Active days: {activeContributionDays}
          </div>
          <div className="rounded-md border border-white/10 bg-white/5 px-3 py-2">
            Range: {formatDateRange(calendar.from, calendar.to)}
          </div>
        </div>
      </div>

      <div ref={scrollContainerRef} className="overflow-x-auto">
        <div className="flex min-w-max gap-3">
          <div className="mt-1 grid grid-rows-7 gap-1 text-[10px] text-muted-foreground">
            {WEEKDAY_LABELS.map((label, index) => (
              <span
                key={`${label}-${index}`}
                className="flex h-3 items-center justify-center leading-none"
                aria-hidden
              >
                {label}
              </span>
            ))}
          </div>
          <div className="inline-flex gap-1">
            {weekColumns.map((week, index) => (
              <div key={`${week[0]?.date ?? 'empty'}-${index}`} className="grid grid-rows-7 gap-1">
                {week.map((day, dayIndex) =>
                  day ? (
                    onSelectDate ? (
                      <button
                        key={day.date}
                        type="button"
                        title={buildContributionTitle(day)}
                        aria-label={buildContributionSelectionLabel(day)}
                        aria-pressed={day.date === selectedDate}
                        data-date={day.date}
                        onClick={() => onSelectDate(day.date)}
                        className={getContributionCellClassName(
                          day.intensity,
                          day.date === activeDate,
                          day.date === selectedDate,
                        )}
                      />
                    ) : (
                      <div
                        key={day.date}
                        role="img"
                        tabIndex={0}
                        title={buildContributionTitle(day)}
                        aria-label={buildContributionTitle(day)}
                        data-date={day.date}
                        className={getContributionCellClassName(
                          day.intensity,
                          day.date === activeDate,
                          day.date === selectedDate,
                        )}
                      />
                    )
                  ) : (
                    <span
                      key={`blank-${index}-${dayIndex}`}
                      className="h-3 w-3 rounded-[3px] border border-transparent opacity-0"
                      aria-hidden
                    />
                  ),
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {mediaBar}

      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        {CONTRIBUTION_LEGEND.map((entry) => (
          <span key={entry.label} className="inline-flex items-center gap-2">
            <span className={getContributionCellClassName(entry.intensity)} aria-hidden />
            {entry.label}
          </span>
        ))}
      </div>
    </Card>
  )
}

function buildContributionWeekColumns(days: GitPulseContributionDay[]) {
  if (!days.length) {
    return []
  }

  const columns: Array<Array<GitPulseContributionDay | null>> = []
  let currentWeek: Array<GitPulseContributionDay | null> = new Array(7).fill(null)

  for (const day of days) {
    const weekDay = getUtcWeekDay(day.date)

    currentWeek[weekDay] = day

    if (weekDay === 6) {
      columns.push(currentWeek)
      currentWeek = new Array(7).fill(null)
    }
  }

  if (currentWeek.some((day) => day !== null)) {
    columns.push(currentWeek)
  }

  return columns
}

function buildContributionTitle(day: GitPulseContributionDay) {
  const breakdown = Object.entries(day.perIdentityCounts)
    .filter(([, count]) => count > 0)
    .map(([username, count]) => `${username}: ${count}`)
    .join('\n')

  return `${formatSingleDate(day.date)}\n${day.contributionCount} contributions\n${
    breakdown || 'No per-identity contributions recorded'
  }`
}

function buildContributionSelectionLabel(day: GitPulseContributionDay) {
  return `Select contribution day ${formatSingleDate(day.date)}, ${
    day.contributionCount
  } contributions`
}

function getContributionCellClassName(intensity: number, isActive = false, isSelected = false) {
  const classNameByIntensity = {
    0: 'border-cyan-400/10 bg-slate-950/80 shadow-[0_0_0_1px_rgba(15,23,42,0.4)]',
    1: 'border-cyan-300/30 bg-cyan-400/25 shadow-[0_0_8px_rgba(34,211,238,0.18)]',
    2: 'border-cyan-200/40 bg-cyan-300/45 shadow-[0_0_10px_rgba(103,232,249,0.2)]',
    3: 'border-violet-300/50 bg-violet-400/60 shadow-[0_0_12px_rgba(167,139,250,0.28)]',
    4: 'border-fuchsia-200/60 bg-fuchsia-400/80 shadow-[0_0_14px_rgba(232,121,249,0.35)]',
  } as const

  return cn(
    'h-3 w-3 appearance-none rounded-[3px] border p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200',
    classNameByIntensity[intensity as keyof typeof classNameByIntensity],
    'transition-[border-color,box-shadow,transform] duration-150',
    isSelected &&
      'border-emerald-200 ring-1 ring-emerald-300/80 ring-offset-1 ring-offset-slate-950',
    isActive &&
      'scale-125 border-cyan-100 shadow-[0_0_12px_rgba(34,211,238,0.75),0_0_24px_rgba(168,85,247,0.45)] motion-safe:animate-pulse',
  )
}

function formatDateRange(from: string, to: string) {
  return `${formatSingleDate(from)} - ${formatSingleDate(to)}`
}

function formatSingleDate(date: string) {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00.000Z`))
}

function getUtcWeekDay(date: string) {
  return new Date(`${date}T00:00:00.000Z`).getUTCDay()
}

function isElementHorizontallyVisible(container: HTMLElement, element: HTMLElement) {
  const containerRect = container.getBoundingClientRect()
  const elementRect = element.getBoundingClientRect()

  return elementRect.left >= containerRect.left && elementRect.right <= containerRect.right
}
