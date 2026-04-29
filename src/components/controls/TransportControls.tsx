import { useEffect, useState } from 'react'
import { AlertCircle, LoaderCircle, Play, Square, Volume2, Waves } from 'lucide-react'
import { createAudioPatternFromDataset } from '@/audio/contributionSequencer'
import { gitPulseAudioEngine } from '@/audio/audioEngine'
import { AUDIO_BPM_RANGE } from '@/audio/moods'
import { useGitPulseStore } from '@/store/useGitPulseStore'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'

export function TransportControls() {
  const [isPreparing, setIsPreparing] = useState(false)
  const {
    dataset,
    mood,
    tempo,
    volume,
    isFetching,
    isFetchingContributions,
    isAudioPlaying,
    audioError,
    setTempo,
    setVolume,
    setAudioPlaying,
    setAudioError,
  } = useGitPulseStore()
  const previewPattern = createAudioPatternFromDataset(dataset, {
    mood,
    bpm: tempo,
  })
  const previewStepCount = previewPattern?.steps.length ?? 0
  const audioSourceLabel = dataset.contributionCalendar
    ? 'Contribution calendar'
    : previewPattern
      ? 'Approximate activity fallback'
      : 'Awaiting data'
  const transportStatusLabel = isPreparing ? 'Starting' : isAudioPlaying ? 'Playing' : 'Ready'
  const canPlay = previewStepCount > 0 && !isPreparing

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
    if (previewPattern) {
      return
    }

    if (isAudioPlaying) {
      setAudioPlaying(false)
    }
  }, [isAudioPlaying, previewPattern, setAudioPlaying])

  useEffect(
    () => () => {
      gitPulseAudioEngine.stop()
    },
    [],
  )

  async function handlePlay() {
    if (!previewPattern) {
      setAudioError('Add a GitHub profile or load demo data before starting the audio loop.')
      return
    }

    setIsPreparing(true)
    setAudioError(undefined)

    try {
      await gitPulseAudioEngine.play(previewPattern, {
        volume,
      })
      setAudioPlaying(true)
    } catch {
      setAudioPlaying(false)
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
  }

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="font-medium">Transport controls</h2>
          <p className="text-xs text-muted-foreground">
            Deterministic Tone.js loop driven by the merged GitHub contribution timeline.
          </p>
        </div>
        <Badge className="capitalize">{transportStatusLabel}</Badge>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => void handlePlay()} disabled={!canPlay}>
          {isPreparing ? (
            <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Play className="h-4 w-4" aria-hidden />
          )}
          Play
        </Button>
        <Button onClick={handleStop} disabled={!isAudioPlaying || isPreparing} variant="outline">
          <Square className="h-4 w-4" aria-hidden /> Stop
        </Button>
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
      <div className="grid grid-cols-1 gap-2 text-xs text-cyan-100/90 md:grid-cols-2 md:text-sm">
        <div className="rounded-md border border-white/10 bg-white/5 px-3 py-2">
          Audio source: {audioSourceLabel}
        </div>
        <div className="rounded-md border border-white/10 bg-white/5 px-3 py-2 capitalize">
          Timeline: {previewPattern?.summary.source ?? 'Awaiting data'}
        </div>
        <div className="rounded-md border border-white/10 bg-white/5 px-3 py-2">
          Loop: {previewPattern?.loopBars ?? 0} bars
        </div>
        <div className="rounded-md border border-white/10 bg-white/5 px-3 py-2">
          Active steps: {previewPattern?.summary.activeSteps ?? 0}/{previewStepCount}
        </div>
      </div>
      <div className="space-y-3">
        <label className="text-sm" htmlFor="tempo-slider">
          BPM: {tempo}
        </label>
        <Slider
          id="tempo-slider"
          min={AUDIO_BPM_RANGE.min}
          max={AUDIO_BPM_RANGE.max}
          step={1}
          value={[tempo]}
          onValueChange={([value]) => setTempo(value)}
        />
      </div>
      <div className="space-y-3">
        <label className="text-sm" htmlFor="volume-slider">
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
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Waves className="h-3.5 w-3.5" aria-hidden /> Futuristic is the tuned Stage 3 engine
        </span>
        <span className="inline-flex items-center gap-1">
          <Volume2 className="h-3.5 w-3.5" aria-hidden /> Conservative output with limiter
        </span>
      </div>
      <p className="text-xs text-muted-foreground">
        {isFetching || isFetchingContributions
          ? 'GitHub data is still loading. The current loop will use the latest normalized dataset.'
          : previewPattern
            ? 'Audio starts only after Play resumes the browser audio context.'
            : 'No dataset is ready yet, so playback stays disabled until normalized activity is available.'}
      </p>
    </Card>
  )
}
