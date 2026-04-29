import { Loader2, Plus, Sparkles, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useGitPulseStore } from '@/store/useGitPulseStore'

export function AccountInputPanel() {
  const {
    draftUsername,
    dataset,
    isFetching,
    fetchError,
    setDraftUsername,
    fetchAndAddIdentity,
    removeIdentity,
    loadDemoDataset,
    clearDataset,
  } = useGitPulseStore()

  const identities = dataset.identities

  return (
    <Card className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-medium">Merged identity mode</h2>
          <Badge>{identities.length} identities</Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Stage 2 merges public GitHub profile, repository, and language data into one normalized
          GitPulse dataset. Demo mode stays available for fallback and UI previews.
        </p>
      </div>

      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault()
          void fetchAndAddIdentity(draftUsername)
        }}
      >
        <label className="space-y-2 text-sm" htmlFor="username-input">
          GitHub username
          <div className="flex gap-2">
            <Input
              id="username-input"
              placeholder="e.g. octocat"
              value={draftUsername}
              onChange={(event) => setDraftUsername(event.target.value)}
            />
            <Button type="submit">
              {isFetching ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Plus className="h-4 w-4" aria-hidden />
              )}
              Add account
            </Button>
          </div>
        </label>

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={loadDemoDataset}>
            <Sparkles className="h-4 w-4" aria-hidden /> Use demo data
          </Button>
          {identities.length > 0 ? (
            <Button type="button" variant="ghost" onClick={clearDataset}>
              Clear dataset
            </Button>
          ) : null}
        </div>
      </form>

      {fetchError ? (
        <p
          className="rounded-md border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-100"
          role="alert"
        >
          {fetchError}
        </p>
      ) : null}

      {identities.length === 0 ? (
        <div className="rounded-md border border-dashed border-white/10 p-3 text-sm text-muted-foreground">
          Add a public GitHub username or load the demo dataset to preview the Stage 2 pipeline.
        </div>
      ) : (
        <ul className="space-y-2">
          {identities.map((identity) => (
            <li
              key={identity.id}
              className="space-y-2 rounded-md border border-white/10 p-3 text-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">@{identity.username}</p>
                    <Badge className={getIdentityBadgeClassName(identity.status)}>
                      {getIdentityStatusLabel(identity.status)}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {identity.displayName ?? 'GitHub profile'} / {identity.role ?? 'other'} account
                  </p>
                  {identity.profileUrl ? (
                    <a
                      className="text-xs text-cyan-200 transition hover:text-cyan-100"
                      href={identity.profileUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View profile
                    </a>
                  ) : null}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeIdentity(identity.id)}
                  aria-label={`Remove ${identity.username}`}
                >
                  <X className="h-4 w-4" aria-hidden />
                </Button>
              </div>
              {identity.errorMessage ? (
                <p className="text-xs text-rose-100">{identity.errorMessage}</p>
              ) : null}
              {identity.warningMessage ? (
                <p className="text-xs text-amber-100">{identity.warningMessage}</p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

function getIdentityStatusLabel(status?: string) {
  switch (status) {
    case 'loading':
      return 'Loading'
    case 'success':
      return 'Ready'
    case 'error':
      return 'Error'
    default:
      return 'Idle'
  }
}

function getIdentityBadgeClassName(status?: string) {
  switch (status) {
    case 'loading':
      return 'border-cyan-300/40 bg-cyan-400/10 text-cyan-100'
    case 'success':
      return 'border-emerald-300/40 bg-emerald-400/10 text-emerald-100'
    case 'error':
      return 'border-rose-400/40 bg-rose-500/10 text-rose-100'
    default:
      return 'border-white/10 bg-white/5 text-foreground'
  }
}
