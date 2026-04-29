import { motion } from 'framer-motion'
import { useGitPulseStore } from '@/store/useGitPulseStore'
import { Card } from '@/components/ui/card'

export function VisualiserStage() {
  const mood = useGitPulseStore((state) => state.mood)
  const dataset = useGitPulseStore((state) => state.dataset)

  const totalRepos = dataset.summary.totalRepos
  const barCount = clamp(totalRepos || 12, 8, 24)
  const activityScore = dataset.summary.activityScore
  const dominantLanguages = dataset.summary.dominantLanguages.slice(0, 3)
  const contributionCalendar = dataset.contributionCalendar

  return (
    <Card className="relative min-h-[320px] overflow-hidden p-6 md:min-h-[420px]">
      <div
        className="pointer-events-none absolute inset-0 bg-grid bg-[size:28px_28px] opacity-30"
        aria-hidden
      />
      <motion.div
        className="absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-cyan-300/60 via-purple-500/50 to-blue-500/60 blur-2xl"
        animate={{ scale: [1, 1.08, 1], opacity: [0.6, 0.9, 0.6] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        aria-hidden
      />
      <div className="relative z-10 flex h-full flex-col justify-between gap-6">
        <div className="flex flex-wrap items-start justify-between gap-3 text-sm text-cyan-100">
          <div>
            <p className="font-medium">Visualiser placeholder</p>
            <p className="text-xs text-cyan-100/80">
              Contribution calendar data now drives the Stage 3 audio loop while the full visual
              scene remains in a later pass.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs text-cyan-100/90 md:text-sm">
            <div className="rounded-md border border-white/10 bg-white/5 px-3 py-2">
              Repo nodes: {totalRepos}
            </div>
            <div className="rounded-md border border-white/10 bg-white/5 px-3 py-2 capitalize">
              Mood: {mood}
            </div>
            <div className="rounded-md border border-white/10 bg-white/5 px-3 py-2">
              Activity: {activityScore}
            </div>
            <div className="rounded-md border border-white/10 bg-white/5 px-3 py-2">
              {dominantLanguages.length ? dominantLanguages.join(' / ') : 'Awaiting languages'}
            </div>
            <div className="rounded-md border border-white/10 bg-white/5 px-3 py-2 capitalize">
              Audio source: {contributionCalendar ? 'contribution calendar' : 'activity fallback'}
            </div>
            <div className="rounded-md border border-white/10 bg-white/5 px-3 py-2">
              Timeline: {contributionCalendar?.dataSource ?? 'approximate'}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-2">
          {Array.from({ length: barCount }).map((_, index) => (
            <motion.span
              key={index}
              className="col-span-1 rounded-sm bg-cyan-200/70"
              animate={{
                height: [12, 32 + Math.round(activityScore / 3) + (index % 6) * 8, 16],
                opacity: [0.55, 0.95, 0.6],
              }}
              transition={{ duration: 1.8, repeat: Infinity, delay: index * 0.04 }}
            />
          ))}
        </div>
      </div>
    </Card>
  )
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}
