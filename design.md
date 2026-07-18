# Project Gooseneck — Design System

> Minimal, monochrome, precise. The interface stays black-and-white so the coffee — bean photos, the hero video, brew imagery — carries all the color. Built for phone-in-hand use during a live brew and calm browsing on desktop.

## How this file was made

The design language was chosen collaboratively by pulling references from Mobbin and reviewing them together. Every major decision traces back to a reference the owner picked.

**Locked decisions:**

| Decision | Choice |
|---|---|
| Mood | Minimal Scandinavian precision |
| UI color | **Monochrome + one accent** — grayscale UI plus a single roast-orange accent used sparingly at a few defined spots; color otherwise comes only from bean photos, hero video, recipe imagery |
| Type | **Space Grotesk** (headings) · **Inter** (body) · **JetBrains Mono** (numerics: dose, ratio, water, time) |
| Theme | **Light + dark**, light default, follows OS + manual toggle |
| Icons | **Phosphor** (`@phosphor-icons/react`), regular weight default |

**Reference map (picks → what each informs):**

| Reference | Pattern borrowed | Applied to |
|---|---|---|
| **ElevenLabs** (base) | Monochrome canvas, black pill buttons, uppercase eyebrows, hairline soft cards, vertical-tab interactive showcase | Global system + recipe-detail layout |
| **Vercel** (components) | Grid/crosshair texture, hairline-divided feature grids, Geist-grade headings, line icons, checkmark lists | Components, section layouts |
| **Superpower** — How it works | Numbered 1–4 image cards w/ device mockups | Landing "how to brew" + pour timeline metaphor |
| **Portrait/hosting** — 3-step | Clean centered 3-up, icon circles, dashed divider, pill CTAs | Simple how-it-works / onboarding |
| **Biograph** — How it works | Editorial image-forward 3-step, `OUR METHOD` eyebrow | Landing storytelling / emotive coffee photography |
| **Deel** — Global People Platform | Bento grid of cards with embedded UI widgets | Feed cards & feature bento |
| **Hero (coffee video)** | Full-bleed looping video behind bold headline + pill CTAs | Landing hero |

## 1. Principles

1. **Monochrome UI, color from coffee.** Chrome is neutral grays + near-black/near-white; photography and video introduce most hue. Two disciplined exceptions: **one accent** (roast-orange, a few defined spots) and a minimal **functional status** palette — see §3.3.
2. **Hairlines over shadows.** Structure comes from 1px borders, dividers, and whitespace — not heavy elevation.
3. **Numbers are first-class.** Dose, ratio, water, temperature, and time render in JetBrains Mono so a recipe reads like an instrument panel.
4. **Whitespace is the layout.** Generous spacing; let content breathe (ElevenLabs/Vercel density).
5. **The timer is sacred.** Legible at arm's length, one-handed, works in a dim kitchen (dark mode shines), never cluttered.
6. **Progressive disclosure.** Recipes are dense; reveal detail in tabs/steps rather than one wall of fields.

## 2. Brand & voice

- **Project name:** Project Gooseneck.
- **Name / wordmark:** the in-app product wordmark is "Gooseneck" set in Space Grotesk Medium, tight tracking (`-0.02em`), title-case. (The "Project" prefix is the working/project name, not part of the user-facing brand — confirm with the owner if it should appear in the UI.)
- **Tone:** precise, unfussy, quietly expert. Like a good barista who respects your time. Short labels, real numbers, no marketing fluff inside the app.
- **Microcopy examples:** "Start brew", "Save version", "Fork this recipe", "Log a brew", "Bloom · 50g · 0:45".

## 3. Design tokens

Tokens are CSS custom properties on `:root` (light) and `[data-theme="dark"]` (dark), mapped into Tailwind. Names below are the source of truth.

### 3.1 Color — light (default)

Neutral (true-gray) scale; near-black foreground is the "primary/accent."

| Token | Value | Use |
|---|---|---|
| `--bg` | `#FAFAFA` | App canvas |
| `--surface` | `#FFFFFF` | Cards, sheets, inputs |
| `--surface-2` | `#F4F4F5` | Subtle fills, hover, bento cards, skeletons |
| `--surface-3` | `#E9E9EB` | Pressed / deeper fill |
| `--border` | `#E4E4E7` | Hairline borders, dividers |
| `--border-strong` | `#D4D4D8` | Emphasized borders, secondary-button outline |
| `--text` | `#111111` | Primary text, primary button bg |
| `--text-secondary` | `#52525B` | Body-secondary, meta (passes 4.5:1 on `--bg`) |
| `--text-muted` | `#A1A1AA` | Placeholders, disabled, captions |
| `--fg-inverse` | `#FAFAFA` | Text on dark/primary surfaces |

### 3.2 Color — dark

| Token | Value | Use |
|---|---|---|
| `--bg` | `#0A0A0A` | App canvas |
| `--surface` | `#141414` | Cards, sheets, inputs |
| `--surface-2` | `#1C1C1F` | Subtle fills, hover, bento |
| `--surface-3` | `#26262A` | Pressed / deeper fill |
| `--border` | `#262626` | Hairlines |
| `--border-strong` | `#3A3A3D` | Emphasized borders |
| `--text` | `#FAFAFA` | Primary text, primary button bg (inverts to white pill) |
| `--text-secondary` | `#A1A1AA` | Secondary text |
| `--text-muted` | `#71717A` | Placeholders, disabled |
| `--fg-inverse` | `#0A0A0A` | Text on light/primary surfaces |

### 3.3 Color beyond grayscale — accent & status

The UI is grayscale except for **one accent hue** plus a minimal set of functional status colors. Both are used sparingly and never as decoration.

**Accent — the one hue.** A single warm roast-orange (crema), brightened in dark mode. This is the *only* decorative color in the product. In code the token is **`--brand`** (Tailwind: `brand`) — deliberately *not* `--accent`, because shadcn/ui reserves `--accent` for a neutral hover surface. Don't conflate them.

| Token | Light | Dark | Use |
|---|---|---|---|
| `--brand` | `#DD5B2E` | `#F26A3C` | The one pop color (a.k.a. "the accent") |
| `--brand-contrast` | `#FFFFFF` | `#111111` | Text/icon sitting on a brand fill |

**Where the accent is allowed** (keeping it to a few spots is what makes it read as intentional):

- Brew-timer **progress ring + the live/active target number** — its signature home
- **Star ratings**
- The **hero eyebrow** (one per marketing page — not every section eyebrow)
- The **active/live step marker** in the pour timeline (e.g. Bloom)
- **Link hover** and **focus rings**

**Not allowed:** primary buttons (they stay the solid black/white button), large fills, page/section backgrounds, body text, or more than ~2 accent elements in one viewport. When in doubt, leave it gray.

**Functional status** — validation, status, and destructive confirmation only. Modest saturation; always paired with an icon or text (never color alone).

| Token | Light | Dark | Use |
|---|---|---|---|
| `--danger` | `#C0392B` | `#F0625A` | Form errors, delete confirms |
| `--success` | `#2E7D5B` | `#4CB98A` | Save/publish confirmations |

Rating uses filled vs. outline Phosphor stars **tinted with `--accent`** — never bare color as the only signal.

### 3.4 Typography

Self-host via `next/font/google`: Space Grotesk, Inter, JetBrains Mono. CSS vars: `--font-display`, `--font-sans`, `--font-mono`.

| Role | Font | Size (desktop) | Weight | Tracking | Notes |
|---|---|---|---|---|---|
| Display | Space Grotesk | `clamp(2.5rem, 5vw, 4.5rem)` | 500–700 | `-0.02em` | Hero, big moments |
| H1 | Space Grotesk | 2.5rem / 40px | 600 | `-0.02em` | |
| H2 | Space Grotesk | 2rem / 32px | 600 | `-0.015em` | Section titles |
| H3 | Space Grotesk | 1.5rem / 24px | 500 | `-0.01em` | Card/recipe titles |
| H4 | Space Grotesk | 1.25rem / 20px | 500 | normal | |
| Body-lg | Inter | 1.125rem / 18px | 300 | normal | Lead paragraphs |
| Body | Inter | 1rem / 16px | 300 | normal | Default |
| Body-sm | Inter | 0.875rem / 14px | 300 | normal | Meta, helper |
| Caption | Inter | 0.8125rem / 13px | 300 | normal | Fine print |
| Eyebrow | Inter | 0.75rem / 12px | 600 | `0.1em`, UPPERCASE | `OUR METHOD`, `USE CASES` |
| Numeric | JetBrains Mono | contextual | 500 | normal | **22g · 1:16 · 350g · 93°C · 02:15** |
| Timer display | JetBrains Mono | `clamp(4rem, 22vw, 8rem)` | 500 | normal | Full-screen brew timer |

Line-height: headings `1.1`, body `1.55`. Mobile scales down ~1 step per role.

Default body weight is **300 (Light)** — it gives the calm, precise feel. Use **400/500** for emphasis, buttons, and labels; if 300 ever feels too thin on a specific dense/small element, step that element to 400 (don't lighten headings or numerics).

### 3.5 Spacing (4px base)

`0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128`. Section vertical rhythm: 64–96 mobile, 96–128 desktop. Card padding: 16 (compact) / 24 (default).

### 3.6 Radius

`--r-sm 4` (chips/badges, inputs-inner) · `--r-md 6` (buttons, inputs, small cards) · `--r-lg 8` (cards) · `--r-xl 12` (large cards, image tiles, media) · `--r-pill 9999` (reserved for rare fully-round elements — status dots, avatars if desired).

**Components are rectangular with tight radii — buttons and badges are NOT pills** (Geist-style precision). This is the component language: rectangular controls, small radii, hairline-divided grids, segmented tabs.

### 3.7 Borders, elevation, texture

- **Hairline:** `1px solid var(--border)` — the default separator everywhere.
- **Elevation (use sparingly):** `--e1: 0 1px 2px rgba(0,0,0,.04)`; `--e2: 0 8px 30px rgba(0,0,0,.08)` (menus, modals, sheets). Dark mode leans on `--border-strong` + lighter surface instead of shadow.
- **Grid texture (Vercel-ism, optional):** faint dotted grid or 1px gridlines for hero/section backgrounds; `+` crosshair marks at the corners of bordered hero containers. Opacity ≤ 6%. Use on marketing surfaces only, not inside the app.

### 3.8 Iconography — Phosphor

- Library: `@phosphor-icons/react`. Default weight **regular** (single-weight line look matches Vercel/Geist). **Bold** or **fill** for active/selected. Sizes 16 / 20 / 24. Color inherits `currentColor`.
- Suggested mappings: `Drop` (bloom), `Timer` (brew timer), `Coffee`/`CoffeeBean` (recipe/bean), `Scales` (ratio/dose), `Thermometer` (temp), `GitFork` (fork), `ClockCounterClockwise` (version history), `Star` (rating), `Plus` (create), `MagnifyingGlass` (search), `User` (account).

### 3.9 Imagery & video

- **The only color in the product.** Bean/grind photos, brew shots, hero video.
- Aspect ratios: feed/hero 16:9 or 3:2; bean/grind uploads square (1:1) or 4:3; recipe hero 3:2.
- Corner radius on media: `--r-lg`/`--r-xl`. Subtle 1px inner border to seat photos against light surfaces.
- Hero video: muted, looping, `playsInline`, poster fallback; slate/near-black overlay for text legibility; respects `prefers-reduced-motion` (falls back to poster still).
- Uploads: user photos should feel editorial — encourage good framing via a subtle guide overlay in the uploader.

### 3.10 Motion

- Durations: 150ms (hover/press), 200ms (toggles), 250–300ms (enter/sheet). Easing: `cubic-bezier(.2,.8,.2,1)` standard, `ease-out` for enters.
- Timer transitions are crisp step-changes (no easing lag on the countdown).
- Always honor `prefers-reduced-motion: reduce` (disable video autoplay, parallax, non-essential transitions).

## 4. Components

### 4.1 Buttons

| Variant | Light | Dark | Shape / size |
|---|---|---|---|
| Primary | bg `--text`, text `--fg-inverse` | bg `--text` (white), text `--fg-inverse` (black) | **rect `--r-md` (6px)**; h 40 (md)/44 (lg)/32 (sm); px 14; Inter 500 14px; hover → `--text-secondary` |
| Secondary | bg `--surface`, 1px `--border-strong`, text `--text` | same tokens | rect; hover bg `--surface-2`, border `--text-muted` |
| Ghost | transparent, text `--text-secondary` | same | rect; hover bg `--surface-2`, text `--text` |
| Icon | square 36, radius `--r-md`, optional border | same | Phosphor 18–20 centered |
| Destructive | text/border `--danger`; solid `--danger` only on confirm dialogs | same | rect |

States: hover (slight bg/opacity shift), active (translate 0 / `--surface-3`), focus-visible (2px ring `--text` at 40% + 2px offset), disabled (`--text-muted`, no bg). Min tap target 44px on mobile.

### 4.2 Inputs & forms

- Field: bg `--surface`, 1px `--border`, radius `--r-md`, h 44, px 14, Inter 15. Focus: border `--text` + 2px ring (`--text` @ 30%). Error: border `--danger` + `--danger` helper text w/ `Warning` icon.
- **Label** above (Body-sm 500), **helper/error** below (Caption).
- **Number fields** (dose, water, temp) render value in JetBrains Mono with a trailing unit adornment (`g`, `°C`).
- **Select:** custom, `CaretDown` Phosphor caret.
- **Photo upload (bean/grind):** dashed-border drop card (`--border-strong`), `ImageSquare`/`Camera` icon, "Drag a photo or tap to use camera" (mobile opens camera). Shows square thumbnail + replace/remove after upload.
- **Ratio helper:** dose + water auto-computes `1:16` (mono) live.

### 4.3 Cards

- **Base:** bg `--surface`, 1px `--border`, radius `--r-lg`, padding 24. Interactive hover: border `--border-strong` + `--e1`.
- **Recipe / feed card:** media top (3:2), body: method chip + visibility, **title** (H3/H4), meta row (author avatar + name, `1:16` mono, dose mono), footer: rating (accent-tinted stars) + brew count. Whole card is the link.
- **Feature grid (Vercel-style):** a single bordered container divided into cells by 1px rules; each cell = Phosphor line icon + bold title + quiet description. This is the default "why Gooseneck" / features layout on the landing page. (A Deel-style filled `--surface-2` bento card remains an option when a cell needs to embed a live UI preview like a timeline snippet or timer mock.)

### 4.4 Eyebrow, tags, badges

- **Eyebrow:** uppercase 12px `0.1em`, `--text-muted`, above section titles.
- **Tag/chip:** small rounded-rectangle (`--r-sm`) with a 1px hairline border, `--surface-2` or transparent fill, 12–13px; method (`V60`), roast level, tasting notes. (Not a pill.)
- **Numbered badge:** small rounded square (`--r-md`) with mono index (`1`–`4`) — used on how-it-works cards (top-left overlay) and timeline steps.
- **Visibility badge:** `Private` (outline) / `Public` (filled foreground).

### 4.5 Numbered step & pour timeline (signature data pattern)

Shared visual language for landing "how it works" **and** the recipe pour schedule.

- **How-it-works (landing):** image tile with numbered badge overlay + title + description below (Superpower/Biograph).
- **Pour timeline (recipe detail):** vertical list, each row connected by a 1px rail:
  - left: step index / phase icon (`Drop` for bloom)
  - label: **Bloom** / **Pour 2** (Space Grotesk)
  - metrics (mono): target this step `50g`, cumulative `→ 150g`, time window `0:00–0:45`
  - optional note (Body-sm, `--text-secondary`)
  - **Bloom** row emphasized (subtle `--surface-2` fill).

### 4.6 Vertical tab showcase (ElevenLabs pattern)

Desktop recipe detail & landing feature: left column of items (Phosphor icon + label; active = bold `--text`, inactive `--text-muted`), right = preview panel (bordered card). On mobile collapses to a horizontal segmented control or stacked sections.

### 4.7 Navigation

- **Top bar (all viewports):** wordmark left; sticky; 1px bottom border; height 64. Desktop: center/right links (Feed · Create · About) + right cluster (theme toggle, search, avatar menu / `Sign in` pill). Scrolled state: `--surface` bg + hairline.
- **Mobile bottom nav (in-app):** 4 tabs with Phosphor icons — **Feed** (`MagnifyingGlass`/`House`), **Create** (`Plus`), **Brew** (`Timer`), **Profile** (`User`). Active = filled weight + `--text`. Ergonomic for one-handed use. Hidden on the full-screen timer.
- **Theme toggle:** `Sun`/`Moon` Phosphor icon button; persists choice, defaults to OS.

### 4.8 Brew timer (the hero component)

Full-screen focus mode, mobile-first; dark mode ideal for a dim kitchen.

- **Layout (top→bottom):** current phase label (H2/H3) → giant elapsed time (JetBrains Mono, `clamp` display size) → target water for current step (mono, large, e.g. `150g`) → "Next: Pour 3 in 0:12" hint (`--text-secondary`) → progress indicator → controls.
- **Progress:** thin ring or linear bar in `--text` over `--surface-2`; segment ticks per step.
- **Controls:** large primary **Start / Pause** pill (full-width on mobile), **Reset** ghost, step **skip** optional. All ≥ 56px tall on mobile.
- **Behavior:** keeps screen awake (Wake Lock), optional audio/haptic cue on step change, step list expandable below. Minimal chrome; bottom nav hidden.

### 4.9 Feedback & states

- **Empty:** centered Phosphor icon (`--text-muted`) + one-line message + primary action (e.g., "No recipes yet — Create your first").
- **Loading:** `--surface-2` skeletons matching card/timeline shapes; subtle shimmer (disabled under reduced-motion).
- **Error:** inline (form) or card-level with `Warning` icon + retry.
- **Toast:** bottom-center, `--surface` + hairline + `--e2`, auto-dismiss; success/error use functional color on the icon only.
- **Modal / sheet:** desktop centered modal, mobile bottom sheet; `--surface`, `--r-xl` top corners, `--e2`, scrim `rgba(0,0,0,.4)`.

## 5. Page layouts

Breakpoints: `sm 640 · md 768 · lg 1024 · xl 1280`. Content max-width 1200 (marketing) / 960 (app reading). Mobile-first.

- **Landing / marketing:** full-bleed **video hero** (bold Space Grotesk headline + two CTAs, optional grid/crosshair frame) → **How it works** (numbered 3–4 steps, Superpower/Biograph) → **feature grid** (hairline-divided, Vercel-style) → sample public recipes → footer (Vercel-style, hairline columns).
- **Discovery feed:** sticky sub-header (search + method/roast filters as chips) → responsive card grid (1 col mobile / 2 md / 3 lg). Infinite scroll or "Load more".
- **Recipe detail:** header (title, author, method chip, visibility, actions: Fork / Log brew / Edit) → params summary (mono grid: dose, water, ratio, temp, grind) → **pour timeline** (§4.5) → prominent **Start brew** CTA → tasting notes / brew log history → version history (`ClockCounterClockwise`). Desktop may use the vertical-tab showcase (§4.6): Overview · Timeline · Brews · Versions.
- **Brew timer:** §4.8, full-screen route.
- **Create / edit recipe:** sectioned long form (Bean → Grinder → Recipe params → Bloom → Pours (repeatable step rows) → Photos → Visibility). Sticky save bar (Save version / Cancel). Live ratio compute. Mobile: one section per screen or accordion.
- **Auth:** centered card on `--bg`, wordmark, email+password fields, `Continue with Google` (secondary pill w/ Google mark), toggle sign-in/up. Minimal, no imagery.
- **Account / profile:** avatar + name, tabs: My recipes · Brew log · Settings (theme, account). Grid of the user's recipe cards.

## 6. Accessibility & responsive (best practices)

This is the quality bar every screen is checked against — see the audit trigger in §9.

**Accessibility**

- Contrast: all text ≥ 4.5:1 (`--text-secondary` verified on `--bg` both themes); large/display ≥ 3:1.
- Focus-visible rings on every interactive element; logical tab/reading order; label every control.
- Status never by color alone (icon + text); rating uses filled/outline shapes.
- `prefers-reduced-motion` disables video autoplay, shimmer, parallax.
- All photos require alt text; timer announces step changes via `aria-live`.

**Responsive & layout**

- **Mobile-first.** Author base styles for small screens; layer up with `sm 640 · md 768 · lg 1024 · xl 1280`. Never desktop-first with `max-width` overrides.
- **Fluid, not fixed.** Headings use `clamp()`; spacing scales; avoid fixed `px` heights on content — use `min-height` and let content grow. Never a horizontal scrollbar on the page body: guard wide content (tables, code, timelines) with `overflow-x:auto` inside its own box; media `max-width:100%`.
- **Tap targets ≥ 44×44** (timer controls ≥ 56); comfortable spacing between tappable items.
- **Container queries** for component-level responsiveness (a `RecipeCard` / `PourTimeline` adapts to its container, not just the viewport) where practical.
- **One nav per viewport.** Desktop top bar, mobile bottom tab bar (§4.7) — never both at once. Full-screen timer hides chrome.
- **Safe-area insets.** Respect `env(safe-area-inset-*)` for the mobile bottom nav and the full-screen timer (notch / home indicator).
- **Thumb-zone.** Primary actions reachable one-handed on phones; the brew timer is optimized for phone-in-hand (large numerals, big controls, screen wake-lock).
- **Mobile inputs.** Correct `type`/`inputmode` (numeric keypad for dose/water/temp), and `capture` for camera photo upload.

**Performance (best practice)**

- **No layout shift (CLS):** every image/media in a fixed aspect-ratio box; `next/image` with responsive `sizes`; reserve space before load.
- **Lazy-load** offscreen images; prefer CSS for layout over JS.
- **Fonts** via `next/font` (self-hosted, no FOUT/CLS); only the weights in §3.4.
- Keep the client bundle lean (Server Components by default; client components only where needed).

**Test viewports** (verify no horizontal scroll, tap-target sizes, and the timer at the smallest width): **360×640** (small phone), **390×844** (modern phone), **768** (tablet), **1024 / 1280 / 1440** (laptop/desktop).

## 7. Tech & component stack

Chosen to match how the reference products are actually built — Vercel's Geist (`geistcn`) registry, Supabase UI, and ElevenLabs UI all sit on the **same base** — and to render this system's tokens with zero friction.

- **Framework:** Next.js (App Router) + React + TypeScript.
- **Component base:** **shadcn/ui** — Radix primitives + Tailwind, installed via the shadcn CLI (copy-in; you own the component source). This is the common foundation under all three references above, so their look is directly reproducible here.
- **Primitives:** **Radix UI** (accessible, unstyled) — behavior for dialog/sheet, tabs, dropdown, tooltip, etc.
- **Styling:** **Tailwind CSS**, driven entirely by the §3 tokens (CSS variables → `tailwind.config`). Components reference tokens, never hex literals.
- **Icons:** **Phosphor** (`@phosphor-icons/react`), regular weight — swapped in for shadcn's default Lucide (see §3.8).
- **Fonts:** Space Grotesk / Inter / JetBrains Mono via `next/font/google` (see §3.4).
- **Optional accelerators:** Supabase UI **auth blocks** for the email + Google sign-in flow; the `vercel:shadcn` skill for CLI/theming during build.

**Applying the design to shadcn components:** run `npx shadcn@latest init`, map the §3 tokens into the generated `globals.css` + `tailwind.config`, then add components (`button`, `card`, `dialog`/`sheet`, `tabs`, `input`, `badge`, …) and restyle them to §4 — **rectangular controls at `--r-md`, hairline borders, monochrome + the single accent**. Point the icon set at Phosphor.

## 8. Component inventory (surface → shared components)

Consistency comes from **reuse**: every surface is composed from the same shared components, which are each built once and read the §3 tokens. Anything appearing on ≥2 surfaces is a shared component — never re-implemented inline.

| Surface | Shared components it MUST use |
|---|---|
| **App shell** (every page) | `<SiteHeader>` (top nav), `<MobileNav>` (bottom tabs), `<Container>` (max-width + section rhythm), `<ThemeToggle>` |
| **Landing** | `<Hero>` (video), `<HowItWorks>` (numbered steps), `<FeatureGrid>` (hairline), `<RecipeCard>`, `<SiteFooter>` |
| **Feed** | `<Container>`, `<FilterBar>` (chips), `<RecipeCard>`, `<EmptyState>`, `<Skeleton>` |
| **Recipe detail** | `<RecipeHeader>`, `<ParamGrid>` (mono), `<PourTimeline>`, `<Button>` (Start brew), `<Segmented>`/`<Tabs>`, `<BrewLogList>`, `<VersionList>` |
| **Brew timer** | `<BrewTimer>` → `<ProgressRing>`, `<TimerControls>` |
| **Create / edit** | `<RecipeForm>` → `<Field>`, `<NumberField>` (unit adornment), `<PhotoUpload>`, `<PourStepEditor>`; `<StickySaveBar>` |
| **Auth** | `<AuthCard>`, `<Field>`, `<Button>`, `<GoogleButton>` |
| **Profile** | `<ProfileHeader>`, `<Tabs>`, `<RecipeCard>`, `<BrewLogList>` |

**shadcn/ui primitives underneath:** `button`, `card`, `input`, `label`, `badge`, `tabs`, `dialog`, `sheet`, `dropdown-menu`, `tooltip`, `avatar`, `skeleton`, `separator`, `sonner` (toast). Style each once to §4, then reuse.

## 9. Consistency contract (Definition of Done)

Build rules that keep every page and section identical in feel. Each screen/PR must satisfy all of these before it's "done":

1. **Tokens, not literals.** No hex/rgb, no arbitrary Tailwind values (`p-[13px]`, `text-[#333]`). Use token utilities (`bg-surface`, `text-secondary`, `border-border`, `rounded-md`, `font-display`). Add a lint rule to flag arbitrary values where practical.
2. **Shared components, not bespoke markup.** Compose from §8; never re-style a button/card/input/field per page.
3. **One shell.** Every page renders inside `<Container>` with the header/nav; section spacing uses the §3.5 rhythm (64–96 mobile / 96–128 desktop).
4. **Accent discipline.** `--brand` only at the §3.3-approved spots; never on primary buttons, fills, or backgrounds.
5. **Both themes.** Verified in light *and* dark before merge.
6. **Fonts stay in lanes.** Headings `font-display`, body `font-sans` (300), numbers `font-mono` — no mixing.
7. **Accessibility & responsive.** Meets §6 — focus-visible, ≥44px tap targets (≥56 timer), alt text, status not by color alone, no horizontal scroll, and verified at the §6 test viewports (360 → 1440).
8. **New pattern? Promote it.** If a needed component isn't in §8, add it here and build it as a shared component — don't inline a one-off.

Reference the live `design-preview.html` as the visual check; the token files below are the enforceable source.

## 10. Implementation notes

- **Fonts:** `next/font/google` for Space Grotesk / Inter / JetBrains Mono, each configured with `variable:` (`--font-space-grotesk`, `--font-inter`, `--font-jetbrains-mono`); add those classes to `<html>`. `globals.css` maps them to `--font-display` / `--font-sans` / `--font-mono`. Load **Inter 300/400/500/600** (300 = default body weight), Space Grotesk 400–700, JetBrains Mono 400/500.
- **Theming:** CSS variables on `:root` + `[data-theme="dark"]`; Tailwind `darkMode: ['class', '[data-theme="dark"]']`. Default light; a small script applies stored/OS preference pre-hydration to avoid flash.
- **Tailwind config:** extend `colors` (map every token), `fontFamily`, `borderRadius`, `spacing`, `boxShadow` from the tokens above so utilities read from one source.
- **Icons:** `@phosphor-icons/react`, regular default; wrap in a small `<Icon>` helper for consistent sizing/weight.
- **Tokens file (shipped in this repo):** `src/app/globals.css` (Tailwind v4, CSS-first; the app uses the `src/` layout) is the committed single source of truth — raw tokens, both themes via `[data-theme]`, the shadcn/ui variable mapping, and `@theme` utility exposure. `tailwind.config.ts` is included as a Tailwind v3 fallback pointing back at the same CSS variables. Components reference tokens/utilities, never hex literals.

## 11. Reference links (Mobbin)

Base + component anchors:

- ElevenLabs — <https://mobbin.com/sites/eleven-labs-80185d3d-f91c-4b7b-bec9-278f1bbb31b9/b7de5292-b215-4582-b3d9-1c1acd5a00fc/sections>
- Vercel — <https://mobbin.com/sites/vercel-a8556e28-93f4-4791-bf1c-f52246152965/444ac65c-6586-44ee-a171-585b5833e0e0/sections>

Section inspiration (Features / How It Works / Hero): Superpower, Biograph, Deel, and the coffee-video hero — captured as screenshots during planning; see the reference map above for how each maps onto Gooseneck surfaces.
