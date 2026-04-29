import { describe, expect, it } from 'vitest'
import { FUTURISTIC_DEFAULT_BPM } from './moods'
import {
  mapIntensityToRhythmFlags,
  mapVolumePercentToDecibels,
  resolvePatternBpm,
} from './musicMapping'

describe('music mapping helpers', () => {
  it('maps intensity levels into deterministic rhythm flags', () => {
    expect(mapIntensityToRhythmFlags(0)).toEqual({
      kick: false,
      snare: false,
      hat: false,
      accent: false,
    })
    expect(mapIntensityToRhythmFlags(1)).toEqual({
      kick: true,
      snare: false,
      hat: false,
      accent: false,
    })
    expect(mapIntensityToRhythmFlags(2)).toEqual({
      kick: true,
      snare: false,
      hat: true,
      accent: false,
    })
    expect(mapIntensityToRhythmFlags(3)).toEqual({
      kick: true,
      snare: true,
      hat: true,
      accent: false,
    })
    expect(mapIntensityToRhythmFlags(4)).toEqual({
      kick: true,
      snare: true,
      hat: true,
      accent: true,
    })
  })

  it('uses the Futuristic default BPM when no override is provided', () => {
    expect(FUTURISTIC_DEFAULT_BPM).toBe(118)
    expect(resolvePatternBpm('futuristic')).toBe(118)
  })

  it('respects a user BPM override within the safe range', () => {
    expect(resolvePatternBpm('futuristic', 142)).toBe(142)
    expect(resolvePatternBpm('futuristic', 200)).toBe(160)
    expect(resolvePatternBpm('futuristic', 48)).toBe(60)
  })

  it('maps app volume to a louder but limiter-friendly master range', () => {
    expect(mapVolumePercentToDecibels(0)).toBe(-60)
    expect(mapVolumePercentToDecibels(60)).toBeGreaterThan(-6)
    expect(mapVolumePercentToDecibels(100)).toBe(-1)
  })
})
