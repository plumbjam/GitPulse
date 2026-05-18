export type GitPulseAnalyserSnapshot = {
  waveform: Float32Array
  frequency: Uint8Array
  rms: number
  bassEnergy: number
  midEnergy: number
  trebleEnergy: number
  isAudioActive: boolean
}
