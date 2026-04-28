import { Pause, Play, Shuffle } from 'lucide-react'
import { useGitPulseStore } from '@/store/useGitPulseStore'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'

export function TransportControls() {
  const { tempo, intensity, setTempo, setIntensity } = useGitPulseStore()

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-medium">Transport controls</h2>
        <p className="text-xs text-muted-foreground">Playback engine pending</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button disabled>
          <Play className="h-4 w-4" aria-hidden /> Play
        </Button>
        <Button disabled variant="outline">
          <Pause className="h-4 w-4" aria-hidden /> Pause
        </Button>
        <Button disabled variant="outline">
          <Shuffle className="h-4 w-4" aria-hidden /> Remix
        </Button>
      </div>
      <div className="space-y-3">
        <label className="text-sm" htmlFor="intensity-slider">
          Intensity: {intensity}
        </label>
        <Slider
          id="intensity-slider"
          min={0}
          max={100}
          step={1}
          value={[intensity]}
          onValueChange={([value]) => setIntensity(value)}
        />
      </div>
      <div className="space-y-3">
        <label className="text-sm" htmlFor="tempo-slider">
          Tempo: {tempo} BPM
        </label>
        <Slider
          id="tempo-slider"
          min={60}
          max={180}
          step={1}
          value={[tempo]}
          onValueChange={([value]) => setTempo(value)}
        />
      </div>
    </Card>
  )
}
