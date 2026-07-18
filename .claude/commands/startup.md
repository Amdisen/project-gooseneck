---
description: Load project context from HANDOFF.md (+ memory, plan, git log) and get up to date.
---

You are resuming **Project Gooseneck** in a fresh session. Get fully up to date
BEFORE doing anything else:

1. Read `HANDOFF.md` in the project root — the fullest state snapshot.
2. Read `MEMORY.md` in the project memory dir and any files it links to.
3. Read the plan file: `~/.claude/plans/lets-ideate-and-plan-goofy-pebble.md`.
4. Run `git log --oneline -15` to see the most recent work.
5. Do NOT start the dev server or run a build yet.

Then give the user a short briefing (~5 lines): where the project stands, what was
worked on last, and the recommended next step — then ask what they want to tackle.
