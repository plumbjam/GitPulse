import { useGitPulseStore } from '@/store/useGitPulseStore'
import { Card } from '@/components/ui/card'
import { VisualCanvas } from '@/visuals/VisualCanvas'

export function VisualiserStage() {
  const mood = useGitPulseStore((state) => state.mood)
  const contributionCalendar = useGitPulseStore((state) => state.dataset.contributionCalendar)

  return (
    <Card className="relative overflow-hidden border-violet-300/15 bg-slate-950/35 p-5">
      <div className="relative z-10 flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3 text-sm text-cyan-100">
          <div className="space-y-1">
            <p className="font-medium">Visual field</p>
            <p className="max-w-2xl text-xs leading-5 text-cyan-100/75 md:text-sm">
              A living GitPulse signal field. Stage 4 begins with a heartbeat-style visual shell;
              later stages will bind it to the real audio output.
            </p>
          </div>
        </div>

        <VisualCanvas />

        <div className="flex flex-wrap gap-2 text-xs text-cyan-100/82">
          <span className="rounded-full border border-cyan-300/15 bg-slate-900/60 px-3 py-1.5">
            Trace: procedural idle
          </span>
          <span className="rounded-full border border-fuchsia-300/15 bg-slate-900/55 px-3 py-1.5">
            Motion: right-to-left
          </span>
          <span className="rounded-full border border-white/10 bg-slate-900/45 px-3 py-1.5 capitalize">
            Mood shell: {mood}
          </span>
          <span className="rounded-full border border-white/10 bg-slate-900/45 px-3 py-1.5">
            Audio bind: Stage 4.2
          </span>
          <span className="rounded-full border border-white/10 bg-slate-900/45 px-3 py-1.5">
            Timeline source: {contributionCalendar?.dataSource ?? 'approximate'}
          </span>
        </div>
      </div>
    </Card>
  )
}
