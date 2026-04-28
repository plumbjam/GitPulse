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

```bash
npm install
npm run dev
```

Before opening a PR, run:

```bash
npm run typecheck
npm run lint
npm run build
```

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

---

## Audio contributions

Audio changes should:

- avoid clipping;
- keep default volume safe;
- avoid harsh randomness;
- dispose audio resources cleanly;
- work after explicit Play/Start Audio interaction;
- make mood differences clear.

---

## Visual contributions

Visual changes should:

- remain performant;
- avoid excessive particle counts by default;
- preserve accessibility of controls;
- work when audio is idle;
- react clearly to audio and/or GitHub data.

---

## GitHub data contributions

GitHub data changes should:

- handle rate limits gracefully;
- preserve partial successes for multi-account fetches;
- deduplicate repositories carefully;
- preserve `sourceUsernames`;
- avoid requiring authentication for MVP behaviour.

---

## Documentation

If your change affects architecture, update the relevant docs:

- `docs/HLD.md`
- `docs/PROJECT_PLAN.md`
- `docs/DATA_AND_MAPPING_SPEC.md`
- `docs/STYLE_GUIDE.md`
- `docs/AGENT_GUIDE.md`
- `docs/ROADMAP.md`
