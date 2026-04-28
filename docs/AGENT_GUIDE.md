# GitPulse — Agent Guide

## 1. Purpose of this guide

This guide explains how to brief coding agents to work on GitPulse safely and effectively.

GitPulse is a creative web application that turns one or more GitHub usernames into generative audio and audio-reactive visuals.

Agents should work in small, testable passes and avoid broad, uncontrolled rewrites.

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
3. make focused changes only;
4. avoid unrelated refactors;
5. preserve existing behaviour unless explicitly asked to change it;
6. run available checks;
7. summarise exactly what changed;
8. list any risks or follow-up tasks.

Agents should not:

- rewrite the whole app unless requested;
- introduce backend infrastructure without approval;
- add paid services without approval;
- commit secrets or tokens;
- silently change public contracts;
- make the audio start automatically;
- remove multi-account source attribution.

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
- Audio must only start after explicit user interaction.
- No OAuth/backend/private repo support in MVP unless explicitly requested.
- Keep changes focused and testable.

# Files likely involved

[List files or folders.]

# Required behaviour

[List exact expected behaviour.]

# Non-goals

[List what the agent must not touch.]

# Checks

Run:

- npm run typecheck
- npm run lint
- npm run build

# Output required

Return:

1. files changed;
2. summary of changes;
3. checks run and results;
4. risks/follow-ups.
```

---

## 5. Example prompt — app skeleton

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
Do not add Tone.js yet.
Do not add Three.js yet.
Do not add backend code.

# Checks

Run typecheck/build if configured.

# Output required

Summarise files changed and any setup notes.
```

---

## 6. Example prompt — multi-account merge

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
- Output dataset uses mergeMode: 'composite'.

# Files likely involved

src/github/
src/types/
src/components/UsernameForm.tsx
src/components/AccountChips.tsx

# Non-goals

Do not implement layered audio mode yet.
Do not implement compare mode yet.
Do not add OAuth.
Do not add backend code.

# Checks

Run:

- npm run typecheck
- npm run build

# Output required

Return files changed, summary, checks, and known limitations.
```

---

## 7. Example prompt — audio engine

```md
# Task

Implement the first Tone.js audio engine for GitPulse.

# Context

The audio engine should translate a normalised GitPulseDataset into a generated loop. Audio must only start after explicit user interaction due to browser autoplay restrictions.

# Required behaviour

- Create AudioEngine under src/audio.
- Add Play/Pause/Stop controls.
- Generate a 16-bar loop from the dataset.
- Use safe default volume and a limiter/compressor.
- Use simple instruments: kick, snare/clap, hi-hat, bass synth, lead synth, pad.
- Use pentatonic scale or similarly safe constraints.
- Dispose audio resources cleanly.

# Non-goals

Do not add AI audio.
Do not add export.
Do not require a backend.
Do not autoplay.

# Checks

Run:

- npm run typecheck
- npm run build

# Output required

Return files changed, summary, checks, and audio behaviour notes.
```

---

## 8. Example prompt — visual engine

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

Run:

- npm run typecheck
- npm run build

# Output required

Return files changed, summary, checks, and performance notes.
```

---

## 9. Data model rules agents must preserve

Agents must preserve these principles:

1. UI should not consume raw GitHub API objects directly.
2. Audio should consume `GitPulseDataset` or derived mapping objects.
3. Visuals should consume `GitPulseDataset` or visual-ready projections.
4. Multi-account source attribution must be preserved.
5. Deduplication should use canonical repo names where possible.
6. Merge mode should be explicit.
7. The app should work with demo data.

---

## 10. Audio implementation rules

Agents working on audio must:

- initialise audio only after user action;
- avoid autoplay;
- cap master volume;
- avoid clipping;
- dispose Tone.js nodes cleanly;
- keep generated patterns deterministic when a seed is provided;
- avoid uncontrolled randomness;
- keep mood configuration data-driven where possible.

---

## 11. Visual implementation rules

Agents working on visuals must:

- keep R3F code isolated under `src/visuals` where possible;
- avoid excessive particle counts;
- keep idle state visually interesting;
- make mood changes visually obvious;
- preserve accessibility of surrounding controls;
- avoid blocking the UI thread.

---

## 12. GitHub API implementation rules

Agents working on GitHub integration must:

- handle rate limits gracefully;
- include demo fallback;
- avoid requiring tokens in MVP;
- never commit tokens;
- isolate API calls under `src/github`;
- preserve partial successes for multi-account fetches;
- clearly report failed usernames.

---

## 13. Documentation update rules

When an agent changes architecture, it should update relevant docs:

- `docs/HLD.md` for major design changes;
- `docs/PROJECT_PLAN.md` for delivery changes;
- `docs/DATA_AND_MAPPING_SPEC.md` for data/mapping changes;
- `docs/STYLE_GUIDE.md` for visual/audio style changes;
- `README.md` for user-facing setup changes.

---

## 14. Agent completion checklist

Every agent response should include:

```text
Before edits:
- What was inspected
- What needed changing
- Risks identified

After edits:
- Files changed
- Behaviour implemented
- Checks run
- Results
- Remaining risks/follow-ups
```

---

## 15. High-risk changes needing explicit approval

Agents should not do these without explicit instruction:

- add OAuth;
- add backend/serverless infrastructure;
- add a database;
- add paid AI services;
- add telemetry/analytics;
- change licensing;
- change the core product direction;
- remove multi-account merge support;
- remove demo data fallback.
