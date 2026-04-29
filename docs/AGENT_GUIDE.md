# GitPulse — Agent Guide

## 1. Purpose of this guide

This guide explains how to brief coding agents to work on GitPulse safely and effectively.

GitPulse is a creative web application that turns one or more GitHub usernames into generative audio and audio-reactive visuals.

Agents should work in small, testable passes and avoid broad, uncontrolled rewrites.

This guide also defines the expected reporting standard for agent work. Agent reports must include enough evidence for the project owner to judge whether a pass is truly green.

---

## 2. Core project intent

GitPulse should feel like:

> Spotify Wrapped meets GitHub contributions meets old-school music visualiser meets futuristic generative art.

The app should:

- fetch public GitHub activity;
- support multiple usernames merged into one profile;
- generate music from activity data;
- render audio-reactive visuals;
- expose mood and tuning controls;
- remain open-source and easy to run.

---

## 3. Preferred agent working style

Agents should:

1. inspect relevant files first;
2. state what they found;
3. identify assumptions and possible mismatches;
4. make focused changes only;
5. avoid unrelated refactors;
6. preserve existing behaviour unless explicitly asked to change it;
7. run available checks;
8. summarise exactly what changed;
9. provide evidence against the task acceptance criteria;
10. state what was and was not manually verified;
11. list any risks or follow-up tasks.

Agents should not:

- rewrite the whole app unless requested;
- introduce backend infrastructure without approval;
- add paid services without approval;
- commit secrets or tokens;
- silently change public contracts;
- make the audio start automatically;
- remove multi-account source attribution;
- remove demo fallback behaviour;
- overclaim that a pass is verified when runtime/manual checks were not possible.

---

## 4. Standard agent prompt structure

Use this structure when asking an agent to do work.

```md
# Task

[Describe the specific change.]

# Context

GitPulse is a React/Vite/TypeScript app that turns one or more GitHub usernames into generative audio and audio-reactive visuals.

Important product rules:

- Multi-account merge is a first-class feature.
- GitHub data must be normalised before audio/visual use.
- The contribution calendar is the preferred audio timing source.
- Audio must only start after explicit user interaction.
- OAuth/backend/private repo support must only be added when explicitly requested.
- Keep changes focused and testable.

# Current state to inspect before editing

[List files/folders and behaviours the agent must inspect.]

# Required behaviour

[List exact expected behaviour.]

# Acceptance criteria

[Numbered list of concrete criteria.]

# Non-goals

[List what the agent must not touch.]

# Checks

Run:

- npm run format
- npm run lint
- npm run format:check
- npm run typecheck
- npm run test
- npm run build

# Output required

Use the required final report template from this guide.
```

---

## 5. Required final report template

Every agent completion report should use this structure.

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

| Behaviour                    | Verified?                 | Notes |
| ---------------------------- | ------------------------- | ----- |
| Browser UI loads             | Yes / No / Not available  | ...   |
| Audible playback             | Yes / No / Not applicable | ...   |
| No clipping/distortion       | Yes / No / Not applicable | ...   |
| Play/Stop no duplicate loops | Yes / No / Not applicable | ...   |
| Active tile follows playback | Yes / No / Not applicable | ...   |
| OAuth login flow             | Yes / No / Not applicable | ...   |

### Known Limitations

- ...

### Residual Risks / Follow-up Candidates

- ...

### Recommended Next Stage

- ...
```

Status meanings:

- `DONE`: implemented and verified by tests, manual checks, or both.
- `PARTIAL`: implemented but incomplete, or only part of the requirement is satisfied.
- `NOT VERIFIED`: implementation exists, but the agent could not verify the behaviour.
- `BLOCKED`: could not implement or verify because of a dependency, missing credential, environment limitation, or unresolved issue.

---

## 6. Reporting evidence requirements

Agents should avoid vague statements such as:

```text
Implemented and working.
```

Instead, they should provide evidence:

```text
Implemented full-range playback.
Evidence: contributionSequencer.test.ts verifies pattern.steps.length equals calendar.days.length; manual browser test was not available.
```

For tuning changes, agents should include before/after values:

```text
Default volume: 35% -> 58%
Limiter ceiling: -6 dB -> -3 dB
Loop length: fixed 64 steps -> dynamic full calendar range
```

For runtime-sensitive claims, agents must say whether they were manually verified.

Examples:

```text
Audible loudness: Not manually verified from this environment.
OAuth login: Not verified because no GitHub OAuth credentials were available.
Active tile auto-scroll: Verified in browser at localhost.
```

---

## 7. Example prompt — app skeleton

```md
# Task

Create the initial GitPulse app skeleton.

# Context

GitPulse turns GitHub activity into generative audio and audio-reactive visuals. The MVP will support one or more GitHub usernames and merge multiple accounts into a composite profile.

# Required behaviour

Create a React/Vite/TypeScript/Tailwind app shell with:

- Header
- UsernameForm
- AccountChips
- MoodSelector
- TransportControls
- VisualCanvas placeholder
- InsightPanel placeholder

Use mock data only in this pass.

# Non-goals

Do not add GitHub API calls yet.
Do not add Tone.js playback yet.
Do not add Three.js rendering yet.
Do not add backend code.

# Checks

Run the configured checks if available.

# Output required

Use the required final report template.
```

---

## 8. Example prompt — multi-account merge

```md
# Task

Add multi-account username parsing and composite dataset merge support.

# Context

GitPulse must allow users to combine personal and work GitHub accounts into one generated track. This is a core product requirement.

# Required behaviour

- Username input accepts single username, comma-separated usernames, or space-separated usernames.
- Duplicate usernames are removed.
- Each valid username is fetched separately.
- Successful accounts are displayed as chips.
- Failed accounts show clear errors without crashing successful accounts.
- Repositories are deduplicated by canonical owner/name.
- Source usernames are preserved on repos and activity days.
- Output dataset uses composite/merged mode.

# Files likely involved

src/github/
src/domain/
src/components/
src/store/

# Non-goals

Do not implement layered audio mode yet.
Do not implement compare mode yet.
Do not add OAuth.
Do not add backend code.

# Checks

Run the configured checks.

# Output required

Use the required final report template.
```

---

## 9. Example prompt — audio engine

```md
# Task

Implement the first Tone.js audio engine for GitPulse.

# Context

The audio engine should translate a normalised GitPulseDataset into a generated loop. Audio must only start after explicit user interaction due to browser autoplay restrictions.

# Required behaviour

- Create audio engine under src/audio.
- Add Play/Stop controls.
- Generate a deterministic loop from the contribution calendar.
- Use safe default volume and limiter/compressor protection.
- Use simple instruments: kick, snare/clap, hi-hat, bass synth, lead synth, pad.
- Keep pure mapping functions separate from Tone.js runtime.
- Avoid duplicate scheduled loops on repeated Play/Stop.
- Dispose or stop audio resources cleanly.

# Non-goals

Do not add AI audio.
Do not add export.
Do not require a backend.
Do not autoplay.

# Checks

Run the configured checks.

# Output required

Use the required final report template, including:

- audio lifecycle details;
- volume/gain before/after values;
- whether audible playback was manually verified.
```

---

## 10. Example prompt — visual engine

```md
# Task

Implement the first React Three Fiber visualiser for GitPulse.

# Context

GitPulse visuals should combine an old-school audio visualiser feel with GitHub-specific meaning. The MVP visual motif is Pulse Field + Repo Orbit.

# Required behaviour

- Add VisualCanvas using React Three Fiber.
- Show central identity core.
- Show repo nodes orbiting around the core.
- Map language to colour.
- Map stars/recent activity to size or brightness.
- Use audio analyser values to drive pulse/glow/movement.
- Provide idle animation when audio is not playing.

# Non-goals

Do not add heavy custom shaders yet.
Do not add export.
Do not add multiple visual modes unless trivial.

# Checks

Run the configured checks.

# Output required

Use the required final report template, including:

- performance notes;
- manual browser verification status;
- any visual limitations.
```

---

## 11. Example prompt — OAuth/serverless broker

```md
# Task

Implement GitHub OAuth login via a small serverless broker.

# Context

GitPulse currently supports manual token entry for GitHub GraphQL contribution calendar access. The desired public UX is Log in with GitHub. The GitHub Pages frontend must not contain the OAuth client secret.

# Required behaviour

- Add GitHub OAuth login UI.
- Generate and validate OAuth state.
- Add or scaffold a serverless broker for code-for-token exchange.
- Keep the GitHub client secret server-side only.
- Store token/session data safely.
- Keep demo/approximate fallback working without login.
- Keep manual token mode as advanced fallback unless explicitly removed.

# Non-goals

Do not add a database.
Do not add full user accounts.
Do not request broad repository scopes unless justified.
Do not expose secrets in frontend code.

# Checks

Run the configured checks.

# Output required

Use the required final report template, including:

- environment variables required;
- callback URLs;
- what was actually tested;
- what could not be tested without credentials;
- security-sensitive files touched.
```

---

## 12. Data model rules agents must preserve

Agents must preserve these principles:

1. UI should not consume raw GitHub API objects directly.
2. Audio should consume `GitPulseDataset` or derived mapping objects.
3. Visuals should consume `GitPulseDataset` or visual-ready projections.
4. Multi-account source attribution must be preserved.
5. Deduplication should use GitHub repo ID where possible, then canonical repo names.
6. Merge/composite mode should be explicit.
7. The app should work with demo data.
8. Contribution calendar and repo-push fallback must be clearly distinguished.
9. Private contribution counts must not be used to infer private repo details.

---

## 13. Audio implementation rules

Agents working on audio must:

- initialise audio only after user action;
- avoid autoplay;
- cap/limit master volume;
- avoid clipping;
- report before/after volume/gain changes;
- dispose or stop Tone.js nodes cleanly;
- prevent duplicate scheduled loops;
- keep generated patterns deterministic when intended;
- avoid uncontrolled randomness;
- keep mood configuration data-driven where possible;
- keep pure mapping functions testable;
- explicitly say whether audible playback and clipping were manually verified.

---

## 14. Visual implementation rules

Agents working on visuals must:

- keep R3F code isolated under appropriate visual components where possible;
- avoid excessive particle counts;
- keep idle state visually interesting;
- make mood changes visually obvious;
- preserve accessibility of surrounding controls;
- avoid blocking the UI thread;
- explicitly state whether animation/performance was manually verified.

---

## 15. GitHub API implementation rules

Agents working on GitHub integration must:

- handle rate limits gracefully;
- include demo fallback;
- never commit tokens;
- isolate API calls under `src/github`;
- preserve partial successes for multi-account fetches;
- clearly report failed usernames;
- distinguish public REST data from GraphQL contribution calendar data;
- never infer private repo details from anonymous contribution counts.

---

## 16. Documentation update rules

When an agent changes architecture or product behaviour, it should update relevant docs:

- `README.md` for current status and setup;
- `docs/HLD.md` for major design changes;
- `docs/PROJECT_PLAN.md` for delivery changes;
- `docs/DATA_AND_MAPPING_SPEC.md` for data/mapping changes;
- `docs/STYLE_GUIDE.md` for visual/audio style changes;
- `CONTRIBUTING.md` for workflow, testing, and contributor guidance.

---

## 17. Agent completion checklist

Every agent response should include:

```text
Before edits:
- What was inspected
- Current repo state
- What needed changing
- Risks identified
- Planned minimal changes

After edits:
- Files created
- Files modified
- Behaviour implemented
- Acceptance criteria status table
- Tuning / behaviour before-after table
- Tests added or updated
- Commands run and results
- Manual verification status
- Known limitations
- Residual risks/follow-ups
```

---

## 18. High-risk changes needing explicit approval

Agents should not do these without explicit instruction:

- add OAuth;
- add backend/serverless infrastructure;
- add a database;
- add paid AI services;
- add telemetry/analytics;
- change licensing;
- change the core product direction;
- remove multi-account merge support;
- remove demo data fallback;
- store tokens insecurely;
- expose client secrets in frontend code.
