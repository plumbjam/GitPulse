import React, { type ReactNode, Suspense, useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { cn } from '@/lib-utils'
import { useReducedMotion } from './useReducedMotion'
import { VisualScene } from './VisualScene'
import { visualTheme } from './visualTheme'
import { WebGLFallback } from './WebGLFallback'

type VisualCanvasProps = {
  className?: string
}

export function VisualCanvas({ className }: VisualCanvasProps) {
  const prefersReducedMotion = useReducedMotion()
  const [hasWebGLSupport, setHasWebGLSupport] = useState(true)

  useEffect(() => {
    setHasWebGLSupport(checkWebGLSupport())
  }, [])

  if (!hasWebGLSupport) {
    return <WebGLFallback />
  }

  return (
    <VisualCanvasErrorBoundary fallback={<WebGLFallback />}>
      <div
        className={cn(
          'relative overflow-hidden rounded-[1.15rem] border border-cyan-300/15 bg-slate-950/80 shadow-[inset_0_0_60px_rgba(34,211,238,0.08)]',
          className,
        )}
        style={{ height: visualTheme.canvasHeight }}
      >
        <div
          className="absolute inset-0 bg-[radial-gradient(circle_at_20%_42%,rgba(34,211,238,0.18),transparent_0,transparent_28%),radial-gradient(circle_at_80%_36%,rgba(232,121,249,0.12),transparent_0,transparent_24%),linear-gradient(180deg,rgba(2,8,23,0.94),rgba(3,7,18,0.98))]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 bg-grid bg-[size:34px_34px] opacity-[0.16]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              'linear-gradient(180deg, transparent 0%, rgba(148,163,184,0.15) 49%, rgba(34,211,238,0.14) 50%, transparent 51%, transparent 100%)',
            backgroundSize: '100% 8px',
          }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/40 to-transparent"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute bottom-4 left-4 z-10 rounded-full border border-cyan-300/15 bg-slate-950/65 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-cyan-100/72"
          aria-hidden
        >
          Procedural heartbeat shell
        </div>
        <div
          className="pointer-events-none absolute right-4 top-4 z-10 rounded-full border border-fuchsia-300/15 bg-slate-950/60 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-cyan-100/60"
          aria-hidden
        >
          {prefersReducedMotion ? 'Reduced motion' : 'Idle monitor drift'}
        </div>

        <div
          className="relative h-full w-full"
          role="img"
          aria-label="Live GitPulse heartbeat waveform visualizer"
          data-testid="visual-field-canvas"
        >
          <Canvas
            orthographic
            dpr={[1, 1.5]}
            camera={{ position: [0, 0, 10], zoom: 94 }}
            gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
            onCreated={({ gl }) => {
              gl.setClearColor(visualTheme.palette.base, 0)
            }}
            fallback={<WebGLFallback />}
          >
            <Suspense fallback={null}>
              <VisualScene reducedMotion={prefersReducedMotion} />
            </Suspense>
          </Canvas>
        </div>
      </div>
    </VisualCanvasErrorBoundary>
  )
}

function checkWebGLSupport() {
  if (typeof document === 'undefined') {
    return true
  }

  try {
    const canvas = document.createElement('canvas')

    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'))
  } catch {
    return false
  }
}

type VisualCanvasErrorBoundaryProps = {
  children: ReactNode
  fallback: ReactNode
}

type VisualCanvasErrorBoundaryState = {
  hasError: boolean
}

class VisualCanvasErrorBoundary extends React.Component<
  VisualCanvasErrorBoundaryProps,
  VisualCanvasErrorBoundaryState
> {
  override state: VisualCanvasErrorBoundaryState = {
    hasError: false,
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  override componentDidCatch() {
    this.setState({ hasError: true })
  }

  override render() {
    if (this.state.hasError) {
      return this.props.fallback
    }

    return this.props.children
  }
}
