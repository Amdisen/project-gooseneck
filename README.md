# Project Gooseneck ☕

A web app for recording and sharing **V60 pour-over coffee recipes** — capture the
bean, grinder settings, dose, water, bloom and every pour, then re-brew it exactly,
tweak it, or share it to a public feed for friends & family. Includes a guided
live brew timer.

Built for mobile and desktop.

## Tech stack

- **Next.js (App Router) + TypeScript + React** — hosted on Vercel
- **Supabase** — Auth (email+password + Google), Postgres, and Storage
- **Drizzle ORM** — typed schema, migrations, and server queries
- **Zod** — shared client/server validation
- **Tailwind CSS** — styling (visual system driven by `design.md`, added later)

## Project structure

```
src/
  app/                 # Next.js routes (App Router)
  lib/
    db/
      schema.ts        # Drizzle tables (profiles, recipes, recipe_versions, brew_logs)
      index.ts         # server-only Drizzle client (Supabase Postgres)
    supabase/
      client.ts        # browser Supabase client
      server.ts        # server Supabase client (cookies)
    validation/
      recipe.ts        # Zod schemas + derived helpers (ratio, total time)
drizzle/               # generated SQL migrations
supabase/
  setup.sql            # auth→profile trigger + RLS policies (run in SQL editor)
drizzle.config.ts
.env.example
```

## Getting started

### 1. Create a Supabase project

At [supabase.com](https://supabase.com), create a project. Then from the dashboard:

- **Project Settings → API**: copy the Project URL, the `anon` key, and the `service_role` key.
- **Project Settings → Database → Connection string (URI)**: copy the **Transaction pooler** string (port `6543`).

### 2. Configure environment

```bash
cp .env.example .env.local
# then fill in the values from step 1
```

### 3. Create the database schema

```bash
npm run db:push        # creates the tables in Supabase Postgres
```

Then open the Supabase **SQL Editor**, paste the contents of `supabase/setup.sql`,
and run it. This adds the signup→profile trigger and the Row Level Security policies.

### 4. Run the app

```bash
npm run dev            # http://localhost:3000
```

## Database workflow

| Command | What it does |
| --- | --- |
| `npm run db:generate` | Generate a SQL migration from schema changes |
| `npm run db:migrate`  | Apply pending migrations |
| `npm run db:push`     | Push the schema directly (fast, good for early dev) |
| `npm run db:studio`   | Open Drizzle Studio to browse data |

> After any change that adds/removes tables, re-run `supabase/setup.sql` if it
> references the affected tables (RLS policies, triggers).

## Roadmap

See the project plan for the full phased roadmap. Current phase: **Phase 0 —
Foundation** (scaffold, DB schema, env, deploy pipeline). Visual design is applied
in a later phase from a dedicated `design.md`.
