import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'

export function VisualiserStage() {
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
      <div className="relative z-10 flex h-full flex-col justify-between">
        <p className="text-sm text-cyan-100">Visualiser engine placeholder</p>
        <div className="grid grid-cols-12 gap-2">
          {Array.from({ length: 24 }).map((_, index) => (
            <motion.span
              key={index}
              className="col-span-1 rounded-sm bg-cyan-200/70"
              animate={{ height: [8, 40 + (index % 6) * 10, 10] }}
              transition={{ duration: 1.8, repeat: Infinity, delay: index * 0.04 }}
            />
          ))}
        </div>
      </div>
    </Card>
  )
}
