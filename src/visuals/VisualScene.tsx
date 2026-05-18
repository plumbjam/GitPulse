import { useRef } from 'react'
import { Group } from 'three'
import { useFrame } from '@react-three/fiber'
import { HeartbeatTrace } from './HeartbeatTrace'

type VisualSceneProps = {
  reducedMotion?: boolean
}

export function VisualScene({ reducedMotion = false }: VisualSceneProps) {
  const rigRef = useRef<Group>(null)

  useFrame((state) => {
    const rig = rigRef.current

    if (!rig) {
      return
    }

    const time = state.clock.getElapsedTime()
    const driftAmount = reducedMotion ? 0.004 : 0.012

    rig.position.y = Math.sin(time * 0.24) * driftAmount
  })

  return (
    <group ref={rigRef}>
      <HeartbeatTrace reducedMotion={reducedMotion} />
    </group>
  )
}
