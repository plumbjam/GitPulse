import { useEffect, useState } from 'react'
import { Loader2, RefreshCw, ShieldCheck, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useGitPulseStore } from '@/store/useGitPulseStore'

export function GitHubTokenPanel() {
  const {
    githubToken,
    dataset,
    isFetchingContributions,
    contributionFetchError,
    setGitHubToken,
    clearGitHubToken,
    refreshContributionCalendars,
  } = useGitPulseStore()
  const [draftToken, setDraftToken] = useState(githubToken)

  useEffect(() => {
    setDraftToken(githubToken)
  }, [githubToken])

  const contributionSource = dataset.contributionCalendar?.dataSource ?? 'approximate'
  const tokenIsConfigured = Boolean(githubToken)

  return (
    <Card className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-medium">Optional GitHub token</h2>
          <Badge className="border-white/10 bg-white/5 text-foreground">
            {tokenIsConfigured ? 'Session token active' : 'Approximate mode'}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Contribution calendar data uses GitHub GraphQL and requires a token. Your token is used
          only in this browser session to query GitHub.
        </p>
      </div>

      <label className="space-y-2 text-sm" htmlFor="github-token-input">
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
        {tokenIsConfigured ? (
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

      {contributionFetchError ? (
        <p
          className="rounded-md border border-amber-300/40 bg-amber-400/10 px-3 py-2 text-xs text-amber-100"
          role="alert"
        >
          {contributionFetchError}
        </p>
      ) : null}

      <div className="rounded-md border border-white/10 bg-white/5 p-3 text-xs text-muted-foreground">
        <p className="inline-flex items-center gap-2 text-cyan-100">
          <ShieldCheck className="h-4 w-4" aria-hidden /> Stored in memory only
        </p>
        <p className="mt-2">
          Current contribution source:{' '}
          <span className="capitalize text-foreground">{contributionSource}</span>. Without a token,
          GitPulse falls back to demo or approximate repo-push activity.
        </p>
        <p className="mt-2">
          Private contributions, if included by GitHub for your token and settings, are treated as
          anonymous count data only. GitPulse does not infer private repository names or details.
        </p>
      </div>
    </Card>
  )
}
