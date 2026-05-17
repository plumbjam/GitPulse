import gitPulseIconUrl from '@/assets/branding/GitPulse_Icon.png'
import { Card } from '@/components/ui/card'

export function HeroPanel() {
  return (
    <Card className="overflow-hidden border-cyan-300/15 bg-slate-950/50">
      <div className="flex items-start gap-5">
        <img
          src={gitPulseIconUrl}
          alt=""
          className="mt-0.5 h-14 w-14 shrink-0 rounded-xl border border-cyan-200/20 bg-cyan-300/10 object-contain p-2 shadow-[0_0_24px_rgba(34,211,238,0.2)]"
          aria-hidden
        />
        <div className="space-y-3">
          <h1 className="text-2xl font-semibold">Your GitHub activity has a sound.</h1>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
            Connect GitHub, merge identities, and turn your contribution history into a live audio
            signature.
          </p>
          <p className="text-xs text-cyan-200/90">
            Contribution calendar, media timeline, and playback controls are now the working core of
            GitPulse.
          </p>
        </div>
      </div>
    </Card>
  )
}
