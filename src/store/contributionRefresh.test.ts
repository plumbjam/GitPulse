import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchGitHubIdentityDataset } from '@/github/githubClient'
import { fetchGitHubContributionCalendarQuery } from '@/github/githubGraphqlClient'
import {
  createFixtureGitHubIdentityAlice,
  createFixtureGitHubIdentityBob,
} from '@/github/githubFixtures'
import {
  contributionFixtureRange,
  fixtureGitHubContributionCalendarAlice,
  createFixtureContributionCalendarBob,
} from '@/github/githubContributionFixtures'
import { normaliseGitHubIdentityDataset } from '@/github/githubNormaliser'
import { mergeIdentityDatasets } from '@/github/githubMerge'
import { useGitPulseStore } from './useGitPulseStore'

vi.mock('@/github/githubGraphqlClient', () => ({ fetchGitHubContributionCalendarQuery: vi.fn() }))
vi.mock('@/github/githubClient', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/github/githubClient')>()),
  fetchGitHubIdentityDataset: vi.fn(),
}))

const initialState = useGitPulseStore.getInitialState()
const result = { payload: fixtureGitHubContributionCalendarAlice, range: contributionFixtureRange }
function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason: Error) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

describe('contribution request lifecycle', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    sessionStorage.clear()
    useGitPulseStore.setState(initialState, true)
    // Any unexpected request fails locally rather than contacting GitHub.
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Unexpected network request')))
    const alice = normaliseGitHubIdentityDataset(createFixtureGitHubIdentityAlice())
    useGitPulseStore.setState({
      identityDatasets: [alice],
      dataset: mergeIdentityDatasets([alice]),
    })
    useGitPulseStore.getState().setOAuthToken('test-oauth')
  })
  afterEach(() => vi.unstubAllGlobals())

  it.each(['oauth', 'manual'])('does not restore calendars after %s disconnect', async (mode) => {
    if (mode === 'manual') {
      useGitPulseStore.getState().clearOAuthSession()
      useGitPulseStore.getState().setGitHubToken('test-manual')
    }
    const pending = deferred<typeof result>()
    vi.mocked(fetchGitHubContributionCalendarQuery).mockReturnValueOnce(pending.promise)
    const refresh = useGitPulseStore.getState().refreshContributionCalendars()
    expect(useGitPulseStore.getState().isFetchingContributions).toBe(true)
    if (mode === 'oauth') useGitPulseStore.getState().clearOAuthSession()
    else useGitPulseStore.getState().clearGitHubToken()
    pending.resolve(result)
    await refresh
    const state = useGitPulseStore.getState()
    expect(state.isFetchingContributions).toBe(false)
    expect(state.identityDatasets[0].contributionCalendar).toBeUndefined()
    expect(state.dataset.contributionCalendar?.dataSource).toBe('approximate')
  })

  it('discards an old response even after reconnecting with the same token', async () => {
    const pending = deferred<typeof result>()
    vi.mocked(fetchGitHubContributionCalendarQuery).mockReturnValueOnce(pending.promise)
    const refresh = useGitPulseStore.getState().refreshContributionCalendars()
    useGitPulseStore.getState().clearOAuthSession()
    useGitPulseStore.getState().setOAuthToken('test-oauth')
    pending.resolve(result)
    await refresh
    expect(useGitPulseStore.getState().identityDatasets[0].contributionCalendar).toBeUndefined()
  })

  it('keeps the latest refresh when an older request fails afterward', async () => {
    const older = deferred<typeof result>()
    vi.mocked(fetchGitHubContributionCalendarQuery)
      .mockReturnValueOnce(older.promise)
      .mockResolvedValueOnce(result)
    const first = useGitPulseStore.getState().refreshContributionCalendars()
    await useGitPulseStore.getState().refreshContributionCalendars()
    older.reject(new Error('Old request failed'))
    await first
    const state = useGitPulseStore.getState()
    expect(state.identityDatasets[0].contributionCalendar?.totalContributions).toBe(8)
    expect(state.contributionFetchError).toBeUndefined()
    expect(state.isFetchingContributions).toBe(false)
  })

  it('does not clear the latest loading indicator when the older request completes first', async () => {
    const older = deferred<typeof result>()
    const newer = deferred<typeof result>()
    vi.mocked(fetchGitHubContributionCalendarQuery)
      .mockReturnValueOnce(older.promise)
      .mockReturnValueOnce(newer.promise)
    const first = useGitPulseStore.getState().refreshContributionCalendars()
    const second = useGitPulseStore.getState().refreshContributionCalendars()
    older.resolve(result)
    await first
    expect(useGitPulseStore.getState().isFetchingContributions).toBe(true)
    expect(useGitPulseStore.getState().identityDatasets[0].contributionCalendar).toBeUndefined()
    newer.resolve(result)
    await second
    expect(useGitPulseStore.getState().isFetchingContributions).toBe(false)
    expect(
      useGitPulseStore.getState().identityDatasets[0].contributionCalendar?.totalContributions,
    ).toBe(8)
  })

  it('preserves a calendar added for an identity outside the pending refresh', async () => {
    const pending = deferred<typeof result>()
    vi.mocked(fetchGitHubContributionCalendarQuery).mockReturnValueOnce(pending.promise)
    const refresh = useGitPulseStore.getState().refreshContributionCalendars()
    const bob = {
      ...normaliseGitHubIdentityDataset(createFixtureGitHubIdentityBob()),
      contributionCalendar: createFixtureContributionCalendarBob(),
    }
    useGitPulseStore.setState((state) => ({ identityDatasets: [...state.identityDatasets, bob] }))
    pending.resolve(result)
    await refresh
    expect(useGitPulseStore.getState().identityDatasets[1]).toBe(bob)
  })

  it('does not apply a refresh to an identity removed and added again', async () => {
    const pending = deferred<typeof result>()
    vi.mocked(fetchGitHubContributionCalendarQuery).mockReturnValueOnce(pending.promise)
    const refresh = useGitPulseStore.getState().refreshContributionCalendars()
    useGitPulseStore.getState().clearDataset()
    const replacement = normaliseGitHubIdentityDataset(createFixtureGitHubIdentityAlice())
    useGitPulseStore.setState({ identityDatasets: [replacement] })
    pending.resolve(result)
    await refresh
    expect(useGitPulseStore.getState().identityDatasets[0]).toBe(replacement)
  })

  it('keeps a public identity but drops its pending calendar after disconnect', async () => {
    useGitPulseStore.getState().clearDataset()
    vi.mocked(fetchGitHubIdentityDataset).mockResolvedValueOnce({
      status: 'success',
      username: 'alice',
      data: createFixtureGitHubIdentityAlice(),
    })
    const pending = deferred<typeof result>()
    vi.mocked(fetchGitHubContributionCalendarQuery).mockReturnValueOnce(pending.promise)
    const adding = useGitPulseStore.getState().fetchAndAddIdentity('alice')
    await vi.waitFor(() => expect(fetchGitHubContributionCalendarQuery).toHaveBeenCalled())
    useGitPulseStore.getState().clearOAuthSession()
    pending.resolve(result)
    await adding
    const state = useGitPulseStore.getState()
    expect(state.identityDatasets[0].identity.status).toBe('success')
    expect(state.identityDatasets[0].contributionCalendar).toBeUndefined()
    expect(state.isFetching).toBe(false)
  })
})
