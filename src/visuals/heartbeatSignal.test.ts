import { createSilentAnalyserSnapshot } from '@/audio/audioAnalyser'
import { describe, expect, it } from 'vitest'
import {
  calculatePulseBoost,
  clampVisualSample,
  createHeartbeatVisualSignal,
  createIdleSignal,
  downsampleWaveform,
  smoothSignal,
} from './heartbeatSignal'

describe('heartbeatSignal', () => {
  it('keeps the idle signal low amplitude', () => {
    const idleSignal = createIdleSignal({ sampleCount: 128, time: 4.8 })
    const maxAmplitude = Math.max(...idleSignal.map((sample) => Math.abs(sample)))

    expect(maxAmplitude).toBeLessThan(0.08)
  })

  it('downsamples a waveform to the requested sample count', () => {
    const waveform = new Float32Array(Array.from({ length: 256 }, (_, index) => Math.sin(index)))
    const downsampled = downsampleWaveform(waveform, 48)

    expect(downsampled).toHaveLength(48)
  })

  it('smooths abrupt jumps in the waveform', () => {
    const jaggedSignal = [0, 0, 1, 0, 0]
    const smoothed = smoothSignal(jaggedSignal, 1, 1)

    expect(smoothed[2]).toBeLessThan(1)
    expect(smoothed[1]).toBeGreaterThan(0)
  })

  it('falls back to an idle-like signal when analyser audio is silent', () => {
    const snapshot = createSilentAnalyserSnapshot()
    const signal = createHeartbeatVisualSignal({
      snapshot,
      sampleCount: 128,
      time: 2.1,
    })
    const maxAmplitude = Math.max(...signal.map((sample) => Math.abs(sample)))

    expect(maxAmplitude).toBeLessThan(0.09)
  })

  it('produces a stronger visual trace when analyser audio is active', () => {
    const snapshot = {
      ...createSilentAnalyserSnapshot(),
      waveform: new Float32Array(
        Array.from({ length: 256 }, (_, index) => Math.sin(index * 0.28) * 0.8),
      ),
      rms: 0.55,
      bassEnergy: 0.62,
      midEnergy: 0.36,
      trebleEnergy: 0.24,
      isAudioActive: true,
    }
    const idleSignal = createHeartbeatVisualSignal({
      snapshot: createSilentAnalyserSnapshot(),
      sampleCount: 128,
      time: 3.4,
    })
    const activeSignal = createHeartbeatVisualSignal({
      snapshot,
      sampleCount: 128,
      time: 3.4,
    })
    const idlePeak = Math.max(...idleSignal.map((sample) => Math.abs(sample)))
    const activePeak = Math.max(...activeSignal.map((sample) => Math.abs(sample)))

    expect(activePeak).toBeGreaterThan(idlePeak)
  })

  it('scales pulse boost with RMS and bass values while clamping output', () => {
    const quietPulse = calculatePulseBoost(0.1, 0.08)
    const loudPulse = calculatePulseBoost(0.95, 1.1)

    expect(loudPulse).toBeGreaterThan(quietPulse)
    expect(loudPulse).toBeLessThanOrEqual(0.55)
  })

  it('keeps reduced-motion output softer than the default trace', () => {
    const snapshot = {
      ...createSilentAnalyserSnapshot(),
      waveform: new Float32Array(
        Array.from({ length: 256 }, (_, index) => Math.sin(index * 0.22) * 0.7),
      ),
      rms: 0.52,
      bassEnergy: 0.6,
      midEnergy: 0.31,
      trebleEnergy: 0.18,
      isAudioActive: true,
    }
    const standardSignal = createHeartbeatVisualSignal({
      snapshot,
      sampleCount: 128,
      time: 1.6,
    })
    const reducedSignal = createHeartbeatVisualSignal({
      snapshot,
      sampleCount: 128,
      time: 1.6,
      reducedMotion: true,
    })
    const standardPeak = Math.max(...standardSignal.map((sample) => Math.abs(sample)))
    const reducedPeak = Math.max(...reducedSignal.map((sample) => Math.abs(sample)))

    expect(reducedPeak).toBeLessThan(standardPeak)
  })

  it('clamps visual samples to the requested amplitude ceiling', () => {
    expect(clampVisualSample(0.9, 0.2)).toBe(0.2)
    expect(clampVisualSample(-0.9, 0.2)).toBe(-0.2)
  })
})
