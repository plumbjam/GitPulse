import { AudioLines } from 'lucide-react'

export function GitPulseLogo() {
  return (
    <div className="flex items-center gap-3">
      <div className="rounded-lg border border-cyan-300/40 bg-cyan-300/10 p-2">
        <AudioLines className="h-5 w-5 text-cyan-200" aria-hidden />
      </div>
      <div>
        <p className="text-lg font-semibold tracking-wide">GitPulse</p>
        <p className="text-xs text-muted-foreground">Turn GitHub activity into sound.</p>
      </div>
    </div>
  )
}
