# GitPulse Data and Mapping Specification

## 1. Purpose

This document defines the normalized Stage 2 GitPulse dataset and the rules that transform public GitHub REST data into that shape.

The core rule is:

> UI, audio, and visuals should use normalized GitPulse data, not raw GitHub API responses.

Stage 2 is intentionally focused on data plumbing and UI wiring. It does not yet include true commit history, audio playback, or a live 3D scene.

---

## 2. Stage 2 pipeline

```text
GitHub REST API responses
  ->
GitHub client
  ->
per-identity normalization
  ->
multi-account merge
  ->
GitPulseDataset
  ->
future audio and visual mapping stages
```

Current source files:

```text
src/github/githubClient.ts
src/github/githubNormaliser.ts
src/github/githubMerge.ts
src/github/github.types.ts
src/github/githubErrors.ts
```

---

## 3. Public GitHub scope

Stage 2 uses public GitHub REST endpoints only:

```text
GET https://api.github.com/users/{username}
GET https://api.github.com/users/{username}/repos?per_page=100&sort=pushed
GET https://api.github.com/repos/{owner}/{repo}/languages
```

Constraints:

- public data only;
- no OAuth or token handling;
- no private repositories;
- no GraphQL contribution calendar;
- language byte fetches are capped to the most recently pushed 24 repositories per identity;
- repo lists can still include repositories beyond that cap, but those repos fall back to GitHub's repo-level `language` field when byte-level language data is unavailable.

Because Stage 2 is unauthenticated, GitHub rate limits must be handled gracefully.

---

## 4. Runtime dataset contract

Stage 2 currently targets this normalized dataset shape:

```ts
export type GitPulseIdentity = {
  id: string
  username: string
  displayName?: string
  avatarUrl?: string
  profileUrl?: string
  source: 'github'
  role?: 'personal' | 'work' | 'other'
  status?: 'idle' | 'loading' | 'success' | 'error'
  errorMessage?: string
  warningMessage?: string
}

export type GitPulseRepo = {
  id: string
  githubId?: number
  name: string
  fullName: string
  owner: string
  url: string
  description?: string
  primaryLanguage?: string
  languages: Record<string, number>
  stars: number
  forks: number
  openIssues?: number
  createdAt: string
  updatedAt: string
  pushedAt: string
  isFork: boolean
  isArchived?: boolean
  sourceUsernames: string[]
}

export type GitPulseLanguageStat = {
  name: string
  bytes: number
  repoCount: number
  sourceUsernames: string[]
}

export type GitPulseActivityDay = {
  date: string
  activityScore: number
  repoTouches: string[]
  sourceUsernames: string[]
}

export type GitPulseSummary = {
  totalIdentities: number
  successfulIdentities: number
  failedIdentities: number
  totalRepos: number
  activeRepos: number
  dormantRepos: number
  totalStars: number
  totalForks: number
  dominantLanguages: string[]
  languageStats: GitPulseLanguageStat[]
  mostRecentPushAt?: string
  activityScore: number
  consistencyScore?: number
  burstinessScore?: number
}

export type GitPulseDataset = {
  identities: GitPulseIdentity[]
  profileMode: 'single' | 'merged'
  repos: GitPulseRepo[]
  days: GitPulseActivityDay[]
  summary: GitPulseSummary
  generatedAt: string
  mode: 'demo' | 'live'
}
```

Stage 2 also uses an internal per-identity container before merge:

```ts
export type GitPulseIdentityDataset = {
  identity: GitPulseIdentity
  repos: GitPulseRepo[]
  days: GitPulseActivityDay[]
  mode: 'demo' | 'live'
  warnings: string[]
}
```

---

## 5. Normalization rules

Raw GitHub responses are normalized before they reach UI components.

Identity normalization:

- `login` -> `username`
- `name` -> `displayName`
- `avatar_url` -> `avatarUrl`
- `html_url` -> `profileUrl`
- fetch outcome sets `status`
- user-facing error and warning strings stay on the identity object

Repository normalization:

- `id` becomes `githubId` and part of the stable repo key;
- `full_name` becomes `fullName`;
- `owner.login` becomes `owner`;
- `html_url` becomes `url`;
- `stargazers_count`, `forks_count`, and `open_issues_count` populate repo summary fields;
- `created_at`, `updated_at`, and `pushed_at` are normalized to ISO strings;
- `languages` stays as `Record<string, number>`;
- `primaryLanguage` is derived from language byte totals when available and falls back to GitHub's repo-level `language` field when needed.

Language-fetch failures:

- do not fail the entire identity;
- produce an empty `languages` object for that repo;
- keep repo metadata;
- surface a friendly warning such as `Could not load languages for some repositories.`

---

## 6. Merge rules

Multi-account merge is a first-class Stage 2 feature.

Rules:

1. Combine all identities into one `GitPulseDataset`.
2. Preserve failed identities with `status: 'error'` and `errorMessage`.
3. Only successful identities contribute repos and activity days.
4. Deduplicate repositories by GitHub numeric repo ID when available, otherwise by lowercased `fullName`.
5. Preserve and merge `sourceUsernames`.
6. Keep the freshest `pushedAt` for duplicate repos.
7. Keep the strongest repo metadata when duplicates disagree, such as higher stars or forks.
8. Merge per-repo language maps without double counting the same repo twice.
9. Recalculate summary metrics from the merged repo set.
10. Set `profileMode` to `merged` when more than one identity succeeds, otherwise `single`.

Important caveat:

- language totals should not double count the same repo just because that repo appears in multiple identities.

---

## 7. Summary metrics

Stage 2 calculates lightweight creative-signal metrics, not precise analytics.

Required metrics:

- `totalIdentities`
- `successfulIdentities`
- `failedIdentities`
- `totalRepos`
- `activeRepos`
- `dormantRepos`
- `totalStars`
- `totalForks`
- `dominantLanguages`
- `languageStats`
- `mostRecentPushAt`
- `activityScore`

Current guidance:

- `activeRepos`: pushed within the last 180 days
- `dormantRepos`: not pushed within the last 365 days
- `activityScore`: approximate 0-100 blend of recency, active repo breadth, and repo traction
- `consistencyScore`: approximate density of active days across the observed timeline
- `burstinessScore`: approximate peak-vs-average variation across active days

These values are intended to drive future audio and visual mappings.

---

## 8. Approximate activity days

Stage 2 does not have true commit-by-day data.

Instead, it builds an approximate `days` array from repository `pushedAt` dates:

- one entry per pushed date;
- `repoTouches` captures repos pushed on that date;
- `sourceUsernames` preserves provenance;
- `activityScore` is derived from touched repos plus simple repo traction.

This is explicitly:

```text
approximate repo activity
```

It is not a contribution graph and should be described that way in UI and docs.

---

## 9. Error handling

Stage 2 should expose predictable, user-friendly error messages.

Expected examples:

- `Enter a valid GitHub username.`
- `User not found.`
- `GitHub rate limit reached. Try again later.`
- `Network error while contacting GitHub.`
- `Could not load languages for some repositories.`

Duplicate usernames should be rejected before fetch to avoid unnecessary API calls.

---

## 10. Demo dataset requirements

Demo data exists so the Stage 2 shell remains useful without live fetches.

The demo dataset should:

- include at least two identities;
- include multiple repositories and languages;
- include recent and dormant repos;
- preserve `sourceUsernames`;
- demonstrate duplicate-repo merge behavior;
- generate meaningful summary metrics and approximate activity days.

Demo data should produce `mode: 'demo'`.

---

## 11. Testing expectations

Stage 2 data logic should remain easy to unit test without live API access.

Current required test coverage:

- normalizing a GitHub profile;
- normalizing repositories with language payloads;
- handling missing language data;
- merging two identities;
- deduplicating duplicate repos;
- preserving `sourceUsernames`;
- preserving failed identity errors;
- calculating summary metrics;
- producing `single` vs `merged` profile mode correctly.

The existing app smoke test should continue to pass alongside the Stage 2 unit tests.

---

## 12. Future stages

Stage 3 will map the normalized GitPulse dataset into a basic playable Tone.js loop.

Later stages may add:

- true contribution data via GraphQL or another approved source;
- OAuth and private-repo support;
- per-account layered audio modes;
- richer visual systems in React Three Fiber;
- export and share flows;
- extended language, mood, and signal mappings.
