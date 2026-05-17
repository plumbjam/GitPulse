import { useState } from 'react'
import { ChevronDown, RotateCcw, SlidersHorizontal, Volume2 } from 'lucide-react'
import { gitPulseAudioEngine } from '@/audio/audioEngine'
import type { ActivityIntensityKey, SoundRole } from '@/audio/audio.types'
import { getMoodAudioConfig } from '@/audio/moods'
import {
  ACTIVITY_INTENSITY_KEYS,
  INTENSITY_MAPPING_LABELS,
  SOUND_ROLE_LABELS,
  SOUND_ROLE_OPTIONS_BY_INTENSITY,
} from '@/audio/musicMapping'
import { cn } from '@/lib-utils'
import { useGitPulseStore } from '@/store/useGitPulseStore'
import { Button } from '@/components/ui/button'

export function PulseMixerPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [previewingKey, setPreviewingKey] = useState<ActivityIntensityKey | undefined>()
  const [previewError, setPreviewError] = useState<string | undefined>()
  const mood = useGitPulseStore((state) => state.mood)
  const volume = useGitPulseStore((state) => state.volume)
  const mapping = useGitPulseStore((state) => state.soundMappings[state.mood])
  const setSoundMapping = useGitPulseStore((state) => state.setSoundMapping)
  const resetSoundMappingForMood = useGitPulseStore((state) => state.resetSoundMappingForMood)
  const moodLabel = getMoodAudioConfig(mood).label

  async function handlePreview(intensityKey: ActivityIntensityKey, soundRole: SoundRole) {
    setPreviewingKey(intensityKey)
    setPreviewError(undefined)

    try {
      await gitPulseAudioEngine.previewSoundRole(soundRole, mood, { volume })
    } catch {
      setPreviewError('Preview could not start. Try again after interacting with the page.')
    } finally {
      setPreviewingKey(undefined)
    }
  }

  return (
    <section className="rounded-lg border border-cyan-300/15 bg-slate-950/35">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        <span className="inline-flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-cyan-200" aria-hidden />
          <span className="text-sm font-medium">Pulse Mixer</span>
          <span className="text-xs text-muted-foreground">{moodLabel} mapping</span>
        </span>
        <ChevronDown
          className={cn(
            'h-4 w-4 text-muted-foreground transition-transform',
            isOpen && 'rotate-180',
          )}
          aria-hidden
        />
      </button>

      {isOpen ? (
        <div className="space-y-4 border-t border-white/10 px-3 pb-3 pt-1">
          <p className="text-xs leading-5 text-muted-foreground">
            Tune how activity intensity becomes sound. Current GitPulse data is intensity-based, not
            commit, pull request, or issue-specific.
          </p>

          <div className="grid gap-3">
            {ACTIVITY_INTENSITY_KEYS.map((intensityKey) => {
              const selectedRole = mapping[intensityKey]

              return (
                <div
                  key={intensityKey}
                  className="grid gap-2 rounded-md border border-white/10 bg-white/[0.025] p-3 md:grid-cols-[minmax(180px,0.9fr)_minmax(180px,1fr)_auto] md:items-center"
                >
                  <label className="text-sm text-cyan-100" htmlFor={`pulse-mixer-${intensityKey}`}>
                    {INTENSITY_MAPPING_LABELS[intensityKey]}
                  </label>
                  <select
                    id={`pulse-mixer-${intensityKey}`}
                    className="h-9 rounded-md border border-white/10 bg-slate-950 px-3 text-sm text-foreground outline-none focus:border-cyan-200 focus:ring-2 focus:ring-cyan-200/30"
                    value={selectedRole}
                    onChange={(event) =>
                      setSoundMapping(mood, intensityKey, event.currentTarget.value as SoundRole)
                    }
                  >
                    {SOUND_ROLE_OPTIONS_BY_INTENSITY[intensityKey].map((soundRole) => (
                      <option key={soundRole} value={soundRole}>
                        {SOUND_ROLE_LABELS[soundRole]}
                      </option>
                    ))}
                  </select>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    aria-label={`Preview ${SOUND_ROLE_LABELS[selectedRole]}`}
                    onClick={() => void handlePreview(intensityKey, selectedRole)}
                    disabled={previewingKey === intensityKey}
                  >
                    <Volume2 className="h-4 w-4" aria-hidden />
                    {previewingKey === intensityKey ? 'Previewing' : 'Preview'}
                  </Button>
                </div>
              )
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              Settings are kept in memory for this session. Other moods currently reuse the
              Futuristic instrument set.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => resetSoundMappingForMood(mood)}
            >
              <RotateCcw className="h-4 w-4" aria-hidden />
              Reset {moodLabel}
            </Button>
          </div>

          {previewError ? (
            <p className="rounded-md border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-100">
              {previewError}
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}
