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
    sampleCount: 180,
    spanX: 7.2,
    cycleLength: 4.8,
    speed: 1.15,
    baseAmplitude: 0.055,
    pulseAmplitude: 0.92,
  },
  layers: [
    {
      color: '#e879f9',
      lineWidth: 4.6,
      opacity: 0.12,
      z: -0.08,
    },
    {
      color: '#22d3ee',
      lineWidth: 2.7,
      opacity: 0.24,
      z: -0.04,
    },
    {
      color: '#67e8f9',
      lineWidth: 1.3,
      opacity: 0.92,
      z: 0,
    },
    {
      color: '#f8fdff',
      lineWidth: 0.62,
      opacity: 0.98,
      z: 0.04,
    },
  ],
}
