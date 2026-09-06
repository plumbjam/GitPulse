import { describe, expect, it } from 'vitest'
import {
  HEARTBEAT_MONITOR_TUNING as tuning,
  advanceHeartbeatMonitor,
  createHeartbeatMonitor,
  sampleHeartbeatHistory,
  sampleHeartbeatPulse,
  writeHeartbeatTrace,
} from './heartbeatSignal'

const quiet: { time: number; amplitude: number }[] = []
const attack = [{ time: 0, amplitude: 0.8 }]
type Monitor = ReturnType<typeof createHeartbeatMonitor>

function runUntil(monitor: Monitor, end: number, audio = quiet, fps = 60) {
  const first = Math.round((monitor.lastTime ?? -1 / fps) * fps) + 1
  for (let frame = first; frame <= Math.round(end * fps); frame += 1) {
    advanceHeartbeatMonitor(monitor, frame / fps, audio)
  }
}

function trace(monitor: Monitor, time: number, width = 10, reducedMotion = false) {
  const positions = new Float32Array(721 * 3)
  writeHeartbeatTrace(monitor, time, positions, width, 4, reducedMotion)
  return Array.from({ length: 721 }, (_, i) => ({ x: positions[i * 3], y: positions[i * 3 + 1] }))
}

function peak(points: ReturnType<typeof trace>) {
  return points.reduce((best, point) => (point.y > best.y ? point : best))
}

describe('heartbeat monitor', () => {
  it('draws a finite dip, peak, recovery and exact return to baseline', () => {
    expect(sampleHeartbeatPulse(-0.1, 1)).toBe(0)
    expect(sampleHeartbeatPulse(0, 1)).toBe(1)
    expect(sampleHeartbeatPulse(0.03, 1)).toBeLessThan(0)
    expect(sampleHeartbeatPulse(0, 0.8)).toBeCloseTo(0.8)
    expect(sampleHeartbeatPulse(0.028, 1)).toBeLessThan(0)
    expect(sampleHeartbeatPulse(tuning.PULSE_SECONDS, 1)).toBe(0)
    expect(sampleHeartbeatPulse(1, 1)).toBe(0)
  })

  it('keeps silence on an exact stationary baseline', () => {
    const monitor = createHeartbeatMonitor()
    runUntil(monitor, 5)
    expect(monitor.readingCount).toBe(0)
    expect(trace(monitor, 5).every((point) => point.y === 0)).toBe(true)
  })

  it('creates one reading for sustained audio and returns the writing end to baseline', () => {
    const monitor = createHeartbeatMonitor()
    advanceHeartbeatMonitor(monitor, 0, attack)
    runUntil(monitor, 2)
    expect(monitor.readingCount).toBe(1)
    expect(sampleHeartbeatHistory(monitor, 2)).toBe(0)
    expect(peak(trace(monitor, 2)).y).toBeGreaterThan(0.5)
  })

  it('moves the same spike left without changing its recorded shape', () => {
    const monitor = createHeartbeatMonitor()
    advanceHeartbeatMonitor(monitor, 0, attack)
    runUntil(monitor, 0.5)
    const first = trace(monitor, 0.5)
    const recorded = [0.03, 0.08, 0.12, 0.2].map((time) => sampleHeartbeatHistory(monitor, time))
    runUntil(monitor, 1)
    const second = trace(monitor, 1)
    expect(peak(second).x).toBeLessThan(peak(first).x)
    expect(peak(first).x - peak(second).x).toBeCloseTo((9.5 * 0.5) / 4, 2)
    expect(peak(second).y).toBeCloseTo(peak(first).y, 5)
    expect([0.03, 0.08, 0.12, 0.2].map((time) => sampleHeartbeatHistory(monitor, time))).toEqual(
      recorded,
    )
  })

  it('records separate attacks without changing earlier readings', () => {
    const monitor = createHeartbeatMonitor()
    advanceHeartbeatMonitor(monitor, 0, attack)
    runUntil(monitor, 0.4)
    const original = sampleHeartbeatHistory(monitor, 0)
    advanceHeartbeatMonitor(monitor, 0.5, [{ time: 0.5, amplitude: 1.2 }])
    runUntil(monitor, 0.9)
    advanceHeartbeatMonitor(monitor, 1, [{ time: 1, amplitude: 0.8 }])
    runUntil(monitor, 1.4)
    expect(monitor.readingCount).toBe(3)
    expect(sampleHeartbeatHistory(monitor, 0)).toBe(original)
    expect(sampleHeartbeatHistory(monitor, 0.5)).toBeGreaterThan(original)
    expect(sampleHeartbeatHistory(monitor, 0.35)).toBe(0)
    expect(sampleHeartbeatHistory(monitor, 0.85)).toBe(0)
  })

  it('records every rapid scheduled hit without an onset cooldown', () => {
    const monitor = createHeartbeatMonitor()
    advanceHeartbeatMonitor(monitor, 0, [])
    advanceHeartbeatMonitor(monitor, 0.2, [
      { time: 0.05, amplitude: 0.8 },
      { time: 0.1, amplitude: 1 },
      { time: 0.15, amplitude: 0.7 },
    ])
    expect(monitor.readingCount).toBe(3)
    for (const time of [0.05, 0.1, 0.15])
      expect(sampleHeartbeatHistory(monitor, time)).toBeGreaterThan(0.6)
  })

  it('freezes the entire trace when visual time is paused', () => {
    const monitor = createHeartbeatMonitor()
    advanceHeartbeatMonitor(monitor, 0, attack)
    runUntil(monitor, 0.1)
    const before = trace(monitor, 0.1)
    for (let frame = 0; frame < 120; frame += 1) advanceHeartbeatMonitor(monitor, 0.1)
    expect(trace(monitor, 0.1)).toEqual(before)
    runUntil(monitor, 0.2)
    expect(peak(trace(monitor, 0.2)).x).toBeLessThan(peak(before).x)
  })

  it('scrolls recorded readings offscreen after audio stops', () => {
    const monitor = createHeartbeatMonitor()
    advanceHeartbeatMonitor(monitor, 0, attack)
    runUntil(monitor, 4.5)
    expect(monitor.readingCount).toBe(1)
    expect(trace(monitor, 4.5).every((point) => point.y === 0)).toBe(true)
  })

  it('keeps bounded storage and does not wrap expired readings into view', () => {
    const monitor = createHeartbeatMonitor()
    const history = monitor.history
    advanceHeartbeatMonitor(monitor, 0, attack)
    runUntil(monitor, 12)
    expect(monitor.history).toBe(history)
    expect(monitor.history.length).toBe(722)
    expect(sampleHeartbeatHistory(monitor, 0.08)).toBe(0)
    expect(trace(monitor, 12, 10, true).every((point) => point.y === 0)).toBe(true)
  })

  it('has the same recorded timing and scroll position at different frame rates', () => {
    const results = [30, 60, 120].map((fps) => {
      const monitor = createHeartbeatMonitor()
      for (let frame = 0; frame <= fps; frame += 1) {
        const time = frame / fps
        const events = time === 0 || time === 0.5 ? [{ time, amplitude: 0.8 }] : []
        advanceHeartbeatMonitor(monitor, time, events)
      }
      expect(monitor.readingCount).toBe(2)
      return trace(monitor, 1)
    })
    expect(results[1]).toEqual(results[0])
    expect(results[2]).toEqual(results[0])
  })

  it('keeps the writing point within narrow and wide viewports without losing history', () => {
    const monitor = createHeartbeatMonitor()
    advanceHeartbeatMonitor(monitor, 0, attack)
    runUntil(monitor, 0.1)
    const narrow = trace(monitor, 0.1, 2)
    const wide = trace(monitor, 0.1, 12)
    expect(narrow[0].x).toBeCloseTo(-0.95)
    expect(narrow.at(-1)?.x).toBeCloseTo(0.95)
    expect(wide.at(-1)?.x).toBeCloseTo(5.7)
    expect(narrow.map((point) => point.y)).toEqual(wide.map((point) => point.y))
    expect(peak(narrow).x).toBeGreaterThan(0.8)
  })

  it('uses softer readings and a longer window for reduced motion', () => {
    const monitor = createHeartbeatMonitor()
    advanceHeartbeatMonitor(monitor, 0, attack)
    runUntil(monitor, 1)
    const normal = peak(trace(monitor, 1))
    const reduced = peak(trace(monitor, 1, 10, true))
    expect(reduced.y).toBeLessThan(normal.y * 0.6)
    expect(reduced.x).toBeGreaterThan(normal.x)
    expect(monitor.readingCount).toBe(1)
  })

  it('bounds amplitude to the visible height', () => {
    const monitor = createHeartbeatMonitor()
    advanceHeartbeatMonitor(monitor, 0, [{ time: 0, amplitude: 1.28 }])
    runUntil(monitor, 0.2)
    const positions = new Float32Array(721 * 3)
    writeHeartbeatTrace(monitor, 0.2, positions, 2, 1)
    for (let index = 1; index < positions.length; index += 3) {
      expect(Math.abs(positions[index])).toBeLessThanOrEqual(0.38)
    }
  })

  it('resets history on a clock restart and ignores invalid samples', () => {
    const monitor = createHeartbeatMonitor()
    advanceHeartbeatMonitor(monitor, 1, attack)
    advanceHeartbeatMonitor(monitor, 0, quiet)
    expect(monitor.readingCount).toBe(0)
    advanceHeartbeatMonitor(monitor, 0.1, [{ time: NaN, amplitude: Infinity }])
    expect(monitor.history.every(Number.isFinite)).toBe(true)
    expect(monitor.readingCount).toBe(0)
  })
})
