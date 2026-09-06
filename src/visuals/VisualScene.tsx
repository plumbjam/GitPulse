import { HeartbeatTrace } from './HeartbeatTrace'

type VisualSceneProps = {
  reducedMotion?: boolean
}

export function VisualScene({ reducedMotion = false }: VisualSceneProps) {
  return <HeartbeatTrace reducedMotion={reducedMotion} />
}
