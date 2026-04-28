# GitPulse — Phased Project Plan

## 1. Delivery approach

GitPulse should be built in small, clean, agent-friendly passes.

The project should prioritise:

1. a fast deployable MVP;
2. clean architecture;
3. strong documentation;
4. visible creative impact;
5. future extensibility.

The initial version should avoid backend complexity, OAuth, AI features, and exports. The first milestone is a static web app that turns one or more public GitHub usernames into a generated audio-visual experience.

---

## 2. Phase overview

| Phase | Name                | Outcome                                           |
| ----- | ------------------- | ------------------------------------------------- |
| 0     | Concept lock        | Product scope, name, initial mappings agreed      |
| 1     | App foundation      | React/Vite app, layout, CI, deployment            |
| 2     | GitHub ingestion    | Public GitHub fetch, normalised data, demo data   |
| 3     | Multi-account merge | Composite profile support and deduplication       |
| 4     | Audio MVP           | Tone.js engine and generated loop                 |
| 5     | Visual MVP          | React Three Fiber visualiser synced to audio      |
| 6     | Mood and controls   | Presets, tempo, intensity, remix, UI polish       |
| 7     | Repo polish         | README, style guide, docs, screenshots, deploy    |
| 8     | Advanced data       | GraphQL contribution calendar and richer activity |
| 9     | Creative expansion  | Layered accounts, exports, AI audio overlays      |

---

## Phase 0 — Concept lock

### Goal

Confirm the MVP product definition and avoid scope creep.

### Step 0.1 — Confirm product name

Use:

```text
GitPulse
```

### Step 0.2 — Confirm positioning

Working positioning:

> GitPulse turns GitHub activity into a generative audio-visual signature.

### Step 0.3 — Confirm MVP user journeys

MVP journeys:

- single username;
- multiple usernames merged into one profile;
- demo profile fallback.

### Step 0.4 — Confirm MVP merge mode

MVP multi-account behaviour:

```text
Composite Merge
```

Meaning:

- multiple usernames are combined into one dataset;
- repos are deduplicated;
- activity is merged;
- the generated track represents the combined identity.

### Step 0.5 — Confirm default creative direction

Recommended default:

- dark futuristic UI;
- neon accents;
- pulse/orbit visualiser;
- Futuristic mood as default;
- Playful and Epic as additional MVP moods.

### Phase 0 exit criteria

- Product name confirmed.
- MVP scope confirmed.
- Multi-account merge included in scope.
- Initial visual/audio direction confirmed.

---

## Phase 1 — App foundation

### Goal

Create the working app skeleton and deployment base.

### Step 1.1 — Create project

Use:

```text
React + Vite + TypeScript + Tailwind
```

### Step 1.2 — Add core dependencies

Install:

```text
tone
three
@react-three/fiber
@react-three/drei
framer-motion
zustand
```

Optional for tuning:

```text
leva
```

### Step 1.3 — Create base folder structure

Recommended structure:

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
```

### Step 1.4 — Build static shell

Create placeholder components:

```text
AppShell
Header
UsernameForm
AccountChips
MoodSelector
TransportControls
VisualCanvas
InsightPanel
SettingsPanel
```

### Step 1.5 — Add CI checks

Add scripts for:

- typecheck;
- lint;
- format check;
- build.

### Step 1.6 — Add deployment

Choose one:

- Vercel;
- Netlify;
- Cloudflare Pages;
- GitHub Pages.

Recommended first deploy:

```text
Vercel
```

### Phase 1 exit criteria

- App runs locally.
- Static shell renders.
- CI/build works.
- App can be deployed.

---

## Phase 2 — GitHub ingestion

### Goal

Fetch public GitHub data and convert it into a normalised GitPulse dataset.

### Step 2.1 — Create GitHub client

Create:

```text
src/github/githubClient.ts
```

Functions:

```ts
fetchGitHubProfile(username)
fetchGitHubRepos(username)
fetchGitHubRepoLanguages(owner, repo)
```

### Step 2.2 — Fetch public profile

Fetch:

- username;
- display name;
- avatar URL;
- profile URL;
- public repo count.

### Step 2.3 — Fetch repositories

Fetch public repos and capture:

- owner/name;
- repo URL;
- primary language;
- stars;
- forks;
- created date;
- pushed date;
- fork status.

### Step 2.4 — Fetch language breakdown

For selected repos, fetch language breakdown.

MVP limit:

```text
Top 12–24 repos by recent activity and stars
```

### Step 2.5 — Create normaliser

Create:

```text
src/github/normaliseGitHubData.ts
```

The normaliser should output:

```ts
GitPulseDataset
```

### Step 2.6 — Add demo data

Create:

```text
src/data/demoDataset.ts
```

Use when:

- API fails;
- rate limit is hit;
- user clicks Load Demo Profile;
- developing offline.

### Phase 2 exit criteria

- Single username fetch works.
- Data is normalised.
- Demo data works.
- Loading and error states are handled.

---

## Phase 3 — Multi-account merge

### Goal

Allow users to enter multiple GitHub usernames and generate one combined GitPulse dataset.

### Step 3.1 — Update username input

Support:

```text
username
username1, username2
username1 username2
```

Add basic validation:

- trim whitespace;
- remove duplicates;
- reject empty values;
- show invalid username errors clearly.

### Step 3.2 — Add account chips

After usernames are parsed or fetched, display chips:

```text
@personal
@work
@other
```

Include remove buttons later if simple.

### Step 3.3 — Fetch accounts sequentially or safely in parallel

Fetch each username.

Handle partial failures:

- if one account fails, show which one failed;
- allow successful accounts to continue;
- do not crash the full experience.

### Step 3.4 — Create merge module

Create:

```text
src/github/mergeGitPulseDatasets.ts
```

Responsibilities:

- combine account profiles;
- deduplicate repos;
- merge language breakdowns;
- combine activity approximations;
- preserve source attribution.

### Step 3.5 — Repo deduplication

Use canonical repo name:

```text
owner/name
```

Rules:

1. If repos share the same canonical name, merge them.
2. Preserve all source usernames.
3. Do not double count stars/forks for the same repo.
4. Use latest `pushedAt` when duplicates differ.
5. Merge language byte counts where appropriate.

### Step 3.6 — Composite activity grid

Create an internal daily timeline.

For MVP, approximate activity using repo pushed dates and public event data if available.

Later, GraphQL contribution calendar should replace or enrich this.

### Step 3.7 — Add merge mode to dataset

Set:

```ts
mergeMode: 'composite'
```

Layered and compare modes are future-facing.

### Phase 3 exit criteria

- User can enter multiple usernames.
- App fetches all valid accounts.
- App creates one combined dataset.
- Repos are deduplicated.
- Source usernames are preserved.
- UI displays merged account chips.

---

## Phase 4 — Audio MVP

### Goal

Create the first working generated soundtrack.

### Step 4.1 — Create AudioEngine

Create:

```text
src/audio/AudioEngine.ts
```

Responsibilities:

- initialise Tone.js after user interaction;
- create instruments;
- schedule events;
- start/stop/pause;
- dispose safely;
- expose analyser values for visuals.

### Step 4.2 — Create instruments

Initial instruments:

- kick;
- snare/clap;
- hi-hat;
- bass synth;
- lead synth;
- pad.

### Step 4.3 — Create sequencer

Create:

```text
src/audio/sequencer.ts
```

The sequencer maps the GitPulse dataset into a loop.

Recommended MVP:

```text
16-bar loop
4/4 time
activity density controls percussion density
repos create melodic/bass layers
languages influence scale/timbre
```

### Step 4.4 — Add safe musical constraints

To avoid unpleasant randomness:

- use pentatonic scale initially;
- cap maximum note density;
- cap volume;
- avoid harsh frequencies by default;
- add intensity control.

### Step 4.5 — Add transport controls

Controls:

- Start Audio;
- Play;
- Pause;
- Stop/Reset.

### Phase 4 exit criteria

- User can press Play and hear generated audio.
- Audio changes based on GitHub dataset.
- Audio engine starts only after user interaction.
- Audio can stop and dispose cleanly.

---

## Phase 5 — Visual MVP

### Goal

Create a compelling audio-reactive visual scene.

### Step 5.1 — Create VisualCanvas

Create:

```text
src/visuals/VisualCanvas.tsx
```

Use React Three Fiber.

### Step 5.2 — Create default scene

Recommended MVP scene:

```text
Pulse Field + Repo Orbit hybrid
```

Elements:

- central merged identity core;
- orbiting repo nodes;
- particle field;
- audio-reactive pulse rings;
- subtle camera drift.

### Step 5.3 — Map data to visuals

| Data            | Visual                     |
| --------------- | -------------------------- |
| Merged identity | Central core               |
| Repos           | Orbiting nodes             |
| Stars           | Node size/glow             |
| Languages       | Colours                    |
| Recent activity | Brightness/pulse rate      |
| Account source  | Subtle ring/outline/accent |

### Step 5.4 — Connect audio analyser

Use analyser values to drive:

- pulse scale;
- particle speed;
- glow intensity;
- camera drift;
- waveform/equaliser bars.

### Step 5.5 — Add fallback visual state

If audio is not playing, visuals should still have ambient idle motion.

### Phase 5 exit criteria

- Visual scene renders.
- Visuals react to audio.
- Repo nodes reflect GitHub data.
- Multi-account merged data is visible in summary or accents.

---

## Phase 6 — Mood presets and controls

### Goal

Make the experience tunable and expressive.

### Step 6.1 — Add mood config model

Create:

```text
src/moods/moodTypes.ts
src/moods/moods.ts
```

Mood config should control:

- instruments;
- effects;
- scale;
- tempo range;
- visual palette;
- visual motion style;
- particle behaviour.

### Step 6.2 — Add MVP moods

Implement:

1. Futuristic
2. Playful
3. Epic

### Step 6.3 — Add controls

MVP controls:

- mood;
- tempo;
- intensity;
- visual mode if available;
- remix seed.

### Step 6.4 — Add deterministic remix

A remix should:

- use the same GitHub data;
- change the generated pattern;
- be reproducible using a seed.

### Step 6.5 — Add URL state later if simple

Potential URL shape:

```text
/?users=alice,bob&mood=futuristic&seed=42
```

### Phase 6 exit criteria

- Mood changes alter sound and visuals.
- User can tune tempo/intensity.
- Remix creates a different but stable variation.

---

## Phase 7 — Repo polish and public release

### Goal

Make the project presentable as an open-source showcase.

### Step 7.1 — Write README

Include:

- project concept;
- live demo link;
- screenshots/GIFs;
- quick start;
- tech stack;
- roadmap;
- contribution notes.

### Step 7.2 — Add documentation

Recommended docs:

```text
docs/HLD.md
docs/PROJECT_PLAN.md
docs/STYLE_GUIDE.md
docs/AGENT_GUIDE.md
docs/DATA_AND_MAPPING_SPEC.md
docs/CONTRIBUTING.md
docs/ROADMAP.md
```

### Step 7.3 — Add screenshots or demo GIF

Include at least:

- landing state;
- generated visual state;
- multi-account chips;
- mood selector.

### Step 7.4 — Add licence

Recommended:

```text
MIT
```

### Step 7.5 — Public release checklist

- Build passes.
- README complete.
- Demo works.
- No secrets.
- No private GitHub token committed.
- Accessibility basics checked.
- Mobile layout acceptable.

### Phase 7 exit criteria

- GitPulse can be shared publicly.
- Repo documentation is strong.
- The deployed app demonstrates the core concept.

---

## Phase 8 — Advanced GitHub data

### Goal

Improve the quality and accuracy of activity mapping.

### Step 8.1 — Add GraphQL support

Use GitHub GraphQL for contribution calendar data.

### Step 8.2 — Add optional token support

Options:

- paste token locally into browser memory only;
- environment token via backend/serverless function;
- OAuth later.

### Step 8.3 — Replace approximate activity grid

Use proper daily contribution data where available.

### Step 8.4 — Improve multi-account merging

Merge contribution calendars across accounts.

Rules:

- sum daily counts;
- preserve source breakdown;
- dedupe shared repo signals where possible.

### Step 8.5 — Add richer contribution types

Map:

- commits;
- PRs;
- issues;
- reviews;
- repositories contributed to.

### Phase 8 exit criteria

- Activity timeline is richer and more accurate.
- Multi-account activity grid is based on contribution calendar data where available.
- Audio feels more closely tied to real activity.

---

## Phase 9 — Creative expansion

### Goal

Turn GitPulse from MVP into a genuinely memorable creative tool.

### Step 9.1 — Layered account mode

Each account becomes a separate audio/visual layer.

Controls:

- mute account;
- solo account;
- pan account;
- assign account to instrument family.

### Step 9.2 — Compare account mode

Show account differences while keeping shared playback.

Visuals:

- split lanes;
- dual orbit rings;
- account-specific pulse fields.

### Step 9.3 — Add more visual modes

Potential modes:

- Commit Galaxy;
- Wave Tunnel;
- Equaliser Grid;
- Glitch Field;
- Repo City;
- Contribution Constellation.

### Step 9.4 — Add export options

Potential exports:

- PNG snapshot;
- WebM visual recording;
- WAV audio export;
- MIDI export;
- MP4 export.

### Step 9.5 — Explore AI audio overlay

Possible AI features:

- mood text prompt to preset;
- generated melody overlay;
- ambient sample generation;
- AI explanation of the generated sound;
- mastering/polish step.

AI should remain optional and should not be required for the core open-source experience.

### Phase 9 exit criteria

- GitPulse supports richer creative modes.
- Multi-account mode feels genuinely expressive.
- Export/sharing possibilities are validated.

---

## 3. Agent build sequence

When using an agent, use small passes with clear boundaries.

### Agent Pass 1 — App skeleton

Build React/Vite/TypeScript/Tailwind app with placeholder UI and mock dataset.

### Agent Pass 2 — GitHub fetch

Add GitHub profile/repo/language fetching and loading/error states.

### Agent Pass 3 — Normalised data model

Create types, normaliser, and demo data.

### Agent Pass 4 — Multi-account merge

Add multiple username parsing, account chips, composite merge, dedupe, and source attribution.

### Agent Pass 5 — Audio engine

Add Tone.js engine, instruments, sequencer, and transport controls.

### Agent Pass 6 — Mood presets

Add Futuristic, Playful, and Epic mood configurations.

### Agent Pass 7 — Visual engine

Add React Three Fiber visual scene and audio-reactive motion.

### Agent Pass 8 — Controls and polish

Add tempo, intensity, remix, UI polish, README updates, and deployment checks.

### Agent Pass 9 — Public release hardening

Review build, accessibility, error states, documentation, and deploy configuration.

---

## 4. Definition of done for MVP

The MVP is done when:

- user can enter one GitHub username;
- user can enter multiple GitHub usernames;
- app fetches public GitHub data;
- app produces one merged dataset;
- app generates audio from the dataset;
- app renders audio-reactive visuals;
- mood presets change the experience;
- app can be deployed publicly;
- docs explain the concept and architecture;
- repo is safe to make public.
