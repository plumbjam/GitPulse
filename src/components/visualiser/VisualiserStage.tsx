import { Card } from '@/components/ui/card'
import { VisualCanvas } from '@/visuals/VisualCanvas'

export function VisualiserStage() {
  return (
    <Card className="relative overflow-hidden border-violet-300/15 bg-slate-950/35 p-5">
      <div className="relative z-10 flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3 text-sm text-cyan-100">
          <div className="space-y-1">
            <p className="font-medium">Visual field</p>
            <p className="max-w-2xl text-xs leading-5 text-cyan-100/75 md:text-sm">
              Each scheduled sound creates a heartbeat spike. Readings scroll right to left and
              freeze when playback is paused.
            </p>
          </div>
        </div>

        <VisualCanvas />

        <p className="text-xs text-cyan-100/70 md:text-sm">
          Audio-reactive heartbeat · Readings scroll right to left
        </p>
      </div>
    </Card>
  )
}
