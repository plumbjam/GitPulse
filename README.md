# GitPulse

> Your GitHub activity has a sound.

GitPulse is an open-source creative web app that turns one or more public GitHub identities into a personalized audio-visual coding signature.

## Stage 2 status

Stage 2 is complete as the GitHub data ingestion and multi-account normalization layer.

Implemented in this stage:

- public GitHub username input with duplicate and invalid-name handling;
- public GitHub REST fetching for profile, repositories, and repository languages;
- per-identity loading, success, and error state;
- multi-account dataset merge with repo deduplication and `sourceUsernames` attribution;
- summary metrics for repos, languages, stars, forks, recency, and activity score;
- approximate repo-push timeline for future audio and visual stages;
- demo dataset fallback;
- insight and visualizer placeholder wiring against real dataset state;
- unit tests for normalization and merge logic.

Not implemented yet:

- GitHub OAuth or token handling;
- private repository access;
- GitHub GraphQL contribution calendar;
- true commit-by-day history;
- Tone.js playback engine;
- Three.js / React Three Fiber live scene;
- backend services, export, or AI features.

## Public GitHub data scope

GitPulse Stage 2 uses public GitHub REST endpoints only:

- `GET https://api.github.com/users/{username}`
- `GET https://api.github.com/users/{username}/repos?per_page=100&sort=pushed`
- `GET https://api.github.com/repos/{owner}/{repo}/languages`

No authentication is required for the MVP flow. That also means GitHub's unauthenticated rate limits apply.

Repository language fetches are intentionally capped to the most recently pushed 24 repositories per identity. Remaining repositories still appear in the normalized dataset, but they fall back to GitHub's repo-level primary language when byte-level language data is unavailable.

## Multi-account merge behavior

GitPulse Stage 2 treats multi-account merge as a first-class concept.

- successful identities are merged into one normalized dataset;
- failed identities are preserved with status and error messages;
- repositories are deduplicated by GitHub repo ID when available, then by lowercased `owner/name`;
- duplicate repos preserve merged `sourceUsernames` and keep the freshest `pushedAt`;
- summary metrics are recalculated from the merged repo set rather than per-account totals.

## Activity timeline caveat

Stage 2 does not fetch true commit history yet.

The `days` array is an approximate activity timeline built from repository `pushedAt` dates. It is intended as a creative signal input for future audio and visual stages, not as precise analytics.

## Stack

- npm
- React
- Vite
- TypeScript
- Tailwind CSS
- shadcn/ui-style primitives
- lucide-react
- framer-motion
- zustand
- Vitest + React Testing Library
- ESLint + Prettier
- Husky + lint-staged

Installed for future stages, not yet active in Stage 2:

- Tone.js
- three
- @react-three/fiber
- @react-three/drei

## Local setup

```bash
npm install
npm run dev
```

## Quality commands

```bash
npm run format
npm run lint
npm run format:check
npm run typecheck
npm run test
npm run build
```

## GitHub Pages preparation

Vite is configured with:

```ts
base: '/GitPulse/'
```

This matches repository-name deployment on GitHub Pages.

## Project docs

- `README.md`
- `CONTRIBUTING.md`
- `HLD.md`
- `docs/PROJECT_PLAN.md`
- `docs/ROADMAP.md`
- `docs/STYLE_GUIDE.md`
- `docs/DATA_AND_MAPPING_SPEC.md`
- `docs/AGENT_GUIDE.md`
- `docs/AGENT_FOUNDATION_PROMPT.md`

## Roadmap

- Stage 1: Foundation shell
- Stage 2: GitHub ingestion and multi-account normalization
- Stage 3: Tone.js audio engine MVP
- Stage 4: React Three Fiber visual MVP
- Stage 5+: Mapping expansion, export/share, and advanced creative features

## Open-source positioning

GitPulse is intended as an open-source playground and creative developer tool.
Contributions, issue reports, and implementation ideas are welcome.
