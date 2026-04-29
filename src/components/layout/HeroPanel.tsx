import { Card } from '@/components/ui/card'

export function HeroPanel() {
  return (
    <Card className="space-y-3">
      <h1 className="text-2xl font-semibold">Your GitHub activity has a sound.</h1>
      <p className="max-w-3xl text-sm text-muted-foreground">
        Enter one or more public GitHub usernames, merge profile and repository signals, and preview
        the normalized GitPulse dataset and merged contribution grid that now feed a deterministic
        Tone.js audio loop and later visual stages.
      </p>
      <p className="text-xs text-cyan-200/90">
        Stage 3 adds safe click-to-play audio using the merged contribution calendar while keeping
        demo and approximate fallbacks intact.
      </p>
    </Card>
  )
}
