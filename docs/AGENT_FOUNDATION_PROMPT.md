# GitPulse — Foundation Prompt for Coding Agents

You are working on **GitPulse**, an open-source creative web app.

## Product summary

GitPulse turns one or more GitHub usernames into a generative audio-visual experience.

A user enters a GitHub username, or multiple usernames, and the app fetches public GitHub activity, normalises it, optionally merges accounts into one composite profile, then generates music and audio-reactive visuals.

The desired feel is:

> Spotify Wrapped meets GitHub contributions meets old-school music visualiser meets futuristic generative art.

## Core features

The MVP must support:

- single GitHub username input;
- multiple GitHub usernames merged into one composite profile;
- public GitHub profile/repo/language fetch;
- normalised internal data model;
- demo data fallback;
- Tone.js generated audio;
- React Three Fiber audio-reactive visuals;
- mood presets: Futuristic, Playful, Epic;
- play/pause controls;
- tempo, intensity, and remix controls;
- static frontend deployment.

## Core architecture rules

- Do not couple UI/audio/visuals directly to raw GitHub API responses.
- Always normalise GitHub data into GitPulse types first.
- Preserve multi-account source attribution using `sourceUsernames` and source breakdowns.
- MVP merge mode is `composite`.
- Audio must only start after explicit user interaction.
- Do not add OAuth, private repo support, backend services, databases, paid AI APIs, or export systems unless explicitly requested.
- Keep changes focused and easy to review.

## Preferred stack

- React
- TypeScript
- Vite
- Tailwind CSS
- Tone.js
- Three.js
- React Three Fiber
- Drei
- Framer Motion
- Zustand or lightweight React state

## Recommended folders

```text
src/
  app/
  audio/
  components/
  data/
  github/
  mappings/
  moods/
  state/
  types/
  visuals/
docs/
```

## Working style

Before editing:

1. Inspect relevant files.
2. Identify the minimal change required.
3. State any risks.

When editing:

1. Make focused changes only.
2. Avoid unrelated refactors.
3. Preserve existing behaviour unless asked.
4. Keep types and contracts clean.

After editing:

1. Summarise changed files.
2. Explain implemented behaviour.
3. Run checks if available:
   - `npm run typecheck`
   - `npm run lint`
   - `npm run build`
4. Report check results.
5. List any remaining risks or follow-ups.

## High-risk changes requiring approval

Do not implement these without explicit instruction:

- OAuth;
- backend/serverless APIs;
- database persistence;
- private repository access;
- paid AI services;
- telemetry/analytics;
- audio/video export;
- licensing changes;
- major visual identity changes;
- removal of multi-account merge support.

## Definition of good output

A good agent response includes:

```text
Before edits:
- Files inspected
- Issue/opportunity found
- Planned minimal change

After edits:
- Files changed
- Behaviour implemented
- Checks run and results
- Risks/follow-ups
```
