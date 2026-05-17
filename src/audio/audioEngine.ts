import type { Sequence } from 'tone'
import type {
  AudioPatternStep,
  GitPulseAudioMood,
  GitPulseAudioPattern,
  SoundRole,
} from './audio.types'
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

  async previewSoundRole(
    soundRole: SoundRole,
    mood: GitPulseAudioMood,
    options?: {
      volume?: number
    },
  ) {
    const Tone = await this.loadTone()

    if (options?.volume !== undefined) {
      this.currentVolume = options.volume
    }

    await Tone.start()
    await this.ensureInstrumentRack(mood)
    this.applyVolume()

    this.triggerSoundRole(soundRole, Tone.now(), {
      velocity: 0.62,
      accent: true,
      bassNote: 'A2',
      leadNote: 'E5',
    })
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
    const loopEnd = pattern.steps.length * stepDuration

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

    if (step.soundRole) {
      this.triggerSoundRole(step.soundRole, time, step)
      return
    }

    this.triggerLegacyStep(time, step)
  }

  private triggerLegacyStep(time: number, step: AudioPatternStep) {
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

  private triggerSoundRole(
    soundRole: SoundRole,
    time: number,
    step: Pick<AudioPatternStep, 'velocity' | 'accent' | 'bassNote' | 'leadNote'>,
  ) {
    if (!this.tone || !this.instrumentRack) {
      return
    }

    const sixteenthNote = this.tone.Time('16n').toSeconds()
    const eighthNote = this.tone.Time('8n').toSeconds()
    const velocity = Math.max(0.18, step.velocity)
    const bassNote = step.bassNote ?? 'A2'
    const leadNote = step.leadNote ?? 'E5'

    switch (soundRole) {
      case 'soft-kick':
        this.instrumentRack.kick.triggerAttackRelease('C1', '16n', time, velocity * 0.72)
        return
      case 'pulse-blip':
        this.instrumentRack.lead.triggerAttackRelease(leadNote, '16n', time, velocity * 0.62)
        return
      case 'muted-pluck':
        this.instrumentRack.lead.triggerAttackRelease('C5', '16n', time, velocity * 0.5)
        return
      case 'sub-tick':
        this.instrumentRack.bass.triggerAttackRelease('A1', '16n', time, velocity * 0.52)
        return
      case 'kick-hat':
        this.instrumentRack.kick.triggerAttackRelease('C1', '16n', time, velocity)
        this.instrumentRack.hats.triggerAttackRelease('32n', time + eighthNote, velocity * 0.44)
        return
      case 'pulse-hat':
        this.instrumentRack.lead.triggerAttackRelease(leadNote, '16n', time, velocity * 0.56)
        this.instrumentRack.hats.triggerAttackRelease('32n', time + eighthNote, velocity * 0.46)
        return
      case 'bass-note':
        this.instrumentRack.bass.triggerAttackRelease(bassNote, '8n', time, velocity * 0.82)
        return
      case 'pluck-pair':
        this.instrumentRack.lead.triggerAttackRelease('A4', '16n', time, velocity * 0.52)
        this.instrumentRack.lead.triggerAttackRelease(
          'E5',
          '16n',
          time + sixteenthNote,
          velocity * 0.48,
        )
        return
      case 'kick-snare-hat':
        this.instrumentRack.kick.triggerAttackRelease('C1', '16n', time, velocity)
        this.instrumentRack.snare.triggerAttackRelease('16n', time + sixteenthNote, velocity * 0.58)
        this.instrumentRack.hats.triggerAttackRelease('32n', time + eighthNote, velocity * 0.42)
        return
      case 'bass-clap':
        this.instrumentRack.bass.triggerAttackRelease(bassNote, '8n', time, velocity * 0.76)
        this.instrumentRack.snare.triggerAttackRelease('16n', time + sixteenthNote, velocity * 0.64)
        return
      case 'lead-accent':
        this.instrumentRack.lead.triggerAttackRelease(leadNote, '8n', time, velocity * 0.74)
        this.instrumentRack.hats.triggerAttackRelease('32n', time + eighthNote, velocity * 0.36)
        return
      case 'chord-stab':
        this.instrumentRack.lead.triggerAttackRelease(
          ['A4', 'C5', 'E5'],
          '8n',
          time,
          velocity * 0.56,
        )
        return
      case 'accent-crash':
        this.instrumentRack.snare.triggerAttackRelease('8n', time, velocity * 0.78)
        this.instrumentRack.hats.triggerAttackRelease('16n', time + sixteenthNote, velocity * 0.72)
        this.instrumentRack.hats.triggerAttackRelease('16n', time + eighthNote, velocity * 0.58)
        return
      case 'tom-fill':
        this.instrumentRack.kick.triggerAttackRelease('C2', '16n', time, velocity * 0.88)
        this.instrumentRack.kick.triggerAttackRelease(
          'G1',
          '16n',
          time + sixteenthNote,
          velocity * 0.7,
        )
        return
      case 'bright-lead-hit':
        this.instrumentRack.lead.triggerAttackRelease(leadNote, '4n', time, velocity * 0.84)
        this.instrumentRack.kick.triggerAttackRelease('C1', '16n', time, velocity * 0.78)
        return
      case 'glitch-burst':
        this.instrumentRack.hats.triggerAttackRelease('32n', time, velocity * 0.58)
        this.instrumentRack.hats.triggerAttackRelease(
          '32n',
          time + sixteenthNote / 2,
          velocity * 0.52,
        )
        this.instrumentRack.lead.triggerAttackRelease(
          'D5',
          '16n',
          time + sixteenthNote,
          velocity * 0.48,
        )
        return
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
