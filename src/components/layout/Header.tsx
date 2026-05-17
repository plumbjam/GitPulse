import { Github } from 'lucide-react'
import { GitPulseLogo } from '@/components/brand/GitPulseLogo'
import { Badge } from '@/components/ui/badge'

export function Header() {
  return (
    <header className="flex flex-col gap-4 rounded-xl border border-cyan-300/15 bg-slate-950/60 px-5 py-3 shadow-[0_0_40px_rgba(34,211,238,0.08)] backdrop-blur md:flex-row md:items-center md:justify-between md:px-5">
      <GitPulseLogo />
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <Badge>Stage 3 / Tone.js audio MVP</Badge>
        <span className="inline-flex items-center gap-1">
          <Github className="h-4 w-4" aria-hidden /> Open-source first
        </span>
      </div>
    </header>
  )
}
