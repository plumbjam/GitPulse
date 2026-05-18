import { describe, expect, it } from 'vitest'
import {
  calculateAnalyserEnergies,
  calculateBandEnergy,
  calculateRms,
  createSilentAnalyserSnapshot,
  DEFAULT_ANALYSER_FREQUENCY_SIZE,
  DEFAULT_ANALYSER_WAVEFORM_SIZE,
  normaliseByteEnergy,
} from './audioAnalyser'

describe('audio analyser helpers', () => {
  it('creates a silent analyser snapshot with stable empty-state values', () => {
    const snapshot = createSilentAnalyserSnapshot()

    expect(snapshot.waveform).toHaveLength(DEFAULT_ANALYSER_WAVEFORM_SIZE)
    expect(snapshot.frequency).toHaveLength(DEFAULT_ANALYSER_FREQUENCY_SIZE)
    expect(snapshot.rms).toBe(0)
    expect(snapshot.bassEnergy).toBe(0)
    expect(snapshot.midEnergy).toBe(0)
    expect(snapshot.trebleEnergy).toBe(0)
    expect(snapshot.isAudioActive).toBe(false)
  })

  it('calculates RMS from waveform samples and clamps it to a safe range', () => {
    expect(calculateRms(new Float32Array([0, 0, 0, 0]))).toBe(0)
    expect(calculateRms(new Float32Array([1, -1, 1, -1]))).toBe(1)
    expect(calculateRms([0.5, -0.5, 0.5, -0.5])).toBeCloseTo(0.5, 5)
  })

  it('normalises byte energy values into 0..1', () => {
    expect(normaliseByteEnergy(0)).toBe(0)
    expect(normaliseByteEnergy(127.5)).toBe(0.5)
    expect(normaliseByteEnergy(255)).toBe(1)
    expect(normaliseByteEnergy(300)).toBe(1)
  })

  it('calculates average band energy and clamps bin ranges safely', () => {
    const frequency = new Uint8Array([0, 64, 128, 255])

    expect(calculateBandEnergy(frequency, 1, 2)).toBeCloseTo((64 / 255 + 128 / 255) / 2, 5)
    expect(calculateBandEnergy(frequency, -10, 99)).toBeCloseTo(
      (0 / 255 + 64 / 255 + 128 / 255 + 255 / 255) / 4,
      5,
    )
  })

  it('derives stable normalised bass, mid, and treble energies from frequency bins', () => {
    const frequency = new Uint8Array(12)

    frequency.set([255, 240], 0)
    frequency.set([180, 170, 160], 3)
    frequency.set([90, 80, 70, 60, 50], 7)

    const energies = calculateAnalyserEnergies(frequency)

    expect(energies.bassEnergy).toBeGreaterThan(energies.midEnergy)
    expect(energies.midEnergy).toBeGreaterThan(energies.trebleEnergy)
    expect(energies.bassEnergy).toBeLessThanOrEqual(1)
    expect(energies.midEnergy).toBeLessThanOrEqual(1)
    expect(energies.trebleEnergy).toBeLessThanOrEqual(1)
  })
})
