import { create } from 'zustand'
import {
  clearGitHubOAuthSession,
  loadGitHubOAuthSession,
  saveGitHubOAuthSession,
} from '@/auth/oauthSession'
import { AUDIO_BPM_RANGE, DEFAULT_AUDIO_VOLUME, getMoodDefaultBpm } from '@/audio/moods'
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
import { normaliseGitHubContributionCalendarResult } from '@/github/githubContributionNormaliser'
import { createGitHubClientErrorMessage, toGitHubClientError } from '@/github/githubErrors'
import { fetchGitHubContributionCalendarQuery } from '@/github/githubGraphqlClient'
import { createEmptyGitPulseDataset, mergeIdentityDatasets } from '@/github/githubMerge'
import {
  createLoadingGitHubIdentityDataset,
  normaliseGitHubFetchResult,
} from '@/github/githubNormaliser'

type GitPulseAuthMode = 'none' | 'oauth' | 'manual-token'
type GitPulseOAuthStatus = 'idle' | 'starting' | 'exchanging' | 'connected' | 'error'

type GitPulseState = {
  previewMode: boolean
  mood: GitPulseMood
  draftUsername: string
  identityDatasets: GitPulseIdentityDataset[]
  dataset: GitPulseDataset
  isFetching: boolean
  isFetchingContributions: boolean
  fetchError?: string
  contributionFetchError?: string
  identityErrors: Record<string, string>
  githubToken: string
  authMode: GitPulseAuthMode
  oauthAccessToken?: string
  oauthStatus: GitPulseOAuthStatus
  oauthError?: string
  intensity: number
  tempo: number
  volume: number
  isAudioPlaying: boolean
  audioError?: string
  hasUserTempoOverride: boolean
  selectedStartStepIndex: number
  selectedStartDate?: string
  currentPlayheadStepIndex: number
  currentPlayheadDate?: string
  activeAudioStepIndex: number | null
  activeAudioDate?: string
  setMood: (mood: GitPulseMood) => void
  setDraftUsername: (username: string) => void
  setGitHubToken: (token: string) => void
  clearGitHubToken: () => void
  setOAuthToken: (token: string, metadata?: { scope?: string; tokenType?: string }) => void
  clearOAuthSession: () => void
  setOAuthStatus: (status: GitPulseOAuthStatus) => void
  setOAuthError: (message?: string) => void
  loadOAuthSessionFromStorage: () => void
  fetchAndAddIdentity: (username: string) => Promise<void>
  refreshContributionCalendars: () => Promise<void>
  removeIdentity: (id: string) => void
  loadDemoDataset: () => void
  clearDataset: () => void
  setTempo: (tempo: number) => void
  resetTempoToMoodDefault: () => void
  setVolume: (volume: number) => void
  setIntensity: (intensity: number) => void
  setAudioPlaying: (isPlaying: boolean) => void
  setAudioError: (message?: string) => void
  setSelectedStartStep: (index: number, date?: string) => void
  setCurrentPlayheadStep: (index: number, date?: string) => void
  setSelectedStartAndPlayhead: (index: number, date?: string) => void
  resetPlayheadToSelectedStart: () => void
  skipPlayhead: (delta: -1 | 1, maxIndex: number, nextDate?: string) => void
  setActiveAudioStep: (index: number, date?: string) => void
  resetActiveAudioStep: () => void
}

export const useGitPulseStore = create<GitPulseState>((set, get) => ({
  previewMode: true,
  mood: 'futuristic',
  draftUsername: '',
  identityDatasets: [],
  dataset: createEmptyGitPulseDataset('live'),
  isFetching: false,
  isFetchingContributions: false,
  fetchError: undefined,
  contributionFetchError: undefined,
  identityErrors: {},
  githubToken: '',
  authMode: 'none',
  oauthAccessToken: undefined,
  oauthStatus: 'idle',
  oauthError: undefined,
  intensity: 70,
  tempo: getMoodDefaultBpm('futuristic'),
  volume: DEFAULT_AUDIO_VOLUME,
  isAudioPlaying: false,
  audioError: undefined,
  hasUserTempoOverride: false,
  selectedStartStepIndex: 0,
  selectedStartDate: undefined,
  currentPlayheadStepIndex: 0,
  currentPlayheadDate: undefined,
  activeAudioStepIndex: null,
  activeAudioDate: undefined,
  setMood: (mood) =>
    set((state) => ({
      mood,
      tempo: state.hasUserTempoOverride ? state.tempo : getMoodDefaultBpm(mood),
      audioError: undefined,
    })),
  setDraftUsername: (draftUsername) => set({ draftUsername, fetchError: undefined }),
  setGitHubToken: (githubToken) =>
    set((state) => {
      const trimmedToken = githubToken.trim()

      return {
        githubToken: trimmedToken,
        authMode: state.oauthAccessToken ? 'oauth' : trimmedToken ? 'manual-token' : 'none',
        contributionFetchError: undefined,
      }
    }),
  clearGitHubToken: () =>
    set((state) => {
      const nextIdentityDatasets = state.oauthAccessToken
        ? state.identityDatasets
        : state.identityDatasets.map((dataset) =>
            dataset.mode === 'live' ? { ...dataset, contributionCalendar: undefined } : dataset,
          )

      return {
        githubToken: '',
        authMode: state.oauthAccessToken ? 'oauth' : 'none',
        identityDatasets: nextIdentityDatasets,
        dataset: state.oauthAccessToken
          ? state.dataset
          : nextIdentityDatasets.length
            ? mergeIdentityDatasets(nextIdentityDatasets, {
                mode: getDatasetMode(nextIdentityDatasets),
              })
            : createEmptyGitPulseDataset('live'),
        isAudioPlaying: false,
        isFetchingContributions: false,
        audioError: undefined,
        contributionFetchError: undefined,
        activeAudioStepIndex: null,
        activeAudioDate: undefined,
      }
    }),
  setOAuthToken: (oauthAccessToken, metadata) => {
    const trimmedToken = oauthAccessToken.trim()

    if (!trimmedToken) {
      return
    }

    saveGitHubOAuthSession({
      accessToken: trimmedToken,
      tokenType: metadata?.tokenType ?? 'bearer',
      scope: metadata?.scope ?? '',
    })
    set({
      authMode: 'oauth',
      oauthAccessToken: trimmedToken,
      oauthStatus: 'connected',
      oauthError: undefined,
      contributionFetchError: undefined,
    })
  },
  clearOAuthSession: () => {
    clearGitHubOAuthSession()
    set((state) => {
      const shouldClearCalendars = !state.githubToken
      const nextIdentityDatasets = shouldClearCalendars
        ? state.identityDatasets.map((dataset) =>
            dataset.mode === 'live' ? { ...dataset, contributionCalendar: undefined } : dataset,
          )
        : state.identityDatasets

      return {
        authMode: state.githubToken ? 'manual-token' : 'none',
        oauthAccessToken: undefined,
        oauthStatus: 'idle',
        oauthError: undefined,
        identityDatasets: nextIdentityDatasets,
        dataset: shouldClearCalendars
          ? nextIdentityDatasets.length
            ? mergeIdentityDatasets(nextIdentityDatasets, {
                mode: getDatasetMode(nextIdentityDatasets),
              })
            : createEmptyGitPulseDataset('live')
          : state.dataset,
        isAudioPlaying: false,
        activeAudioStepIndex: null,
        activeAudioDate: undefined,
        contributionFetchError: undefined,
      }
    })
  },
  setOAuthStatus: (oauthStatus) => set({ oauthStatus }),
  setOAuthError: (oauthError) =>
    set({
      oauthError,
      oauthStatus: oauthError ? 'error' : 'idle',
    }),
  loadOAuthSessionFromStorage: () => {
    const session = loadGitHubOAuthSession()

    if (!session) {
      return
    }

    set({
      authMode: 'oauth',
      oauthAccessToken: session.accessToken,
      oauthStatus: 'connected',
      oauthError: undefined,
    })
  },
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
      audioError: undefined,
      contributionFetchError: undefined,
      identityErrors: buildIdentityErrors(loadingIdentityDatasets),
      draftUsername: '',
    })

    try {
      const result = await fetchGitHubIdentityDataset(trimmedUsername)
      let resolvedDataset = normaliseGitHubFetchResult(
        result,
        loadingDataset.identity.role ?? 'other',
      )
      let contributionFetchError: string | undefined

      const graphqlToken = getGraphqlAccessToken(get())

      if (resolvedDataset.identity.status === 'success' && graphqlToken) {
        const contributionResult = await loadContributionCalendarForUsername(
          resolvedDataset.identity.username,
          graphqlToken,
        )

        if (contributionResult.status === 'success') {
          resolvedDataset = {
            ...resolvedDataset,
            contributionCalendar: contributionResult.calendar,
          }
        } else {
          contributionFetchError = `Could not load contribution calendar for @${resolvedDataset.identity.username}. Using approximate fallback.`
        }
      }

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
          isAudioPlaying: false,
          activeAudioStepIndex: null,
          activeAudioDate: undefined,
          contributionFetchError,
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
          isAudioPlaying: false,
          activeAudioStepIndex: null,
          activeAudioDate: undefined,
          contributionFetchError: undefined,
          identityErrors: buildIdentityErrors(nextIdentityDatasets),
        }
      })
    }
  },
  refreshContributionCalendars: async () => {
    const { identityDatasets } = get()
    const graphqlToken = getGraphqlAccessToken(get())

    if (!identityDatasets.length) {
      set({
        contributionFetchError: undefined,
        isFetchingContributions: false,
      })
      return
    }

    if (!graphqlToken) {
      set((state) => {
        const nextIdentityDatasets = state.identityDatasets.map((dataset) =>
          dataset.mode === 'live' ? { ...dataset, contributionCalendar: undefined } : dataset,
        )

        return {
          identityDatasets: nextIdentityDatasets,
          dataset: mergeIdentityDatasets(nextIdentityDatasets, {
            mode: getDatasetMode(nextIdentityDatasets),
          }),
          isAudioPlaying: false,
          isFetchingContributions: false,
          audioError: undefined,
          contributionFetchError: undefined,
          activeAudioStepIndex: null,
          activeAudioDate: undefined,
        }
      })
      return
    }

    set({
      isFetchingContributions: true,
      contributionFetchError: undefined,
    })

    const liveIdentityDatasets = identityDatasets.filter(
      (dataset) => dataset.mode === 'live' && dataset.identity.status === 'success',
    )
    const contributionResults = await Promise.all(
      liveIdentityDatasets.map((dataset) =>
        loadContributionCalendarForUsername(dataset.identity.username, graphqlToken),
      ),
    )
    const contributionResultsByUsername = new Map(
      contributionResults.map((result) => [getGitHubUsernameKey(result.username), result]),
    )

    set((state) => {
      const nextIdentityDatasets = state.identityDatasets.map((dataset) => {
        if (dataset.mode !== 'live' || dataset.identity.status !== 'success') {
          return dataset
        }

        const contributionResult = contributionResultsByUsername.get(
          getGitHubUsernameKey(dataset.identity.username),
        )

        if (!contributionResult || contributionResult.status === 'error') {
          return {
            ...dataset,
            contributionCalendar: undefined,
          }
        }

        return {
          ...dataset,
          contributionCalendar: contributionResult.calendar,
        }
      })

      return {
        identityDatasets: nextIdentityDatasets,
        dataset: mergeIdentityDatasets(nextIdentityDatasets, {
          mode: getDatasetMode(nextIdentityDatasets),
        }),
        isAudioPlaying: false,
        isFetchingContributions: false,
        audioError: undefined,
        contributionFetchError: buildContributionFetchError(contributionResults),
        activeAudioStepIndex: null,
        activeAudioDate: undefined,
      }
    })
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
        isAudioPlaying: false,
        isFetching: nextIdentityDatasets.some((dataset) => dataset.identity.status === 'loading'),
        isFetchingContributions: false,
        audioError: undefined,
        fetchError: undefined,
        contributionFetchError: undefined,
        identityErrors: buildIdentityErrors(nextIdentityDatasets),
        selectedStartStepIndex: 0,
        selectedStartDate: undefined,
        currentPlayheadStepIndex: 0,
        currentPlayheadDate: undefined,
        activeAudioStepIndex: null,
        activeAudioDate: undefined,
      }
    }),
  loadDemoDataset: () => {
    const demoIdentityDatasets = createDemoIdentityDatasets()

    set({
      identityDatasets: demoIdentityDatasets,
      dataset: mergeIdentityDatasets(demoIdentityDatasets, { mode: 'demo' }),
      isFetching: false,
      isFetchingContributions: false,
      isAudioPlaying: false,
      audioError: undefined,
      fetchError: undefined,
      contributionFetchError: undefined,
      identityErrors: {},
      draftUsername: '',
      selectedStartStepIndex: 0,
      selectedStartDate: undefined,
      currentPlayheadStepIndex: 0,
      currentPlayheadDate: undefined,
      activeAudioStepIndex: null,
      activeAudioDate: undefined,
    })
  },
  clearDataset: () =>
    set({
      identityDatasets: [],
      dataset: createEmptyGitPulseDataset('live'),
      isFetching: false,
      isFetchingContributions: false,
      isAudioPlaying: false,
      audioError: undefined,
      fetchError: undefined,
      contributionFetchError: undefined,
      identityErrors: {},
      draftUsername: '',
      selectedStartStepIndex: 0,
      selectedStartDate: undefined,
      currentPlayheadStepIndex: 0,
      currentPlayheadDate: undefined,
      activeAudioStepIndex: null,
      activeAudioDate: undefined,
    }),
  setTempo: (tempo) =>
    set({
      tempo: clamp(tempo, AUDIO_BPM_RANGE.min, AUDIO_BPM_RANGE.max),
      hasUserTempoOverride: true,
    }),
  resetTempoToMoodDefault: () =>
    set((state) => ({
      tempo: getMoodDefaultBpm(state.mood),
      hasUserTempoOverride: false,
    })),
  setVolume: (volume) => set({ volume: clamp(volume, 0, 100) }),
  setIntensity: (intensity) => set({ intensity }),
  setAudioPlaying: (isAudioPlaying) =>
    set({
      isAudioPlaying,
      ...(isAudioPlaying ? {} : { activeAudioStepIndex: null, activeAudioDate: undefined }),
    }),
  setAudioError: (audioError) => set({ audioError }),
  setSelectedStartStep: (selectedStartStepIndex, selectedStartDate) =>
    set({
      selectedStartStepIndex: Math.max(0, selectedStartStepIndex),
      selectedStartDate,
    }),
  setCurrentPlayheadStep: (currentPlayheadStepIndex, currentPlayheadDate) =>
    set({
      currentPlayheadStepIndex: Math.max(0, currentPlayheadStepIndex),
      currentPlayheadDate,
    }),
  setSelectedStartAndPlayhead: (selectedStartStepIndex, selectedStartDate) =>
    set({
      selectedStartStepIndex: Math.max(0, selectedStartStepIndex),
      selectedStartDate,
      currentPlayheadStepIndex: Math.max(0, selectedStartStepIndex),
      currentPlayheadDate: selectedStartDate,
      isAudioPlaying: false,
      activeAudioStepIndex: null,
      activeAudioDate: undefined,
      audioError: undefined,
    }),
  resetPlayheadToSelectedStart: () =>
    set((state) => ({
      currentPlayheadStepIndex: state.selectedStartStepIndex,
      currentPlayheadDate: state.selectedStartDate,
      activeAudioStepIndex: null,
      activeAudioDate: undefined,
    })),
  skipPlayhead: (delta, maxIndex, nextDate) =>
    set((state) => {
      const nextStepIndex = clamp(state.currentPlayheadStepIndex + delta, 0, Math.max(0, maxIndex))

      return {
        currentPlayheadStepIndex: nextStepIndex,
        currentPlayheadDate: nextDate,
      }
    }),
  setActiveAudioStep: (activeAudioStepIndex, activeAudioDate) =>
    set({
      activeAudioStepIndex,
      activeAudioDate,
      currentPlayheadStepIndex: activeAudioStepIndex,
      currentPlayheadDate: activeAudioDate,
    }),
  resetActiveAudioStep: () =>
    set({
      activeAudioStepIndex: null,
      activeAudioDate: undefined,
    }),
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

function getGraphqlAccessToken(state: GitPulseState) {
  return state.oauthAccessToken || state.githubToken
}

async function loadContributionCalendarForUsername(username: string, githubToken: string) {
  try {
    const queryResult = await fetchGitHubContributionCalendarQuery(username, githubToken)
    return normaliseGitHubContributionCalendarResult(username, queryResult)
  } catch (error) {
    const clientError = toGitHubClientError(error, username)

    return {
      username,
      status: 'error' as const,
      errorMessage: createGitHubClientErrorMessage(clientError),
    }
  }
}

function buildContributionFetchError(
  contributionResults: Array<{
    username: string
    status: 'success' | 'error'
    errorMessage?: string
  }>,
) {
  const failedResults = contributionResults.filter((result) => result.status === 'error')

  if (!failedResults.length) {
    return undefined
  }

  if (failedResults.length === 1) {
    return `Could not load contribution calendar for @${failedResults[0].username}. Using approximate fallback.`
  }

  return 'Could not load contribution calendars for some identities. Using approximate fallback where needed.'
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}
