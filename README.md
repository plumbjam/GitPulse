# GitPulse

> Your GitHub activity has a sound.

GitPulse is an open-source creative web app that turns one or more GitHub identities into a personalized audio-visual coding signature.

## Stage 2.6 + Stage 3.3A status

Stage 2.6 adds GitHub OAuth login through a Cloudflare Worker broker while Stage 3.3A adds media-style transport controls and selectable playback start positions.

Implemented so far:

- public GitHub REST fetching for profile, repositories, and repository languages;
- multi-account normalization and merge logic;
- repo/language summary metrics and approximate repo-push timeline;
- optional GitHub GraphQL contribution calendar fetching with OAuth or an advanced manual token;
- GitHub OAuth login through a Cloudflare Worker broker for contribution-calendar access;
- advanced manual token fallback for development;
- OAuth session tokens stored in `sessionStorage` for the current browser session;
- merged contribution calendar data model with deterministic intensity levels;
- GitPulse-styled contribution grid UI;
- demo and approximate fallback contribution modes when no token is present;
- deterministic Tone.js loop generation across the full contribution calendar range;
- contribution media bar directly under the grid, using the same dynamic pattern as playback;
- active media segment and matching contribution tile highlighting while the loop plays;
- active contribution tile auto-follow inside the scrollable grid;
- safe click-to-play transport with Reset, Skip Back, Play/Pause, Stop, and Skip Forward controls;
- default playback start from the first active contribution day, falling back to step 0 for quiet timelines;
- clickable media segments and contribution grid tiles that set the selected playhead without autoplay;
- pause behavior that stops audible playback while preserving the current playhead for the next Play;
- stop/reset behavior that returns the playhead to the selected start;
- one-step skip controls for moving by one contribution day;
- mood-aware BPM defaults with a user BPM override and reset-to-default control;
- louder practical master volume with limiter protection;
- unit tests for REST normalization, repo merge logic, contribution calendar logic, audio state, media timeline mapping, and pure audio mapping helpers.

Not implemented yet:

- full user accounts or database-backed sessions;
- broad backend proxy services beyond the OAuth broker;
- private repository detail access;
- live React Three Fiber scene;
- export/share flows;
- downloaded sample packs;
- AI audio features;
- per-account audio layers;
- audio export, recording, or MIDI output.
- mood-specific sound mapping controls, which are planned for Stage 3.3B.

## Stage 3 audio MVP

GitPulse Stage 3 uses deterministic Tone.js synthesis only.

Current behavior:

- no audio starts automatically;
- the user must click `Play`, which then resumes the browser audio context before playback starts;
- playback starts from the selected playhead, which defaults to the first active contribution day;
- playback loop length is calculated from the available contribution day count;
- one contribution day maps to one quarter-note step;
- the media bar shows every audio step from oldest to newest;
- each bar represents 4 contribution days;
- contribution intensity drives rhythmic density and accents;
- the merged contribution calendar is the primary rhythm source;
- if a merged contribution calendar is unavailable, GitPulse falls back to normalized approximate activity data when possible.

Current audio scope:

- one tuned mood: `Futuristic`;
- generated synth and drum sounds only;
- no sample downloads;
- no AI audio generation;
- no recording, export, or MIDI output.

## Data sources

GitPulse currently uses two GitHub API surfaces:

### Public REST data

- `GET https://api.github.com/users/{username}`
- `GET https://api.github.com/users/{username}/repos?per_page=100&sort=pushed`
- `GET https://api.github.com/repos/{owner}/{repo}/languages`

This powers:

- identity lookup;
- public repos and repo metadata;
- language breakdowns;
- merged repo summary metrics.

### Optional GraphQL contribution calendar

- `POST https://api.github.com/graphql`

This powers:

- classic contribution-calendar day counts;
- merged day-by-day activity timeline;
- primary timing source for the Stage 3 audio engine.

GraphQL contribution calendar fetching requires an OAuth session token or a manual development token, but the app does not require either to remain usable.

## OAuth and Token Behavior

- GitHub OAuth is the primary public connection path;
- a Cloudflare Worker broker exchanges GitHub OAuth codes for access tokens;
- the GitHub OAuth client secret is never placed in frontend code;
- OAuth tokens are stored in `sessionStorage` and cleared when the browser session ends or the user disconnects;
- manual token input remains available as an advanced developer fallback;
- manual tokens are stored in memory only;
- without OAuth or a manual token, GitPulse falls back to demo or approximate contribution activity;
- if GitHub includes private contribution counts for your token and settings, GitPulse treats them as anonymous count data only.

GitPulse does not infer private repository names, languages, or private repo details from contribution counts.

## Contribution calendar behavior

GitPulse supports these contribution-calendar sources:

- `demo`
- `graphql`
- `approximate`
- `mixed`

Behavior:

- multiple identity calendars are merged by date;
- contribution counts are summed per day;
- `perIdentityCounts` and `sourceUsernames` are preserved;
- missing days are filled with zero-count entries for grid continuity;
- merged data source becomes `mixed` when calendars come from different origins.

## Approximate timeline caveat

GitPulse still keeps the Stage 2 repo-push `days` array.

That data remains useful as:

- a tokenless fallback contribution signal;
- a lightweight repo-centric activity view;
- a backup timing source if GraphQL contribution data is unavailable.

It is not true commit history and should be treated as approximate repo activity, not forensic analytics.

## Browser audio behavior

- browsers block autoplay, so playback begins only after an explicit `Play` click;
- GitPulse calls `Tone.start()` only from that user gesture path;
- repeated transport interactions reuse the Tone transport safely and avoid overlapping duplicate loops;
- `Pause` stops the audible Tone transport but preserves the current playhead, so the next `Play` starts from that step;
- `Stop` clears scheduled playback and resets the visible media timeline back to the selected start;
- `Reset` returns the playhead to the selected start without changing the selected start;
- Skip Back and Skip Forward move one contribution day/step and clamp at the timeline ends;
- clicking a media segment or contribution tile sets the selected start/playhead but does not autoplay.

## Audio controls

- `Futuristic` defaults to `118 BPM`;
- BPM stays in the safe `60-160` range;
- mood changes apply their default BPM unless the user has manually changed BPM;
- `Reset BPM` restores the current mood default and clears the user override;
- user BPM changes update the Tone transport while playing;
- volume stays in the safe `0-100%` range and maps internally to a louder limiter-protected master gain;
- the UI shows the active audio source, timeline origin, loop length, active contribution steps, and current playhead.
- custom media SVG icons live in `src/assets/icons/media/`; `skip-forward.svg` is mirrored from `skip-back.svg`, and the UI can fall back to `lucide-react` icons if an expected media icon is unavailable.

## Known limitations

- only the Futuristic mood is sonically tuned in Stage 3;
- other mood labels currently reuse the Futuristic engine while keeping their own default BPMs;
- contribution intensity drives rhythm, but there are no per-account audio layers yet;
- long timelines can create very dense media bars, so individual day segments may become narrow;
- the visualiser is still a placeholder rather than a live audio-reactive scene.

## Local setup

```bash
npm install
npm run dev
```

For OAuth configuration, see [docs/OAUTH_SETUP.md](docs/OAUTH_SETUP.md).

## Quality commands

```bash
npm run format
npm run lint
npm run format:check
npm run typecheck
npm run test
npm run build
```

## Stack

- npm
- React
- Vite
- TypeScript
- Tailwind CSS
- shadcn/ui-style primitives
- lucide-react
- framer-motion
- Tone.js
- zustand
- Vitest + React Testing Library
- ESLint + Prettier
- Husky + lint-staged
- three
- @react-three/fiber
- @react-three/drei

## GitHub Pages preparation

Vite is configured with:

```ts
base: '/GitPulse/'
```

This matches repository-name deployment on GitHub Pages.

## Project docs

- `README.md`
- `CONTRIBUTING.md`
- `HLD.md`
- `docs/PROJECT_PLAN.md`
- `docs/ROADMAP.md`
- `docs/STYLE_GUIDE.md`
- `docs/DATA_AND_MAPPING_SPEC.md`
- `docs/OAUTH_SETUP.md`
- `docs/AGENT_GUIDE.md`
- `docs/AGENT_FOUNDATION_PROMPT.md`

## Roadmap

- Stage 1: Foundation shell
- Stage 2: GitHub ingestion and multi-account normalization
- Stage 2.5: Contribution calendar grid and mergeable activity timeline
- Stage 3: Tone.js audio engine MVP
- Stage 2.6: GitHub OAuth login
- Stage 3C: Mood presets expansion
- Stage 4: React Three Fiber visual MVP
- Stage 5+: Mapping expansion, export/share, and advanced creative features

## Open-source positioning

GitPulse is intended as an open-source playground and creative developer tool.
Contributions, issue reports, and implementation ideas are welcome.
