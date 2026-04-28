import { create } from 'zustand'
import type { GitPulseIdentity } from '@/domain/gitpulse.types'
import type { GitPulseMood } from '@/domain/mood.types'

type GitPulseState = {
  previewMode: boolean
  mood: GitPulseMood
  draftUsername: string
  identities: GitPulseIdentity[]
  intensity: number
  tempo: number
  setMood: (mood: GitPulseMood) => void
  setDraftUsername: (username: string) => void
  addIdentity: () => void
  removeIdentity: (id: string) => void
  setTempo: (tempo: number) => void
  setIntensity: (intensity: number) => void
}

export const useGitPulseStore = create<GitPulseState>((set, get) => ({
  previewMode: true,
  mood: 'futuristic',
  draftUsername: '',
  identities: [
    { id: 'seed-personal', username: 'octo-dev', source: 'github', role: 'personal' },
    { id: 'seed-work', username: 'octo-work', source: 'github', role: 'work' },
  ],
  intensity: 70,
  tempo: 112,
  setMood: (mood) => set({ mood }),
  setDraftUsername: (draftUsername) => set({ draftUsername }),
  addIdentity: () => {
    const username = get().draftUsername.trim()
    if (!username) {
      return
    }

    const identity: GitPulseIdentity = {
      id: `identity-${crypto.randomUUID()}`,
      username,
      source: 'github',
      role: 'other',
    }

    set((state) => ({
      identities: [...state.identities, identity],
      draftUsername: '',
    }))
  },
  removeIdentity: (id) =>
    set((state) => ({ identities: state.identities.filter((item) => item.id !== id) })),
  setTempo: (tempo) => set({ tempo }),
  setIntensity: (intensity) => set({ intensity }),
}))
