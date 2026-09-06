import { render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useFrame, type RootState } from '@react-three/fiber'
import { Line2, LineGeometry, LineMaterial } from 'three-stdlib'
import { gitPulseAudioEngine } from '@/audio/audioEngine'
import { AudioVisualTimeline } from '@/audio/audioVisualTimeline'
let audioNow = 0
let timeline: AudioVisualTimeline
import { HeartbeatTrace } from './HeartbeatTrace'

const renderedLines: Line2[] = []
vi.mock('@react-three/fiber', () => ({ useFrame: vi.fn() }))
vi.mock('@react-three/drei', async () => {
  const React = await import('react')
  return {
    Line: React.forwardRef<Line2, { points: number[][]; opacity: number }>(
      function TestLine(props, ref) {
        const line = React.useMemo(() => {
          const geometry = new LineGeometry()
          geometry.setPositions(props.points.flat())
          const instance = new Line2(geometry, new LineMaterial({ opacity: props.opacity }))
          renderedLines.push(instance)
          return instance
        }, [props.points, props.opacity])
        React.useImperativeHandle(ref, () => line, [line])
        React.useEffect(
          () => () => {
            line.geometry.dispose()
            line.material.dispose()
          },
          [line],
        )
        return null
      },
    ),
  }
})

function frame(time: number, width = 10) {
  audioNow = time
  const callback = vi.mocked(useFrame).mock.calls.at(-1)![0]
  callback(
    { clock: { getElapsedTime: () => time }, viewport: { width, height: 4 } } as RootState,
    1 / 60,
  )
}

function peak(line: Line2) {
  const starts = line.geometry.getAttribute('instanceStart')
  let index = 0
  for (let i = 1; i < starts.count; i += 1) if (starts.getY(i) > starts.getY(index)) index = i
  return { x: starts.getX(index), y: starts.getY(index) }
}

describe('HeartbeatTrace frame rendering', () => {
  beforeEach(() => {
    renderedLines.length = 0
    vi.clearAllMocks()
    audioNow = 0
    timeline = new AudioVisualTimeline(() => audioNow)
    timeline.start()
    vi.spyOn(gitPulseAudioEngine, 'getVisualFrame').mockImplementation(() => timeline.getFrame())
  })
  afterEach(() => vi.restoreAllMocks())

  it('updates retained line geometry with a scrolling spike and a localized glow', () => {
    render(<HeartbeatTrace />)
    const [trace, , , head] = renderedLines
    const geometry = trace.geometry
    const buffer = trace.geometry.getAttribute('instanceStart')
    const opacity = trace.material.opacity
    timeline.schedule(0, 0.6)
    frame(0)
    frame(0.08)
    expect(head.material.opacity).toBeGreaterThan(0)
    for (let i = 6; i <= 30; i += 1) frame(i / 60)
    const first = peak(trace)
    for (let i = 31; i <= 60; i += 1) frame(i / 60)
    const second = peak(trace)
    expect(second.x).toBeLessThan(first.x)
    expect(second.y).toBeCloseTo(first.y, 5)
    expect(trace.geometry).toBe(geometry)
    expect(trace.geometry.getAttribute('instanceStart')).toBe(buffer)
    expect(trace.material.opacity).toBe(opacity)
    expect(head.material.opacity).toBe(0)
    const end = geometry.getAttribute('instanceEnd')
    expect(end.getY(end.count - 1)).toBe(0)
  })

  it('freezes the geometry during pause and continues from the same position on resume', () => {
    render(<HeartbeatTrace />)
    timeline.schedule(0, 0.6)
    frame(0)
    frame(0.1)
    timeline.pause()
    const before = peak(renderedLines[0])
    frame(20)
    expect(peak(renderedLines[0])).toEqual(before)
    timeline.start()
    frame(20.1)
    expect(peak(renderedLines[0]).x).toBeLessThan(before.x)
  })

  it('fits the writing point to a resized viewport and preserves history on reduced-motion changes', () => {
    const view = render(<HeartbeatTrace />)
    timeline.schedule(0, 0.6)
    frame(0)
    for (let i = 1; i <= 30; i += 1) frame(i / 60)
    const normal = peak(renderedLines[0])
    view.rerender(<HeartbeatTrace reducedMotion />)
    frame(0.5, 2)
    const reduced = peak(renderedLines[0])
    expect(renderedLines).toHaveLength(4)
    expect(reduced.y).toBeGreaterThan(0)
    expect(reduced.y).toBeLessThan(normal.y)
    const end = renderedLines[0].geometry.getAttribute('instanceEnd')
    expect(end.getX(end.count - 1)).toBeCloseTo(0.95)
    expect(renderedLines[3].material.opacity).toBe(0)
  })
})
