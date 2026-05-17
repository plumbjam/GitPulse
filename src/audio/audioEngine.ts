import type { Sequence } from 'tone'
import type { AudioPatternStep, GitPulseAudioMood, GitPulseAudioPattern } from './audio.types'
import { DEFAULT_AUDIO_VOLUME, FUTURISTIC_DEFAULT_BPM } from './moods'
import { createInstrumentRack, disposeInstrumentRack, setMasterVolume } from './instruments'
import type { GitPulseInstrumentRack } from './instruments'
import { mapVolumePercentToDecibels } from './musicMapping'

type ToneModule = typeof import('tone')
type ToneDrawScheduler = {
  schedule?: (callback: () => void, time: number) => void
}
type ToneModuleWithDraw = ToneModule & {
  Draw?: ToneDrawScheduler
}

type PlayOptions = {
  volume: number
  startStepIndex?: number
  loopStartStepIndex?: number
  onStep?: (stepIndex: number, step: AudioPatternStep) => void
}

class GitPulseAudioEngine {
  private tone?: ToneModule
  private tonePromise?: Promise<ToneModule>
  private instrumentRack?: GitPulseInstrumentRack
  private sequence?: Sequence<AudioPatternStep>
  private currentBpm = FUTURISTIC_DEFAULT_BPM
  private currentVolume = DEFAULT_AUDIO_VOLUME
  private playbackToken = 0

  async play(pattern: GitPulseAudioPattern, options: PlayOptions) {
    const Tone = await this.loadTone()

    this.currentBpm = pattern.bpm
    this.currentVolume = options.volume

    await Tone.start()
    this.stop()
    const playbackToken = this.playbackToken
    await this.ensureInstrumentRack(pattern.mood)
    this.applyBpm()
    this.applyVolume()
    this.schedulePattern(
      pattern,
      {
        startStepIndex: options.startStepIndex ?? 0,
        loopStartStepIndex: options.loopStartStepIndex ?? options.startStepIndex ?? 0,
      },
      options.onStep,
      playbackToken,
    )

    Tone.Transport.start()
  }

  stop() {
    this.playbackToken += 1

    if (!this.tone) {
      return
    }

    this.sequence?.stop()
    this.sequence?.dispose()
    this.sequence = undefined

    this.instrumentRack?.bass.triggerRelease()
    this.instrumentRack?.lead.releaseAll()

    this.tone.Transport.stop()
    this.tone.Transport.cancel(0)
    this.tone.Transport.seconds = 0
  }

  dispose() {
    this.stop()

    if (this.instrumentRack) {
      disposeInstrumentRack(this.instrumentRack)
      this.instrumentRack = undefined
    }
  }

  setBpm(bpm: number) {
    this.currentBpm = bpm
    this.applyBpm()
  }

  setVolume(volume: number) {
    this.currentVolume = volume
    this.applyVolume()
  }

  private async loadTone() {
    if (this.tone) {
      return this.tone
    }

    if (!this.tonePromise) {
      this.tonePromise = import('tone').then((tone) => {
        this.tone = tone
        return tone
      })
    }

    return this.tonePromise
  }

  private async ensureInstrumentRack(mood: GitPulseAudioMood) {
    const Tone = await this.loadTone()

    if (this.instrumentRack) {
      return this.instrumentRack
    }

    this.instrumentRack = await createInstrumentRack(Tone, {
      mood,
      volumeDb: mapVolumePercentToDecibels(this.currentVolume),
    })

    return this.instrumentRack
  }

  private schedulePattern(
    pattern: GitPulseAudioPattern,
    position: {
      startStepIndex: number
      loopStartStepIndex: number
    },
    onStep: PlayOptions['onStep'],
    playbackToken: number,
  ) {
    if (!this.tone || !this.instrumentRack) {
      return
    }

    const Tone = this.tone
    const finalStepIndex = Math.max(0, pattern.steps.length - 1)
    const startStepIndex = clampStepIndex(position.startStepIndex, finalStepIndex)
    const loopStartStepIndex = clampStepIndex(position.loopStartStepIndex, finalStepIndex)
    const stepDuration = Tone.Time('4n').toSeconds()
    const startOffset = startStepIndex * stepDuration
    const loopStart = loopStartStepIndex * stepDuration
    const loopEnd = Tone.Time(`${pattern.loopBars}m`).toSeconds()

    Tone.Transport.loop = true
    Tone.Transport.loopStart = loopStart
    Tone.Transport.loopEnd = loopEnd
    Tone.Transport.seconds = startOffset

    this.sequence = new Tone.Sequence(
      (time, step) => {
        this.triggerStep(time, step)
        this.scheduleStepCallback(time, step, onStep, playbackToken)
      },
      pattern.steps,
      '4n',
    )
    this.sequence.loop = true
    this.sequence.loopEnd = loopEnd
    this.sequence.start(0)
  }

  private scheduleStepCallback(
    time: number,
    step: AudioPatternStep,
    onStep: PlayOptions['onStep'],
    playbackToken: number,
  ) {
    if (!this.tone || !onStep) {
      return
    }

    const notify = () => {
      if (playbackToken === this.playbackToken) {
        onStep(step.index, step)
      }
    }

    const draw = (this.tone as ToneModuleWithDraw).Draw

    if (draw?.schedule) {
      draw.schedule(notify, time)
      return
    }

    // Tone.Draw is the intended UI-safe scheduler. The timeout fallback keeps
    // the callback aligned if a Tone build does not expose Draw.
    globalThis.setTimeout(notify, Math.max(0, (time - this.tone.now()) * 1000))
  }

  private triggerStep(time: number, step: AudioPatternStep) {
    if (!this.tone || !this.instrumentRack) {
      return
    }

    const eighthNote = this.tone.Time('8n').toSeconds()
    const sixteenthNote = this.tone.Time('16n').toSeconds()
    const leadVelocity = Math.max(0.22, step.velocity * 0.55)
    const hatVelocity = Math.max(0.15, step.velocity * 0.45)
    const accentVelocity = Math.max(0.18, step.velocity * 0.32)

    if (step.kick) {
      this.instrumentRack.kick.triggerAttackRelease(
        'C1',
        step.accent ? '8n' : '16n',
        time,
        step.velocity,
      )
    }

    if (step.snare) {
      this.instrumentRack.snare.triggerAttackRelease(
        step.accent ? '8n' : '16n',
        time + sixteenthNote,
        Math.max(0.2, step.velocity * 0.6),
      )
    }

    if (step.hat) {
      this.instrumentRack.hats.triggerAttackRelease('32n', time + eighthNote, hatVelocity)
    }

    if (step.accent) {
      this.instrumentRack.hats.triggerAttackRelease('32n', time + sixteenthNote, accentVelocity)
      this.instrumentRack.hats.triggerAttackRelease(
        '32n',
        time + eighthNote + sixteenthNote,
        accentVelocity,
      )
    }

    if (step.bassNote) {
      this.instrumentRack.bass.triggerAttackRelease(
        step.bassNote,
        step.accent ? '8n' : '16n',
        time,
        Math.max(0.22, step.velocity * 0.82),
      )
    }

    if (step.leadNote) {
      this.instrumentRack.lead.triggerAttackRelease(
        step.leadNote,
        step.accent ? '2n' : '4n',
        time + sixteenthNote,
        leadVelocity,
      )
    }
  }

  private applyBpm() {
    if (!this.tone) {
      return
    }

    this.tone.Transport.bpm.rampTo(this.currentBpm, 0.05)
  }

  private applyVolume() {
    if (!this.instrumentRack) {
      return
    }

    setMasterVolume(this.instrumentRack, mapVolumePercentToDecibels(this.currentVolume))
  }
}

function clampStepIndex(index: number, maxIndex: number) {
  return Math.min(Math.max(0, maxIndex), Math.max(0, Math.round(index)))
}

export const gitPulseAudioEngine = new GitPulseAudioEngine()
