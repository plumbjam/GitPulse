import { useRef } from 'react'
import { Group } from 'three'
import { useFrame } from '@react-three/fiber'
import { HeartbeatTrace } from './HeartbeatTrace'
import { visualTheme } from './visualTheme'

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
    const driftAmount = reducedMotion ? 0.02 : 0.055
    const rotationAmount = reducedMotion ? 0.004 : 0.012

    rig.position.y = Math.sin(time * 0.24) * driftAmount
    rig.rotation.z = Math.sin(time * 0.16) * rotationAmount
  })

  return (
    <group ref={rigRef}>
      <mesh position={[-2.15, 0.28, -1.6]} scale={[2.9, 1.1, 1]}>
        <circleGeometry args={[1, 64]} />
        <meshBasicMaterial
          color={visualTheme.palette.cyan}
          opacity={0.075}
          transparent
          depthWrite={false}
        />
      </mesh>

      <mesh position={[2.6, -0.2, -1.4]} scale={[1.95, 0.9, 1]}>
        <circleGeometry args={[1, 64]} />
        <meshBasicMaterial
          color={visualTheme.palette.magenta}
          opacity={0.055}
          transparent
          depthWrite={false}
        />
      </mesh>

      <HeartbeatTrace reducedMotion={reducedMotion} />
    </group>
  )
}
