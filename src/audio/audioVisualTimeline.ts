export type AudioVisualReading = { time: number; amplitude: number }

/** Converts scheduled audio-context times into a visual clock that freezes during pause. */
export class AudioVisualTimeline {
  private time = 0
  private lastClock: number
  private pending: AudioVisualReading[] = []
  private paused = false
  private playing = false
  private muted = false

  constructor(private readonly clock: () => number) {
    this.lastClock = clock()
  }

  isPaused() {
    return this.paused
  }
  isPlaying() {
    return this.playing
  }

  start() {
    this.sync()
    this.paused = false
    this.playing = true
  }

  pause() {
    this.sync()
    this.pending = this.pending.filter((reading) => reading.time <= this.time)
    this.paused = true
    this.playing = false
  }

  stop() {
    this.sync()
    this.pending = this.pending.filter((reading) => reading.time <= this.time)
    this.paused = false
    this.playing = false
  }

  setMuted(muted: boolean) {
    this.muted = muted
  }

  schedule(audioTime: number, velocity: number) {
    const now = this.clock()
    this.sync(now)
    if (this.paused || velocity <= 0) return
    this.pending = this.pending.filter((reading) => reading.time >= this.time - 7)
    const time = this.time + Math.max(0, audioTime - now)
    const amplitude = Math.min(1.28, 0.25 + Math.sqrt(velocity) * 1.03)
    // A chord or simultaneous instruments are one audible attack on a single trace.
    const existing = this.pending.find((reading) => Math.abs(reading.time - time) < 0.00001)
    if (existing) existing.amplitude = Math.max(existing.amplitude, amplitude)
    else this.pending.push({ time, amplitude })
    this.pending.sort((left, right) => left.time - right.time)
  }

  getFrame() {
    this.sync()
    const count = this.pending.findIndex((reading) => reading.time > this.time)
    const due = this.pending.splice(0, count < 0 ? this.pending.length : count)
    return { time: this.time, paused: this.paused, readings: this.muted ? [] : due }
  }

  private sync(now = this.clock()) {
    if (!this.paused) this.time += Math.max(0, now - this.lastClock)
    this.lastClock = now
  }
}
