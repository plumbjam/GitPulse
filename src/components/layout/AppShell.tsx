import { AccountInputPanel } from '@/components/controls/AccountInputPanel'
import { MoodSelector } from '@/components/controls/MoodSelector'
import { TransportControls } from '@/components/controls/TransportControls'
import { InsightPanel } from '@/components/insights/InsightPanel'
import { Header } from '@/components/layout/Header'
import { HeroPanel } from '@/components/layout/HeroPanel'
import { VisualiserStage } from '@/components/visualiser/VisualiserStage'

export function AppShell() {
  return (
    <main className="mx-auto max-w-7xl space-y-4 px-4 py-8 text-foreground md:px-6">
      <Header />
      <HeroPanel />
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[340px_minmax(0,1fr)]">
        <div className="space-y-4">
          <AccountInputPanel />
          <MoodSelector />
          <TransportControls />
        </div>
        <div className="space-y-4">
          <VisualiserStage />
          <InsightPanel />
        </div>
      </section>
    </main>
  )
}
