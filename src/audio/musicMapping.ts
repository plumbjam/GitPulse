import type { GitPulseContributionIntensity } from '@/domain/gitpulse.types'
import type {
  ActivityIntensityKey,
  GitPulseAudioMood,
  MoodSoundMapping,
  SoundMappingsByMood,
  SoundRole,
} from './audio.types'
import { AUDIO_BPM_RANGE, getMoodAudioConfig } from './moods'

const MOODS: GitPulseAudioMood[] = ['futuristic', 'playful', 'epic', 'lofi', 'glitch', 'ambient']

export const ACTIVITY_INTENSITY_KEYS: ActivityIntensityKey[] = [
  'intensity1',
  'intensity2',
  'intensity3',
  'intensity4',
]

export const INTENSITY_MAPPING_LABELS: Record<ActivityIntensityKey, string> = {
  intensity1: 'Pulse activity (Intensity 1)',
  intensity2: 'Build activity (Intensity 2)',
  intensity3: 'Surge activity (Intensity 3)',
  intensity4: 'Overload activity (Intensity 4)',
}

export const SOUND_ROLE_LABELS: Record<SoundRole, string> = {
  'soft-kick': 'Soft kick',
  'pulse-blip': 'Pulse blip',
  'muted-pluck': 'Muted pluck',
  'sub-tick': 'Sub tick',
  'kick-hat': 'Kick + Hat',
  'pulse-hat': 'Pulse + Hat',
  'bass-note': 'Bass note',
  'pluck-pair': 'Pluck pair',
  'kick-snare-hat': 'Kick + Snare + Hat',
  'bass-clap': 'Bass + Clap',
  'lead-accent': 'Lead accent',
  'chord-stab': 'Chord stab',
  'accent-crash': 'Accent crash',
  'tom-fill': 'Tom fill',
  'bright-lead-hit': 'Bright lead hit',
  'glitch-burst': 'Glitch burst',
}

export const SOUND_ROLE_OPTIONS_BY_INTENSITY: Record<ActivityIntensityKey, SoundRole[]> = {
  intensity1: ['soft-kick', 'pulse-blip', 'muted-pluck', 'sub-tick'],
  intensity2: ['kick-hat', 'pulse-hat', 'bass-note', 'pluck-pair'],
  intensity3: ['kick-snare-hat', 'bass-clap', 'lead-accent', 'chord-stab'],
  intensity4: ['accent-crash', 'tom-fill', 'bright-lead-hit', 'glitch-burst'],
}

export const DEFAULT_FUTURISTIC_SOUND_MAPPING: MoodSoundMapping = {
  intensity1: 'pulse-blip',
  intensity2: 'kick-hat',
  intensity3: 'kick-snare-hat',
  intensity4: 'bright-lead-hit',
}

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

export function mapSoundRoleToRhythmFlags(soundRole: SoundRole) {
  switch (soundRole) {
    case 'soft-kick':
    case 'sub-tick':
    case 'bass-note':
      return {
        kick: true,
        snare: false,
        hat: false,
        accent: false,
      }
    case 'pulse-blip':
    case 'muted-pluck':
      return {
        kick: false,
        snare: false,
        hat: false,
        accent: false,
      }
    case 'kick-hat':
    case 'pulse-hat':
    case 'pluck-pair':
      return {
        kick: true,
        snare: false,
        hat: true,
        accent: false,
      }
    case 'bass-clap':
    case 'lead-accent':
    case 'chord-stab':
    case 'kick-snare-hat':
      return {
        kick: true,
        snare: true,
        hat: true,
        accent: false,
      }
    case 'accent-crash':
    case 'tom-fill':
    case 'bright-lead-hit':
    case 'glitch-burst':
    default:
      return {
        kick: true,
        snare: true,
        hat: true,
        accent: true,
      }
  }
}

export function mapIntensityToActivityKey(
  intensity: GitPulseContributionIntensity,
): ActivityIntensityKey | undefined {
  if (intensity < 1 || intensity > 4) {
    return undefined
  }

  return `intensity${intensity}` as ActivityIntensityKey
}

export function resolveSoundRoleForIntensity(
  intensity: GitPulseContributionIntensity,
  mapping?: MoodSoundMapping,
) {
  const intensityKey = mapIntensityToActivityKey(intensity)

  if (!intensityKey) {
    return undefined
  }

  return mapping?.[intensityKey] ?? DEFAULT_FUTURISTIC_SOUND_MAPPING[intensityKey]
}

export function getDefaultMoodSoundMapping(mood: GitPulseAudioMood): MoodSoundMapping {
  void mood

  return { ...DEFAULT_FUTURISTIC_SOUND_MAPPING }
}

export function createDefaultSoundMappings(): SoundMappingsByMood {
  return Object.fromEntries(
    MOODS.map((mood) => [mood, getDefaultMoodSoundMapping(mood)]),
  ) as SoundMappingsByMood
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
