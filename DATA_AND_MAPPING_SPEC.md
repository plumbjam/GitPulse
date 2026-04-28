# GitPulse — Data and Mapping Specification

## 1. Purpose

This document defines how GitPulse should structure GitHub data internally and how that data should map to audio and visual behaviour.

The key rule is:

> UI, audio, and visuals should use normalised GitPulse data, not raw GitHub API responses.

---

## 2. Data pipeline

Recommended data flow:

```text
GitHub API responses
  ↓
GitHub client
  ↓
per-account normalisation
  ↓
multi-account merge
  ↓
GitPulseDataset
  ↓
audio mapping + visual mapping
  ↓
Tone.js + React Three Fiber
```

---

## 3. Core types

### 3.1 Merge mode

```ts
export type GitPulseMergeMode = 'composite' | 'layered' | 'compare';
```

MVP uses:

```ts
'composite'
```

---

### 3.2 Account

```ts
export type GitPulseAccount = {
  username: string;
  displayName?: string;
  avatarUrl?: string;
  profileUrl: string;
  publicRepoCount?: number;
};
```

---

### 3.3 Repository

```ts
export type GitPulseRepo = {
  id: string;
  canonicalName: string; // owner/name
  owner: string;
  name: string;
  url: string;
  primaryLanguage?: string;
  languages: Record<string, number>;
  stars: number;
  forks: number;
  createdAt: string;
  pushedAt: string;
  isFork: boolean;
  sourceUsernames: string[];
};
```

---

### 3.4 Activity day

```ts
export type GitPulseActivityDay = {
  date: string;
  commitCountApprox: number;
  issueCount?: number;
  pullRequestCount?: number;
  repoTouches: string[];
  sourceBreakdown: Record<string, {
    commitCountApprox: number;
    repoTouches: string[];
  }>;
};
```

---

### 3.5 Dataset

```ts
export type GitPulseDataset = {
  accounts: GitPulseAccount[];
  mergedIdentity: {
    label: string;
    usernames: string[];
    avatarUrls: string[];
  };
  repos: GitPulseRepo[];
  days: GitPulseActivityDay[];
  summary: {
    totalRepos: number;
    activeRepos: number;
    dominantLanguages: string[];
    sourceUsernames: string[];
    activityScore: number;
    consistencyScore: number;
    burstinessScore: number;
    mergeMode: GitPulseMergeMode;
  };
};
```

---

## 4. Multi-account merge specification

### 4.1 Input

Multiple per-account datasets:

```text
Dataset for @personal
Dataset for @work
Dataset for @legacy
```

### 4.2 Output

One merged dataset:

```text
Composite GitPulseDataset
```

### 4.3 Username parsing

Input should support:

```text
ben
ben, ben-work
ben ben-work
ben,ben-work, ben-lab
```

Parsing rules:

1. Split on commas and whitespace.
2. Trim values.
3. Remove empty values.
4. Remove duplicates case-insensitively.
5. Preserve display casing if possible.

### 4.4 Repo deduplication

Canonical repo identity:

```text
owner/name
```

Rules:

1. If two repos share the same canonical name, merge them.
2. Preserve all `sourceUsernames`.
3. Do not double count stars or forks for duplicate repos.
4. Use the highest stars/forks values if duplicates differ.
5. Use the most recent `pushedAt`.
6. Merge languages by summing language byte counts.

### 4.5 Activity merge

For each date:

1. Sum approximate commit/activity counts.
2. Merge repo touches.
3. Deduplicate repo touches.
4. Preserve per-account source breakdown.

Example:

```ts
{
  date: '2026-04-28',
  commitCountApprox: 12,
  repoTouches: ['alice/app', 'work/api'],
  sourceBreakdown: {
    alice: {
      commitCountApprox: 5,
      repoTouches: ['alice/app']
    },
    aliceWork: {
      commitCountApprox: 7,
      repoTouches: ['work/api']
    }
  }
}
```

---

## 5. Activity scoring

MVP scoring can be approximate.

### 5.1 Activity score

Purpose:

- global energy of the track;
- visual intensity;
- baseline density.

Possible calculation:

```text
activityScore = normalised weighted blend of:
- active repos
- recent pushed dates
- public event activity
- approximate commit/activity days
```

### 5.2 Consistency score

Purpose:

- sustained pads;
- smooth visual motion;
- long arcs.

Possible calculation:

```text
consistencyScore = proportion of active days in selected period
```

### 5.3 Burstiness score

Purpose:

- glitch intensity;
- drum fills;
- particle explosions;
- dynamic spikes.

Possible calculation:

```text
burstinessScore = variance of activity count per active day
```

---

## 6. Audio mapping specification

### 6.1 Core mapping table

| GitHub signal | Audio mapping |
|---|---|
| Activity/commit count | Drum density / pulse frequency |
| Repository | Instrument layer / sequence lane |
| Primary language | Instrument timbre / note palette |
| Language diversity | Harmonic richness / stereo width |
| Stars | Reverb / brightness / sustain |
| Forks | Delay / echo repeats |
| Recent activity | Volume / filter brightness |
| Dormant repos | Low-pass filter / quieter layer |
| Consistency score | Pad sustain / smoother rhythm |
| Burstiness score | Fills / accents / glitch bursts |
| Multiple accounts | Composite, layered, or split channels |

---

### 6.2 Mood influence

Mood should alter the same data mapping.

Example:

| Signal | Futuristic | Playful | Epic |
|---|---|---|---|
| Activity | Clean electronic kick | Bouncy percussion | Cinematic drum hit |
| Repo | Synth arp | Pluck pattern | Low brass/string pad |
| Stars | Shimmer reverb | Sparkle accent | Huge hall reverb |
| Forks | Digital delay | Ping-pong echo | Distant echo swell |
| Burstiness | Laser fill | Percussion roll | Taiko-style impact |

---

### 6.3 Multi-account audio modes

#### Composite

MVP mode.

Behaviour:

- all accounts drive one combined track;
- account source mostly hidden;
- source can subtly influence stereo spread or accent variation.

#### Layered

Future mode.

Behaviour:

- each account gets one or more instrument layers;
- account can be muted/soloed;
- panning and timbre can distinguish accounts.

#### Compare

Future mode.

Behaviour:

- accounts remain distinct;
- shared transport;
- split visual/audio channels.

---

### 6.4 Timing model

MVP recommendation:

```text
16-bar loop
4/4 time
one selected time range compressed into the loop
```

Possible time ranges:

```text
30 days
90 days
1 year
```

Mapping options:

| Time range | Loop mapping |
|---|---|
| 30 days | roughly 2 days per bar |
| 90 days | roughly 5-6 days per bar |
| 1 year | roughly 22-23 days per bar |

This can be refined later.

---

## 7. Visual mapping specification

### 7.1 Core visual mapping table

| GitHub signal | Visual mapping |
|---|---|
| Merged identity | Central core |
| Account source | Rings/chips/accent colours |
| Repository | Orbiting node |
| Repo stars | Node size/glow |
| Repo forks | Branching trails |
| Primary language | Colour/material |
| Recent activity | Brightness/pulse frequency |
| Dormant repo | Dim/distant node |
| Activity score | Particle density |
| Consistency score | Smooth orbital motion |
| Burstiness score | Shockwaves/explosions |
| Audio analyser | Scale/glow/motion amplitude |

---

### 7.2 Multi-account visual modes

#### Composite

MVP mode.

- one central core;
- all repos orbit in one system;
- account source shown subtly through node outline or ring colour.

#### Layered

Future mode.

- each account has an orbit band;
- account colour is more visible;
- merged track still plays as one composition.

#### Compare

Future mode.

- split visual lanes;
- account systems side by side;
- shared audio timeline.

---

## 8. Language mapping

Languages should map to both sound and colour.

Initial colour and instrument mapping can be simple and centralised.

Example:

```ts
export const languageMappings = {
  TypeScript: {
    colour: '#38bdf8',
    instrumentHint: 'leadSynth'
  },
  JavaScript: {
    colour: '#facc15',
    instrumentHint: 'pluckSynth'
  },
  Python: {
    colour: '#60a5fa',
    instrumentHint: 'softKeys'
  },
  CSharp: {
    colour: '#a78bfa',
    instrumentHint: 'bassSynth'
  },
  Rust: {
    colour: '#fb923c',
    instrumentHint: 'distortedSynth'
  },
  Go: {
    colour: '#22d3ee',
    instrumentHint: 'arpSynth'
  }
};
```

Unknown languages should fall back to a neutral mapping.

---

## 9. Demo dataset requirements

Demo data should include:

- at least two accounts;
- at least 8 repositories;
- multiple languages;
- recent and dormant repos;
- varied stars/forks;
- a visible activity pattern;
- enough data to demonstrate multi-account merge.

Demo usernames can be fictional.

---

## 10. Testing expectations

Core merge functions should be easy to unit test.

Recommended tests:

- username parser handles comma-separated input;
- username parser removes duplicates;
- repo merge deduplicates by owner/name;
- source usernames are preserved;
- activity days merge correctly;
- failed account fetch does not destroy successful account data;
- demo data conforms to `GitPulseDataset`.

---

## 11. Future extensions

Potential future data improvements:

- GitHub GraphQL contribution calendar;
- OAuth/private contributions;
- organisation-level visualisation;
- team merge mode;
- annual recap mode;
- MIDI export;
- shareable saved configs;
- AI-generated overlay prompts.
