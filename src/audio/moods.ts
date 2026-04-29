import type { GitPulseAudioMood, GitPulseMoodAudioConfig } from './audio.types'

export const AUDIO_STEPS_PER_BAR = 4
export const AUDIO_BPM_RANGE = {
  min: 60,
  max: 160,
} as const
export const DEFAULT_AUDIO_VOLUME = 58
export const FUTURISTIC_DEFAULT_BPM = 118

const AUDIO_MOOD_CONFIG: Record<GitPulseAudioMood, GitPulseMoodAudioConfig> = {
  futuristic: {
    mood: 'futuristic',
    label: 'Futuristic',
    soundProfile: 'futuristic',
    defaultBpm: FUTURISTIC_DEFAULT_BPM,
    bpmRange: AUDIO_BPM_RANGE,
    bassNotes: ['A2', 'A2', 'F2', 'G2', 'A2', 'C3', 'G2', 'E2'],
    leadNotes: ['A4', 'C5', 'E5', 'G5', 'B4', 'E5', 'D5', 'C5'],
    padNotes: ['A3', 'C4', 'E4', 'G4'],
  },
  playful: {
    mood: 'playful',
    label: 'Playful',
    soundProfile: 'futuristic',
    defaultBpm: 126,
    bpmRange: AUDIO_BPM_RANGE,
    bassNotes: ['A2', 'A2', 'F2', 'G2', 'A2', 'C3', 'G2', 'E2'],
    leadNotes: ['A4', 'C5', 'E5', 'G5', 'B4', 'E5', 'D5', 'C5'],
    padNotes: ['A3', 'C4', 'E4', 'G4'],
  },
  epic: {
    mood: 'epic',
    label: 'Epic',
    soundProfile: 'futuristic',
    defaultBpm: 92,
    bpmRange: AUDIO_BPM_RANGE,
    bassNotes: ['A2', 'A2', 'F2', 'G2', 'A2', 'C3', 'G2', 'E2'],
    leadNotes: ['A4', 'C5', 'E5', 'G5', 'B4', 'E5', 'D5', 'C5'],
    padNotes: ['A3', 'C4', 'E4', 'G4'],
  },
  lofi: {
    mood: 'lofi',
    label: 'Lo-fi',
    soundProfile: 'futuristic',
    defaultBpm: 84,
    bpmRange: AUDIO_BPM_RANGE,
    bassNotes: ['A2', 'A2', 'F2', 'G2', 'A2', 'C3', 'G2', 'E2'],
    leadNotes: ['A4', 'C5', 'E5', 'G5', 'B4', 'E5', 'D5', 'C5'],
    padNotes: ['A3', 'C4', 'E4', 'G4'],
  },
  glitch: {
    mood: 'glitch',
    label: 'Glitch',
    soundProfile: 'futuristic',
    defaultBpm: 132,
    bpmRange: AUDIO_BPM_RANGE,
    bassNotes: ['A2', 'A2', 'F2', 'G2', 'A2', 'C3', 'G2', 'E2'],
    leadNotes: ['A4', 'C5', 'E5', 'G5', 'B4', 'E5', 'D5', 'C5'],
    padNotes: ['A3', 'C4', 'E4', 'G4'],
  },
  ambient: {
    mood: 'ambient',
    label: 'Ambient',
    soundProfile: 'futuristic',
    defaultBpm: 70,
    bpmRange: AUDIO_BPM_RANGE,
    bassNotes: ['A2', 'A2', 'F2', 'G2', 'A2', 'C3', 'G2', 'E2'],
    leadNotes: ['A4', 'C5', 'E5', 'G5', 'B4', 'E5', 'D5', 'C5'],
    padNotes: ['A3', 'C4', 'E4', 'G4'],
  },
}

export function getMoodAudioConfig(mood: GitPulseAudioMood) {
  return AUDIO_MOOD_CONFIG[mood]
}

export function getMoodDefaultBpm(mood: GitPulseAudioMood) {
  return getMoodAudioConfig(mood).defaultBpm
}
