import { useMemo, useRef } from 'react'
import { Line } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useAudioAnalyser } from '@/audio/useAudioAnalyser'
import { HeartbeatPoint } from './visual.types'
import { calculatePulseBoost, createHeartbeatVisualSignal } from './heartbeatSignal'
import { visualTheme } from './visualTheme'

type HeartbeatTraceProps = {
  reducedMotion?: boolean
}

export function HeartbeatTrace({ reducedMotion = false }: HeartbeatTraceProps) {
  const elapsedTimeRef = useRef(0)
  const previousSignalRef = useRef<number[] | undefined>(undefined)
  const analyserSnapshot = useAudioAnalyser({ fps: reducedMotion ? 18 : 30 })

  const samplePositions = useMemo(() => {
    const { sampleCount, spanX } = visualTheme.trace

    return Array.from({ length: sampleCount }, (_, index) => {
      const progress = index / (sampleCount - 1)
      return -spanX + progress * spanX * 2
    })
  }, [])

  useFrame((state) => {
    elapsedTimeRef.current = state.clock.getElapsedTime()
  })

  const pulseBoost = calculatePulseBoost(
    analyserSnapshot.rms,
    analyserSnapshot.bassEnergy,
    reducedMotion,
  )
  const pulseBreath =
    0.92 +
    Math.sin(elapsedTimeRef.current * 0.42) * (reducedMotion ? 0.012 : 0.032) +
    analyserSnapshot.rms * (reducedMotion ? 0.08 : 0.16)
  const visualSignal = createHeartbeatVisualSignal({
    snapshot: analyserSnapshot,
    sampleCount: samplePositions.length,
    time: elapsedTimeRef.current,
    reducedMotion,
    previousSignal: previousSignalRef.current,
  })

  previousSignalRef.current = visualSignal

  const tracePoints = sampleSignal(samplePositions, visualSignal, 0)
  const glowTracePoints = sampleSignal(samplePositions, visualSignal, -0.018)
  const baselinePoints = sampleBaseline(samplePositions, elapsedTimeRef.current, reducedMotion)
  const lineWidthMultiplier =
    1 + analyserSnapshot.midEnergy * (reducedMotion ? 0.12 : 0.22) + pulseBoost * 0.16
  const glowOpacityMultiplier =
    1 + analyserSnapshot.rms * (reducedMotion ? 0.16 : 0.28) + analyserSnapshot.trebleEnergy * 0.12

  return (
    <group>
      <Line
        points={baselinePoints}
        color={visualTheme.palette.cyanSoft}
        lineWidth={0.38}
        opacity={0.16}
        transparent
        depthWrite={false}
      />

      <Line
        points={glowTracePoints}
        color={visualTheme.palette.violet}
        lineWidth={1.9 * lineWidthMultiplier}
        opacity={0.06 * glowOpacityMultiplier}
        transparent
        depthWrite={false}
      />

      {visualTheme.layers.map((layer, index) => (
        <Line
          key={`${layer.color}-${index}`}
          points={tracePoints}
          color={layer.color}
          lineWidth={layer.lineWidth * lineWidthMultiplier}
          opacity={layer.opacity * pulseBreath}
          transparent
          depthWrite={false}
          position={[0, 0, layer.z]}
        />
      ))}
    </group>
  )
}

function sampleSignal(samplePositions: number[], signal: number[], phaseOffset: number) {
  return samplePositions.map<HeartbeatPoint>((xPosition, index) => [
    xPosition,
    (signal[index] ?? 0) + phaseOffset,
    0,
  ])
}

function sampleBaseline(samplePositions: number[], elapsedTime: number, reducedMotion: boolean) {
  return samplePositions.map<HeartbeatPoint>((xPosition) => [
    xPosition,
    getBaselineY(xPosition, elapsedTime, reducedMotion ? 0.08 : 0.14),
    -0.12,
  ])
}

function getBaselineY(xPosition: number, elapsedTime: number, scale: number) {
  const harmonicOne = Math.sin(xPosition * 0.72 + elapsedTime * 0.24)
  const harmonicTwo = Math.sin(xPosition * 1.58 - elapsedTime * 0.18) * 0.22

  return (harmonicOne + harmonicTwo) * visualTheme.trace.baseAmplitude * 0.22 * scale
}
