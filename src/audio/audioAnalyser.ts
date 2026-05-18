import type { FFT, InputNode, Waveform } from 'tone'
import type { GitPulseAnalyserSnapshot } from './audioAnalyser.types'

type ToneModule = typeof import('tone')
type ToneConnectable = {
  connect: (destination: InputNode, outputNum?: number, inputNum?: number) => unknown
}

export const DEFAULT_ANALYSER_WAVEFORM_SIZE = 256
export const DEFAULT_ANALYSER_FREQUENCY_SIZE = 256

const AUDIO_ACTIVITY_RMS_THRESHOLD = 0.01
const AUDIO_ACTIVITY_ENERGY_THRESHOLD = 0.015

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

class GitPulseAudioAnalyser {
  private tone?: ToneModule
  private waveformAnalyser?: Waveform
  private frequencyAnalyser?: FFT

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
      return createSilentAnalyserSnapshot()
    }

    if (this.tone.getContext().state !== 'running') {
      return createSilentAnalyserSnapshot()
    }

    const waveformValues = this.waveformAnalyser.getValue()
    const frequencyValues = this.frequencyAnalyser.getValue()
    const waveform = Float32Array.from(waveformValues, (sample) => clamp(sample, -1, 1))
    const frequency = Uint8Array.from(frequencyValues, (value) =>
      clamp(Math.round(clamp(value, 0, 1) * 255), 0, 255),
    )
    const rms = calculateRms(waveform)
    const { bassEnergy, midEnergy, trebleEnergy } = calculateAnalyserEnergies(frequency)
    const isAudioActive =
      rms >= AUDIO_ACTIVITY_RMS_THRESHOLD ||
      bassEnergy >= AUDIO_ACTIVITY_ENERGY_THRESHOLD ||
      midEnergy >= AUDIO_ACTIVITY_ENERGY_THRESHOLD ||
      trebleEnergy >= AUDIO_ACTIVITY_ENERGY_THRESHOLD

    if (!isAudioActive) {
      return createSilentAnalyserSnapshot()
    }

    return {
      waveform,
      frequency,
      rms,
      bassEnergy,
      midEnergy,
      trebleEnergy,
      isAudioActive,
    }
  }

  dispose() {
    this.waveformAnalyser?.dispose()
    this.frequencyAnalyser?.dispose()
    this.waveformAnalyser = undefined
    this.frequencyAnalyser = undefined
    this.tone = undefined
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export const gitPulseAudioAnalyser = new GitPulseAudioAnalyser()
