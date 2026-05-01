import { useEffect, useRef } from 'react'
import {
  exchangeGitHubOAuthCode,
  getGitHubOAuthRuntimeConfig,
  hasGitHubOAuthConfig,
  parseGitHubOAuthCallback,
  removeGitHubOAuthCallbackParams,
} from '@/auth/githubOAuth'
import { clearOAuthState, validateOAuthState } from '@/auth/oauthState'
import { useAudioPattern } from '@/audio/useAudioPattern'
import { AccountInputPanel } from '@/components/controls/AccountInputPanel'
import { GitHubConnectionPanel } from '@/components/controls/GitHubConnectionPanel'
import { MoodSelector } from '@/components/controls/MoodSelector'
import { InsightPanel } from '@/components/insights/InsightPanel'
import { Header } from '@/components/layout/Header'
import { HeroPanel } from '@/components/layout/HeroPanel'
import { ContributionMediaBar } from '@/components/visualiser/ContributionMediaBar'
import { ContributionSignalGrid } from '@/components/visualiser/ContributionSignalGrid'
import { VisualiserStage } from '@/components/visualiser/VisualiserStage'
import { useGitPulseStore } from '@/store/useGitPulseStore'

export function AppShell() {
  const dataset = useGitPulseStore((state) => state.dataset)
  const mood = useGitPulseStore((state) => state.mood)
  const tempo = useGitPulseStore((state) => state.tempo)
  const isAudioPlaying = useGitPulseStore((state) => state.isAudioPlaying)
  const activeAudioDate = useGitPulseStore((state) => state.activeAudioDate)
  const loadOAuthSessionFromStorage = useGitPulseStore((state) => state.loadOAuthSessionFromStorage)
  const refreshContributionCalendars = useGitPulseStore(
    (state) => state.refreshContributionCalendars,
  )
  const setOAuthError = useGitPulseStore((state) => state.setOAuthError)
  const setOAuthStatus = useGitPulseStore((state) => state.setOAuthStatus)
  const setOAuthToken = useGitPulseStore((state) => state.setOAuthToken)
  const contributionCalendar = dataset.contributionCalendar
  const audioPattern = useAudioPattern(dataset, mood, tempo)
  const hasProcessedOAuthCallback = useRef(false)

  useEffect(() => {
    loadOAuthSessionFromStorage()
  }, [loadOAuthSessionFromStorage])

  useEffect(() => {
    if (hasProcessedOAuthCallback.current) {
      return
    }

    const callback = parseGitHubOAuthCallback(globalThis.location.search)

    if (callback.type === 'none') {
      return
    }

    hasProcessedOAuthCallback.current = true

    if (callback.type === 'error') {
      clearOAuthState()
      setOAuthError(
        callback.errorDescription || 'GitHub login was cancelled or could not be completed.',
      )
      const nextPath = removeGitHubOAuthCallbackParams(globalThis.location.href)
      globalThis.history.replaceState({}, document.title, nextPath)
      return
    }

    const successCallback = callback

    async function completeOAuthCallback() {
      try {
        setOAuthStatus('exchanging')

        if (!validateOAuthState(successCallback.state)) {
          setOAuthError('GitHub login could not be verified. Please try again.')
          return
        }

        const oauthConfig = getGitHubOAuthRuntimeConfig()

        if (!hasGitHubOAuthConfig(oauthConfig)) {
          setOAuthError('GitHub OAuth is not configured for this deployment.')
          return
        }

        const session = await exchangeGitHubOAuthCode({
          brokerUrl: oauthConfig.brokerUrl,
          code: successCallback.code,
          redirectUri: oauthConfig.redirectUri,
        })

        setOAuthToken(session.accessToken, {
          scope: session.scope,
          tokenType: session.tokenType,
        })
        await refreshContributionCalendars()
      } catch {
        setOAuthError('GitHub login could not be completed. Please try again.')
      } finally {
        const nextPath = removeGitHubOAuthCallbackParams(globalThis.location.href)
        globalThis.history.replaceState({}, document.title, nextPath)
      }
    }

    void completeOAuthCallback()
  }, [refreshContributionCalendars, setOAuthError, setOAuthStatus, setOAuthToken])

  return (
    <main className="mx-auto max-w-7xl space-y-4 px-4 py-8 text-foreground md:px-6">
      <Header />
      <HeroPanel />
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[340px_minmax(0,1fr)]">
        <div className="space-y-4">
          <AccountInputPanel />
          <GitHubConnectionPanel />
          <MoodSelector />
        </div>
        <div className="space-y-4">
          <VisualiserStage />
          <ContributionSignalGrid
            activeDate={isAudioPlaying ? activeAudioDate : undefined}
            calendar={contributionCalendar}
            mediaBar={<ContributionMediaBar pattern={audioPattern} />}
          />
          <InsightPanel />
        </div>
      </section>
    </main>
  )
}
