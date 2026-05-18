import { useMemo, useRef, useState } from 'react'
import { Line } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { visualTheme } from './visualTheme'
import type { HeartbeatPoint } from './visual.types'

type HeartbeatTraceProps = {
  reducedMotion?: boolean
}

export function HeartbeatTrace({ reducedMotion = false }: HeartbeatTraceProps) {
  const [frame, setFrame] = useState(0)
  const elapsedTimeRef = useRef(0)
  const frameAccumulatorRef = useRef(0)

  const samplePositions = useMemo(() => {
    const { sampleCount, spanX } = visualTheme.trace

    return Array.from({ length: sampleCount }, (_, index) => {
      const progress = index / (sampleCount - 1)
      return -spanX + progress * spanX * 2
    })
  }, [])

  useFrame((state, delta) => {
    elapsedTimeRef.current = state.clock.getElapsedTime()
    frameAccumulatorRef.current += delta

    const targetInterval = reducedMotion ? 1 / 12 : 1 / 30

    if (frameAccumulatorRef.current < targetInterval) {
      return
    }

    frameAccumulatorRef.current = 0
    setFrame((currentFrame) => currentFrame + 1)
  })

  void frame

  const pulseBreath = 0.85 + Math.sin(elapsedTimeRef.current * 0.85) * (reducedMotion ? 0.03 : 0.08)
  const tracePoints = sampleHeartbeat(samplePositions, elapsedTimeRef.current, 0, reducedMotion)
  const ghostTracePoints = sampleHeartbeat(
    samplePositions,
    elapsedTimeRef.current,
    -0.58,
    reducedMotion,
    0.74,
  )
  const baselinePoints = sampleBaseline(samplePositions, elapsedTimeRef.current, reducedMotion)

  return (
    <group>
      <Line
        points={baselinePoints}
        color={visualTheme.palette.cyan}
        lineWidth={0.45}
        opacity={0.12}
        transparent
        depthWrite={false}
      />

      <Line
        points={ghostTracePoints}
        color={visualTheme.palette.violet}
        lineWidth={1.8}
        opacity={0.12}
        transparent
        depthWrite={false}
      />

      {visualTheme.layers.map((layer, index) => (
        <Line
          key={`${layer.color}-${index}`}
          points={tracePoints}
          color={layer.color}
          lineWidth={layer.lineWidth}
          opacity={layer.opacity * pulseBreath}
          transparent
          depthWrite={false}
          position={[0, 0, layer.z]}
        />
      ))}
    </group>
  )
}

function sampleHeartbeat(
  samplePositions: number[],
  elapsedTime: number,
  phaseOffset: number,
  reducedMotion: boolean,
  scale = 1,
) {
  return samplePositions.map<HeartbeatPoint>((xPosition) => {
    const motionScale = reducedMotion ? 0.42 : 1
    const amplitudeScale = reducedMotion ? 0.58 : 1
    const waveformY =
      getHeartbeatY(xPosition + phaseOffset, elapsedTime, motionScale) * amplitudeScale * scale

    return [xPosition, waveformY, 0]
  })
}

function sampleBaseline(samplePositions: number[], elapsedTime: number, reducedMotion: boolean) {
  return samplePositions.map<HeartbeatPoint>((xPosition) => [
    xPosition,
    getBaselineY(xPosition, elapsedTime, reducedMotion ? 0.16 : 0.28),
    -0.12,
  ])
}

function getHeartbeatY(xPosition: number, elapsedTime: number, motionScale: number) {
  const drift = elapsedTime * visualTheme.trace.speed * motionScale
  const cyclePosition = modulo(xPosition + drift, visualTheme.trace.cycleLength)
  const cycleProgress = cyclePosition / visualTheme.trace.cycleLength
  const baseline = getBaselineY(xPosition, elapsedTime, 1)

  const pulse =
    gaussian(cycleProgress, 0.198, 0.022, 0.12) -
    gaussian(cycleProgress, 0.257, 0.015, 0.18) +
    gaussian(cycleProgress, 0.282, 0.0088, 0.98) -
    gaussian(cycleProgress, 0.314, 0.016, 0.46) +
    gaussian(cycleProgress, 0.37, 0.026, 0.2)

  const breathing = 0.93 + Math.sin(elapsedTime * 0.55) * 0.07

  return baseline + pulse * visualTheme.trace.pulseAmplitude * breathing
}

function getBaselineY(xPosition: number, elapsedTime: number, scale: number) {
  const harmonicOne = Math.sin(xPosition * 1.65 + elapsedTime * 0.92)
  const harmonicTwo = Math.sin(xPosition * 3.95 - elapsedTime * 0.48) * 0.48
  const harmonicThree = Math.sin(xPosition * 0.72 + elapsedTime * 0.18) * 0.28

  return (harmonicOne + harmonicTwo + harmonicThree) * visualTheme.trace.baseAmplitude * scale
}

function gaussian(value: number, center: number, spread: number, weight: number) {
  const normalized = (value - center) / spread
  return Math.exp(-(normalized * normalized) / 2) * weight
}

function modulo(value: number, divisor: number) {
  return ((value % divisor) + divisor) % divisor
}
