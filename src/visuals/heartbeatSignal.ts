import type { GitPulseAnalyserSnapshot } from '@/audio/audioAnalyser.types'

type CreateIdleSignalOptions = {
  sampleCount: number
  time: number
  reducedMotion?: boolean
}

type CreateHeartbeatVisualSignalOptions = {
  snapshot: GitPulseAnalyserSnapshot
  sampleCount: number
  time: number
  reducedMotion?: boolean
  previousSignal?: number[]
}

export function createIdleSignal({
  sampleCount,
  time,
  reducedMotion = false,
}: CreateIdleSignalOptions) {
  const amplitude = reducedMotion ? 0.018 : 0.031
  const driftSpeed = reducedMotion ? 0.32 : 0.56

  return Array.from({ length: sampleCount }, (_, index) => {
    const progress = sampleCount <= 1 ? 0 : index / (sampleCount - 1)
    const phase = progress * 10.2 + time * driftSpeed
    const carrier = Math.sin(phase * 1.16 + Math.sin(time * 0.2) * 0.28)
    const support = Math.sin(phase * 2.24 - time * 0.34) * 0.24
    const micro = Math.sin(phase * 5.6 + time * 0.48) * (reducedMotion ? 0.018 : 0.032)
    const envelope = 0.88 + Math.sin(time * 0.22 + progress * 2.6) * 0.08

    return clampVisualSample((carrier * 0.8 + support * 0.2) * amplitude * envelope + micro)
  })
}

export function downsampleWaveform(waveform: Float32Array | number[], sampleCount: number) {
  if (sampleCount <= 0) {
    return []
  }

  if (waveform.length === 0) {
    return Array.from({ length: sampleCount }, () => 0)
  }

  return Array.from({ length: sampleCount }, (_, index) => {
    const start = Math.floor((index / sampleCount) * waveform.length)
    const end = Math.max(start + 1, Math.floor(((index + 1) / sampleCount) * waveform.length))
    let total = 0

    for (let cursor = start; cursor < end; cursor += 1) {
      total += waveform[cursor] ?? 0
    }

    return total / Math.max(1, end - start)
  })
}

export function smoothSignal(signal: number[], radius = 2, passes = 1) {
  let smoothed = [...signal]

  for (let pass = 0; pass < passes; pass += 1) {
    smoothed = smoothed.map((_, index, currentSignal) => {
      const start = Math.max(0, index - radius)
      const end = Math.min(currentSignal.length - 1, index + radius)
      let total = 0
      let count = 0

      for (let cursor = start; cursor <= end; cursor += 1) {
        total += currentSignal[cursor] ?? 0
        count += 1
      }

      return total / Math.max(1, count)
    })
  }

  return smoothed
}

export function blendIdleAndAudioSignal(
  idleSignal: number[],
  audioSignal: number[],
  audioMix: number,
  pulseBoost: number,
  reducedMotion = false,
) {
  const maxAmplitude = reducedMotion ? 0.16 : 0.26

  return idleSignal.map((idleSample, index) => {
    const progress = idleSignal.length <= 1 ? 0 : index / (idleSignal.length - 1)
    const pulseEnvelope = 1 + gaussian(progress, 0.76, 0.11) * pulseBoost
    const audioSample = shapeAudioSample(audioSignal[index] ?? 0) * audioMix * pulseEnvelope

    return clampVisualSample(idleSample + audioSample, maxAmplitude)
  })
}

export function calculatePulseBoost(rms: number, bassEnergy: number, reducedMotion = false) {
  const baseBoost = rms * 0.45 + bassEnergy * 0.85

  return clampVisualSample(baseBoost * (reducedMotion ? 0.45 : 0.72), 0.55)
}

export function clampVisualSample(value: number, maxAmplitude = 0.32) {
  return Math.min(maxAmplitude, Math.max(-maxAmplitude, value))
}

export function createHeartbeatVisualSignal({
  snapshot,
  sampleCount,
  time,
  reducedMotion = false,
  previousSignal,
}: CreateHeartbeatVisualSignalOptions) {
  const idleSignal = createIdleSignal({ sampleCount, time, reducedMotion })
  const downsampledWaveform = downsampleWaveform(snapshot.waveform, sampleCount)
  const smoothedWaveform = smoothSignal(downsampledWaveform, reducedMotion ? 2 : 3, 2)
  const audioMix = snapshot.isAudioActive
    ? clampVisualSample(
        snapshot.rms * 1.55 +
          snapshot.bassEnergy * 0.42 +
          snapshot.midEnergy * 0.22 +
          snapshot.trebleEnergy * 0.08,
        reducedMotion ? 0.45 : 0.78,
      )
    : 0
  const pulseBoost = snapshot.isAudioActive
    ? calculatePulseBoost(snapshot.rms, snapshot.bassEnergy, reducedMotion)
    : 0
  const blendedSignal = blendIdleAndAudioSignal(
    idleSignal,
    smoothedWaveform,
    audioMix,
    pulseBoost,
    reducedMotion,
  )

  if (!previousSignal?.length || previousSignal.length !== blendedSignal.length) {
    return blendedSignal
  }

  const smoothingFactor = reducedMotion ? 0.18 : 0.3

  return blendedSignal.map((sample, index) =>
    clampVisualSample(previousSignal[index] + (sample - previousSignal[index]) * smoothingFactor),
  )
}

function shapeAudioSample(sample: number) {
  const sign = Math.sign(sample)
  const magnitude = Math.pow(Math.abs(sample), 0.82)

  return sign * magnitude * 0.42
}

function gaussian(value: number, center: number, spread: number) {
  const normalized = (value - center) / spread

  return Math.exp(-(normalized * normalized) / 2)
}
