import { beforeEach, describe, expect, it } from 'vitest'
import { DEFAULT_FUTURISTIC_SOUND_MAPPING } from '@/audio/musicMapping'
import { DEFAULT_AUDIO_VOLUME, getMoodDefaultBpm } from '@/audio/moods'
import { useGitPulseStore } from './useGitPulseStore'

const initialStoreState = useGitPulseStore.getState()

describe('useGitPulseStore audio state', () => {
  beforeEach(() => {
    sessionStorage.clear()
    useGitPulseStore.setState(initialStoreState, true)
  })

  it('starts with the Futuristic mood default tempo and comfortable volume', () => {
    const state = useGitPulseStore.getState()

    expect(state.mood).toBe('futuristic')
    expect(state.tempo).toBe(getMoodDefaultBpm('futuristic'))
    expect(state.hasUserTempoOverride).toBe(false)
    expect(state.volume).toBe(DEFAULT_AUDIO_VOLUME)
  })

  it('applies the next mood default tempo when the user has not overridden BPM', () => {
    useGitPulseStore.getState().setMood('playful')

    const state = useGitPulseStore.getState()

    expect(state.mood).toBe('playful')
    expect(state.tempo).toBe(getMoodDefaultBpm('playful'))
    expect(state.hasUserTempoOverride).toBe(false)
  })

  it('preserves user BPM when mood changes after a manual tempo override', () => {
    useGitPulseStore.getState().setTempo(142)
    useGitPulseStore.getState().setMood('ambient')

    const state = useGitPulseStore.getState()

    expect(state.mood).toBe('ambient')
    expect(state.tempo).toBe(142)
    expect(state.hasUserTempoOverride).toBe(true)
  })

  it('resets tempo to the current mood default and clears the override flag', () => {
    useGitPulseStore.getState().setTempo(150)
    useGitPulseStore.getState().setMood('lofi')
    useGitPulseStore.getState().resetTempoToMoodDefault()

    const state = useGitPulseStore.getState()

    expect(state.mood).toBe('lofi')
    expect(state.tempo).toBe(getMoodDefaultBpm('lofi'))
    expect(state.hasUserTempoOverride).toBe(false)
  })

  it('tracks and resets the active audio step', () => {
    useGitPulseStore.getState().setActiveAudioStep(12, '2026-04-29')

    expect(useGitPulseStore.getState()).toMatchObject({
      activeAudioStepIndex: 12,
      activeAudioDate: '2026-04-29',
      currentPlayheadStepIndex: 12,
      currentPlayheadDate: '2026-04-29',
    })

    useGitPulseStore.getState().resetActiveAudioStep()

    expect(useGitPulseStore.getState()).toMatchObject({
      activeAudioStepIndex: null,
      activeAudioDate: undefined,
    })
  })

  it('tracks selected start separately from the current playhead', () => {
    useGitPulseStore.getState().setSelectedStartAndPlayhead(4, '2026-05-04')
    useGitPulseStore.getState().setCurrentPlayheadStep(7, '2026-05-07')

    expect(useGitPulseStore.getState()).toMatchObject({
      selectedStartStepIndex: 4,
      selectedStartDate: '2026-05-04',
      currentPlayheadStepIndex: 7,
      currentPlayheadDate: '2026-05-07',
    })

    useGitPulseStore.getState().resetPlayheadToSelectedStart()

    expect(useGitPulseStore.getState()).toMatchObject({
      selectedStartStepIndex: 4,
      selectedStartDate: '2026-05-04',
      currentPlayheadStepIndex: 4,
      currentPlayheadDate: '2026-05-04',
    })
  })

  it('cues the playhead without changing the selected loop start', () => {
    useGitPulseStore.getState().setSelectedStartAndPlayhead(2, '2026-05-02')
    useGitPulseStore.setState({
      isAudioPlaying: true,
      activeAudioStepIndex: 4,
      activeAudioDate: '2026-05-04',
      audioError: 'Previous playback error',
    })

    useGitPulseStore.getState().cuePlayheadStep(6, '2026-05-06')

    expect(useGitPulseStore.getState()).toMatchObject({
      selectedStartStepIndex: 2,
      selectedStartDate: '2026-05-02',
      currentPlayheadStepIndex: 6,
      currentPlayheadDate: '2026-05-06',
      isAudioPlaying: false,
      activeAudioStepIndex: null,
      activeAudioDate: undefined,
      audioError: undefined,
    })
  })

  it('preserves the current playhead when playback is paused', () => {
    useGitPulseStore.getState().setSelectedStartAndPlayhead(2, '2026-05-02')
    useGitPulseStore.getState().setActiveAudioStep(5, '2026-05-05')
    useGitPulseStore.getState().setAudioPlaying(false)

    expect(useGitPulseStore.getState()).toMatchObject({
      isAudioPlaying: false,
      activeAudioStepIndex: null,
      selectedStartStepIndex: 2,
      currentPlayheadStepIndex: 5,
      currentPlayheadDate: '2026-05-05',
    })
  })

  it('updates and resets mood-specific sound mappings in memory', () => {
    expect(useGitPulseStore.getState().soundMappings.futuristic).toEqual(
      DEFAULT_FUTURISTIC_SOUND_MAPPING,
    )

    useGitPulseStore.getState().setSoundMapping('futuristic', 'intensity1', 'soft-kick')

    expect(useGitPulseStore.getState().soundMappings.futuristic).toMatchObject({
      intensity1: 'soft-kick',
      intensity2: DEFAULT_FUTURISTIC_SOUND_MAPPING.intensity2,
    })

    useGitPulseStore.getState().resetSoundMappingForMood('futuristic')

    expect(useGitPulseStore.getState().soundMappings.futuristic).toEqual(
      DEFAULT_FUTURISTIC_SOUND_MAPPING,
    )
  })

  it('stores an OAuth token as the preferred auth mode', () => {
    useGitPulseStore.getState().setGitHubToken('manual-token')
    useGitPulseStore.getState().setOAuthToken('oauth-token', {
      scope: 'read:user',
      tokenType: 'bearer',
    })

    const state = useGitPulseStore.getState()

    expect(state.authMode).toBe('oauth')
    expect(state.oauthStatus).toBe('connected')
    expect(state.oauthAccessToken).toBe('oauth-token')
    expect(state.githubToken).toBe('manual-token')
  })

  it('loads and clears OAuth sessions from sessionStorage', () => {
    useGitPulseStore.getState().setOAuthToken('oauth-token')
    useGitPulseStore.setState(initialStoreState, true)
    useGitPulseStore.getState().loadOAuthSessionFromStorage()

    expect(useGitPulseStore.getState()).toMatchObject({
      authMode: 'oauth',
      oauthAccessToken: 'oauth-token',
      oauthStatus: 'connected',
    })

    useGitPulseStore.getState().clearOAuthSession()

    expect(useGitPulseStore.getState()).toMatchObject({
      authMode: 'none',
      oauthAccessToken: undefined,
      oauthStatus: 'idle',
    })
  })

  it('falls back to manual token auth mode after OAuth disconnect when a token exists', () => {
    useGitPulseStore.getState().setGitHubToken('manual-token')
    useGitPulseStore.getState().setOAuthToken('oauth-token')
    useGitPulseStore.getState().clearOAuthSession()

    expect(useGitPulseStore.getState()).toMatchObject({
      authMode: 'manual-token',
      githubToken: 'manual-token',
      oauthAccessToken: undefined,
    })
  })
})
