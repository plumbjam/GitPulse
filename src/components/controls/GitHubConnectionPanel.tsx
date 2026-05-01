import { useEffect, useState } from 'react'
import { KeyRound, Loader2, LogIn, RefreshCw, ShieldCheck, Unplug, X } from 'lucide-react'
import {
  buildGitHubAuthorizeUrl,
  getGitHubOAuthRuntimeConfig,
  hasGitHubOAuthConfig,
} from '@/auth/githubOAuth'
import { generateOAuthState } from '@/auth/oauthState'
import { useGitPulseStore } from '@/store/useGitPulseStore'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

export function GitHubConnectionPanel() {
  const {
    authMode,
    contributionFetchError,
    dataset,
    githubToken,
    isFetchingContributions,
    oauthError,
    oauthStatus,
    clearGitHubToken,
    clearOAuthSession,
    refreshContributionCalendars,
    setGitHubToken,
    setOAuthError,
    setOAuthStatus,
  } = useGitPulseStore()
  const [draftToken, setDraftToken] = useState(githubToken)
  const oauthConfig = getGitHubOAuthRuntimeConfig()
  const oauthIsConfigured = hasGitHubOAuthConfig(oauthConfig)
  const oauthIsConnected = authMode === 'oauth' && oauthStatus === 'connected'
  const manualTokenIsConfigured = Boolean(githubToken)
  const contributionSource = dataset.contributionCalendar?.dataSource ?? 'approximate'

  useEffect(() => {
    setDraftToken(githubToken)
  }, [githubToken])

  function handleStartOAuthLogin() {
    if (!oauthIsConfigured) {
      setOAuthError(
        'GitHub OAuth is not configured yet. Add the public client ID and broker URL, or use the advanced token fallback.',
      )
      return
    }

    try {
      const state = generateOAuthState()
      const authorizeUrl = buildGitHubAuthorizeUrl({
        clientId: oauthConfig.clientId,
        redirectUri: oauthConfig.redirectUri,
        scope: oauthConfig.scope,
        state,
      })

      setOAuthStatus('starting')
      globalThis.location.assign(authorizeUrl)
    } catch {
      setOAuthError('GitHub login could not start because secure browser storage is unavailable.')
    }
  }

  return (
    <Card className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-medium">Connect GitHub</h2>
          <Badge className="border-white/10 bg-white/5 text-foreground">
            {getConnectionLabel(authMode, oauthStatus)}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Use GitHub login to load your contribution calendar. GitPulse still works without login
          using demo or approximate activity.
        </p>
      </div>

      {oauthIsConnected ? (
        <div className="space-y-3">
          <div className="rounded-md border border-emerald-300/30 bg-emerald-400/10 p-3 text-xs text-emerald-100">
            <p className="inline-flex items-center gap-2 font-medium">
              <ShieldCheck className="h-4 w-4" aria-hidden />
              GitHub connected
            </p>
            <p className="mt-2">
              Contribution calendars can be refreshed from GitHub GraphQL for the current browser
              session.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              disabled={isFetchingContributions}
              onClick={() => void refreshContributionCalendars()}
            >
              {isFetchingContributions ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <RefreshCw className="h-4 w-4" aria-hidden />
              )}
              Refresh calendars
            </Button>
            <Button type="button" variant="outline" onClick={clearOAuthSession}>
              <Unplug className="h-4 w-4" aria-hidden />
              Disconnect
            </Button>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          disabled={oauthStatus === 'starting' || oauthStatus === 'exchanging'}
          onClick={handleStartOAuthLogin}
        >
          {oauthStatus === 'starting' || oauthStatus === 'exchanging' ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <LogIn className="h-4 w-4" aria-hidden />
          )}
          {oauthStatus === 'exchanging' ? 'Completing GitHub login...' : 'Log in with GitHub'}
        </Button>
      )}

      {oauthError ? (
        <p
          className="rounded-md border border-rose-300/40 bg-rose-400/10 px-3 py-2 text-xs text-rose-100"
          role="alert"
        >
          {oauthError}
        </p>
      ) : null}

      {contributionFetchError ? (
        <p
          className="rounded-md border border-amber-300/40 bg-amber-400/10 px-3 py-2 text-xs text-amber-100"
          role="alert"
        >
          {contributionFetchError}
        </p>
      ) : null}

      <details className="rounded-md border border-white/10 bg-white/5 p-3 text-xs text-muted-foreground">
        <summary className="cursor-pointer text-sm text-foreground">
          Advanced: use a token manually
        </summary>
        <div className="mt-3 space-y-3">
          <p>
            For development only. Tokens are used in this browser session and are not committed or
            logged. OAuth is preferred when connected.
          </p>
          <label className="space-y-2 text-sm text-foreground" htmlFor="github-token-input">
            Personal access token
            <Input
              id="github-token-input"
              type="password"
              autoComplete="off"
              spellCheck={false}
              placeholder="ghp_..."
              value={draftToken}
              onChange={(event) => setDraftToken(event.target.value)}
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              disabled={!draftToken.trim() && !githubToken}
              onClick={() => {
                const tokenToUse = draftToken.trim() || githubToken
                setGitHubToken(tokenToUse)
                void refreshContributionCalendars()
              }}
            >
              {isFetchingContributions ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <RefreshCw className="h-4 w-4" aria-hidden />
              )}
              Fetch calendar
            </Button>
            {manualTokenIsConfigured ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setDraftToken('')
                  clearGitHubToken()
                }}
              >
                <X className="h-4 w-4" aria-hidden /> Clear token
              </Button>
            ) : null}
          </div>
        </div>
      </details>

      <div className="rounded-md border border-white/10 bg-white/5 p-3 text-xs text-muted-foreground">
        <p className="inline-flex items-center gap-2 text-cyan-100">
          <KeyRound className="h-4 w-4" aria-hidden />
          OAuth session tokens use sessionStorage
        </p>
        <p className="mt-2">
          Current contribution source:{' '}
          <span className="capitalize text-foreground">{contributionSource}</span>. Without OAuth or
          a manual token, GitPulse falls back to demo or approximate repo-push activity.
        </p>
      </div>
    </Card>
  )
}

function getConnectionLabel(authMode: string, oauthStatus: string) {
  if (authMode === 'oauth' && oauthStatus === 'connected') {
    return 'GitHub connected'
  }

  if (authMode === 'manual-token') {
    return 'Manual token active'
  }

  if (oauthStatus === 'exchanging') {
    return 'Completing login'
  }

  return 'Approximate mode'
}
