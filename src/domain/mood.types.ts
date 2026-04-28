export type GitPulseMood = 'futuristic' | 'playful' | 'epic' | 'lofi' | 'glitch' | 'ambient'

export const MOOD_OPTIONS: Array<{ value: GitPulseMood; label: string; description: string }> = [
  { value: 'futuristic', label: 'Futuristic', description: 'Neon-forward and synthetic energy.' },
  { value: 'playful', label: 'Playful', description: 'Bright and kinetic mood profile.' },
  { value: 'epic', label: 'Epic', description: 'Large cinematic signal style.' },
  { value: 'lofi', label: 'Lo-fi', description: 'Warm and laid-back coding groove.' },
  { value: 'glitch', label: 'Glitch', description: 'Digital jitter and fractured rhythm.' },
  { value: 'ambient', label: 'Ambient', description: 'Soft atmospheric profile.' },
]
