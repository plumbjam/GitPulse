import { describe, expect, it } from 'vitest'
import { AudioVisualTimeline } from './audioVisualTimeline'

describe('audio visual timeline', () => {
  it('waits for scheduled sound time and retains closely spaced hits', () => {
    let now = 0
    const timeline = new AudioVisualTimeline(() => now)
    timeline.start()
    timeline.schedule(0.1, 0.6)
    timeline.schedule(0.15, 0.5)
    timeline.schedule(0.2, 0.7)
    now = 0.099
    expect(timeline.getFrame().readings).toEqual([])
    now = 0.2
    expect(timeline.getFrame().readings.map((hit) => hit.time)).toEqual([0.1, 0.15, 0.2])
    expect(timeline.getFrame().readings).toEqual([])
  })

  it('combines simultaneous voices into one spike', () => {
    let now = 0
    const timeline = new AudioVisualTimeline(() => now)
    timeline.schedule(0.1, 0.2)
    timeline.schedule(0.1, 0.8)
    now = 0.1
    expect(timeline.getFrame().readings).toHaveLength(1)
  })

  it('freezes at pause, cancels future hits and resumes without a clock jump', () => {
    let now = 0
    const timeline = new AudioVisualTimeline(() => now)
    timeline.start()
    timeline.schedule(0.2, 0.5)
    timeline.schedule(0.8, 0.5)
    now = 0.3
    timeline.getFrame()
    timeline.pause()
    now = 20
    expect(timeline.getFrame()).toEqual({ time: 0.3, paused: true, readings: [] })
    timeline.start()
    timeline.schedule(20.1, 0.6)
    now = 20.1
    const frame = timeline.getFrame()
    expect(frame.time).toBeCloseTo(0.4)
    expect(frame.readings).toHaveLength(1)
    expect(frame.readings[0].time).toBeCloseTo(0.4)
  })

  it('does not show muted notes, and Stop allows history to scroll out', () => {
    let now = 0
    const timeline = new AudioVisualTimeline(() => now)
    timeline.start()
    timeline.setMuted(true)
    timeline.schedule(0.1, 0.5)
    now = 0.2
    expect(timeline.getFrame().readings).toEqual([])
    timeline.pause()
    now = 1
    timeline.stop()
    now = 2
    expect(timeline.getFrame().time).toBeCloseTo(1.2)
  })
})
