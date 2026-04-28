# Contributing to GitPulse

Thank you for considering a contribution to GitPulse.

GitPulse is an open-source creative coding project that turns GitHub activity into generative audio and audio-reactive visuals.

---

## Project principles

Please preserve these principles:

1. GitPulse should feel creative, musical, and visually distinctive.
2. Multi-account merge support is a core feature.
3. GitHub API responses should be normalised before use.
4. Audio must only start after explicit user interaction.
5. The app should work with public GitHub data and demo data.
6. No secrets or tokens should be committed.
7. MVP should remain frontend-first and easy to deploy.

---

## Development setup

From a fresh clone:

```bash
npm install
npm run dev
```

Before opening a PR, run the full local check suite:

```bash
npm run lint
npm run format:check
npm run typecheck
npm run test
npm run build
```

If formatting fails, run:

```bash
npm run format
npm run format:check
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

## Known Stage 1 tooling gotchas

These were encountered during the initial Stage 1 scaffold validation and should be kept in mind when editing tooling or tests.

### 1. Prettier check vs write script

The repo uses:

```json
{
  "format": "prettier --write .",
  "format:check": "prettier --check ."
}
```

If `npm run format:check` reports many files with style issues, run:

```bash
npm run format
npm run format:check
```

Do not assume there is a `format:write` script unless one is explicitly added to `package.json`.

### 2. Vitest config must use `vitest/config`

If `npm run typecheck` reports that `test` does not exist in `vite.config.ts`, make sure `defineConfig` is imported from Vitest, not plain Vite:

```ts
import { defineConfig } from 'vitest/config'
```

not:

```ts
import { defineConfig } from 'vite'
```

The `test` block in `vite.config.ts` is a Vitest extension, so TypeScript needs the Vitest-aware config helper.

### 3. Vitest globals should be imported explicitly in tests

Prefer explicit Vitest imports in test files:

```ts
import { describe, expect, it } from 'vitest'
```

This avoids TypeScript errors such as:

```text
Cannot find name 'describe'
Cannot find name 'it'
Cannot find name 'expect'
```

### 4. jsdom does not provide every browser API

Some shadcn/Radix components rely on browser APIs that are not always available in jsdom.

If tests fail with:

```text
ReferenceError: ResizeObserver is not defined
```

add or preserve the no-op `ResizeObserver` mock in:

```text
src/test/setup.ts
```

Example:

```ts
import '@testing-library/jest-dom/vitest'

class ResizeObserverMock {
  observe() {
    // No-op for jsdom tests.
  }

  unobserve() {
    // No-op for jsdom tests.
  }

  disconnect() {
    // No-op for jsdom tests.
  }
}

globalThis.ResizeObserver = ResizeObserverMock
```

### 5. Testing Library queries should be specific

Avoid broad text queries that may match multiple parts of the page.

For example, this can fail if the word appears elsewhere:

```ts
screen.getByText(/GitPulse/i)
```

Prefer a more specific query:

```ts
screen.getByText('GitPulse')
```

Or, where possible, use semantic queries such as:

```ts
screen.getByRole('heading', { name: /your github activity has a sound/i })
```

The preferred Testing Library style is to query the UI in the way a user or assistive technology would perceive it.

### 6. GitHub Pages base path

The app is prepared for GitHub Pages under the repository path:

```text
/GitPulse/
```

During local development, if the app appears blank at:

```text
http://localhost:5173/
```

try:

```text
http://localhost:5173/GitPulse/
```

Avoid hardcoded absolute asset paths that would break when deployed to GitHub Pages.

---

## Code organisation

Recommended folders:

```text
src/audio       Tone.js audio engine and sequencer
src/github      GitHub API client, normalisation, merge logic
src/visuals     React Three Fiber scenes and audio-reactive visuals
src/moods       Mood configuration
src/types       Shared TypeScript contracts
src/components  UI components
src/data        Demo data and static fixtures
```

Current Stage 1 scaffold folders include:

```text
src/app         App entry and providers
src/components  UI shell, controls, visualiser placeholder, shadcn-style primitives
src/data        Demo data
src/domain      Shared domain contracts
src/store       Zustand state
src/styles      Global styles
src/test        Vitest setup
```

As the project matures, new feature areas should be added deliberately rather than by scattering logic across components.

---

## Pull request guidance

A good PR should include:

- clear summary;
- screenshots/GIFs for visual changes;
- audio behaviour notes for sound changes;
- tests where appropriate;
- documentation updates when architecture changes.

Please avoid:

- broad unrelated refactors;
- introducing backend services without discussion;
- adding paid APIs as required dependencies;
- removing demo data fallback;
- breaking multi-account source attribution.

Before requesting review, run:

```bash
npm run lint
npm run format:check
npm run typecheck
npm run test
npm run build
```

If a command cannot be run, state why in the PR notes.

---

## Git hooks

The repo uses Husky and lint-staged.

Expected behaviour:

- pre-commit: staged formatting/lint checks;
- pre-push: stricter checks such as typecheck, tests, and build.

If hooks do not appear to run after install, try:

```bash
npm run prepare
```

Hooks can be bypassed with `--no-verify` for exceptional cases, but this should not be normal practice.

---

## CI and release labels

Pull requests and pushes to `main` should run the CI workflow.

Release tagging is expected to use labels:

- `release:major`
- `release:minor`
- `release:patch`

If no release label is present, the workflow should default to a patch bump.

Tags use the format:

```text
version-X.Y.Z
```

Example:

```text
version-0.1.1
```

---

## Audio contributions

Audio changes should:

- avoid clipping;
- keep default volume safe;
- avoid harsh randomness;
- dispose audio resources cleanly;
- work after explicit Play/Start Audio interaction;
- make mood differences clear.

Browser audio must only begin after explicit user interaction. Do not initialise active playback on page load.

---

## Visual contributions

Visual changes should:

- remain performant;
- avoid excessive particle counts by default;
- preserve accessibility of controls;
- work when audio is idle;
- react clearly to audio and/or GitHub data.

Prefer progressive enhancement: the UI should still be understandable if advanced visuals fail or are disabled.

---

## GitHub data contributions

GitHub data changes should:

- handle rate limits gracefully;
- preserve partial successes for multi-account fetches;
- deduplicate repositories carefully;
- preserve `sourceUsernames`;
- avoid requiring authentication for MVP behaviour.

Multi-account merge support is core to GitPulse. Any ingestion or normalisation work should preserve account/source attribution so users can combine personal, work, and optional organisation-linked identities into one generated track without losing provenance.

---

## Documentation

If your change affects architecture, update the relevant docs:

- `docs/HLD.md`
- `docs/PROJECT_PLAN.md`
- `docs/DATA_AND_MAPPING_SPEC.md`
- `docs/STYLE_GUIDE.md`
- `docs/AGENT_GUIDE.md`
- `docs/ROADMAP.md`

If the docs remain at repository root rather than inside `docs/`, preserve the same filenames and update links accordingly.

Keep documentation practical and agent-friendly. Future contributors and coding agents should be able to understand the project direction, current stage, and boundaries without needing the original planning conversation.
