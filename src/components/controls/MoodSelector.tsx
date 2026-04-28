import { MOOD_OPTIONS } from '@/domain/mood.types'
import { useGitPulseStore } from '@/store/useGitPulseStore'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export function MoodSelector() {
  const mood = useGitPulseStore((state) => state.mood)
  const setMood = useGitPulseStore((state) => state.setMood)

  return (
    <Card className="space-y-3">
      <h2 className="font-medium">Mood preset</h2>
      <div className="grid grid-cols-2 gap-2">
        {MOOD_OPTIONS.map((option) => (
          <Button
            key={option.value}
            variant={mood === option.value ? 'default' : 'outline'}
            className="h-auto justify-start py-2"
            onClick={() => setMood(option.value)}
          >
            <span className="text-left">
              <span className="block text-sm">{option.label}</span>
              <span className="block text-xs opacity-80">{option.description}</span>
            </span>
          </Button>
        ))}
      </div>
    </Card>
  )
}
