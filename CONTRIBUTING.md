# Contributing to GitPulse

Thank you for considering a contribution to GitPulse.

GitPulse is an open-source creative coding project that turns GitHub activity into generative audio and audio-reactive visuals.

---

## Project principles

Please preserve these principles:

1. GitPulse should feel creative, musical, and visually distinctive.
2. Multi-account merge support is a core feature.
3. GitHub API responses should be normalized before use.
4. Contribution counts are creative timing signals, not forensic reporting.
5. Audio must only start after explicit user interaction.
6. The app should work with public GitHub data and demo data.
7. No secrets or tokens should be committed.
8. MVP should remain frontend-first and easy to deploy.

---

## Current scope

The current completed stage is:

```text
Stage 3.3A - Media transport controls and playback start position
```

This stage includes:

- public GitHub REST repo/language ingestion;
- multi-account merged datasets;
- optional GitHub GraphQL contribution calendar fetching;
- GitHub OAuth login through a Cloudflare Worker broker;
- session-scoped OAuth token storage with advanced manual token fallback;
- demo and approximate contribution fallbacks;
- merged contribution grid rendering;
- deterministic Tone.js contribution sequencing;
- full-range contribution playback with one day per audio step;
- contribution-linked media bar under the grid with dynamic step counts and active step highlighting;
- matching contribution grid tile glow while playback advances;
- active tile auto-follow inside the scrollable contribution grid;
- media-style transport controls with Reset, Skip Back, Play/Pause, Stop, and Skip Forward;
- default playback start from the first active contribution day, with quiet timelines falling back to step 0;
- clickable media segments and contribution grid tiles that cue the playhead without autoplay;
- pause behavior that preserves the current playhead and stop/reset behavior that returns it to the first active contribution day;
- one-step skip controls for moving by one contribution day;
- BPM, reset-to-mood-default, and volume controls in the media bar;
- Stage 2, 2.5, Stage 3 pure-function tests, and focused audio state/media UI tests.

This stage intentionally does not include:

- full user accounts or database-backed sessions;
- backend proxies beyond the OAuth broker;
- private repo detail fetching;
- downloaded sample packs;
- AI audio generation;
- audio export or MIDI export;
- per-account audio layers;
- mood-specific sound mapping controls, planned for Stage 3.3B;
- live R3F scenes;
- export or share flows.

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

Recommended tools:

- Git for Windows
- Node.js LTS
- npm
- VS Code or another editor

Check versions with:

```cmd
git --version
node --version
npm --version
```

If `npm install` fails with registry issues, check and reset the npm registry:

```cmd
npm config get registry
npm config set registry https://registry.npmjs.org/
npm cache clean --force
npm install
```

---

## Tooling gotchas

### 1. Prettier write vs check

The repo uses:

```json
{
  "format": "prettier --write .",
  "format:check": "prettier --check ."
}
```

If `npm run format:check` fails, run:

```bash
npm run format
npm run format:check
```

### 2. Vitest config must use `vitest/config`

Keep:

```ts
import { defineConfig } from 'vitest/config'
```

### 3. Import Vitest globals explicitly in tests

Prefer:

```ts
import { describe, expect, it } from 'vitest'
```

### 4. Preserve the jsdom `ResizeObserver` mock

If UI tests fail with `ResizeObserver is not defined`, keep the no-op mock in `src/test/setup.ts`.

### 5. GitHub Pages base path

The app is prepared for GitHub Pages under:

```text
/GitPulse/
```

Avoid hardcoded absolute asset paths that break repository-path deployments.

---

## GitHub data guidance

### REST data

Stage 2 REST data work should preserve:

- public GitHub endpoints only;
- partial language-fetch warnings instead of hard failure;
- repo deduplication with preserved `sourceUsernames`;
- demo fallback behavior;
- no private repo access for MVP.

### Contribution calendar data

Stage 2.5 contribution calendar work should preserve:

- GraphQL is optional and token-gated;
- do not attempt GraphQL calendar fetches without an OAuth or manual token;
- OAuth tokens stay in `sessionStorage` for the browser session;
- manual tokens stay in memory only;
- do not log tokens;
- do not store token values in source-controlled files;
- do not expose GitHub OAuth client secrets in frontend code;
- if GraphQL contribution fetch fails, preserve the REST dataset and fall back to approximate contribution activity;
- merged calendars must preserve `perIdentityCounts`, `sourceUsernames`, and date continuity.

### GitHub OAuth broker behavior

Stage 2.6 OAuth work should preserve:

- GitHub Pages as the frontend deployment target;
- Cloudflare Worker as the code-for-token broker;
- `read:user` as the default OAuth scope;
- OAuth state generation and validation before code exchange;
- callback query params removed after processing;
- OAuth token preferred over the manual token for GraphQL;
- disconnect clearing the OAuth session without deleting REST/demo data.

### Tone.js audio behavior

Stage 3 audio work should preserve:

- no autoplay;
- `Tone.start()` only inside an explicit user-gesture path;
- the merged contribution calendar as the primary rhythm source;
- approximate fallback only from normalized in-memory data;
- deterministic full-range contribution sequencing;
- dynamic loop bars calculated from the contribution day count;
- the media bar and Tone runtime sharing the same generated audio pattern;
- active step callbacks scheduled through Tone's UI-safe draw path when available;
- loop/reset start defaulting to the first active contribution step, or step 0 when all steps are quiet;
- media segment and contribution grid tile clicks cueing the current playhead without changing the loop start or autoplaying;
- `Pause` preserving the current playhead while stopping audible playback;
- `Stop` resetting the visible media playhead to the first active contribution step;
- Skip Back and Skip Forward moving exactly one contribution step and clamping safely;
- mood default BPM unless the user has manually overridden BPM;
- safe Play and Stop behavior without duplicate overlapping loops;
- comfortably audible volume defaults and limiter-backed output;
- pure audio mapping logic kept separate from the Tone runtime so tests can stay browser-independent.

Custom media SVG icons belong in:

```text
src/assets/icons/media/
```

`skip-forward.svg` should match the style of `skip-back.svg`; the media controls should keep working with `lucide-react` fallback icons if a custom SVG is unavailable.

### Privacy rules

- GitPulse must not infer private repository names, languages, or details from contribution counts.
- Private or restricted contributions, if included by GitHub for a token and account settings, must be treated as anonymous count data only.
- Contribution grids are timing and activity signals, not forensic reports.

### Fallback behavior

Keep these modes working:

- `demo`
- `graphql`
- `approximate`
- `mixed`

The Stage 2 repo-push `days` array remains approximate and should stay clearly documented as such.

---

## Code organization

Recommended folders:

```text
src/audio       Audio pattern mapping, sequencing, instruments, runtime engine, tests
src/github      GitHub REST/GraphQL clients, normalization, merge logic, fixtures, tests
src/data        Demo data
src/domain      Shared dataset contracts
src/store       Zustand state
src/components  UI components
src/app         App entry and providers
src/test        Vitest setup
```

Keep API fetching, normalization, merge logic, UI wiring, and Tone runtime behavior separate.

---

## Pull request guidance

A good PR should include:

- a clear summary;
- screenshots or GIFs for UI changes;
- tests where appropriate;
- documentation updates when architecture changes.

Please avoid:

- broad unrelated refactors;
- backend services without discussion;
- paid APIs as required dependencies;
- removing demo or approximate fallbacks;
- mixing Tone.js runtime objects into serializable Zustand dataset state;
- adding AI audio or downloaded samples to the Stage 3 MVP without explicit scope approval;
- breaking multi-account source attribution;
- unsafe token handling.

If a command cannot be run locally, note that in the PR summary.

---

## Git hooks, CI, and labels

Expected checks:

- pre-commit: staged formatting and lint checks;
- pre-push: typecheck, tests, and build;
- CI: `npm run lint`, `npm run format:check`, `npm run typecheck`, `npm run test`, `npm run build`.

Release labels:

- `release:major`
- `release:minor`
- `release:patch`

Tags use:

```text
version-X.Y.Z
```

---

## Documentation

If your change affects architecture or Stage 3 behavior, update the relevant docs:

- `README.md`
- `CONTRIBUTING.md`
- `HLD.md`
- `docs/PROJECT_PLAN.md`
- `docs/DATA_AND_MAPPING_SPEC.md`
- `docs/OAUTH_SETUP.md`
- `docs/ROADMAP.md`

Keep documentation aligned with the real repository state rather than the intended future state.
