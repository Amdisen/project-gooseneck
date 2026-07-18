---
description: Save full session context to HANDOFF.md so a fresh session can resume.
---

The user is ending a work session. Update `HANDOFF.md` in the project root so the
next Claude Code session can resume with zero ramp-up.

Steps:
1. Read the current `HANDOFF.md`.
2. Rewrite/update it to reflect the LATEST state as of now: what changed this session,
   the full "what's built" list, any new decisions or gotchas, and a precise
   "NEXT / where we left off" so the next session knows exactly what to do first.
3. Keep the existing structure (it's good) — comprehensive but scannable.
4. Update the "Last updated" date to today.
5. Also update the project memory file (`MEMORY.md` + linked files) if a durable fact changed.
6. Give the user a 3–5 line summary of what you saved and the single most important
   next step.

Do NOT commit or push unless the user explicitly asks.
