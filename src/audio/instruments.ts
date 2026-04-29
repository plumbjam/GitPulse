import type {
  FeedbackDelay,
  Limiter,
  MembraneSynth,
  MonoSynth,
  NoiseSynth,
  PolySynth,
  Reverb,
  Volume,
} from 'tone'
import type { GitPulseAudioMood } from './audio.types'

type ToneModule = typeof import('tone')

export type GitPulseInstrumentRack = {
  master: Volume
  limiter: Limiter
  kick: MembraneSynth
  snare: NoiseSynth
  hats: NoiseSynth
  bass: MonoSynth
  lead: PolySynth
  delay: FeedbackDelay
  reverb: Reverb
}

export async function createInstrumentRack(
  Tone: ToneModule,
  options: {
    mood: GitPulseAudioMood
    volumeDb: number
  },
): Promise<GitPulseInstrumentRack> {
  const master = new Tone.Volume(options.volumeDb)
  const limiter = new Tone.Limiter(-3).toDestination()

  master.connect(limiter)

  const kick = new Tone.MembraneSynth({
    pitchDecay: 0.04,
    octaves: 5,
    envelope: {
      attack: 0.001,
      decay: 0.32,
      sustain: 0.01,
      release: 0.08,
    },
    volume: -3,
  }).connect(master)

  const snare = new Tone.NoiseSynth({
    noise: {
      type: 'pink',
    },
    envelope: {
      attack: 0.001,
      decay: 0.14,
      sustain: 0,
      release: 0.05,
    },
    volume: -9,
  }).connect(master)

  const hats = new Tone.NoiseSynth({
    noise: {
      type: 'white',
    },
    envelope: {
      attack: 0.001,
      decay: 0.05,
      sustain: 0,
      release: 0.02,
    },
    volume: -18,
  }).connect(master)

  const bass = new Tone.MonoSynth({
    oscillator: {
      type: 'fatsawtooth',
      count: 2,
      spread: 20,
    },
    filter: {
      Q: 2,
      type: 'lowpass',
      rolloff: -24,
    },
    envelope: {
      attack: 0.01,
      decay: 0.18,
      sustain: 0.3,
      release: 0.35,
    },
    filterEnvelope: {
      attack: 0.01,
      decay: 0.12,
      sustain: 0.2,
      release: 0.3,
      baseFrequency: 160,
      octaves: 2.4,
    },
    volume: -9,
  }).connect(master)

  const delay = new Tone.FeedbackDelay('8n', 0.18)

  delay.wet.value = 0.16
  delay.connect(master)

  const reverb = new Tone.Reverb({
    decay: 2.6,
    wet: 0.12,
    preDelay: 0.03,
  })

  await reverb.generate()
  reverb.connect(master)

  const lead = new Tone.PolySynth(Tone.Synth, {
    oscillator: {
      type: 'triangle8',
    },
    envelope: {
      attack: 0.02,
      decay: 0.12,
      sustain: 0.18,
      release: 0.9,
    },
    volume: -13,
  })

  lead.connect(delay)
  lead.connect(reverb)
  lead.connect(master)

  return {
    master,
    limiter,
    kick,
    snare,
    hats,
    bass,
    lead,
    delay,
    reverb,
  }
}

export function setMasterVolume(rack: GitPulseInstrumentRack, volumeDb: number) {
  rack.master.volume.rampTo(volumeDb, 0.05)
}

export function disposeInstrumentRack(rack: GitPulseInstrumentRack) {
  rack.kick.dispose()
  rack.snare.dispose()
  rack.hats.dispose()
  rack.bass.dispose()
  rack.lead.dispose()
  rack.delay.dispose()
  rack.reverb.dispose()
  rack.master.dispose()
  rack.limiter.dispose()
}
