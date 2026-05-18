import { useEffect, useState } from 'react'
import { createSilentAnalyserSnapshot, gitPulseAudioAnalyser } from './audioAnalyser'
import type { GitPulseAnalyserSnapshot } from './audioAnalyser.types'

type UseAudioAnalyserOptions = {
  enabled?: boolean
  fps?: number
}

export function useAudioAnalyser(options: UseAudioAnalyserOptions = {}): GitPulseAnalyserSnapshot {
  const { enabled = true, fps = 30 } = options
  const [snapshot, setSnapshot] = useState<GitPulseAnalyserSnapshot>(() =>
    createSilentAnalyserSnapshot(),
  )

  useEffect(() => {
    if (!enabled) {
      setSnapshot(createSilentAnalyserSnapshot())
      return
    }

    let animationFrameId = 0
    let lastFrameTime = 0
    const frameInterval = 1000 / Math.max(1, fps)

    const updateSnapshot = (time: number) => {
      if (time - lastFrameTime >= frameInterval) {
        lastFrameTime = time
        setSnapshot(gitPulseAudioAnalyser.getSnapshot())
      }

      animationFrameId = globalThis.requestAnimationFrame(updateSnapshot)
    }

    animationFrameId = globalThis.requestAnimationFrame(updateSnapshot)

    return () => {
      globalThis.cancelAnimationFrame(animationFrameId)
    }
  }, [enabled, fps])

  return snapshot
}
