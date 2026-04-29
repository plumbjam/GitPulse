import { create } from 'zustand'
import { createDemoIdentityDatasets } from '@/data/demoDataset'
import type {
  GitPulseDataset,
  GitPulseIdentityDataset,
  GitPulseIdentityRole,
} from '@/domain/gitpulse.types'
import type { GitPulseMood } from '@/domain/mood.types'
import {
  fetchGitHubIdentityDataset,
  getGitHubUsernameKey,
  isValidGitHubUsername,
  normaliseGitHubUsernameInput,
} from '@/github/githubClient'
import { createGitHubClientErrorMessage, toGitHubClientError } from '@/github/githubErrors'
import { createEmptyGitPulseDataset, mergeIdentityDatasets } from '@/github/githubMerge'
import {
  createLoadingGitHubIdentityDataset,
  normaliseGitHubFetchResult,
} from '@/github/githubNormaliser'

type GitPulseState = {
  previewMode: boolean
  mood: GitPulseMood
  draftUsername: string
  identityDatasets: GitPulseIdentityDataset[]
  dataset: GitPulseDataset
  isFetching: boolean
  fetchError?: string
  identityErrors: Record<string, string>
  intensity: number
  tempo: number
  setMood: (mood: GitPulseMood) => void
  setDraftUsername: (username: string) => void
  fetchAndAddIdentity: (username: string) => Promise<void>
  removeIdentity: (id: string) => void
  loadDemoDataset: () => void
  clearDataset: () => void
  setTempo: (tempo: number) => void
  setIntensity: (intensity: number) => void
}

export const useGitPulseStore = create<GitPulseState>((set, get) => ({
  previewMode: true,
  mood: 'futuristic',
  draftUsername: '',
  identityDatasets: [],
  dataset: createEmptyGitPulseDataset('live'),
  isFetching: false,
  fetchError: undefined,
  identityErrors: {},
  intensity: 70,
  tempo: 112,
  setMood: (mood) => set({ mood }),
  setDraftUsername: (draftUsername) => set({ draftUsername, fetchError: undefined }),
  fetchAndAddIdentity: async (username) => {
    const trimmedUsername = normaliseGitHubUsernameInput(username)

    if (!isValidGitHubUsername(trimmedUsername)) {
      set({
        fetchError: createGitHubClientErrorMessage({
          code: 'invalid_username',
          username: trimmedUsername,
        }),
      })
      return
    }

    const currentState = get()
    const baseIdentityDatasets = currentState.identityDatasets.some(
      (dataset) => dataset.mode === 'demo',
    )
      ? []
      : currentState.identityDatasets
    const duplicateIdentity = baseIdentityDatasets.find(
      (dataset) =>
        getGitHubUsernameKey(dataset.identity.username) === getGitHubUsernameKey(trimmedUsername),
    )

    if (duplicateIdentity) {
      set({ fetchError: 'That GitHub username is already added.' })
      return
    }

    const loadingDataset = createLoadingGitHubIdentityDataset(
      trimmedUsername,
      getNextIdentityRole(baseIdentityDatasets),
    )
    const loadingIdentityDatasets = [...baseIdentityDatasets, loadingDataset]

    set({
      identityDatasets: loadingIdentityDatasets,
      dataset: mergeIdentityDatasets(loadingIdentityDatasets, { mode: 'live' }),
      isFetching: true,
      fetchError: undefined,
      identityErrors: buildIdentityErrors(loadingIdentityDatasets),
      draftUsername: '',
    })

    try {
      const result = await fetchGitHubIdentityDataset(trimmedUsername)
      const resolvedDataset = normaliseGitHubFetchResult(
        result,
        loadingDataset.identity.role ?? 'other',
      )

      set((state) => {
        if (
          !state.identityDatasets.some(
            (dataset) => dataset.identity.id === loadingDataset.identity.id,
          )
        ) {
          return {}
        }

        const nextIdentityDatasets = state.identityDatasets.map((dataset) =>
          dataset.identity.id === loadingDataset.identity.id ? resolvedDataset : dataset,
        )

        return {
          identityDatasets: nextIdentityDatasets,
          dataset: mergeIdentityDatasets(nextIdentityDatasets, { mode: 'live' }),
          isFetching: nextIdentityDatasets.some((dataset) => dataset.identity.status === 'loading'),
          fetchError:
            resolvedDataset.identity.status === 'error'
              ? resolvedDataset.identity.errorMessage
              : undefined,
          identityErrors: buildIdentityErrors(nextIdentityDatasets),
        }
      })
    } catch (error) {
      const fallbackDataset = normaliseGitHubFetchResult(
        {
          status: 'error',
          username: trimmedUsername,
          error: toGitHubClientError(error, trimmedUsername),
        },
        loadingDataset.identity.role ?? 'other',
      )

      set((state) => {
        if (
          !state.identityDatasets.some(
            (dataset) => dataset.identity.id === loadingDataset.identity.id,
          )
        ) {
          return {}
        }

        const nextIdentityDatasets = state.identityDatasets.map((dataset) =>
          dataset.identity.id === loadingDataset.identity.id ? fallbackDataset : dataset,
        )

        return {
          identityDatasets: nextIdentityDatasets,
          dataset: mergeIdentityDatasets(nextIdentityDatasets, { mode: 'live' }),
          isFetching: nextIdentityDatasets.some((dataset) => dataset.identity.status === 'loading'),
          fetchError: fallbackDataset.identity.errorMessage,
          identityErrors: buildIdentityErrors(nextIdentityDatasets),
        }
      })
    }
  },
  removeIdentity: (id) =>
    set((state) => {
      const nextIdentityDatasets = state.identityDatasets.filter(
        (dataset) => dataset.identity.id !== id,
      )
      const nextMode = getDatasetMode(nextIdentityDatasets)

      return {
        identityDatasets: nextIdentityDatasets,
        dataset: nextIdentityDatasets.length
          ? mergeIdentityDatasets(nextIdentityDatasets, { mode: nextMode })
          : createEmptyGitPulseDataset('live'),
        isFetching: nextIdentityDatasets.some((dataset) => dataset.identity.status === 'loading'),
        fetchError: undefined,
        identityErrors: buildIdentityErrors(nextIdentityDatasets),
      }
    }),
  loadDemoDataset: () => {
    const demoIdentityDatasets = createDemoIdentityDatasets()

    set({
      identityDatasets: demoIdentityDatasets,
      dataset: mergeIdentityDatasets(demoIdentityDatasets, { mode: 'demo' }),
      isFetching: false,
      fetchError: undefined,
      identityErrors: {},
      draftUsername: '',
    })
  },
  clearDataset: () =>
    set({
      identityDatasets: [],
      dataset: createEmptyGitPulseDataset('live'),
      isFetching: false,
      fetchError: undefined,
      identityErrors: {},
      draftUsername: '',
    }),
  setTempo: (tempo) => set({ tempo }),
  setIntensity: (intensity) => set({ intensity }),
}))

function getNextIdentityRole(identityDatasets: GitPulseIdentityDataset[]): GitPulseIdentityRole {
  if (identityDatasets.length === 0) {
    return 'personal'
  }

  if (identityDatasets.length === 1) {
    return 'work'
  }

  return 'other'
}

function buildIdentityErrors(identityDatasets: GitPulseIdentityDataset[]) {
  return identityDatasets.reduce<Record<string, string>>((errors, dataset) => {
    if (dataset.identity.errorMessage) {
      errors[getGitHubUsernameKey(dataset.identity.username)] = dataset.identity.errorMessage
    }

    return errors
  }, {})
}

function getDatasetMode(identityDatasets: GitPulseIdentityDataset[]) {
  if (identityDatasets.some((dataset) => dataset.mode === 'live')) {
    return 'live'
  }

  return 'demo'
}
