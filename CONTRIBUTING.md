# Contributing to GitPulse

Thank you for considering a contribution to GitPulse.

GitPulse is an open-source creative coding project that turns GitHub activity into generative audio and audio-reactive visuals.

---

## Project principles

Please preserve these principles:

1. GitPulse should feel creative, musical, and visually distinctive.
2. Multi-account merge support is a core feature.
3. GitHub API responses should be normalized before use.
4. Audio must only start after explicit user interaction.
5. The app should work with public GitHub data and demo data.
6. No secrets or tokens should be committed.
7. MVP should remain frontend-first and easy to deploy.

---

## Stage 2 scope

The current completed stage is:

```text
GitHub data ingestion + multi-account normalization
```

Stage 2 currently includes:

- public GitHub REST fetching for profile, repositories, and repository languages;
- dataset normalization into GitPulse domain types;
- multi-account merge logic with `sourceUsernames` preservation;
- approximate repo-push timeline generation;
- demo fallback behavior;
- insight and visualizer placeholder wiring to live dataset state.

Stage 2 intentionally does not include:

- OAuth or token entry;
- private repositories;
- GraphQL contribution calendars;
- true commit history;
- Tone.js playback;
- Three.js / React Three Fiber live scenes;
- backend services or export flows.

---

## Development setup

From a fresh clone:

```bash
npm install
npm run dev
```

Before opening a PR, run the full local check suite:

```bash
npm run format
npm run lint
npm run format:check
npm run typecheck
npm run test
npm run build
```

> Note: the write/fix script is `npm run format`, not `npm run format:write`.

---

## Windows setup notes

On Windows, the recommended baseline tools are:

- Git for Windows
- Node.js LTS
- npm
- VS Code or another editor

Using CMD with Winget:

```cmd
winget install --id Git.Git -e --source winget
winget install --id OpenJS.NodeJS.LTS -e --source winget
winget install --id Microsoft.VisualStudioCode -e --source winget
```

After installing Node or Git, close and reopen CMD so PATH updates are available.

Check versions with:

```cmd
git --version
node --version
npm --version
```

If `npm install` fails with registry or 403 errors, check and reset the npm registry:

```cmd
npm config get registry
npm config set registry https://registry.npmjs.org/
npm cache clean --force
npm install
```

---

## Tooling gotchas

### 1. Prettier check vs write script

The repo uses:

```json
{
  "format": "prettier --write .",
  "format:check": "prettier --check ."
}
```

If `npm run format:check` reports style issues, run:

```bash
npm run format
npm run format:check
```

### 2. Vitest config must use `vitest/config`

If `npm run typecheck` reports that `test` does not exist in `vite.config.ts`, make sure `defineConfig` is imported from:

```ts
import { defineConfig } from 'vitest/config'
```

### 3. Vitest globals should be imported explicitly

Prefer explicit Vitest imports in tests:

```ts
import { describe, expect, it } from 'vitest'
```

### 4. jsdom does not provide every browser API

If tests fail with `ResizeObserver is not defined`, preserve the no-op mock in `src/test/setup.ts`.

### 5. Testing Library queries should stay specific

Avoid broad text regexes that match multiple UI elements. Prefer precise text or semantic role queries.

### 6. GitHub Pages base path

The app is prepared for GitHub Pages under:

```text
/GitPulse/
```

Avoid hardcoded absolute asset paths that would break repository-path deployments.

---

## GitHub data guidance

Stage 2 GitHub data work should preserve these behaviors:

- use public GitHub REST endpoints only;
- do not add OAuth or token handling without discussion;
- treat partial language-fetch failures as warnings, not total failure;
- preserve successful accounts even when one identity fails;
- deduplicate repositories carefully and preserve `sourceUsernames`;
- keep language byte fetches capped to the most recently pushed 24 repos per identity;
- keep demo fallback behavior working;
- remember that the Stage 2 `days` timeline is an approximate repo-push timeline, not commit history.

User-facing errors should stay friendly:

- `User not found.`
- `GitHub rate limit reached. Try again later.`
- `Network error while contacting GitHub.`
- `Could not load languages for some repositories.`
- duplicate and invalid username validation messages

---

## Code organization

Recommended folders:

```text
src/github      GitHub API client, normalization, merge logic, fixtures, tests
src/data        Demo data
src/domain      Shared dataset contracts
src/store       Zustand state
src/components  UI components
src/app         App entry and providers
src/test        Vitest setup
```

Keep API fetching, normalization, merge logic, and UI wiring separate.

---

## Pull request guidance

A good PR should include:

- a clear summary;
- screenshots or GIFs for visual changes;
- tests where appropriate;
- documentation updates when architecture changes.

Please avoid:

- broad unrelated refactors;
- introducing backend services without discussion;
- adding paid APIs as required dependencies;
- removing demo fallback;
- breaking multi-account source attribution.

If a command cannot be run locally, state why in the PR notes.

---

## Git hooks, CI, and labels

The repo uses Husky and lint-staged.

Expected behavior:

- pre-commit: staged formatting and lint checks;
- pre-push: typecheck, tests, and build;
- CI: `npm run lint`, `npm run format:check`, `npm run typecheck`, `npm run test`, `npm run build`.

Release labels:

- `release:major`
- `release:minor`
- `release:patch`

Tags use the format:

```text
version-X.Y.Z
```

---

## Documentation

If your change affects architecture or Stage 2 behavior, update the relevant docs:

- `README.md`
- `CONTRIBUTING.md`
- `HLD.md`
- `docs/PROJECT_PLAN.md`
- `docs/DATA_AND_MAPPING_SPEC.md`
- `docs/ROADMAP.md`

Keep documentation practical, current, and aligned with the actual repository state.
