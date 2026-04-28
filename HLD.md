# GitPulse — High-Level Design

## 1. Project summary

**GitPulse** is an open-source web application that turns one or more GitHub usernames into a personalised generative audio-visual experience.

The user enters a GitHub username, or several GitHub usernames, and GitPulse fetches public GitHub activity, normalises it into a common internal data model, and translates that data into:

- generative music;
- audio-reactive visuals;
- mood-based presets;
- tweakable GitHub-to-sound mappings;
- a shareable creative representation of developer activity.

The experience should feel like:

> Spotify Wrapped meets GitHub contributions meets old-school music visualiser meets futuristic generative art.

GitPulse is not intended to be a serious analytics dashboard in its first version. It should be a memorable creative showcase that demonstrates modern web development, generative audio, 3D visualisation, GitHub API integration, and strong product design.

---

## 2. Product positioning

### Working name

**GitPulse**

### Tagline options

- Your GitHub activity has a sound.
- Turn your code into rhythm.
- A generative soundtrack for your developer history.
- Your contribution graph, remixed.
- Listen to your commits.

### Recommended tagline

> Your GitHub activity has a sound.

### Primary purpose

GitPulse should be an open-source showcase project rather than a commercial product at launch.

It should demonstrate:

- creative technical leadership;
- React/Vite/TypeScript capability;
- Web Audio / Tone.js experimentation;
- Three.js / React Three Fiber visualisation;
- API integration and data modelling;
- design taste and product thinking;
- well-structured repo documentation suitable for future agents and contributors.

---

## 3. Core user journeys

### 3.1 Single-account journey

1. User lands on GitPulse.
2. User enters a GitHub username.
3. App fetches public profile and repository data.
4. App normalises the data into the GitPulse internal model.
5. App generates a default soundtrack and visual scene.
6. User presses **Play**.
7. Music starts and visuals react to the audio.
8. User tweaks mood, tempo, intensity, and mappings.
9. User optionally copies a shareable URL.

### 3.2 Multi-account merged journey

1. User enters multiple GitHub usernames.
2. App fetches public GitHub data for each identity.
3. App merges the identities into a single composite activity profile.
4. App deduplicates repositories and activity where possible.
5. App creates one combined activity timeline/grid.
6. App generates a single combined GitPulse soundtrack.
7. User can toggle whether accounts are:
   - fully merged into one sound;
   - layered as separate instruments;
   - shown as separate visual lanes/orbits but mixed into the same track.

This is especially useful for people who have separate personal and work GitHub accounts and want one creative representation of their full development activity.

### 3.3 Demo journey

1. User clicks **Load Demo Profile**.
2. App loads bundled demo data.
3. User can explore the app without relying on the GitHub API.

This is important for demos, development, API rate-limit resilience, and screenshots.

---

## 4. Core product principles

### 4.1 Translate, do not merely display

GitPulse should not simply chart GitHub data. It should translate GitHub activity into sound and motion.

### 4.2 Keep the MVP creative and constrained

The first version should be small enough to build quickly, but polished enough to feel special.

### 4.3 Make moods meaningfully different

Changing from Futuristic to Playful or Epic should clearly change both the music and visuals.

### 4.4 Make multi-account merging first-class

Multi-account support should not feel like an afterthought. It should be represented in the data model from the start, even if the initial UI is simple.

### 4.5 Avoid account login in the MVP

The MVP should work with public GitHub data and avoid OAuth/private data until later phases.

### 4.6 Audio must require explicit user interaction

Browsers restrict autoplay. Audio should start only after the user presses Play or Start Audio.

---

## 5. Technical stack

### 5.1 Frontend

Recommended stack:

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

### 5.2 Backend

MVP:

- No backend required.
- Fetch public GitHub data directly from the browser.
- Use bundled demo data as fallback.

Later:

- Optional lightweight backend/serverless functions for:
  - GitHub token protection;
  - GraphQL proxying;
  - caching;
  - share link persistence;
  - export/render jobs;
  - OAuth/private contribution support.

### 5.3 Hosting

Recommended initial hosting:

- Vercel, Netlify, Cloudflare Pages, or GitHub Pages.

Recommended initial path:

- Vercel for speed of deployment and preview environments.
- GitHub Actions for build and quality checks.

---

## 6. Data source strategy

### 6.1 MVP data source

Use GitHub public REST API data:

- public profile;
- public repositories;
- repository languages;
- stars;
- forks;
- created date;
- pushed date;
- fork status;
- public event data where useful.

This provides enough signal for a first creative experience.

### 6.2 Later data source

Use GitHub GraphQL for richer contribution calendar data:

- daily contribution counts;
- commits by date;
- pull request contributions;
- issue contributions;
- richer time-based mapping.

### 6.3 Authentication

MVP should avoid authentication.

Later versions may support:

- user-provided local GitHub token;
- OAuth;
- private contribution support;
- organisation/team visualisations.

---

## 7. Multi-account merge design

### 7.1 Goal

Allow a user to combine multiple GitHub accounts into one GitPulse profile.

Example:

```text
personalAccount + workAccount → one combined GitPulse track
```

### 7.2 Merge modes

The app should support, or be architected to support, three merge modes.

#### Mode A — Composite Merge

All activity is merged into one combined profile.

Use case:

> “Show my full developer activity as one identity.”

Audio:

- combined timeline drives one track;
- total activity increases rhythm density;
- dominant languages come from all accounts.

Visuals:

- one central core;
- repos orbit as one system;
- account source can be shown subtly via colour rings or tags.

#### Mode B — Layered Mix

Each GitHub account becomes a distinct audio layer within the same track.

Use case:

> “Let my personal account and work account both be heard.”

Audio:

- account A may drive drums;
- account B may drive bass/synths;
- or each account has its own panned/layered instrument group.

Visuals:

- multiple orbit rings;
- each account has a subtle colour identity;
- activity pulses can be source-specific.

#### Mode C — Compare / Split View

Accounts remain visually distinct but play within a shared timeline.

Use case:

> “Show how my work and personal activity differ.”

Audio:

- shared transport;
- separate channels;
- optional mute/solo per account.

Visuals:

- account lanes;
- split orbit systems;
- toggle between merged and isolated views.

### 7.3 MVP recommendation

Build support for multiple usernames in the data model from the start.

MVP UI should support:

- username input accepting comma-separated usernames;
- account chips after lookup;
- default mode: **Composite Merge**;
- optional source labels in the summary panel.

Later versions can expose Layered Mix and Compare / Split View.

### 7.4 Deduplication rules

Deduplication is important because the same repo may appear across multiple accounts, especially with forks, org repos, or shared work repos.

Initial rules:

1. Treat `owner/name` as the canonical repo identity.
2. If two accounts reference the same `owner/name`, merge repo metadata.
3. Preserve all source accounts in `sourceUsernames`.
4. For forks, keep `isFork` and optionally group under original repo when API data allows.
5. For activity days, sum contribution-like signals across accounts.
6. Prevent double-counting repo-level metrics where the same repo is visible through multiple accounts.

### 7.5 Source attribution

Even in Composite Merge mode, the merged dataset should preserve provenance.

Every repo and activity event should know which username(s) contributed to it.

This enables later features such as:

- account-specific mute/solo;
- account contribution breakdown;
- account colour accents;
- personal vs work split;
- dedupe debugging.

---

## 8. Internal data model

The app should use a normalised internal model and avoid coupling UI/audio/visual logic directly to GitHub API responses.

### 8.1 Profile identity

```ts
export type GitPulseAccount = {
  username: string
  displayName?: string
  avatarUrl?: string
  profileUrl: string
  publicRepoCount?: number
}
```

### 8.2 Repo model

```ts
export type GitPulseRepo = {
  id: string
  canonicalName: string // owner/name
  owner: string
  name: string
  url: string
  primaryLanguage?: string
  languages: Record<string, number>
  stars: number
  forks: number
  createdAt: string
  pushedAt: string
  isFork: boolean
  sourceUsernames: string[]
}
```

### 8.3 Activity day model

```ts
export type GitPulseActivityDay = {
  date: string
  commitCountApprox: number
  issueCount?: number
  pullRequestCount?: number
  repoTouches: string[]
  sourceBreakdown: Record<
    string,
    {
      commitCountApprox: number
      repoTouches: string[]
    }
  >
}
```

### 8.4 Dataset model

```ts
export type GitPulseDataset = {
  accounts: GitPulseAccount[]
  mergedIdentity: {
    label: string
    usernames: string[]
    avatarUrls: string[]
  }
  repos: GitPulseRepo[]
  days: GitPulseActivityDay[]
  summary: {
    totalRepos: number
    activeRepos: number
    dominantLanguages: string[]
    sourceUsernames: string[]
    activityScore: number
    consistencyScore: number
    burstinessScore: number
    mergeMode: GitPulseMergeMode
  }
}

export type GitPulseMergeMode = 'composite' | 'layered' | 'compare'
```

---

## 9. GitHub-to-audio mapping

### 9.1 Core mapping

| GitHub signal         | Audio interpretation                     |
| --------------------- | ---------------------------------------- |
| Commit/activity count | Drum hits / rhythmic pulses              |
| Repository            | Instrument track / channel               |
| Primary language      | Instrument timbre / scale colour         |
| Stars                 | Reverb / brightness / sustain            |
| Forks                 | Delay / echo repeats                     |
| Recent activity       | Louder/brighter sounds                   |
| Dormant repos         | Filtered/muffled layers                  |
| Streaks               | Crescendos / sustained notes             |
| Account source        | Layer/pan/channel in multi-account modes |

### 9.2 Multi-account audio mapping

Composite mode:

- all accounts contribute to a single rhythm and melody system;
- activity counts are summed;
- account identity is mostly hidden.

Layered mode:

- each account gets an instrument group;
- account activity can be panned slightly left/right;
- users can mute or solo an account later.

Compare mode:

- shared transport;
- separate account channels;
- visual and audio distinction remains clear.

---

## 10. Mood presets

The same GitHub dataset should produce different outputs depending on mood.

### 10.1 Initial moods

#### Futuristic

- Clean electronic percussion.
- Pulsing synths.
- Neon visuals.
- Particle field and grid motifs.

#### Playful

- Bouncy rhythm.
- Plucks and quirky percussion.
- Bright colours.
- Wobbling shapes.

#### Epic

- Cinematic drums.
- String-like pads.
- Big reverb.
- Slow crescendos.
- Cosmic visuals.

### 10.2 Later moods

#### Lo-fi

- Soft drums.
- Warm bass.
- Tape wobble.
- Muted visuals.

#### Glitch

- Broken rhythms.
- Bitcrush/distortion.
- Fragmented visuals.

#### Ambient

- Slow pads.
- Minimal percussion.
- Gentle evolving motion.

---

## 11. Visual architecture

### 11.1 Visual engine

Use React Three Fiber to render audio-reactive scenes.

Initial scene:

- central profile core;
- orbiting repo nodes;
- particle field;
- pulse rings;
- waveform/equaliser response;
- mood-specific visual treatment.

### 11.2 GitHub-to-visual mapping

| GitHub signal          | Visual interpretation                         |
| ---------------------- | --------------------------------------------- |
| User / merged identity | Central core                                  |
| Repositories           | Orbiting nodes                                |
| Languages              | Colours/materials                             |
| Stars                  | Node size/glow                                |
| Recent activity        | Brightness/pulse frequency                    |
| Dormant activity       | Dim/frozen nodes                              |
| Multi-account sources  | Rings, colour accents, lanes                  |
| Audio analyser values  | Scale, particle movement, bloom, camera drift |

### 11.3 Visual modes

MVP:

- Pulse Field / Repo Orbit hybrid.

Later:

- Commit Galaxy;
- Wave Tunnel;
- Equaliser Grid;
- Split Account Orbit;
- Glitch Field.

---

## 12. User interface

### 12.1 MVP UI areas

- Hero/header.
- Username input with support for multiple usernames.
- Account chips.
- Start/play controls.
- Mood selector.
- Tempo control.
- Intensity control.
- Remix button.
- Visual canvas.
- Summary/insight panel.

### 12.2 Multi-account UI

Username input should accept:

```text
username
username1, username2
username1 username2
```

After lookup, show each account as a chip:

```text
@personal    @work    + Add account
```

MVP merge behaviour:

```text
Merge mode: Composite
```

Later controls:

```text
Composite | Layered | Compare
Mute | Solo per account
```

---

## 13. MVP scope

### 13.1 Include

- React/Vite/TypeScript/Tailwind app.
- GitHub username input.
- Multiple username input.
- Public profile/repo/language fetch.
- Data normalisation.
- Basic deduplication.
- Composite merged dataset.
- Tone.js generated loop.
- Three mood presets: Futuristic, Playful, Epic.
- React Three Fiber visual scene.
- Audio-reactive animation.
- Play/pause, tempo, intensity, remix controls.
- Demo dataset fallback.
- README and docs.
- Static deployment.

### 13.2 Exclude from MVP

- OAuth login.
- Private repositories.
- True contribution calendar via GraphQL.
- AI-generated audio.
- Audio/video export.
- User accounts.
- Saved projects.
- Payments.
- Backend database.

---

## 14. Risks and mitigations

### 14.1 GitHub API data may be limited

Mitigation:

- Use public repo data for MVP.
- Add demo data.
- Add GraphQL later.

### 14.2 Generated audio may sound unpleasant

Mitigation:

- Use simple musical constraints.
- Prefer pentatonic scales initially.
- Limit density.
- Make moods distinct but controlled.
- Add a global intensity limiter.

### 14.3 Browser audio restrictions

Mitigation:

- Require user to press Play.
- Initialise audio only after interaction.
- Show clear audio-start UI.

### 14.4 Three.js performance

Mitigation:

- Keep particle counts modest.
- Add quality settings later.
- Avoid heavy custom shaders in MVP.

### 14.5 Multi-account double counting

Mitigation:

- Preserve source usernames.
- Use canonical repo names.
- Deduplicate repo metrics.
- Keep merge logic isolated and testable.

---

## 15. Long-term vision

GitPulse could evolve into:

- a creative GitHub identity generator;
- a developer portfolio widget;
- a public open-source showcase;
- a generative audio playground;
- a shareable annual coding recap;
- a multi-account contribution remixer;
- a team/org GitHub soundtrack generator.

The long-term expression:

> Your GitHub profile, but as music.
