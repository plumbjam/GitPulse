import { Activity, Waves } from 'lucide-react'

export function WebGLFallback() {
  return (
    <div
      className="relative flex h-full min-h-[360px] flex-col justify-between overflow-hidden rounded-[1.15rem] border border-cyan-300/15 bg-slate-950/80 p-5 shadow-[inset_0_0_60px_rgba(34,211,238,0.08)]"
      role="img"
      aria-label="Static GitPulse heartbeat fallback"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-grid bg-[size:34px_34px] opacity-[0.14]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            'linear-gradient(180deg, transparent 0%, rgba(103,232,249,0.08) 49%, transparent 51%, transparent 100%)',
          backgroundSize: '100% 8px',
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute left-[-5%] top-[22%] h-32 w-40 rounded-full bg-cyan-400/20 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute right-[-3%] top-[12%] h-36 w-44 rounded-full bg-fuchsia-400/15 blur-3xl"
        aria-hidden
      />

      <div className="relative z-10 flex items-center justify-between gap-4 text-cyan-100/80">
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-slate-900/65 px-3 py-1 text-[11px] uppercase tracking-[0.28em]">
          <Activity className="h-3.5 w-3.5" aria-hidden />
          Static fallback
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-fuchsia-300/15 bg-slate-900/50 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-cyan-100/65">
          <Waves className="h-3.5 w-3.5" aria-hidden />
          Audio still active
        </div>
      </div>

      <div className="relative z-10 my-6">
        <svg viewBox="0 0 720 240" className="h-44 w-full" aria-hidden preserveAspectRatio="none">
          <defs>
            <linearGradient id="heartbeatFallbackStroke" x1="0%" x2="100%" y1="0%" y2="0%">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.15" />
              <stop offset="45%" stopColor="#67e8f9" stopOpacity="0.95" />
              <stop offset="75%" stopColor="#f8fdff" stopOpacity="1" />
              <stop offset="100%" stopColor="#e879f9" stopOpacity="0.5" />
            </linearGradient>
            <filter id="heartbeatFallbackGlow" x="-20%" y="-120%" width="140%" height="340%">
              <feGaussianBlur stdDeviation="7" result="glow" />
              <feMerge>
                <feMergeNode in="glow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <path
            d="M0 124 L118 124 L166 124 L208 138 L230 102 L256 124 L290 124 L326 124 L358 56 L384 196 L414 24 L442 150 L474 124 L534 124 L602 124 L646 110 L684 132 L720 124"
            fill="none"
            stroke="url(#heartbeatFallbackStroke)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#heartbeatFallbackGlow)"
          />
        </svg>
      </div>

      <div className="relative z-10 space-y-3">
        <div>
          <p className="text-sm font-medium text-cyan-50">Visual field unavailable</p>
          <p className="max-w-2xl text-sm leading-6 text-cyan-100/72">
            Your browser could not start the live visual scene, but GitPulse audio remains
            available.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-cyan-100/70">
          <span className="rounded-full border border-cyan-300/15 bg-slate-900/65 px-3 py-1.5">
            Heartbeat shell preserved
          </span>
          <span className="rounded-full border border-fuchsia-300/15 bg-slate-900/55 px-3 py-1.5">
            Medium-height visual card
          </span>
          <span className="rounded-full border border-white/10 bg-slate-900/45 px-3 py-1.5">
            Audio transport untouched
          </span>
        </div>
      </div>
    </div>
  )
}
