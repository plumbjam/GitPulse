# GitPulse

> Your GitHub activity has a sound.

GitPulse is an open-source creative web app that turns one or more GitHub identities into a future audio-visual coding signature.

## Stage 1 status (Application Foundation)

Stage 1 is complete as a polished **foundation shell**.

Implemented in this stage:

- React + Vite + TypeScript app foundation;
- futuristic dark UI shell and visual identity;
- multi-account merged identity input placeholders;
- mood selector placeholders;
- transport (playback) placeholder controls;
- visualiser stage placeholder animations;
- typed domain model and initial Zustand store;
- Tailwind + shadcn/ui-style component foundation;
- Vitest + React Testing Library smoke test;
- ESLint + Prettier + Husky + lint-staged quality gates;
- GitHub Actions CI and semantic version tag workflow prep.

Not implemented yet:

- live GitHub API data ingestion;
- audio generation/playback with Tone.js;
- real Three.js / React Three Fiber visualisation engine;
- backend, auth, exports, deployment pipeline.

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
- Tone.js _(installed, not yet used for playback)_
- three _(installed, visual engine pending)_
- @react-three/fiber _(installed, scene pending)_
- @react-three/drei _(installed, scene pending)_
- Vitest + React Testing Library
- ESLint + Prettier
- Husky + lint-staged

## Local setup

```bash
npm install
npm run dev
```

## Scripts

```bash
npm run dev
npm run build
npm run preview
npm run lint
npm run format
npm run format:check
npm run typecheck
npm run test
npm run test:watch
```

## Git hooks

Husky hooks are configured:

- **pre-commit**: runs `lint-staged`;
- **pre-push**: runs `npm run typecheck`, `npm run test`, `npm run build`.

## CI summary

Workflow: `.github/workflows/ci.yml`

Runs on pushes and pull requests to `main`:

1. `npm ci`
2. `npm run lint`
3. `npm run format:check`
4. `npm run typecheck`
5. `npm run test`
6. `npm run build`

## Version tagging workflow

Workflow: `.github/workflows/version-tag.yml`

On pushes to `main`, the workflow:

- attempts to find merged PR labels (`release:major`, `release:minor`, `release:patch`);
- defaults to `patch` when no release label is found;
- reads latest tag in `version-X.Y.Z` format;
- creates and pushes the next semantic tag.

Tag examples:

- `version-0.1.0`
- `version-0.1.1`
- `version-0.2.0`
- `version-1.0.0`

## GitHub Pages preparation

Vite is configured with:

```ts
base: '/GitPulse/'
```

This matches repository-name deployment on GitHub Pages.

> Note: deployment automation is intentionally deferred to a later stage.

## Project docs

Existing planning/design docs are preserved at repository root:

- `HLD.md`
- `PROJECT_PLAN.md`
- `ROADMAP.md`
- `STYLE_GUIDE.md`
- `DATA_AND_MAPPING_SPEC.md`
- `AGENT_GUIDE.md`
- `AGENT_FOUNDATION_PROMPT.md`
- `CONTRIBUTING.md`

## Roadmap (high level)

- **Stage 1**: Foundation shell ✅
- **Stage 2**: GitHub ingestion and normalization
- **Stage 3**: Multi-account merge logic
- **Stage 4**: Tone.js audio MVP
- **Stage 5**: React Three Fiber visual MVP
- **Stage 6+**: Mood/audio mapping expansion, export/share, advanced creative features

## Open-source positioning

GitPulse is intended as an open-source playground and creative developer tool.
Contributions, issue reports, and implementation ideas are welcome.
