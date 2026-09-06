import type { VisualTheme } from './visual.types'

export const visualTheme: VisualTheme = {
  canvasHeight: 360,
  monitorLineCount: 18,
  palette: {
    base: '#020817',
    cyan: '#67e8f9',
    cyanSoft: '#a5f3fc',
    violet: '#8b5cf6',
    magenta: '#e879f9',
    glow: '#22d3ee',
  },
  trace: {
    sampleCount: 721,
    headSampleCount: 40,
  },
  layers: [
    {
      color: '#8b5cf6',
      lineWidth: 3.1,
      opacity: 0.08,
      z: -0.08,
    },
    {
      color: '#22d3ee',
      lineWidth: 1.55,
      opacity: 0.62,
      z: -0.04,
    },
    {
      color: '#a5f3fc',
      lineWidth: 0.95,
      opacity: 0.92,
      z: 0,
    },
  ],
}
