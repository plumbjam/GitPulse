# GitPulse Data and Mapping Specification

## 1. Purpose

This document defines the normalized GitPulse dataset and the rules that transform GitHub REST and GraphQL contribution data into that shape.

The core rule is:

> UI, audio, and visuals should use normalized GitPulse data, not raw GitHub API responses.

Stage 2.5 adds a merged contribution-calendar layer, and Stage 3.3A uses that merged calendar as the full-range timing source for both the playable audio engine and the selectable contribution media bar.

---

## 2. Data pipeline

```text
GitHub REST profile/repo/language responses
  ->
REST normalization
  ->
per-identity repo datasets
  ->
multi-account merge
  ->
GitPulseDataset

Optional GitHub GraphQL contribution calendar
  via OAuth session token or manual development token
  ->
calendar normalization
  ->
per-identity contribution calendars
  ->
calendar merge
  ->
GitPulseDataset.contributionCalendar
  ->
Stage 3 audio pattern generation
```

Current source areas:

```text
src/github/githubClient.ts
src/github/githubNormaliser.ts
src/github/githubMerge.ts
src/github/githubGraphqlClient.ts
src/github/githubContributionNormaliser.ts
src/github/githubContributionMerge.ts
src/audio/contributionSequencer.ts
src/audio/musicMapping.ts
src/audio/useAudioPattern.ts
src/audio/audioEngine.ts
```

---

## 3. GitHub API scope

### Public REST endpoints

```text
GET https://api.github.com/users/{username}
GET https://api.github.com/users/{username}/repos?per_page=100&sort=pushed
GET https://api.github.com/repos/{owner}/{repo}/languages
```

Constraints:

- public data only;
- no private repo detail access;
- language byte fetches capped to the most recently pushed 24 repos per identity.

### Optional GraphQL contribution calendar

```text
POST https://api.github.com/graphql
```

Used for:

- classic GitHub-style contribution-calendar day counts;
- merged daily activity timeline;
- primary audio timing source.

Constraints:

- requires an OAuth session token or an advanced manual token;
- do not attempt this query without a token;
- OAuth tokens are stored in `sessionStorage` for the browser session;
- manual tokens are runtime-only in memory;
- contribution data may include anonymous private counts if GitHub provides them, but GitPulse must not infer private repo details.

---

## 4. Runtime dataset contract

```ts
export type GitPulseContributionDataSource = 'demo' | 'graphql' | 'approximate' | 'mixed'

export type GitPulseContributionDay = {
  date: string
  contributionCount: number
  intensity: 0 | 1 | 2 | 3 | 4
  sourceUsernames: string[]
  perIdentityCounts: Record<string, number>
  dataSource: GitPulseContributionDataSource
}

export type GitPulseContributionCalendar = {
  from: string
  to: string
  totalContributions: number
  days: GitPulseContributionDay[]
  sourceUsernames: string[]
  dataSource: GitPulseContributionDataSource
}

export type GitPulseDataset = {
  identities: GitPulseIdentity[]
  profileMode: 'single' | 'merged'
  repos: GitPulseRepo[]
  days: GitPulseActivityDay[]
  contributionCalendar?: GitPulseContributionCalendar
  summary: GitPulseSummary
  generatedAt: string
  mode: 'demo' | 'live'
}
```

Internal per-identity container:

```ts
export type GitPulseIdentityDataset = {
  identity: GitPulseIdentity
  repos: GitPulseRepo[]
  days: GitPulseActivityDay[]
  contributionCalendar?: GitPulseContributionCalendar
  mode: 'demo' | 'live'
  warnings: string[]
}
```

---

## 5. Data-source meanings

### `demo`

- fixed local fixture data for previews and fallback mode;
- used when the user explicitly loads demo data.

### `graphql`

- real GitHub contribution calendar day counts fetched from GraphQL with a token.

### `approximate`

- contribution-like day counts derived from the Stage 2 repo-push activity timeline;
- used when no GraphQL token is available or GraphQL data is unavailable.

### `mixed`

- merged output containing a blend of `graphql`, `approximate`, and/or `demo` contribution sources across identities.

---

## 6. REST normalization rules

REST normalization remains unchanged from Stage 2:

- normalize identity profile fields;
- normalize repo metadata and dates;
- normalize language maps;
- preserve `sourceUsernames`;
- keep repo-push `days` as approximate repo activity, not commit history.

Those `days` remain useful as fallback contribution input when GraphQL data is unavailable.

---

## 7. Contribution-calendar normalization rules

GraphQL contribution-calendar normalization rules:

1. Flatten `weeks[].contributionDays[]`.
2. Normalize dates to `YYYY-MM-DD`.
3. Create one `GitPulseContributionDay` per day.
4. Set `contributionCount`.
5. Set `perIdentityCounts[username]`.
6. Set `sourceUsernames` to the contributing identity list for that calendar.
7. Calculate `intensity`.
8. Set `dataSource` to `graphql`.
9. Preserve `from`, `to`, and `totalContributions`.

If GraphQL returns `user: null`, return a friendly `User not found.` result.

---

## 8. Intensity calculation

Contribution intensity is intentionally simple and deterministic:

```text
0 contributions -> 0
1 contribution  -> 1
2-4             -> 2
5-9             -> 3
10+             -> 4
```

This is shared between GraphQL normalization, fallback generation, grid rendering, and Stage 3 audio mapping.

---

## 9. Approximate contribution fallback

When no GraphQL calendar is available, GitPulse derives an approximate contribution calendar from the Stage 2 repo-push `days` signal.

Important caveat:

- this is not commit history;
- this is not a GitHub contribution graph clone with exact counts;
- it is a tokenless timing fallback derived from repo activity.

Use cases:

- live mode without a token;
- live mode when GraphQL fetch fails;
- mixed mode where some identities have GraphQL data and others do not;
- Stage 3 audio sequencing when a normalized merged calendar is unavailable.

---

## 10. Calendar merge rules

Merged contribution calendars must:

1. merge by date;
2. sum `contributionCount`;
3. merge `perIdentityCounts`;
4. merge and deduplicate `sourceUsernames`;
5. recalculate `intensity`;
6. preserve all dates across the merged range;
7. fill missing days with zero-count entries for continuity;
8. determine merged `dataSource`:
   - `demo` if all calendars are demo
   - `graphql` if all calendars are graphql
   - `approximate` if all calendars are approximate
   - `mixed` otherwise
9. recalculate `totalContributions` from merged days;
10. avoid double counting the same identity calendar twice.

---

## 11. Summary and UI implications

Stage 2 repo summary metrics still exist and remain useful for:

- repo node count;
- dominant languages;
- stars and forks;
- overall creative energy.

Stage 2.5 adds contribution summary signals such as:

- total contributions;
- active contribution days;
- contribution range;
- peak contribution day;
- contribution data source.

The contribution grid and merged contribution calendar are now the primary rhythm and timing surface for Stage 3.

---

## 12. Demo dataset requirements

Demo data should include:

- at least two identities;
- merged repos and merged contribution calendars;
- quiet periods and contribution spikes;
- visible multi-account overlap;
- `dataSource: 'demo'`.

The existing Stage 2 `Use demo data` flow should keep working without requiring a token.

---

## 13. Privacy and safety rules

Contribution data must respect these rules:

- do not infer private repo names or languages from private contribution counts;
- do not expose token values in logs, errors, or committed files;
- do not expose the GitHub OAuth client secret in frontend code;
- exchange OAuth authorization codes only through the Cloudflare Worker broker;
- treat private or restricted contribution counts as anonymous activity only;
- clearly distinguish repo-centric REST data from GraphQL contribution-calendar data and approximate fallback data.

---

## 13.1. OAuth token source rules

GitPulse uses these GraphQL token sources in priority order:

1. OAuth session token loaded from `sessionStorage`.
2. Advanced manual development token stored in memory.
3. No token, which means demo or approximate contribution fallback.

The OAuth token is not part of `GitPulseDataset` and must not be serialized into generated data. Disconnecting OAuth clears the session token and leaves REST/demo data intact.

---

## 14. Stage 3 audio mapping

Stage 3 maps normalized contribution data into a deterministic Tone.js loop with these rules.

### Primary source selection

- use `GitPulseDataset.contributionCalendar.days` when available;
- if no merged contribution calendar exists, fall back to normalized approximate activity data derived from `GitPulseDataset.days`;
- do not make live GitHub API calls from the audio engine.

### Timeline range

- use the full contribution calendar range;
- sort dates ascending before sequencing;
- preserve zero-contribution days and fill missing dates inside the selected range with zero-contribution days;
- map one contribution day to one sequencer step;
- each bar contains 4 quarter-note steps, so each step represents one day.
- calculate loop bars with `Math.ceil(stepCount / 4)`.

### Playback visual alignment

- `useAudioPattern` should provide the shared pattern used by playback UI and the Tone runtime;
- the contribution media bar renders the same ordered steps that are passed to the audio engine;
- the default selected playback start is the first audio step where `contributionCount > 0` or `intensity > 0`;
- if every step is quiet, the default selected playback start is step `0`;
- clicking a media segment or contribution grid tile sets the selected start and current playhead without autoplay;
- Skip Back and Skip Forward move the current playhead by exactly one contribution day/step and clamp at the first and final steps;
- `Pause` stops audible playback while preserving the current playhead for the next `Play`;
- `Stop` clears scheduled playback and resets the current playhead to the selected start;
- `Reset` returns the current playhead to the selected start without changing that selected start;
- the media bar playhead advances one step at a time through the scheduled `onStep` callback;
- the main contribution grid may highlight the matching `date` while playback is active;
- the main contribution grid may separately highlight the selected/current playhead date while stopped;
- the active grid tile should be brought into view inside the scrollable contribution map while playback is active;
- stopping playback clears the active grid date but keeps the selected playhead visible.

### Rhythm mapping

Stage 3 uses the normalized `intensity` field directly:

```text
0 -> rest
1 -> kick / pulse
2 -> kick + hat
3 -> kick + snare/clap + hat
4 -> kick + snare/clap + hat + accent fill
```

The mapping is deterministic for the same normalized dataset and mood settings.

### Mood and tempo behavior

- `Futuristic` is the fully tuned Stage 3 sound preset;
- other mood labels may reuse the same engine for now;
- Futuristic defaults to `118 BPM`;
- documented future defaults are:
  - Playful `126`
  - Epic `92`
  - Lo-fi `84`
  - Glitch `132`
  - Ambient `70`
- BPM remains clamped to `60-160`;
- mood changes apply their default BPM unless the user has manually changed BPM;
- user BPM changes set the override flag and are preserved across mood changes;
- resetting BPM restores the current mood default and clears the override flag.

### Volume behavior

- UI volume range is `0-100%`;
- internal master gain is tuned so 50-60% app volume is comfortably audible;
- Stage 3 uses a limiter-backed master path to keep 100% volume strong without harsh clipping;
- near-silent output should still be possible at low slider values.

### Browser audio safety

- browsers require a user gesture before audio playback;
- Stage 3 playback starts only after a `Play` click calls `Tone.start()`;
- playback can start from a selected step index and should continue to the final pattern step before looping back to that selected step;
- `Pause` may be implemented by stopping the Tone transport and preserving playhead state in Zustand;
- `Stop` must halt the transport, clear scheduled events, reset the media playhead to the selected start, and avoid overlapping replay loops.

### Media icon assets

Stage 3.3A media controls may use custom SVG files from:

```text
src/assets/icons/media/
```

Expected filenames include:

```text
play.svg
pause.svg
stop.svg
skip-back.svg
skip-forward.svg
reset-start.svg
settings.svg
volume.svg
mute.svg
```

`skip-forward.svg` is the forward-facing partner to `skip-back.svg` and should preserve the same viewBox and fill/stroke style. The UI should remain functional with `lucide-react` fallback icons if a custom media SVG is unavailable. The mood-specific sound mapping panel and sound preview buttons remain planned for Stage 3.3B.

---

## 15. Testing expectations

Stage 2.5 tests should continue to cover:

- intensity calculation;
- GraphQL contribution normalization;
- missing-user handling;
- calendar merge logic;
- preserved `perIdentityCounts`;
- preserved `sourceUsernames`;
- filled missing days;
- `mixed` data-source determination;
- total-contribution recalculation.

Stage 3 audio tests should cover:

- using the full contribution calendar range;
- filling missing dates inside a range with quiet steps;
- sorting dates before sequencing;
- intensity-to-rhythm mapping;
- dynamic bar calculation from step count;
- active-step and peak-count calculations;
- mood default BPM behavior;
- user BPM override behavior;
- active audio step reset behavior;
- selected start/current playhead behavior;
- first-active default playback start with quiet-step fallback to step 0;
- one-step skip clamping at the first and final steps;
- media segment and contribution tile click-to-select behavior;
- pause preserving the playhead and stop resetting to the selected start;
- media bar mapping from audio pattern steps to visible timeline segments.

Existing Stage 2 REST tests and the app smoke test should continue to pass.

---

## 16. Known limitations

Current intentional limitations:

- no AI-generated audio;
- no downloaded samples;
- no per-account audio layers;
- no export, recording, or MIDI output;
- no live audio-reactive Three.js scene yet.
