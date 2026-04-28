import { demoDataset } from '@/data/demoDataset'
import { useGitPulseStore } from '@/store/useGitPulseStore'
import { Card } from '@/components/ui/card'

const insightRows = [
  { label: 'Activity model', value: 'Demo' },
  { label: 'Audio engine', value: 'Pending' },
  { label: 'Visual engine', value: 'Pending' },
]

export function InsightPanel() {
  const mood = useGitPulseStore((state) => state.mood)
  const identities = useGitPulseStore((state) => state.identities)

  return (
    <Card className="space-y-3">
      <h2 className="font-medium">Developer signal</h2>
      <div className="grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
        <div className="rounded-md border border-white/10 p-3">Merged accounts: {identities.length} planned</div>
        <div className="rounded-md border border-white/10 p-3 capitalize">Mood: {mood}</div>
        <div className="rounded-md border border-white/10 p-3">Dominant language: {demoDataset.summary.dominantLanguage}</div>
        {insightRows.map((row) => (
          <div key={row.label} className="rounded-md border border-white/10 p-3">
            {row.label}: {row.value}
          </div>
        ))}
      </div>
    </Card>
  )
}
