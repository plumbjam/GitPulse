import { useGitPulseStore } from '@/store/useGitPulseStore'
import { Card } from '@/components/ui/card'

export function InsightPanel() {
  const mood = useGitPulseStore((state) => state.mood)
  const dataset = useGitPulseStore((state) => state.dataset)
  const isFetching = useGitPulseStore((state) => state.isFetching)

  const insightRows = [
    { label: 'Mode', value: dataset.mode },
    { label: 'Profile mode', value: dataset.profileMode },
    {
      label: 'Identities merged',
      value: `${dataset.summary.successfulIdentities}/${dataset.summary.totalIdentities}`,
    },
    { label: 'Failed identities', value: dataset.summary.failedIdentities.toString() },
    { label: 'Total repos', value: dataset.summary.totalRepos.toString() },
    { label: 'Active repos', value: dataset.summary.activeRepos.toString() },
    { label: 'Dormant repos', value: dataset.summary.dormantRepos.toString() },
    { label: 'Total stars', value: dataset.summary.totalStars.toString() },
    { label: 'Total forks', value: dataset.summary.totalForks.toString() },
    {
      label: 'Dominant languages',
      value: dataset.summary.dominantLanguages.length
        ? dataset.summary.dominantLanguages.join(', ')
        : 'Awaiting data',
    },
    {
      label: 'Most recent push',
      value: dataset.summary.mostRecentPushAt
        ? formatDisplayDate(dataset.summary.mostRecentPushAt)
        : 'Awaiting data',
    },
    { label: 'Activity score', value: dataset.summary.activityScore.toString() },
    { label: 'Mood', value: mood },
  ]

  return (
    <Card className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-medium">Developer signal</h2>
        <p className="text-xs text-muted-foreground">
          {isFetching ? 'Fetching GitHub data...' : 'Dataset summary ready'}
        </p>
      </div>
      <div className="grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
        {insightRows.map((row) => (
          <div key={row.label} className="rounded-md border border-white/10 p-3">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{row.label}</p>
            <p className="mt-2 break-words capitalize">{row.value}</p>
          </div>
        ))}
      </div>
    </Card>
  )
}

function formatDisplayDate(isoDate: string) {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(isoDate))
}
