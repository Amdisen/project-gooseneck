# Project Gooseneck — Session Handoff

> Read this first when resuming. Also auto-loaded: `MEMORY.md` (memory dir) and the plan file
> `~/.claude/plans/lets-ideate-and-plan-goofy-pebble.md`. This file is the fullest snapshot.
> Last updated: 2026-07-19.

## What it is
A web app to record, re-brew, and share **V60 pour-over coffee recipes** — with a guided brew
timer and an iteration "logbook". V60-only for now; `method` enum is the extension point.
Owner: nma@eupry.com (EU-based, coffee enthusiast). Claude scaffolds; owner makes product calls.

## Live + how to run
- **Live:** https://project-gooseneck-one.vercel.app (GitHub `Amdisen/project-gooseneck` → Vercel, auto-deploys on push to `main`). Functions pinned to **Frankfurt `fra1`** (vercel.json) to co-locate with Supabase EU.
- **Local:** `npm run dev` (http://localhost:3000). `.env.local` has Supabase creds (permission-locked; can't Read/Edit — diagnose env via a node+dotenv script).
- **Build gate:** `npm run build`. **NEVER run build while `npm run dev` is running** (both write `.next` → corrupts route types). Stop dev first.
- **DB:** Drizzle. `npm run db:generate` then `npm run db:migrate`. RLS/policies via focused SQL files applied with `node scripts/apply-sql.mjs supabase/<file>.sql` (NOT full `setup.sql` re-run — it times out on the pooler).
- Commit style: end messages with the Co-Authored-By line. **PowerShell mangles double-quotes in git `-m` here-strings** — keep commit messages quote-free.

## Stack
Next.js 16 (App Router) + TS + Tailwind v4 · Supabase (Auth email+password, Postgres, Storage) ·
Drizzle ORM · Zod · hosted on Vercel. Fonts via next/font: Space Grotesk / Inter / JetBrains Mono.

## What's BUILT (all committed + pushed, live)
- **Auth** (Phase 1): email+password, sessions, proxy route-guard (`src/proxy.ts`), signup→profile trigger, account page. (No password reset UI, no Google SSO yet. Email confirmation currently OFF for testing.)
- **Recipes** (Phase 2): create/edit/view with **cumulative-pour timeline** input, bean+grind **photos** (HEIC→WebP, compress, EXIF-strip → Supabase Storage), bean **process** field.
- **Logbook loop**: guided **"Brew this"** flow (`/recipes/[id]/brew`) — 3 steps: adjust → **hybrid timer** → record (better/same/worse + rating + tasting notes + "try next"). Auto-snapshots params per brew. "Before you brew" nudge, "changed since last brew", one-tap **revert** when worse, "won't repeat" list, fold-out change-history table.
- **Hybrid brew timer** (`brew-timer.tsx`): guided countdown, Wake Lock, beep+vibrate cue, mute, mark-pour actuals → plan-vs-actual stored on brew log.
- **Library** (`/library`): Coffees / Grinders / Brewers (owner-scoped) + pickers with **inline-add** in the recipe form + profile **default** grinder/brewer. Recipes store a soft reference AND a snapshot.
- **Sharing** (Phase 3): publish/unpublish, public read-only view `/r/[id]` (no auth to view; shows recipe + maker's ratings & tasting notes ONLY — not internals), `/feed` discovery (newest first), **fork** (copies values to a new private recipe, attribution), **comments** (add/delete-own-or-owner + report).
- **App shell**: persistent `SiteHeader` nav (Discover, My recipes, Library, Account, +New / Sign in). Post-login lands on `/recipes`.
- **Design pass — increment 1 DONE**: next/font wired to tokens, light/dark theme (`data-theme` + no-flash script + `ThemeToggle`), `Container` width tiers (wide 1200 / app 960 / prose 680 / card 400), header restyled to tokens.

## Key files
- `src/lib/db/schema.ts` — all tables (profiles, recipes, recipe_versions [draft+snapshots], brew_logs, coffees, grinders, brewers, comments).
- `src/lib/validation/recipe.ts` — Zod schemas, clock helpers, cumulative→increment converter, brew payload.
- `src/lib/recipe-diff.ts` — snapshot diff for history/won't-repeat.
- `src/app/recipes/actions.ts` — create/update draft, snapshotDraft, brewAndLog, revert, fork, setVisibility, delete.
- `src/app/recipes/recipe-form.tsx` — the big form (pickers + inline-add).
- `src/app/recipes/[id]/page.tsx` — owner recipe view. `src/app/r/[id]/page.tsx` — public view.
- `src/app/recipes/[id]/brew/` — guided flow + timer.
- `src/components/` — site-header, container, theme-toggle.
- `src/app/globals.css` + `tailwind.config.ts` + `design.md` — **DESIGN SYSTEM (SSOT, do not overwrite/move; extend additively only, document new components in design.md §8)**.

## Design system rules (critical)
Build against `design.md` tokens/utilities: `bg-background`/`bg-card`, `text-foreground`/`text-muted-foreground`, `border-border`, `bg-primary`/`text-primary-foreground`, `bg-muted`, `text-brand` (roast-orange, sparingly per §3.3), `font-display`/`font-mono`, `rounded-md`. Never hardcode hex or use arbitrary values (container max-widths are the accepted structural exception). Monochrome + one accent; rectangular controls, hairline borders; light+dark both. Stack to still adopt: shadcn/ui (init WITHOUT clobbering globals.css/tailwind.config — snapshot & revert), Phosphor icons.

## NEXT: design pass remaining increments (in order)
1. **Feed → responsive card grid** (2–3 col in `wide` container) — biggest "use the width" win.
2. **Recipe list + detail** → `app` width, styled cards, mono numbers, pour-timeline as signature component.
3. **Forms** (create/edit, brew flow) → `prose` width, styled `Field`/`NumberField` inputs.
4. **Auth** → centered `card`.
5. **Phosphor icons** + **mobile bottom-tab bar** (design.md §4.7: Feed · Create · Brew · Profile).
6. shadcn/ui primitives (dialog/sheet/tabs/toast) as needed.
Pages still use plain `gray-*` + `max-w-2xl/md` — migrate each to Container + tokens.

## Backlog (post-MVP, owner-confirmed)
AI-barista (LLM reads tasting note → suggests a change); feed search/filters (roaster/roast/origin/process/brewer); other brew methods (Aeropress/French Press/Espresso/Cold Brew) via `method` enum; bean bags/roast-date/freshness; public profile pages.

## Pre-wider-launch TODOs (flagged to owner)
Re-enable Supabase email confirmation; add Vercel domain to Supabase Auth redirect URLs; build password-reset flow; enable Google SSO; GDPR delete/export (Phase 7); comment moderation UI.
