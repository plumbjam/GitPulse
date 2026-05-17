import { useMemo } from 'react'
import type { GitPulseDataset } from '@/domain/gitpulse.types'
import type { GitPulseAudioMood, MoodSoundMapping } from './audio.types'
import { createAudioPatternFromDataset } from './contributionSequencer'

export function useAudioPattern(
  dataset: GitPulseDataset,
  mood: GitPulseAudioMood,
  bpm: number,
  soundMapping?: MoodSoundMapping,
) {
  return useMemo(
    () =>
      createAudioPatternFromDataset(dataset, {
        mood,
        bpm,
        soundMapping,
      }),
    [bpm, dataset, mood, soundMapping],
  )
}
