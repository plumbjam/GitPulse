# GitPulse — Foundation Prompt for Coding Agents

You are working on **GitPulse**, an open-source creative web app.

## Product summary

GitPulse turns one or more GitHub usernames into a generative audio-visual experience.

A user enters a GitHub username, or multiple usernames, and the app fetches public GitHub activity, normalises it, optionally merges accounts into one composite profile, then generates music and audio-reactive visuals.

The desired feel is:

> Spotify Wrapped meets GitHub contributions meets old-school music visualiser meets futuristic generative art.

## Current product direction

GitPulse is being built in focused stages.

Current architectural direction:

- GitHub REST data provides profile, repository, and language metadata.
- GitHub GraphQL contribution-calendar data can be used when the user provides authorised access.
- Multi-account identities are merged into one composite GitPulse dataset.
- The contribution calendar is the primary timing source for audio.
- Tone.js provides deterministic generated audio.
- React Three Fiber will later provide live audio-reactive visuals.
- GitHub Pages remains the frontend deployment target.
- OAuth/serverless work must only be introduced when explicitly scoped.

## Core features

The MVP must support:

- single GitHub username input;
- multiple GitHub usernames merged into one composite profile;
- public GitHub profile/repo/language fetch;
- normalised internal data model;
- demo data fallback;
- merged contribution calendar;
- contribution signal grid;
- Tone.js generated audio;
- contribution-linked media/playback bar;
- React Three Fiber audio-reactive visuals in a later stage;
- mood presets: Futuristic, Playful, Epic, Lo-fi, Glitch, Ambient;
- play/stop controls;
- BPM, volume, intensity, and remix controls;
- static frontend deployment.

## Core architecture rules

- Do not couple UI/audio/visuals directly to raw GitHub API responses.
- Always normalise GitHub data into GitPulse types first.
- Preserve multi-account source attribution using `sourceUsernames` and source breakdowns.
- Audio must only start after explicit user interaction.
- Browser audio must avoid clipping and runaway duplicate playback loops.
- The audio engine should consume derived audio patterns, not raw API responses.
- Visuals should consume normalised data or visual-ready projections.
- Do not add OAuth, private repo support, backend services, databases, paid AI APIs, telemetry, or export systems unless explicitly requested.
- Keep changes focused and easy to review.

## Preferred stack

- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn-style UI primitives
- Tone.js
- Three.js
- React Three Fiber
- Drei
- Framer Motion
- Zustand
- Vitest
- React Testing Library
- ESLint
- Prettier
- Husky / lint-staged

## Recommended folders

```text
src/
  app/
  audio/
  components/
  data/
  domain/
  github/
  hooks/
  mappings/
  moods/
  store/
  styles/
  test/
  visuals/
docs/
```

## Working style

Before editing:

1. Inspect relevant files.
2. Confirm the current repo state.
3. Identify the minimal change required.
4. State any risks or uncertain areas.
5. Check for mismatches between task assumptions and actual files.

When editing:

1. Make focused changes only.
2. Avoid unrelated refactors.
3. Preserve existing behaviour unless asked.
4. Keep types and contracts clean.
5. Prefer pure, testable mapping functions for data/audio/visual transformations.
6. Avoid storing runtime objects such as Tone.js nodes inside serialisable app data.

After editing:

1. Summarise changed files.
2. Explain implemented behaviour.
3. Run checks if available.
4. Report check results truthfully.
5. Provide evidence against the task acceptance criteria.
6. Clearly state anything that was not manually verified.
7. List remaining risks or follow-ups.

## Standard checks

When available, run the full local suite:

```bash
npm run format
npm run lint
npm run format:check
npm run typecheck
npm run test
npm run build
```

If a command cannot be run, explain exactly why.

Do not claim that a command passed unless it was actually run.

## High-risk changes requiring approval

Do not implement these without explicit instruction:

- OAuth;
- backend/serverless APIs;
- database persistence;
- private repository access;
- paid AI services;
- telemetry/analytics;
- audio/video export;
- MIDI export;
- licensing changes;
- major visual identity changes;
- removal of multi-account merge support;
- removal of demo data fallback.

## Verification expectations

Agents must provide more than a summary of files changed.

For each pass, the final report must show:

- whether the acceptance criteria were met;
- what evidence supports each claim;
- what was tested automatically;
- what was tested manually;
- what was not or could not be verified;
- any behaviour that still needs human/browser/audio verification.

For subjective or runtime-sensitive work such as audio loudness, clipping, OAuth login, browser scrolling, animation smoothness, visual sync, or camera/graphics performance, the agent must explicitly distinguish:

```text
Implemented in code
Covered by tests
Manually verified
Not manually verified
```

## Required final report template

Every coding-agent completion report should use this structure.

```md
## Final Report

### Files Created

- ...

### Files Modified

- ...

### Implementation Summary

- ...

### Acceptance Criteria Status

| #   | Criterion | Status                                  | Evidence / Notes |
| --- | --------- | --------------------------------------- | ---------------- |
| 1   | ...       | DONE / PARTIAL / NOT VERIFIED / BLOCKED | ...              |

### Tuning / Behaviour Changes

| Area | Before | After | Reason |
| ---- | ------ | ----- | ------ |
| ...  | ...    | ...   | ...    |

### Tests Added or Updated

- `file.test.ts`
  - ...

### Commands Run

| Command              | Result                    |
| -------------------- | ------------------------- |
| npm run format       | Passed / Failed / Not run |
| npm run lint         | Passed / Failed / Not run |
| npm run format:check | Passed / Failed / Not run |
| npm run typecheck    | Passed / Failed / Not run |
| npm run test         | Passed / Failed / Not run |
| npm run build        | Passed / Failed / Not run |

### Manual Verification

| Behaviour                    | Verified?                | Notes |
| ---------------------------- | ------------------------ | ----- |
| Browser UI loads             | Yes / No / Not available | ...   |
| Audible playback             | Yes / No / Not available | ...   |
| No clipping/distortion       | Yes / No / Not available | ...   |
| Play/Stop no duplicate loops | Yes / No / Not available | ...   |
| Active tile follows playback | Yes / No / Not available | ...   |
| OAuth login flow             | Yes / No / Not available | ...   |

### Known Limitations

- ...

### Residual Risks / Follow-up Candidates

- ...

### Recommended Next Stage

- ...
```

For tasks where some rows are irrelevant, keep the table but mark them as `Not applicable`.

## Definition of good output

A good agent response includes:

```text
Before edits:
- Files inspected
- Current state confirmed
- Issue/opportunity found
- Planned minimal change
- Risks identified

After edits:
- Files created/modified
- Behaviour implemented
- Acceptance criteria status table
- Tuning before/after details where relevant
- Tests added/updated
- Commands run and results
- Manual verification status
- Known limitations
- Remaining risks/follow-ups
```

## Extra requirements for audio work

Agents working on audio must report:

- how audio is started and stopped;
- how duplicate scheduled loops are avoided;
- how volume is mapped and limited;
- before/after gain or loudness-related values;
- whether audible loudness and clipping were manually verified;
- whether browser autoplay restrictions are respected.

## Extra requirements for OAuth/security work

Agents working on OAuth or security-sensitive code must report:

- whether any client secrets are absent from frontend code;
- what environment variables are required;
- what callback URLs are expected;
- whether tokens are logged, persisted, or held only in runtime/session state;
- what was mocked vs actually tested;
- what cannot be verified without real credentials.

## Extra requirements for visual/playback sync work

Agents working on visual playback sync must report:

- what drives the active state;
- how UI updates are synchronised with audio/animation;
- whether the relevant element is highlighted;
- whether auto-scroll/follow behaviour was manually verified;
- performance or jitter risks.
