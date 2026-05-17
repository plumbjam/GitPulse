import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import {
  AlertCircle,
  Gauge,
  LoaderCircle,
  Pause,
  Play,
  RotateCcw,
  SkipBack,
  SkipForward,
  Square,
  Volume2,
  Waves,
  type LucideIcon,
} from 'lucide-react'
import { gitPulseAudioEngine } from '@/audio/audioEngine'
import { clampStepIndex, findFirstActiveStepIndex } from '@/audio/contributionSequencer'
import type { AudioPatternStep, GitPulseAudioPattern } from '@/audio/audio.types'
import { AUDIO_BPM_RANGE, getMoodDefaultBpm } from '@/audio/moods'
import { cn } from '@/lib-utils'
import { useGitPulseStore } from '@/store/useGitPulseStore'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { PulseMixerPanel } from './PulseMixerPanel'

type ContributionMediaBarProps = {
  pattern?: GitPulseAudioPattern
}

type MediaIconName = 'play' | 'pause' | 'stop' | 'skip-back' | 'skip-forward' | 'reset-start'

const EMPTY_AUDIO_STEPS: AudioPatternStep[] = []
const mediaIconModules = import.meta.glob('/src/assets/icons/media/*.svg', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>
const mediaIconPathByName: Record<MediaIconName, string> = {
  play: '/src/assets/icons/media/play.svg',
  pause: '/src/assets/icons/media/pause.svg',
  stop: '/src/assets/icons/media/stop.svg',
  'skip-back': '/src/assets/icons/media/skip-back.svg',
  'skip-forward': '/src/assets/icons/media/skip-forward.svg',
  'reset-start': '/src/assets/icons/media/reset-start.svg',
}
const MEDIA_INTENSITY_LEGEND = [
  { label: 'Quiet', intensity: 0 },
  { label: 'Pulse', intensity: 1 },
  { label: 'Active', intensity: 2 },
  { label: 'Surge', intensity: 3 },
  { label: 'Overload', intensity: 4 },
] as const

export function ContributionMediaBar({ pattern }: ContributionMediaBarProps) {
  const [isPreparing, setIsPreparing] = useState(false)
  const lastTimelineKeyRef = useRef<string | undefined>(undefined)
  const {
    mood,
    tempo,
    volume,
    isFetching,
    isFetchingContributions,
    isAudioPlaying,
    audioError,
    hasUserTempoOverride,
    selectedStartStepIndex,
    currentPlayheadStepIndex,
    activeAudioStepIndex,
    setTempo,
    resetTempoToMoodDefault,
    setVolume,
    setAudioPlaying,
    setAudioError,
    setSelectedStartAndPlayhead,
    setCurrentPlayheadStep,
    cuePlayheadStep,
    resetPlayheadToSelectedStart,
    setActiveAudioStep,
    resetActiveAudioStep,
  } = useGitPulseStore()
  const patternSteps = pattern?.steps ?? EMPTY_AUDIO_STEPS
  const patternStepCount = patternSteps.length
  const maxStepIndex = Math.max(0, patternStepCount - 1)
  const timelineKey = useMemo(
    () =>
      patternSteps
        .map((step) => `${step.date ?? step.index}:${step.contributionCount}:${step.intensity}`)
        .join('|'),
    [patternSteps],
  )
  const moodDefaultBpm = getMoodDefaultBpm(mood)
  const selectedStepIndex = clampStepIndex(selectedStartStepIndex, maxStepIndex)
  const playheadStepIndex = clampStepIndex(currentPlayheadStepIndex, maxStepIndex)
  const activeStepIndex =
    patternStepCount > 0 && isAudioPlaying && activeAudioStepIndex !== null
      ? clampStepIndex(activeAudioStepIndex, maxStepIndex)
      : undefined
  const displayStepIndex = activeStepIndex ?? playheadStepIndex
  const activeStep = patternSteps[displayStepIndex]
  const selectedStep = patternSteps[selectedStepIndex]
  const canUseTransport = patternStepCount > 0 && !isPreparing
  const canStop =
    patternStepCount > 0 &&
    !isPreparing &&
    (isAudioPlaying || playheadStepIndex !== selectedStepIndex)
  const isAtFirstStep = playheadStepIndex <= 0
  const isAtFinalStep = patternStepCount === 0 || playheadStepIndex >= maxStepIndex
  const transportStatusLabel = isPreparing
    ? 'Starting'
    : isAudioPlaying
      ? 'Playing'
      : playheadStepIndex !== selectedStepIndex
        ? 'Paused'
        : 'Ready'
  const audioSourceLabel = pattern
    ? pattern.summary.source === 'approximate'
      ? 'Approximate activity fallback'
      : 'Contribution calendar'
    : 'Awaiting data'
  const nowLabel = isAudioPlaying ? 'Now playing' : 'Now cued'
  const nowStepText = activeStep
    ? formatStepStatus(nowLabel, activeStep, displayStepIndex, patternStepCount)
    : `${nowLabel}: No audio pattern is ready yet.`
  const loopStartText = selectedStep
    ? `Loop start: First active day - Step ${selectedStepIndex + 1}/${patternStepCount} - ${formatSingleDate(
        selectedStep.date,
      )}`
    : 'Loop start: Awaiting contribution activity'
  const playbackRangeText = patternStepCount
    ? 'Playback range: cue -> latest day - loop to first active day'
    : 'Playback range: Awaiting contribution activity'

  useEffect(() => {
    if (!patternStepCount) {
      if (lastTimelineKeyRef.current !== undefined) {
        setSelectedStartAndPlayhead(0)
        lastTimelineKeyRef.current = undefined
      }
      return
    }

    if (lastTimelineKeyRef.current === timelineKey) {
      return
    }

    const defaultStartStepIndex = findFirstActiveStepIndex(patternSteps)
    const defaultStartStep = patternSteps[defaultStartStepIndex]

    setSelectedStartAndPlayhead(defaultStartStepIndex, defaultStartStep?.date)
    lastTimelineKeyRef.current = timelineKey
  }, [patternStepCount, patternSteps, setSelectedStartAndPlayhead, timelineKey])

  useEffect(() => {
    gitPulseAudioEngine.setBpm(tempo)
  }, [tempo])

  useEffect(() => {
    gitPulseAudioEngine.setVolume(volume)
  }, [volume])

  useEffect(() => {
    if (!isAudioPlaying) {
      gitPulseAudioEngine.stop()
    }
  }, [isAudioPlaying])

  useEffect(
    () => () => {
      gitPulseAudioEngine.stop()
    },
    [],
  )

  async function handlePlay() {
    if (!pattern || !patternStepCount) {
      setAudioError('Add a GitHub profile or load demo data before starting the audio loop.')
      return
    }

    const startStepIndex = clampStepIndex(currentPlayheadStepIndex, maxStepIndex)
    const loopStartStepIndex = clampStepIndex(selectedStartStepIndex, maxStepIndex)
    const startStep = patternSteps[startStepIndex]

    setIsPreparing(true)
    setAudioError(undefined)
    setCurrentPlayheadStep(startStepIndex, startStep?.date)
    setActiveAudioStep(startStepIndex, startStep?.date)

    try {
      await gitPulseAudioEngine.play(pattern, {
        volume,
        startStepIndex,
        loopStartStepIndex,
        onStep: (stepIndex, step) => {
          setActiveAudioStep(stepIndex, step.date)
        },
      })
      setAudioPlaying(true)
    } catch {
      setAudioPlaying(false)
      resetActiveAudioStep()
      setAudioError(
        'Could not start Tone.js audio. Press Play again after interacting with the page.',
      )
    } finally {
      setIsPreparing(false)
    }
  }

  function handlePause() {
    gitPulseAudioEngine.stop()
    setAudioError(undefined)
    setAudioPlaying(false)
    resetActiveAudioStep()
  }

  function handleStop() {
    gitPulseAudioEngine.stop()
    setAudioError(undefined)
    setAudioPlaying(false)
    resetPlayheadToSelectedStart()
  }

  function handleResetToStart() {
    gitPulseAudioEngine.stop()
    setAudioError(undefined)
    setAudioPlaying(false)
    resetPlayheadToSelectedStart()
  }

  function handleSkip(delta: -1 | 1) {
    if (!patternStepCount) {
      return
    }

    const nextStepIndex = clampStepIndex(playheadStepIndex + delta, maxStepIndex)
    const nextStep = patternSteps[nextStepIndex]

    gitPulseAudioEngine.stop()
    setAudioError(undefined)
    setAudioPlaying(false)
    resetActiveAudioStep()
    setCurrentPlayheadStep(nextStepIndex, nextStep?.date)
  }

  function handleSelectStep(index: number) {
    if (!patternStepCount) {
      return
    }

    const nextStepIndex = clampStepIndex(index, maxStepIndex)
    const nextStep = patternSteps[nextStepIndex]

    gitPulseAudioEngine.stop()
    cuePlayheadStep(nextStepIndex, nextStep?.date)
  }

  return (
    <div className="space-y-4 border-t border-cyan-300/15 bg-slate-950/30 pt-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-medium">Audio timeline</h3>
            <Badge>{transportStatusLabel}</Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {formatStepCount(patternStepCount)} - {formatBarCount(pattern?.loopBars ?? 0)} - oldest
            to newest
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-cyan-100/90">
          <span className="rounded-md border border-white/10 bg-white/5 px-3 py-2">
            Source: {audioSourceLabel}
          </span>
          <span className="rounded-md border border-white/10 bg-white/5 px-3 py-2">
            Active: {pattern?.summary.activeSteps ?? 0}/{patternStepCount}
          </span>
        </div>
      </div>

      <div className="grid gap-3 rounded-lg border border-white/10 bg-white/[0.025] p-3 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-center">
        <div
          className="flex flex-wrap items-center gap-2"
          role="group"
          aria-label="Audio transport controls"
        >
          <Button
            aria-label="Reset to start"
            className="h-9 w-9 p-0"
            disabled={
              !canUseTransport || (playheadStepIndex === selectedStepIndex && !isAudioPlaying)
            }
            onClick={handleResetToStart}
            size="sm"
            title="Reset to start"
            type="button"
            variant="outline"
          >
            <MediaControlIcon fallback={RotateCcw} name="reset-start" />
          </Button>
          <Button
            aria-label="Skip back one contribution day"
            className="h-9 w-9 p-0"
            disabled={!canUseTransport || isAtFirstStep}
            onClick={() => handleSkip(-1)}
            size="sm"
            title="Skip back one contribution day"
            type="button"
            variant="outline"
          >
            <MediaControlIcon fallback={SkipBack} name="skip-back" />
          </Button>
          <Button
            aria-label={isAudioPlaying ? 'Pause' : 'Play'}
            className="h-9 w-9 p-0"
            disabled={!canUseTransport}
            onClick={() => (isAudioPlaying ? handlePause() : void handlePlay())}
            size="sm"
            title={isAudioPlaying ? 'Pause' : 'Play'}
            type="button"
          >
            {isPreparing ? (
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
            ) : isAudioPlaying ? (
              <MediaControlIcon fallback={Pause} name="pause" />
            ) : (
              <MediaControlIcon fallback={Play} name="play" />
            )}
          </Button>
          <Button
            aria-label="Stop"
            className="h-9 w-9 p-0"
            disabled={!canStop}
            onClick={handleStop}
            size="sm"
            title="Stop"
            type="button"
            variant="outline"
          >
            <MediaControlIcon fallback={Square} name="stop" />
          </Button>
          <Button
            aria-label="Skip forward one contribution day"
            className="h-9 w-9 p-0"
            disabled={!canUseTransport || isAtFinalStep}
            onClick={() => handleSkip(1)}
            size="sm"
            title="Skip forward one contribution day"
            type="button"
            variant="outline"
          >
            <MediaControlIcon fallback={SkipForward} name="skip-forward" />
          </Button>
        </div>

        <div className="grid gap-2 text-xs text-cyan-100/90 md:grid-cols-[1fr_1fr_minmax(220px,1.2fr)]">
          <span className="rounded-md border border-cyan-300/10 bg-cyan-300/[0.04] px-3 py-2">
            {nowStepText}
          </span>
          <span className="rounded-md border border-emerald-300/10 bg-emerald-300/[0.04] px-3 py-2">
            {loopStartText}
          </span>
          <span className="rounded-md border border-violet-300/10 bg-violet-300/[0.04] px-3 py-2">
            {playbackRangeText}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        <div className="min-w-0 space-y-2">
          <div
            className="grid h-12 items-stretch gap-px overflow-hidden rounded-md border border-cyan-300/15 bg-slate-950/70 p-1 shadow-[inset_0_0_22px_rgba(34,211,238,0.08)]"
            role="list"
            aria-label="Contribution audio timeline"
            style={{
              gridTemplateColumns: patternStepCount
                ? `repeat(${patternStepCount}, minmax(2px, 1fr))`
                : undefined,
            }}
          >
            {patternSteps.map((step, index) => {
              const isActive = index === activeStepIndex
              const isPlayhead = index === playheadStepIndex
              const isSelectedStart = index === selectedStepIndex

              return (
                <span key={step.date ?? `empty-step-${index}`} role="listitem" className="min-w-0">
                  <button
                    type="button"
                    title={buildStepTitle(step, index)}
                    aria-label={buildStepSelectionLabel(step, index)}
                    onClick={() => handleSelectStep(index)}
                    className={cn(
                      'relative h-full w-full min-w-0 appearance-none rounded-[2px] border p-0 transition-[background-color,border-color,box-shadow,transform] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200',
                      getMediaSegmentClassName(step.intensity),
                      isSelectedStart &&
                        'ring-1 ring-emerald-300/80 ring-offset-1 ring-offset-slate-950',
                      isPlayhead &&
                        'scale-y-105 border-cyan-100/80 shadow-[0_0_12px_rgba(34,211,238,0.48)]',
                      isActive &&
                        'scale-y-110 border-cyan-100 shadow-[0_0_16px_rgba(34,211,238,0.7),0_0_28px_rgba(168,85,247,0.45)]',
                    )}
                  >
                    {isSelectedStart ? (
                      <span
                        className="absolute left-1/2 top-1 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-emerald-200 shadow-[0_0_8px_rgba(110,231,183,0.9)]"
                        aria-hidden
                      />
                    ) : null}
                    {isPlayhead ? (
                      <span
                        className="absolute inset-x-0 top-0 h-0.5 rounded-full bg-cyan-100 shadow-[0_0_8px_rgba(103,232,249,0.9)]"
                        aria-hidden
                      />
                    ) : null}
                    {isActive ? (
                      <span
                        className="absolute bottom-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-fuchsia-100 shadow-[0_0_10px_rgba(232,121,249,0.95)]"
                        aria-hidden
                      />
                    ) : null}
                  </button>
                </span>
              )
            })}
          </div>
          <div
            className="flex flex-wrap items-center gap-3 border-t border-white/10 pt-2 text-xs text-muted-foreground"
            aria-label="Contribution intensity legend"
          >
            {MEDIA_INTENSITY_LEGEND.map((entry) => (
              <span key={entry.label} className="inline-flex items-center gap-2">
                <span
                  className={cn(
                    'h-2.5 w-4 rounded-sm border',
                    getMediaSegmentClassName(entry.intensity),
                  )}
                  aria-hidden
                />
                {entry.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {audioError ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-md border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-100"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>{audioError}</span>
        </div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-3 rounded-lg border border-white/10 bg-white/[0.03] p-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="inline-flex items-center gap-2 text-sm" htmlFor="tempo-slider">
              <Gauge className="h-4 w-4 text-cyan-200" aria-hidden />
              <span>BPM</span>
              <span className="font-semibold text-cyan-100">{tempo}</span>
            </label>
            <Button
              onClick={resetTempoToMoodDefault}
              disabled={!hasUserTempoOverride && tempo === moodDefaultBpm}
              size="sm"
              type="button"
              variant="outline"
            >
              <RotateCcw className="h-4 w-4" aria-hidden />
              Reset BPM
            </Button>
          </div>
          <Slider
            id="tempo-slider"
            min={AUDIO_BPM_RANGE.min}
            max={AUDIO_BPM_RANGE.max}
            step={1}
            value={[tempo]}
            onValueChange={([value]) => setTempo(value)}
          />
          <p className="text-xs text-muted-foreground">
            {hasUserTempoOverride ? 'Custom BPM' : `Mood default: ${moodDefaultBpm} BPM`}
          </p>
        </div>

        <div className="space-y-3 rounded-lg border border-white/10 bg-white/[0.03] p-3">
          <label className="inline-flex items-center gap-2 text-sm" htmlFor="volume-slider">
            <Volume2 className="h-4 w-4 text-cyan-200" aria-hidden />
            <span>Volume</span>
            <span className="font-semibold text-cyan-100">{volume}%</span>
          </label>
          <Slider
            id="volume-slider"
            min={0}
            max={100}
            step={1}
            value={[volume]}
            onValueChange={([value]) => setVolume(value)}
          />
          <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Waves className="h-3.5 w-3.5" aria-hidden />
            {isFetching || isFetchingContributions
              ? 'Loading the latest normalized dataset'
              : 'Tone.js loop uses the visible contribution pattern'}
          </p>
        </div>
      </div>

      <PulseMixerPanel />
    </div>
  )
}

function MediaControlIcon({
  fallback: Fallback,
  name,
}: {
  fallback: LucideIcon
  name: MediaIconName
}) {
  const iconUrl = mediaIconModules[mediaIconPathByName[name]]

  if (iconUrl) {
    return (
      <span aria-hidden className="block h-4 w-4 bg-current" style={buildIconMaskStyle(iconUrl)} />
    )
  }

  return <Fallback className="h-4 w-4" aria-hidden />
}

function buildIconMaskStyle(iconUrl: string): CSSProperties {
  const mask = `url("${iconUrl}") center / contain no-repeat`

  return {
    WebkitMask: mask,
    mask,
  }
}

function getMediaSegmentClassName(intensity: number) {
  const classNameByIntensity = {
    0: 'border-cyan-400/10 bg-slate-950/80 shadow-[0_0_0_1px_rgba(15,23,42,0.4)]',
    1: 'border-cyan-300/30 bg-cyan-400/25 shadow-[0_0_8px_rgba(34,211,238,0.18)]',
    2: 'border-cyan-200/40 bg-cyan-300/45 shadow-[0_0_10px_rgba(103,232,249,0.22)]',
    3: 'border-violet-300/50 bg-violet-400/60 shadow-[0_0_12px_rgba(167,139,250,0.3)]',
    4: 'border-fuchsia-200/70 bg-fuchsia-400/85 shadow-[0_0_14px_rgba(232,121,249,0.38)]',
  } as const

  return classNameByIntensity[intensity as keyof typeof classNameByIntensity]
}

function buildStepTitle(step: AudioPatternStep | undefined, index: number) {
  if (!step) {
    return `Step ${index + 1}\nAwaiting contribution data`
  }

  return `Step ${index + 1}\n${formatSingleDate(step.date)}\n${
    step.contributionCount
  } contributions\nBar ${step.bar}, beat ${step.beat}`
}

function buildStepSelectionLabel(step: AudioPatternStep | undefined, index: number) {
  if (!step) {
    return `Select audio step ${index + 1}`
  }

  return `Select audio step ${index + 1}: ${formatSingleDate(step.date)}, ${
    step.contributionCount
  } contributions`
}

function formatStepStatus(label: string, step: AudioPatternStep, index: number, stepCount: number) {
  return `${label}: Step ${index + 1}/${stepCount} - ${formatSingleDate(
    step.date,
  )} - ${formatContributionCount(step.contributionCount)}`
}

function formatContributionCount(count: number) {
  return `${count} ${count === 1 ? 'contribution' : 'contributions'}`
}

function formatStepCount(stepCount: number) {
  return `${stepCount} contribution ${stepCount === 1 ? 'step' : 'steps'}`
}

function formatBarCount(barCount: number) {
  return `${barCount} ${barCount === 1 ? 'bar' : 'bars'}`
}

function formatSingleDate(date: string | undefined) {
  if (!date) {
    return 'No date'
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00.000Z`))
}
