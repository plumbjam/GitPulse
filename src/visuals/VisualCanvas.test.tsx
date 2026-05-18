import type { ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { VisualCanvas } from './VisualCanvas'
import { WebGLFallback } from './WebGLFallback'

vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children: ReactNode }) => <div data-testid="r3f-canvas">{children}</div>,
}))

vi.mock('./VisualScene', () => ({
  VisualScene: () => <div data-testid="visual-scene" />,
}))

describe('VisualCanvas', () => {
  const originalGetContext = HTMLCanvasElement.prototype.getContext

  beforeEach(() => {
    HTMLCanvasElement.prototype.getContext = (() =>
      ({}) as WebGLRenderingContext) as unknown as HTMLCanvasElement['getContext']
  })

  afterEach(() => {
    HTMLCanvasElement.prototype.getContext = originalGetContext
  })

  it('renders an accessible visual field canvas wrapper', async () => {
    render(<VisualCanvas />)

    expect(
      await screen.findByRole('img', {
        name: /Live GitPulse audio-reactive heartbeat visualizer/i,
      }),
    ).toBeInTheDocument()
    expect(screen.getByTestId('visual-field-canvas')).toBeInTheDocument()
    expect(screen.getByTestId('r3f-canvas')).toBeInTheDocument()
  })

  it('renders the static fallback copy', () => {
    render(<WebGLFallback />)

    expect(screen.getByText('Visual field unavailable')).toBeInTheDocument()
    expect(
      screen.getByText(/Your browser could not start the live visual scene/i),
    ).toBeInTheDocument()
  })
})
