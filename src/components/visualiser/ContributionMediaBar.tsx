import { useEffect, useState } from 'react'
import {
  AlertCircle,
  Gauge,
  LoaderCircle,
  Play,
  RotateCcw,
  Square,
  Volume2,
  Waves,
} from 'lucide-react'
import { gitPulseAudioEngine } from '@/audio/audioEngine'
import type { AudioPatternStep, GitPulseAudioPattern } from '@/audio/audio.types'
import { AUDIO_BPM_RANGE, getMoodDefaultBpm } from '@/audio/moods'
import { cn } from '@/lib-utils'
import { useGitPulseStore } from '@/store/useGitPulseStore'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'

type ContributionMediaBarProps = {
  pattern?: GitPulseAudioPattern
}

export function ContributionMediaBar({ pattern }: ContributionMediaBarProps) {
  const [isPreparing, setIsPreparing] = useState(false)
  const {
    mood,
    tempo,
    volume,
    isFetching,
    isFetchingContributions,
    isAudioPlaying,
    audioError,
    hasUserTempoOverride,
    activeAudioStepIndex,
    setTempo,
    resetTempoToMoodDefault,
    setVolume,
    setAudioPlaying,
    setAudioError,
    setActiveAudioStep,
    resetActiveAudioStep,
  } = useGitPulseStore()
  const patternSteps = pattern?.steps ?? []
  const patternStepCount = patternSteps.length
  const moodDefaultBpm = getMoodDefaultBpm(mood)
  const canPlay = patternStepCount > 0 && !isPreparing && !isAudioPlaying
  const displayStepIndex =
    patternStepCount > 0 && isAudioPlaying && activeAudioStepIndex !== null
      ? Math.min(activeAudioStepIndex, patternStepCount - 1)
      : 0
  const activeStep = patternSteps[displayStepIndex]
  const transportStatusLabel = isPreparing ? 'Starting' : isAudioPlaying ? 'Playing' : 'Ready'
  const audioSourceLabel = pattern
    ? pattern.summary.source === 'approximate'
      ? 'Approximate activity fallback'
      : 'Contribution calendar'
    : 'Awaiting data'

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

  useEffect(() => {
    if (patternStepCount > 0 || !isAudioPlaying) {
      return
    }

    setAudioPlaying(false)
    resetActiveAudioStep()
  }, [isAudioPlaying, patternStepCount, resetActiveAudioStep, setAudioPlaying])

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

    setIsPreparing(true)
    setAudioError(undefined)
    setActiveAudioStep(0, patternSteps[0]?.date)

    try {
      await gitPulseAudioEngine.play(pattern, {
        volume,
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

  function handleStop() {
    setAudioError(undefined)
    setAudioPlaying(false)
    resetActiveAudioStep()
  }

  return (
    <div className="space-y-4 border-t border-white/10 pt-4">
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

      <div className="grid gap-4 xl:grid-cols-[auto_minmax(0,1fr)]">
        <div className="flex flex-wrap items-center gap-2 xl:flex-col xl:items-stretch">
          <Button onClick={() => void handlePlay()} disabled={!canPlay} size="sm">
            {isPreparing ? (
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Play className="h-4 w-4" aria-hidden />
            )}
            Play
          </Button>
          <Button
            onClick={handleStop}
            disabled={!isAudioPlaying || isPreparing}
            size="sm"
            variant="outline"
          >
            <Square className="h-4 w-4" aria-hidden /> Stop
          </Button>
        </div>

        <div className="min-w-0 space-y-2">
          <div
            className="grid h-10 items-stretch gap-px overflow-hidden rounded-md border border-white/10 bg-slate-950/60 p-1"
            role="list"
            aria-label="Contribution audio timeline"
            style={{
              gridTemplateColumns: patternStepCount
                ? `repeat(${patternStepCount}, minmax(2px, 1fr))`
                : undefined,
            }}
          >
            {patternSteps.map((step, index) => {
              const isActive = index === displayStepIndex

              return (
                <span
                  key={step.date ?? `empty-step-${index}`}
                  role="listitem"
                  title={buildStepTitle(step, index)}
                  aria-label={buildStepTitle(step, index)}
                  className={cn(
                    'min-w-0 rounded-[2px] border transition-[background-color,border-color,box-shadow,transform] duration-150',
                    getMediaSegmentClassName(step.intensity),
                    isActive &&
                      'scale-y-110 border-cyan-100 shadow-[0_0_16px_rgba(34,211,238,0.7),0_0_28px_rgba(168,85,247,0.45)]',
                  )}
                />
              )
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            {activeStep
              ? `Step ${displayStepIndex + 1}/${patternStepCount} - ${formatSingleDate(
                  activeStep.date,
                )} - ${activeStep.contributionCount} contributions`
              : 'No audio pattern is ready yet.'}
          </p>
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

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="inline-flex items-center gap-2 text-sm" htmlFor="tempo-slider">
              <Gauge className="h-4 w-4" aria-hidden />
              BPM: {tempo}
            </label>
            <Button
              onClick={resetTempoToMoodDefault}
              disabled={!hasUserTempoOverride && tempo === moodDefaultBpm}
              size="sm"
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

        <div className="space-y-3">
          <label className="inline-flex items-center gap-2 text-sm" htmlFor="volume-slider">
            <Volume2 className="h-4 w-4" aria-hidden />
            Volume: {volume}%
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
    </div>
  )
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
