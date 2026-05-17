import type {
  GitPulseContributionDataSource,
  GitPulseContributionIntensity,
} from '@/domain/gitpulse.types'
import type { GitPulseMood } from '@/domain/mood.types'

export type GitPulseAudioMood = GitPulseMood

export type SoundRole =
  | 'soft-kick'
  | 'pulse-blip'
  | 'muted-pluck'
  | 'sub-tick'
  | 'kick-hat'
  | 'pulse-hat'
  | 'bass-note'
  | 'pluck-pair'
  | 'kick-snare-hat'
  | 'bass-clap'
  | 'lead-accent'
  | 'chord-stab'
  | 'accent-crash'
  | 'tom-fill'
  | 'bright-lead-hit'
  | 'glitch-burst'

export type ActivityIntensityKey = 'intensity1' | 'intensity2' | 'intensity3' | 'intensity4'

export type MoodSoundMapping = Record<ActivityIntensityKey, SoundRole>

export type SoundMappingsByMood = Record<GitPulseAudioMood, MoodSoundMapping>

export type AudioPatternStep = {
  index: number
  bar: number
  beat: number
  date?: string
  contributionCount: number
  intensity: GitPulseContributionIntensity
  kick: boolean
  snare: boolean
  hat: boolean
  accent: boolean
  soundRole?: SoundRole
  bassNote?: string
  leadNote?: string
  velocity: number
  sourceUsernames: string[]
  dataSource: GitPulseContributionDataSource
}

export type GitPulseAudioPattern = {
  mood: GitPulseAudioMood
  bpm: number
  loopBars: number
  steps: AudioPatternStep[]
  summary: {
    source: GitPulseContributionDataSource
    activeSteps: number
    peakContributionCount: number
    dominantLanguages: string[]
  }
}

export type GitPulseMoodAudioConfig = {
  mood: GitPulseAudioMood
  label: string
  soundProfile: 'futuristic'
  defaultBpm: number
  bpmRange: {
    min: number
    max: number
  }
  bassNotes: string[]
  leadNotes: string[]
  padNotes: string[]
}
