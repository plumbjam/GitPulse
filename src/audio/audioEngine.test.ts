import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AudioPatternStep, GitPulseAudioPattern, SoundRole } from './audio.types'
import { SOUND_ROLE_LABELS } from './musicMapping'
import { GitPulseAudioEngine } from './audioEngine'
import { disposeInstrumentRack } from './instruments'

const runtime = vi.hoisted(() => {
  const hits: { time: number; velocity: number }[] = []
  const voice = (noise = false) => ({
    triggerAttackRelease: vi.fn((...args: unknown[]) => {
      hits.push({ time: args[noise ? 1 : 2] as number, velocity: args[noise ? 2 : 3] as number })
    }),
    triggerRelease: vi.fn(),
    releaseAll: vi.fn(),
  })
  return {
    now: 0,
    bpm: 120,
    hits,
    sequence: undefined as ((time: number, step: AudioPatternStep) => void) | undefined,
    draws: [] as { callback: () => void; time: number }[],
    rack: {
      master: { mute: false },
      limiter: {},
      kick: voice(),
      bass: voice(),
      lead: voice(),
      snare: voice(true),
      hats: voice(true),
    },
  }
})

vi.mock('tone', () => ({
  start: vi.fn(),
  immediate: () => runtime.now,
  now: () => runtime.now + 0.1,
  Time: (duration: string) => ({
    toSeconds: () => (60 / runtime.bpm) * ({ '4n': 1, '8n': 0.5, '16n': 0.25 }[duration] ?? 1),
  }),
  Transport: {
    start: vi.fn(),
    stop: vi.fn(),
    cancel: vi.fn(),
    seconds: 0,
    bpm: {
      rampTo: (bpm: number) => {
        runtime.bpm = bpm
      },
    },
  },
  Draw: {
    schedule: (callback: () => void, time: number) => runtime.draws.push({ callback, time }),
  },
  Sequence: class {
    constructor(callback: typeof runtime.sequence) {
      runtime.sequence = callback
    }
    start = vi.fn()
    stop = vi.fn()
    dispose = vi.fn()
  },
}))
vi.mock('./audioAnalyser', () => ({ gitPulseAudioAnalyser: { attach: vi.fn(), dispose: vi.fn() } }))
vi.mock('./instruments', () => ({
  createInstrumentRack: async () => runtime.rack,
  setMasterVolume: vi.fn(),
  disposeInstrumentRack: vi.fn(),
}))

const step: AudioPatternStep = {
  index: 0,
  bar: 0,
  beat: 0,
  date: '2026-09-06',
  contributionCount: 4,
  intensity: 4,
  kick: false,
  snare: false,
  hat: false,
  accent: false,
  velocity: 0.6,
  sourceUsernames: ['demo'],
  dataSource: 'demo',
  soundRole: 'kick-snare-hat',
}
const pattern: GitPulseAudioPattern = {
  mood: 'futuristic',
  bpm: 120,
  loopBars: 1,
  steps: [step],
  summary: { source: 'demo', activeSteps: 1, peakContributionCount: 4, dominantLanguages: [] },
}

describe('audio engine visual scheduling', () => {
  beforeEach(() => {
    runtime.now = 0
    runtime.bpm = 120
    runtime.hits.length = 0
    runtime.draws.length = 0
    runtime.rack.master.mute = false
    vi.clearAllMocks()
  })

  it.each(Object.keys(SOUND_ROLE_LABELS) as SoundRole[])(
    'matches every instrument attack in %s to its visual time',
    async (role) => {
      const engine = new GitPulseAudioEngine()
      await engine.previewSoundRole(role, 'futuristic', { volume: 50 })
      const initial = engine.getVisualFrame()
      expect(initial.readings).toEqual([])
      runtime.now = 1
      const readings = engine.getVisualFrame().readings
      const times = [...new Set(runtime.hits.map((hit) => hit.time))].sort((a, b) => a - b)
      expect(times.length).toBeGreaterThan(0)
      expect(readings).toHaveLength(times.length)
      readings.forEach((reading, index) =>
        expect(reading.time).toBeCloseTo(initial.time + times[index], 6),
      )
      engine.dispose()
    },
  )

  it('uses the step audio time for the activity square and preserves later hits inside the square', async () => {
    const engine = new GitPulseAudioEngine()
    const onStep = vi.fn()
    await engine.play(pattern, { volume: 50, onStep })
    const initial = engine.getVisualFrame()
    runtime.sequence!(1, step)
    expect(onStep).not.toHaveBeenCalled()
    runtime.now = 0.99
    expect(engine.getVisualFrame().readings).toEqual([])
    runtime.now = 1
    runtime.draws.filter((draw) => draw.time <= runtime.now).forEach((draw) => draw.callback())
    expect(onStep).toHaveBeenCalledWith(0, step)
    expect(engine.getVisualFrame().readings[0].time).toBeCloseTo(initial.time + 1)
    runtime.now = 1.25
    const remaining = engine.getVisualFrame().readings
    expect(remaining).toHaveLength(2)
    expect(remaining[0].time).toBeCloseTo(initial.time + 1.125)
    expect(remaining[1].time).toBeCloseTo(initial.time + 1.25)
    engine.dispose()
  })

  it('freezes on Pause and rejects old activity callbacks and future sound markers', async () => {
    const engine = new GitPulseAudioEngine()
    const onStep = vi.fn()
    await engine.play(pattern, { volume: 50, onStep })
    runtime.sequence!(0.1, step)
    runtime.now = 0.05
    engine.pause()
    expect(disposeInstrumentRack).toHaveBeenCalledWith(runtime.rack)
    const paused = engine.getVisualFrame()
    engine.stopIfPlaying()
    runtime.now = 10
    runtime.draws.forEach((draw) => draw.callback())
    expect(onStep).not.toHaveBeenCalled()
    expect(engine.getVisualFrame()).toEqual(paused)
    expect(runtime.rack.master.mute).toBe(true)
    await engine.play(pattern, { volume: 50 })
    expect(engine.isPaused()).toBe(false)
    expect(engine.getVisualFrame().time).toBeCloseTo(paused.time)
    expect(runtime.rack.master.mute).toBe(false)
    runtime.sequence!(10.1, step)
    runtime.now = 10.1
    expect(engine.getVisualFrame().readings).toHaveLength(1)
    engine.dispose()
  })

  it('does not produce pulses for quiet steps or zero volume', async () => {
    const engine = new GitPulseAudioEngine()
    await engine.play(pattern, { volume: 50 })
    runtime.sequence!(0.1, { ...step, soundRole: undefined, contributionCount: 0, intensity: 0 })
    runtime.now = 0.5
    expect(engine.getVisualFrame().readings).toEqual([])
    engine.setVolume(0)
    runtime.sequence!(0.6, step)
    runtime.now = 1
    expect(engine.getVisualFrame().readings).toEqual([])
    expect(runtime.rack.master.mute).toBe(true)
    engine.dispose()
  })
})
