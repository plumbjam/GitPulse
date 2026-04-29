import { Github } from 'lucide-react'
import { GitPulseLogo } from '@/components/brand/GitPulseLogo'
import { Badge } from '@/components/ui/badge'

export function Header() {
  return (
    <header className="flex flex-col gap-4 rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur md:flex-row md:items-center md:justify-between">
      <GitPulseLogo />
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <Badge>Stage 2 / Public GitHub data</Badge>
        <span className="inline-flex items-center gap-1">
          <Github className="h-4 w-4" aria-hidden /> Open-source first
        </span>
      </div>
    </header>
  )
}
