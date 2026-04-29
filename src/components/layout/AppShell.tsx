import { useAudioPattern } from '@/audio/useAudioPattern'
import { AccountInputPanel } from '@/components/controls/AccountInputPanel'
import { GitHubTokenPanel } from '@/components/controls/GitHubTokenPanel'
import { MoodSelector } from '@/components/controls/MoodSelector'
import { InsightPanel } from '@/components/insights/InsightPanel'
import { Header } from '@/components/layout/Header'
import { HeroPanel } from '@/components/layout/HeroPanel'
import { ContributionMediaBar } from '@/components/visualiser/ContributionMediaBar'
import { ContributionSignalGrid } from '@/components/visualiser/ContributionSignalGrid'
import { VisualiserStage } from '@/components/visualiser/VisualiserStage'
import { useGitPulseStore } from '@/store/useGitPulseStore'

export function AppShell() {
  const dataset = useGitPulseStore((state) => state.dataset)
  const mood = useGitPulseStore((state) => state.mood)
  const tempo = useGitPulseStore((state) => state.tempo)
  const isAudioPlaying = useGitPulseStore((state) => state.isAudioPlaying)
  const activeAudioDate = useGitPulseStore((state) => state.activeAudioDate)
  const contributionCalendar = dataset.contributionCalendar
  const audioPattern = useAudioPattern(dataset, mood, tempo)

  return (
    <main className="mx-auto max-w-7xl space-y-4 px-4 py-8 text-foreground md:px-6">
      <Header />
      <HeroPanel />
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[340px_minmax(0,1fr)]">
        <div className="space-y-4">
          <AccountInputPanel />
          <GitHubTokenPanel />
          <MoodSelector />
        </div>
        <div className="space-y-4">
          <VisualiserStage />
          <ContributionSignalGrid
            activeDate={isAudioPlaying ? activeAudioDate : undefined}
            calendar={contributionCalendar}
            mediaBar={<ContributionMediaBar pattern={audioPattern} />}
          />
          <InsightPanel />
        </div>
      </section>
    </main>
  )
}
