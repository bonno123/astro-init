# Portfolio Redesign Plan

## Goal

Move the site away from a generic Web3/product studio feel and toward a personal, memorable portfolio for Avik: technically credible, casual, funny in specific places, and still useful for people who may want to hire or collaborate.

The main principle: do not make the shader funny. Use shaders as proof of taste and experimentation, but make the personality come from copy, interaction, layout, and small product-like details.

## Direction

Build the homepage as a funny developer control panel rather than a meme-coin clone.

Core vibe:

- Personal, not agency-template.
- Competent, but not cold.
- Playful through specific developer details.
- Warm, outlined, chunky UI inspired by playful web culture.
- One strong visual idea instead of many decorative effects.

## Visual System

Use the current brand foundation, but make it warmer and more human.

- Background: warm off-white or soft yellow-tinted surface.
- Text: near-black / navy for readability.
- Accents: keep cyan and red from the current palette so the redesign still connects to the existing site.
- Borders: high-contrast black or navy outlines.
- Cards: flat, lightly shadowed, 8px radius or less.
- Motion: use marquee/status labels/small hover states before adding more heavy WebGL.
- Shader: keep as a secondary lab/visual proof, not the main humor engine.

## Homepage Structure

### 1. Hero

Replace the current studio-style hero with a personal statement.

Possible headline:

> I build web apps, dashboards, weird experiments, and occasionally my own problems.

Possible supporting copy:

> Full-stack dev from Kolkata. I work with Astro, Vue, Web3, Cloudflare, and whatever else the project threatens me with.

Primary CTA:

- `Send the problem`

Secondary CTA:

- `See work`

Proof/status strip ideas:

- `30+ things shipped`
- `chai level: critical`
- `wallet bugs survived`
- `deploys: still standing`

### 2. Hero Visual

Use a "developer control panel" or "desktop mess" instead of an abstract shader as the main visual.

Possible modules:

- Fake terminal/status window.
- Chai indicator.
- Current task row.
- Tiny deploy log.
- Bug counter.
- Wallet popup joke.
- Floating tags for stack/tools.

The visual should feel like a usable little dashboard, not a decorative illustration only.

### 3. Marquee

Add one scrolling ticker inspired by neiroeth.io, but tailored to the portfolio.

Possible text:

`ASTRO - VUE - CLOUDFLARE - WEB3 - DASHBOARDS - CHAOS MANAGEMENT - KOLKATA - SHIPPING -`

Keep it short, readable, and not too noisy.

### 4. Work / Projects

Keep real credibility, but rewrite project cards to feel less corporate.

Current issue:

- Project copy reads like generated SaaS case studies.

New direction:

- Keep metrics and technical stack.
- Add memorable titles or subtitles.
- Add one funny quote/status per card.

Example titles:

- `The wallet connection war`
- `The one with too many charts`
- `Dashboard that finally stopped lying`
- `Tiny app, suspiciously useful`

Example card details:

- Status badge: `survived mainnet`
- Quote: `"we do not talk about v1"`
- Metric: `250ms p95`
- Stack chips: `Astro`, `Vue`, `Cloudflare`

### 5. Services / What I Do

Rename the section from generic agency language to something more personal.

Possible heading:

> Stuff people usually ask me to fix/build

Service categories:

- Web apps and dashboards.
- Web3 integrations.
- Cloudflare / deployment / infra.
- Product cleanup and technical direction.

Tone: casual headings, serious descriptions.

### 6. About / Lore

Add a compact timeline section.

Possible heading:

> Lore

Timeline badge examples:

- `Survived`
- `Humbling`
- `Bold move`
- `Still useful`

The goal is to show personality while still communicating experience and judgment.

### 7. Contact CTA

Make the contact section feel like filing a useful bug report.

Possible heading:

> Send the problem

Possible supporting copy:

> Tell me what you are building, what is broken, or what needs to exist before Friday.

CTA labels:

- `Start a thread`
- `Email me`

Optional future idea:

- A bug-report style contact form with severity options:
  - `minor`
  - `production is on fire`
  - `founder has an idea`

## Interactive Gimmick

Add one memorable interaction. Do not add several.

Preferred option:

- A fake terminal/control-panel widget in the hero.

Commands or rows:

- `whoami`
- `projects`
- `mistakes`
- `hire avik`

Alternative option:

- A `panic button` that toggles the CTA/copy from calm professional mode to chaotic mode.

Decision:

- Start with the control-panel hero because it directly supports the site concept and does not require a complicated state system.

## Implementation Phases

### Phase 1: Homepage Copy and Structure

- Rewrite hero copy.
- Replace agency voice with personal voice.
- Add status/proof strip.
- Add marquee.
- Rename and rewrite services section.
- Rewrite project cards with more personality.
- Update final CTA.

### Phase 2: Hero Control Panel Visual

- Replace the current homepage shader block with a custom control-panel component.
- Keep it responsive.
- Add small, lightweight animations.
- Preserve shader experiments on lab/playground pages.

### Phase 3: Visual Styling

- Adjust global theme colors toward warm off-white.
- Add outlined/chunky UI treatment.
- Keep cyan/red accents.
- Audit mobile spacing and text fitting.
- Avoid overusing one hue family.

### Phase 4: About / Lore Section

- Add compact timeline content.
- Keep it skimmable.
- Make it funny through labels and specific details, not long jokes.

### Phase 5: Verification

- Run `yarn build`.
- Check homepage at desktop and mobile widths.
- Confirm text does not overlap.
- Confirm animations are not distracting.
- Confirm current project/contact routes still work.

## Non-Goals

- Do not clone neiroeth.io directly.
- Do not turn the portfolio into a meme site.
- Do not add more shaders just to add movement.
- Do not bury credibility under jokes.
- Do not rewrite every page before the homepage direction works.

## First Implementation Target

Start with `src/pages/index.astro`.

Initial concrete changes:

- New hero copy.
- New status strip.
- Marquee section.
- Control-panel hero markup/CSS.
- Rewrite services and selected projects copy.
- Update CTA section copy.

