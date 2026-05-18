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
          className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,211,238,0.05),transparent_0,transparent_58%),linear-gradient(180deg,rgba(1,6,18,0.98),rgba(2,8,23,0.98))]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 bg-grid bg-[size:36px_36px] opacity-[0.12]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.14]"
          style={{
            backgroundImage:
              'linear-gradient(180deg, transparent 0%, rgba(148,163,184,0.12) 49%, rgba(34,211,238,0.08) 50%, transparent 51%, transparent 100%)',
            backgroundSize: '100% 10px',
          }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_45%,rgba(2,6,23,0.26)_100%)]"
          aria-hidden
        />

        <div
          className="relative h-full w-full"
          role="img"
          aria-label="Live GitPulse idle signal visualizer"
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
