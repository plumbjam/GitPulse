import type { FFT, InputNode, Waveform } from 'tone'
import type { GitPulseAnalyserSnapshot } from './audioAnalyser.types'

type ToneModule = typeof import('tone')
type ToneConnectable = {
  connect: (destination: InputNode, outputNum?: number, inputNum?: number) => unknown
}

export const DEFAULT_ANALYSER_WAVEFORM_SIZE = 256
export const DEFAULT_ANALYSER_FREQUENCY_SIZE = 256

const AUDIO_ACTIVITY_RMS_THRESHOLD = 0.004
const AUDIO_ACTIVITY_ENERGY_THRESHOLD = 0.008
const AUDIO_ANALYSER_DEBUG_STORAGE_KEY = 'gitpulse.debug.audioAnalyser'
const AUDIO_ANALYSER_DEBUG_LOG_INTERVAL_MS = 1000

type AudioAnalyserActivityInput = Pick<
  GitPulseAnalyserSnapshot,
  'rms' | 'bassEnergy' | 'midEnergy' | 'trebleEnergy'
>

type AudioAnalyserDebugSummary = {
  source: 'audioAnalyser'
  attached: boolean
  contextState: string
  waveformMin: number
  waveformMax: number
  frequencyMax: number
  rms: number
  bassEnergy: number
  midEnergy: number
  trebleEnergy: number
  isAudioActive: boolean
}

export function createSilentAnalyserSnapshot(): GitPulseAnalyserSnapshot {
  return {
    waveform: new Float32Array(DEFAULT_ANALYSER_WAVEFORM_SIZE),
    frequency: new Uint8Array(DEFAULT_ANALYSER_FREQUENCY_SIZE),
    rms: 0,
    bassEnergy: 0,
    midEnergy: 0,
    trebleEnergy: 0,
    isAudioActive: false,
  }
}

export function calculateRms(waveform: Float32Array | number[]) {
  if (waveform.length === 0) {
    return 0
  }

  let sumSquares = 0

  for (const sample of waveform) {
    sumSquares += sample * sample
  }

  return clamp(Math.sqrt(sumSquares / waveform.length), 0, 1)
}

export function normaliseByteEnergy(value: number) {
  return clamp(value / 255, 0, 1)
}

export function calculateBandEnergy(
  frequency: Uint8Array | number[],
  startBin: number,
  endBin: number,
) {
  if (frequency.length === 0) {
    return 0
  }

  const safeStart = clamp(Math.floor(startBin), 0, frequency.length - 1)
  const safeEnd = clamp(Math.floor(endBin), safeStart, frequency.length - 1)
  let total = 0

  for (let index = safeStart; index <= safeEnd; index += 1) {
    total += normaliseByteEnergy(frequency[index] ?? 0)
  }

  return clamp(total / (safeEnd - safeStart + 1), 0, 1)
}

export function calculateAnalyserEnergies(frequency: Uint8Array) {
  if (frequency.length === 0) {
    return {
      bassEnergy: 0,
      midEnergy: 0,
      trebleEnergy: 0,
    }
  }

  const finalIndex = frequency.length - 1
  const bassEnd = Math.max(0, Math.floor(finalIndex * 0.12))
  const midStart = Math.min(finalIndex, bassEnd + 1)
  const midEnd = Math.max(midStart, Math.floor(finalIndex * 0.45))
  const trebleStart = Math.min(finalIndex, midEnd + 1)

  return {
    bassEnergy: calculateBandEnergy(frequency, 0, bassEnd),
    midEnergy: calculateBandEnergy(frequency, midStart, midEnd),
    trebleEnergy: calculateBandEnergy(frequency, trebleStart, finalIndex),
  }
}

export function calculateIsAudioActive({
  rms,
  bassEnergy,
  midEnergy,
  trebleEnergy,
}: AudioAnalyserActivityInput) {
  return (
    rms >= AUDIO_ACTIVITY_RMS_THRESHOLD ||
    bassEnergy >= AUDIO_ACTIVITY_ENERGY_THRESHOLD ||
    midEnergy >= AUDIO_ACTIVITY_ENERGY_THRESHOLD ||
    trebleEnergy >= AUDIO_ACTIVITY_ENERGY_THRESHOLD
  )
}

export function isAudioAnalyserDebugEnabled() {
  try {
    return (
      typeof window !== 'undefined' &&
      window.localStorage.getItem(AUDIO_ANALYSER_DEBUG_STORAGE_KEY) === '1'
    )
  } catch {
    // Debugging is optional, including when browser storage is unavailable.
    return false
  }
}

export function summarizeAnalyserSnapshot(
  snapshot: GitPulseAnalyserSnapshot,
  options: {
    attached: boolean
    contextState: string
  },
): AudioAnalyserDebugSummary {
  let waveformMin = 0
  let waveformMax = 0

  for (const sample of snapshot.waveform) {
    waveformMin = Math.min(waveformMin, sample)
    waveformMax = Math.max(waveformMax, sample)
  }

  let frequencyMax = 0

  for (const bin of snapshot.frequency) {
    frequencyMax = Math.max(frequencyMax, bin)
  }

  return {
    source: 'audioAnalyser',
    attached: options.attached,
    contextState: options.contextState,
    waveformMin: roundToFourDecimals(waveformMin),
    waveformMax: roundToFourDecimals(waveformMax),
    frequencyMax,
    rms: roundToFourDecimals(snapshot.rms),
    bassEnergy: roundToFourDecimals(snapshot.bassEnergy),
    midEnergy: roundToFourDecimals(snapshot.midEnergy),
    trebleEnergy: roundToFourDecimals(snapshot.trebleEnergy),
    isAudioActive: snapshot.isAudioActive,
  }
}

class GitPulseAudioAnalyser {
  private tone?: ToneModule
  private waveformAnalyser?: Waveform
  private frequencyAnalyser?: FFT
  private lastDebugLogAt = 0

  attach(Tone: ToneModule, source: ToneConnectable) {
    if (this.waveformAnalyser || this.frequencyAnalyser) {
      this.dispose()
    }

    this.tone = Tone
    this.waveformAnalyser = new Tone.Waveform(DEFAULT_ANALYSER_WAVEFORM_SIZE)
    this.frequencyAnalyser = new Tone.FFT({
      normalRange: true,
      size: DEFAULT_ANALYSER_FREQUENCY_SIZE,
      smoothing: 0.72,
    })

    source.connect(this.waveformAnalyser)
    source.connect(this.frequencyAnalyser)
  }

  getSnapshot(): GitPulseAnalyserSnapshot {
    if (!this.tone || !this.waveformAnalyser || !this.frequencyAnalyser) {
      const snapshot = createSilentAnalyserSnapshot()

      this.logDebugSummary(snapshot, 'unattached')

      return snapshot
    }

    const contextState = this.tone.getContext().state

    if (contextState !== 'running') {
      const snapshot = createSilentAnalyserSnapshot()

      this.logDebugSummary(snapshot, contextState)

      return snapshot
    }

    const waveformValues = this.waveformAnalyser.getValue()
    const frequencyValues = this.frequencyAnalyser.getValue()
    const waveform = Float32Array.from(waveformValues, (sample) => clamp(sample, -1, 1))
    const frequency = Uint8Array.from(frequencyValues, (value) =>
      clamp(Math.round(clamp(value, 0, 1) * 255), 0, 255),
    )
    const rms = calculateRms(waveform)
    const { bassEnergy, midEnergy, trebleEnergy } = calculateAnalyserEnergies(frequency)
    const snapshot = {
      waveform,
      frequency,
      rms,
      bassEnergy,
      midEnergy,
      trebleEnergy,
      isAudioActive: calculateIsAudioActive({
        rms,
        bassEnergy,
        midEnergy,
        trebleEnergy,
      }),
    }

    this.logDebugSummary(snapshot, contextState)

    return snapshot
  }

  dispose() {
    this.waveformAnalyser?.dispose()
    this.frequencyAnalyser?.dispose()
    this.waveformAnalyser = undefined
    this.frequencyAnalyser = undefined
    this.tone = undefined
  }

  private logDebugSummary(snapshot: GitPulseAnalyserSnapshot, contextState: string) {
    if (!isAudioAnalyserDebugEnabled()) {
      return
    }

    const now = Date.now()

    if (now - this.lastDebugLogAt < AUDIO_ANALYSER_DEBUG_LOG_INTERVAL_MS) {
      return
    }

    this.lastDebugLogAt = now

    console.info(
      '[GitPulse]',
      summarizeAnalyserSnapshot(snapshot, {
        attached: Boolean(this.tone && this.waveformAnalyser && this.frequencyAnalyser),
        contextState,
      }),
    )
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function roundToFourDecimals(value: number) {
  return Math.round(value * 10_000) / 10_000
}

export const gitPulseAudioAnalyser = new GitPulseAudioAnalyser()
