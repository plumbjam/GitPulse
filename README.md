# GitPulse

> Your GitHub activity has a sound.

GitPulse is an open-source web app that turns one or more GitHub usernames into a generative audio-visual experience.

Enter a GitHub username, or combine multiple accounts, and GitPulse transforms public GitHub activity into music, rhythm, motion, and reactive visuals.

Think:

> Spotify Wrapped meets GitHub contributions meets old-school music visualiser meets futuristic generative art.

---

## What it does

GitPulse fetches public GitHub activity and translates it into:

- generative music;
- audio-reactive visuals;
- mood-based presets;
- tweakable mappings between GitHub activity and sound;
- merged multi-account developer profiles.

Example use cases:

```text
alice → one personal GitPulse track
alice, alice-work → one merged personal + work GitPulse track
```

---

## Core concept

GitPulse does not just display GitHub data.

It translates it.

| GitHub signal | Audio/visual interpretation |
|---|---|
| Commits/activity | Beats, pulses, particle bursts |
| Repositories | Instrument layers, orbiting nodes |
| Languages | Timbres, colours, materials |
| Stars | Glow, reverb, brightness |
| Forks | Echoes, branching trails |
| Recent activity | Brighter, louder, more energetic patterns |
| Dormant repos | Dimmed, filtered, distant elements |
| Multiple accounts | Composite or layered identity |

---

## Multi-account support

GitPulse supports the idea of merging multiple GitHub accounts into one creative profile.

This is useful when a developer has:

- a personal GitHub account;
- a work GitHub account;
- legacy accounts;
- separate open-source and commercial identities.

MVP behaviour:

```text
Composite Merge
```

That means multiple usernames are merged into one combined activity dataset and used to generate a single GitPulse track.

Future modes may include:

- **Layered Mix** — each account becomes a different instrument layer;
- **Compare Mode** — accounts remain visually distinct but play on a shared timeline;
- **Mute/Solo Accounts** — isolate the sound of individual accounts.

---

## Planned tech stack

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

The MVP is designed to run as a static frontend app using public GitHub data.

A backend may be added later for:

- GitHub token protection;
- caching;
- GraphQL contribution calendar data;
- share links;
- audio/video export;
- private contribution support.

---

## MVP scope

The first version should include:

- GitHub username input;
- multiple username input;
- public profile/repo/language fetch;
- normalised internal data model;
- composite multi-account merge;
- demo dataset fallback;
- Tone.js generated audio loop;
- React Three Fiber visualiser;
- three mood presets: Futuristic, Playful, Epic;
- play/pause controls;
- tempo and intensity controls;
- remix seed;
- deployable static site.

The first version should not include:

- OAuth login;
- private repositories;
- user accounts;
- payments;
- AI-generated audio;
- audio/video export;
- backend database.

---

## Mood presets

Initial moods:

### Futuristic

Clean synths, electronic pulses, neon visuals, sharp geometry.

### Playful

Bouncy rhythms, plucks, quirky percussion, brighter motion.

### Epic

Cinematic drums, large pads, reverb, cosmic scale.

Later moods:

- Lo-fi;
- Glitch;
- Ambient.

---

## Recommended project structure

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
  HLD.md
  PROJECT_PLAN.md
  STYLE_GUIDE.md
  AGENT_GUIDE.md
  DATA_AND_MAPPING_SPEC.md
  ROADMAP.md
  CONTRIBUTING.md
```

---

## Getting started

```bash
npm install
npm run dev
```

Build:

```bash
npm run build
```

Typecheck:

```bash
npm run typecheck
```

Lint:

```bash
npm run lint
```

---

## Documentation

Recommended repo docs:

- `docs/HLD.md` — high-level design
- `docs/PROJECT_PLAN.md` — phased delivery plan
- `docs/DATA_AND_MAPPING_SPEC.md` — data model and GitHub-to-audio mapping
- `docs/STYLE_GUIDE.md` — design, UI, audio, and code style
- `docs/AGENT_GUIDE.md` — how to brief coding agents safely
- `docs/ROADMAP.md` — future direction
- `docs/CONTRIBUTING.md` — contribution rules

---

## Open-source intent

GitPulse is intended as an open-source showcase project.

It should demonstrate creative technical execution across:

- frontend engineering;
- data modelling;
- generative audio;
- 3D visualisation;
- product design;
- clean repo documentation.

Recommended licence:

```text
MIT
```

---

## Project status

Early design stage.

The first milestone is to build a deployable MVP that proves:

> GitHub activity can become a cool, listenable, reactive audio-visual experience.
