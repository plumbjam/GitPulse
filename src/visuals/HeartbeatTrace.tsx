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

  const pulseBreath =
    0.92 + Math.sin(elapsedTimeRef.current * 0.42) * (reducedMotion ? 0.015 : 0.04)
  const tracePoints = sampleSignal(samplePositions, elapsedTimeRef.current, 0, reducedMotion)
  const glowTracePoints = sampleSignal(
    samplePositions,
    elapsedTimeRef.current,
    -0.24,
    reducedMotion,
    0.985,
  )
  const baselinePoints = sampleBaseline(samplePositions, elapsedTimeRef.current, reducedMotion)

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
        lineWidth={1.9}
        opacity={0.06}
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

function sampleSignal(
  samplePositions: number[],
  elapsedTime: number,
  phaseOffset: number,
  reducedMotion: boolean,
  scale = 1,
) {
  return samplePositions.map<HeartbeatPoint>((xPosition) => {
    const motionScale = reducedMotion ? 0.46 : 1
    const amplitudeScale = reducedMotion ? 0.58 : 1
    const waveformY =
      getSignalY(xPosition + phaseOffset, elapsedTime, motionScale) * amplitudeScale * scale

    return [xPosition, waveformY, 0]
  })
}

function sampleBaseline(samplePositions: number[], elapsedTime: number, reducedMotion: boolean) {
  return samplePositions.map<HeartbeatPoint>((xPosition) => [
    xPosition,
    getBaselineY(xPosition, elapsedTime, reducedMotion ? 0.08 : 0.14),
    -0.12,
  ])
}

function getSignalY(xPosition: number, elapsedTime: number, motionScale: number) {
  const drift = elapsedTime * visualTheme.trace.speed * motionScale
  const shiftedX = xPosition + drift
  const carrier = Math.sin(shiftedX * 1.28 + Math.sin(elapsedTime * 0.16) * 0.38)
  const support = Math.sin(shiftedX * 2.42 - elapsedTime * 0.34) * 0.26
  const micro = Math.sin(shiftedX * 5.8 + elapsedTime * 0.48) * 0.07
  const driftEnvelope = 0.88 + Math.sin(elapsedTime * 0.22 + xPosition * 0.22) * 0.12
  const baseline = getBaselineY(xPosition, elapsedTime, 1)
  const meander = (carrier * 0.78 + support * 0.18 + micro) * driftEnvelope

  return (
    baseline + meander * visualTheme.trace.baseAmplitude + micro * visualTheme.trace.pulseAmplitude
  )
}

function getBaselineY(xPosition: number, elapsedTime: number, scale: number) {
  const harmonicOne = Math.sin(xPosition * 0.72 + elapsedTime * 0.24)
  const harmonicTwo = Math.sin(xPosition * 1.58 - elapsedTime * 0.18) * 0.22

  return (harmonicOne + harmonicTwo) * visualTheme.trace.baseAmplitude * 0.22 * scale
}
