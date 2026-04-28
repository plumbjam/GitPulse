# GitPulse — Style Guide

## 1. Design intent

GitPulse should feel:

- futuristic;
- creative;
- polished;
- playful but not childish;
- technical but not sterile;
- musical;
- visually alive.

It should not feel like a conventional analytics dashboard.

The target impression is:

> “I have seen GitHub charts before, but I have never seen GitHub activity represented like this.”

---

## 2. Brand tone

### Voice

Use language that is:

- short;
- energetic;
- slightly mysterious;
- developer-friendly;
- creative;
- clear.

### Avoid

- corporate dashboard language;
- excessive technical jargon in the UI;
- generic SaaS copy;
- novelty language that feels gimmicky.

### Example UI copy

Good:

```text
Generate your pulse
Your GitHub activity has a sound
Merge accounts
Remix track
Choose mood
Start audio
```

Avoid:

```text
Submit user data for contribution visualisation
Perform repository analytics operation
Configure advanced sonification parameters
```

---

## 3. Visual identity

### Overall look

Default visual direction:

- dark background;
- neon accents;
- glowing particles;
- soft gradients;
- glass-like panels;
- subtle motion;
- high contrast;
- audio-reactive animation.

### Layout

Recommended layout:

- full-screen hero canvas;
- floating control panel;
- compact account chips;
- mood selector as prominent creative control;
- insight cards below or beside the canvas.

### Shape language

Use:

- rounded panels;
- circular/orbital forms;
- pulse rings;
- waveform elements;
- particle trails;
- orbit paths;
- equaliser-like bars.

Avoid:

- heavy square dashboard grids;
- flat static charts as the main experience;
- overly cluttered controls.

---

## 4. Colour guidance

### Base theme

Recommended base:

```text
Background: near-black / deep navy
Primary accent: electric cyan or blue
Secondary accent: violet/magenta
Highlight: soft white glow
Warning/error: warm red/orange
Success: green only where semantically useful
```

### Mood palettes

#### Futuristic

- cyan;
- violet;
- blue-white;
- dark navy;
- crisp glows.

#### Playful

- bright cyan;
- coral;
- yellow;
- mint;
- bouncy contrast.

#### Epic

- deep purple;
- gold;
- blue-black;
- white flares;
- large soft gradients.

#### Lo-fi

- warm amber;
- muted purple;
- dusty rose;
- soft brown/cream accents.

#### Glitch

- acid green;
- magenta;
- harsh cyan;
- digital red;
- scanline contrast.

#### Ambient

- teal;
- blue;
- soft violet;
- low contrast;
- slow gradients.

---

## 5. Typography

Use clean modern fonts.

Recommended:

- Inter;
- Sora;
- Space Grotesk;
- JetBrains Mono for technical labels.

Possible pairing:

```text
Headings: Sora or Space Grotesk
Body: Inter
Technical/meta labels: JetBrains Mono
```

---

## 6. UI components

### Username input

Should support:

```text
single username
comma-separated usernames
space-separated usernames
```

Placeholder examples:

```text
Enter GitHub username
Try: octocat
Merge accounts: alice, alice-work
```

### Account chips

Account chips should show:

```text
@username
```

For multi-account merge, chips should make it clear that more than one identity is active.

### Mood selector

Mood selection should feel like choosing a creative mode, not a boring setting.

Possible labels:

```text
Futuristic
Playful
Epic
Lo-fi
Glitch
Ambient
```

### Transport controls

Use clear labels:

```text
Start Audio
Play
Pause
Stop
Remix
```

Remember browser audio restrictions: audio must be started by explicit user interaction.

### Insight cards

Insight cards should feel playful and interpretive.

Examples:

```text
Burst Coder
Deep Diver
Repo Hopper
Polyglot
Revivalist
Signal Splitter
```

---

## 7. Audio style

### General rules

Generated audio should be:

- listenable;
- not too harsh;
- not too dense by default;
- clearly reactive to data;
- mood-specific;
- safe in volume.

### Avoid

- random unpleasant noise;
- excessive dissonance;
- clipping;
- sudden loud spikes;
- too many simultaneous notes.

### Musical constraints

MVP should use:

- pentatonic scales;
- controlled note density;
- capped velocity;
- master limiter/compressor;
- safe default volume.

### Audio identity

Each mood should have a recognisable identity.

| Mood | Audio feel |
|---|---|
| Futuristic | Clean synth pulses, electronic drums |
| Playful | Bouncy plucks, quirky percussion |
| Epic | Cinematic hits, pads, reverb |
| Lo-fi | Soft drums, warm bass, tape wobble |
| Glitch | Broken rhythms, bitcrush, stutters |
| Ambient | Slow pads, sparse pulses |

---

## 8. Visual style

### Visual rules

Visuals should be:

- audio-reactive;
- data-informed;
- fluid;
- performant;
- beautiful even when idle.

### MVP visual motif

Use:

```text
Pulse Field + Repo Orbit
```

That gives the app both:

- old-school visualiser energy;
- GitHub-specific meaning.

### Audio-reactive parameters

Audio can drive:

- scale;
- glow;
- particle speed;
- camera drift;
- pulse ring size;
- waveform amplitude;
- node brightness.

### Data-driven parameters

GitHub data can drive:

- repo node count;
- repo size;
- orbit distance;
- language colour;
- account source accent;
- recent activity brightness.

---

## 9. Accessibility

Minimum expectations:

- clear keyboard focus states;
- sufficient contrast;
- reduced motion option later;
- visible text labels for controls;
- do not rely on colour alone;
- audio start/stop always accessible;
- no autoplay audio.

Add a future setting:

```text
Reduce motion
```

---

## 10. Code style

### TypeScript

Use explicit types for shared contracts.

Important contracts should live in:

```text
src/types/
```

### Components

Keep components focused.

Prefer:

```text
UsernameForm.tsx
MoodSelector.tsx
TransportControls.tsx
VisualCanvas.tsx
```

Avoid large monolithic pages.

### Audio code

Audio code should be isolated under:

```text
src/audio/
```

Audio objects should be disposed cleanly.

### Visual code

Visual code should be isolated under:

```text
src/visuals/
```

Keep Three.js/R3F logic away from ordinary UI components where possible.

### GitHub API code

GitHub API code should be isolated under:

```text
src/github/
```

Do not scatter fetch calls across UI components.

---

## 11. Error state tone

Error messages should be clear and friendly.

Examples:

```text
We could not find that GitHub user.
GitHub rate limit reached. Try the demo profile for now.
One account failed to load, but the others are ready.
```

Avoid:

```text
Unhandled exception
Fetch failed
Invalid API response object
```

---

## 12. Public repo standards

Before public release:

- no secrets;
- no private tokens;
- no committed `.env` files;
- README complete;
- screenshots/GIFs added;
- licence added;
- build passes;
- mobile layout acceptable;
- browser audio behaviour tested.
