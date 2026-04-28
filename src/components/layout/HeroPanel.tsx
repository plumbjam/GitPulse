import { Card } from '@/components/ui/card'

export function HeroPanel() {
  return (
    <Card className="space-y-3">
      <h1 className="text-2xl font-semibold">Your GitHub activity has a sound.</h1>
      <p className="max-w-3xl text-sm text-muted-foreground">
        Enter one or more GitHub usernames, merge their activity, and generate a living audio-visual
        coding signature.
      </p>
      <p className="text-xs text-cyan-200/90">
        Stage 1 foundation preview: UI/typing/state are ready. Live GitHub fetch, audio engine, and
        visual engine ship in upcoming stages.
      </p>
    </Card>
  )
}
