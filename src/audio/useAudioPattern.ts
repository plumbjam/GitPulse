import { useMemo } from 'react'
import type { GitPulseDataset } from '@/domain/gitpulse.types'
import type { GitPulseAudioMood } from './audio.types'
import { createAudioPatternFromDataset } from './contributionSequencer'

export function useAudioPattern(dataset: GitPulseDataset, mood: GitPulseAudioMood, bpm: number) {
  return useMemo(
    () =>
      createAudioPatternFromDataset(dataset, {
        mood,
        bpm,
      }),
    [bpm, dataset, mood],
  )
}
