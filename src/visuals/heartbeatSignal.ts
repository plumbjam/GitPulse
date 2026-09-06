import type { AudioVisualReading } from '@/audio/audioVisualTimeline'

export const HEARTBEAT_MONITOR_TUNING = {
  HISTORY_SECONDS: 4,
  REDUCED_HISTORY_SECONDS: 6,
  SAMPLE_RATE: 120,
  PULSE_SECONDS: 0.14,
  MAX_AMPLITUDE: 1.28,
  REDUCED_AMPLITUDE: 0.52,
} as const

export type HeartbeatMonitor = {
  history: Float32Array
  lastSampleTick: number
  lastTime: number | undefined
  readings: AudioVisualReading[]
  readingCount: number
}

export function createHeartbeatMonitor(): HeartbeatMonitor {
  return {
    history: new Float32Array(
      HEARTBEAT_MONITOR_TUNING.REDUCED_HISTORY_SECONDS * HEARTBEAT_MONITOR_TUNING.SAMPLE_RATE + 2,
    ),
    lastSampleTick: -1,
    lastTime: undefined,
    readings: [],
    readingCount: 0,
  }
}

// The attack is visible immediately at its scheduled time; recovery yields to the next hit.
const PULSE_POINTS = [
  [0, 1],
  [0.028, -0.28],
  [0.075, 0.08],
  [HEARTBEAT_MONITOR_TUNING.PULSE_SECONDS, 0],
] as const

export function sampleHeartbeatPulse(age: number, amplitude: number) {
  if (age < 0 || age >= HEARTBEAT_MONITOR_TUNING.PULSE_SECONDS) return 0
  for (let index = 1; index < PULSE_POINTS.length; index += 1) {
    const [end, endValue] = PULSE_POINTS[index]
    if (age <= end) {
      const [start, startValue] = PULSE_POINTS[index - 1]
      return (startValue + (endValue - startValue) * ((age - start) / (end - start))) * amplitude
    }
  }
  return 0
}

/** Record timestamped audio attacks at a fixed rate, independent of rendering FPS. */
export function advanceHeartbeatMonitor(
  monitor: HeartbeatMonitor,
  time: number,
  readings: AudioVisualReading[] = [],
) {
  if (!Number.isFinite(time) || time < 0) return
  if (monitor.lastTime !== undefined && time < monitor.lastTime) {
    Object.assign(monitor, createHeartbeatMonitor())
  }
  const valid = readings.filter(
    (reading) =>
      Number.isFinite(reading.time) && Number.isFinite(reading.amplitude) && reading.time <= time,
  )
  monitor.readings.push(...valid)
  monitor.readings.sort((left, right) => left.time - right.time)
  monitor.readingCount += valid.length
  if (time === monitor.lastTime && !valid.length) return
  const tuning = HEARTBEAT_MONITOR_TUNING
  const endTick = Math.floor(time * tuning.SAMPLE_RATE)
  const startTick = Math.max(monitor.lastSampleTick + 1, endTick - monitor.history.length + 1)
  for (let tick = startTick; tick <= endTick; tick += 1) {
    monitor.history[tick % monitor.history.length] = sampleReadings(
      monitor.readings,
      tick / tuning.SAMPLE_RATE,
    )
  }
  monitor.lastSampleTick = endTick
  monitor.lastTime = time
  monitor.readings = monitor.readings.filter(
    (reading) => reading.time + tuning.PULSE_SECONDS >= time,
  )
}

function sampleReadings(readings: AudioVisualReading[], time: number) {
  for (let index = readings.length - 1; index >= 0; index -= 1) {
    const reading = readings[index]
    if (reading.time <= time) return sampleHeartbeatPulse(time - reading.time, reading.amplitude)
  }
  return 0
}

/** Read recorded samples without changing them. Only their screen position moves. */
export function sampleHeartbeatHistory(monitor: HeartbeatMonitor, time: number) {
  if (time < 0 || monitor.lastTime === undefined || time > monitor.lastTime) return 0
  const position = time * HEARTBEAT_MONITOR_TUNING.SAMPLE_RATE
  const tick = Math.floor(position)
  if (tick <= monitor.lastSampleTick - monitor.history.length) return 0
  if (tick >= monitor.lastSampleTick) {
    return sampleReadings(monitor.readings, time)
  }
  const left = monitor.history[tick % monitor.history.length]
  const right = monitor.history[(tick + 1) % monitor.history.length]
  return left + (right - left) * (position - tick)
}

/** Fill a reusable XYZ buffer, oldest at the left and the writing point at the right. */
export function writeHeartbeatTrace(
  monitor: HeartbeatMonitor,
  time: number,
  positions: Float32Array,
  viewportWidth: number,
  viewportHeight: number,
  reducedMotion = false,
) {
  const tuning = HEARTBEAT_MONITOR_TUNING
  const seconds = reducedMotion ? tuning.REDUCED_HISTORY_SECONDS : tuning.HISTORY_SECONDS
  const count = positions.length / 3
  const halfWidth = viewportWidth * 0.475
  const amplitudeScale =
    Math.min(1, (viewportHeight * 0.38) / tuning.MAX_AMPLITUDE) *
    (reducedMotion ? tuning.REDUCED_AMPLITUDE : 1)
  for (let index = 0; index < count; index += 1) {
    const progress = index / (count - 1)
    positions[index * 3] = -halfWidth + progress * halfWidth * 2
    positions[index * 3 + 1] =
      sampleHeartbeatHistory(monitor, time - seconds * (1 - progress)) * amplitudeScale
    positions[index * 3 + 2] = 0
  }
}
