@AGENTS.md

# Project Gooseneck

When starting a session here, **read `HANDOFF.md`** (full state snapshot) to get up to date,
then continue. Type `/startup` to load context, `/shutdown` to save it before ending.

Key rules:
- Build against the design system in `design.md` + `src/app/globals.css` + `tailwind.config.ts` — do NOT overwrite/move these; extend additively; use tokens, not hardcoded colors.
- **Never run `npm run build` while `npm run dev` is running** (both write `.next`). Stop dev first.
- Keep git commit messages **quote-free** (PowerShell mangles double-quotes in `-m` here-strings).
- Apply DB policies via focused SQL files (`node scripts/apply-sql.mjs supabase/<file>.sql`), not the full `setup.sql` (pooler statement-timeout).
