export type HeartbeatPoint = [number, number, number]

export type HeartbeatTraceLayer = {
  color: string
  lineWidth: number
  opacity: number
  z: number
}

export type VisualTheme = {
  canvasHeight: number
  monitorLineCount: number
  palette: {
    base: string
    cyan: string
    cyanSoft: string
    violet: string
    magenta: string
    glow: string
  }
  trace: {
    sampleCount: number
    spanX: number
    cycleLength: number
    speed: number
    baseAmplitude: number
    pulseAmplitude: number
  }
  layers: HeartbeatTraceLayer[]
}
