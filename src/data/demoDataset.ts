import type { GitPulseDataset } from '@/domain/gitpulse.types'

export const demoDataset: GitPulseDataset = {
  identities: [
    { id: 'id-alice', username: 'alice', source: 'github', role: 'personal' },
    { id: 'id-alice-work', username: 'alice-work', source: 'github', role: 'work' },
  ],
  profileMode: 'merged',
  repos: [
    { id: 'repo-1', name: 'gitpulse', stars: 142, forks: 18, primaryLanguage: 'TypeScript' },
    { id: 'repo-2', name: 'neon-visual-lab', stars: 55, forks: 7, primaryLanguage: 'GLSL' },
  ],
  days: [
    { date: '2026-04-25', commits: 6, pullRequests: 1, issues: 0 },
    { date: '2026-04-26', commits: 9, pullRequests: 2, issues: 1 },
    { date: '2026-04-27', commits: 4, pullRequests: 1, issues: 0 },
  ],
  summary: {
    totalCommits: 19,
    activeRepos: 2,
    dominantLanguage: 'TypeScript',
    generatedFrom: 'demo',
  },
  selectedMood: 'futuristic',
}
