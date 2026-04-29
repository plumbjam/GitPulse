import type { GitPulseContributionIntensity } from '@/domain/gitpulse.types'
import type { GitPulseAudioMood } from './audio.types'
import { AUDIO_BPM_RANGE, getMoodAudioConfig } from './moods'

export function mapIntensityToRhythmFlags(intensity: GitPulseContributionIntensity) {
  switch (intensity) {
    case 0:
      return {
        kick: false,
        snare: false,
        hat: false,
        accent: false,
      }
    case 1:
      return {
        kick: true,
        snare: false,
        hat: false,
        accent: false,
      }
    case 2:
      return {
        kick: true,
        snare: false,
        hat: true,
        accent: false,
      }
    case 3:
      return {
        kick: true,
        snare: true,
        hat: true,
        accent: false,
      }
    case 4:
    default:
      return {
        kick: true,
        snare: true,
        hat: true,
        accent: true,
      }
  }
}

export function resolvePatternBpm(mood: GitPulseAudioMood, bpmOverride?: number) {
  const defaultBpm = getMoodAudioConfig(mood).defaultBpm

  return clamp(Math.round(bpmOverride ?? defaultBpm), AUDIO_BPM_RANGE.min, AUDIO_BPM_RANGE.max)
}

export function mapStepVelocity(
  intensity: GitPulseContributionIntensity,
  contributionCount: number,
  peakContributionCount: number,
) {
  if (intensity === 0) {
    return 0.18
  }

  const peakRatio = peakContributionCount > 0 ? contributionCount / peakContributionCount : 0
  const velocity = 0.3 + intensity * 0.12 + peakRatio * 0.12

  return roundToTwoDecimals(clamp(velocity, 0.24, 0.94))
}

export function mapBassNoteForStep(
  mood: GitPulseAudioMood,
  index: number,
  intensity: GitPulseContributionIntensity,
  contributionCount: number,
) {
  if (intensity === 0) {
    return undefined
  }

  const notes = getMoodAudioConfig(mood).bassNotes
  const noteIndex = (Math.floor(index / 2) + contributionCount) % notes.length

  return notes[noteIndex]
}

export function mapLeadNoteForStep(
  mood: GitPulseAudioMood,
  index: number,
  intensity: GitPulseContributionIntensity,
  contributionCount: number,
) {
  if (intensity < 3) {
    return undefined
  }

  const notes = getMoodAudioConfig(mood).leadNotes
  const noteIndex = (index + contributionCount + intensity) % notes.length

  return notes[noteIndex]
}

export function mapVolumePercentToDecibels(volumePercent: number) {
  const safeVolumePercent = clamp(volumePercent, 0, 100)

  if (safeVolumePercent === 0) {
    return -60
  }

  const gain = Math.pow(safeVolumePercent / 100, 1.08) * 0.95
  const decibels = 20 * Math.log10(Math.max(gain, 0.001))

  return roundToTwoDecimals(clamp(decibels, -48, -1))
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function roundToTwoDecimals(value: number) {
  return Math.round(value * 100) / 100
}
