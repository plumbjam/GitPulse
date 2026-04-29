import { Card } from '@/components/ui/card'

export function HeroPanel() {
  return (
    <Card className="space-y-3">
      <h1 className="text-2xl font-semibold">Your GitHub activity has a sound.</h1>
      <p className="max-w-3xl text-sm text-muted-foreground">
        Enter one or more public GitHub usernames, merge profile and repository signals, and preview
        the normalized GitPulse dataset that later stages will map into audio and visuals.
      </p>
      <p className="text-xs text-cyan-200/90">
        Stage 2 is live for public GitHub REST data. Audio playback and the full visual engine ship
        in upcoming stages.
      </p>
    </Card>
  )
}
