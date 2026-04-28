import { Plus, X } from 'lucide-react'
import { useGitPulseStore } from '@/store/useGitPulseStore'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

export function AccountInputPanel() {
  const { draftUsername, identities, setDraftUsername, addIdentity, removeIdentity } = useGitPulseStore()

  return (
    <Card className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-medium">Merged identity mode</h2>
          <Badge>{identities.length} identities</Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Future stages will combine personal, work, and optional org-linked profiles into one normalized
          GitPulse dataset.
        </p>
      </div>
      <label className="space-y-2 text-sm" htmlFor="username-input">
        Primary GitHub username
        <div className="flex gap-2">
          <Input
            id="username-input"
            placeholder="e.g. octocat"
            value={draftUsername}
            onChange={(event) => setDraftUsername(event.target.value)}
          />
          <Button type="button" onClick={addIdentity}>
            <Plus className="h-4 w-4" aria-hidden /> Add account
          </Button>
        </div>
      </label>
      <ul className="space-y-2">
        {identities.map((identity) => (
          <li key={identity.id} className="flex items-center justify-between rounded-md border border-white/10 p-2 text-sm">
            <div>
              <p className="font-medium">@{identity.username}</p>
              <p className="text-xs capitalize text-muted-foreground">{identity.role ?? 'other'} account</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => removeIdentity(identity.id)} aria-label={`Remove ${identity.username}`}>
              <X className="h-4 w-4" aria-hidden />
            </Button>
          </li>
        ))}
      </ul>
    </Card>
  )
}
