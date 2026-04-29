import type {
  GitPulseContributionDataSource,
  GitPulseContributionIntensity,
} from '@/domain/gitpulse.types'
import type { GitPulseMood } from '@/domain/mood.types'

export type GitPulseAudioMood = GitPulseMood

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
