import { useMemo, useRef, type ComponentRef } from 'react'
import { Line } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { InterleavedBufferAttribute } from 'three'
import { gitPulseAudioEngine } from '@/audio/audioEngine'
import {
  advanceHeartbeatMonitor,
  createHeartbeatMonitor,
  writeHeartbeatTrace,
} from './heartbeatSignal'
import type { HeartbeatPoint } from './visual.types'
import { visualTheme } from './visualTheme'

type TraceLine = ComponentRef<typeof Line>

export function HeartbeatTrace({ reducedMotion = false }: { reducedMotion?: boolean }) {
  const monitor = useMemo(() => createHeartbeatMonitor(), [])
  const lines = useRef<Array<TraceLine | null>>([])
  const head = useRef<TraceLine>(null)
  const positions = useMemo(() => new Float32Array(visualTheme.trace.sampleCount * 3), [])
  const initialPoints = useMemo(
    () =>
      Array.from(
        { length: visualTheme.trace.sampleCount },
        (_, i): HeartbeatPoint => [(i / (visualTheme.trace.sampleCount - 1)) * 2 - 1, 0, 0],
      ),
    [],
  )
  const headPoints = useMemo(
    () => initialPoints.slice(-visualTheme.trace.headSampleCount),
    [initialPoints],
  )

  useFrame(({ viewport }) => {
    const { time, readings } = gitPulseAudioEngine.getVisualFrame()
    advanceHeartbeatMonitor(monitor, time, readings)
    writeHeartbeatTrace(monitor, time, positions, viewport.width, viewport.height, reducedMotion)
    for (const line of lines.current) if (line) updateLinePositions(line, positions)
    if (head.current) {
      updateLinePositions(
        head.current,
        positions.subarray(positions.length - visualTheme.trace.headSampleCount * 3),
      )
      // Only the writing end glows. Historical readings keep their original styling.
      head.current.material.opacity = reducedMotion
        ? 0
        : Math.min(0.6, Math.abs(positions[positions.length - 2]) * 0.7)
    }
  })

  return (
    <>
      {visualTheme.layers.map((layer, index) => (
        <Line
          key={layer.color}
          ref={(line) => {
            lines.current[index] = line
          }}
          points={initialPoints}
          color={layer.color}
          lineWidth={layer.lineWidth}
          opacity={layer.opacity}
          transparent
          depthWrite={false}
          frustumCulled={false}
          position={[0, 0, layer.z]}
        />
      ))}
      <Line
        ref={head}
        points={headPoints}
        color={visualTheme.palette.cyanSoft}
        lineWidth={3.5}
        opacity={0}
        transparent
        depthWrite={false}
        frustumCulled={false}
        position={[0, 0, 0.01]}
      />
    </>
  )
}

// Drei's Line stores adjacent vertices in an interleaved segment buffer. Update that buffer
// in place instead of allocating geometry or rerendering React on every animation frame.
function updateLinePositions(line: TraceLine, positions: Float32Array) {
  const start = line.geometry.getAttribute('instanceStart') as InterleavedBufferAttribute
  const segments = start.data.array
  for (let index = 0; index < positions.length / 3 - 1; index += 1) {
    for (let axis = 0; axis < 3; axis += 1) {
      segments[index * 6 + axis] = positions[index * 3 + axis]
      segments[index * 6 + 3 + axis] = positions[(index + 1) * 3 + axis]
    }
  }
  start.data.needsUpdate = true
}
