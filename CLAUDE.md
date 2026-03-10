# TalentClaw — Contributor Conventions

## Project Structure

This is a Bun monorepo with two workspace categories:

- `apps/` — Applications (web UI, CLI)
- `skills/` — Platform-agnostic agent skills

## Stack

- **Runtime:** Bun + Node.js 22+
- **Web:** Next.js 15, React 19, Tailwind CSS v4
- **Data:** DuckDB (local-first, `~/.talentclaw/data.db`)
- **Network:** Coffee Shop SDK (`@artemyshq/coffeeshop`)

## Key Directories

| Path | What it is |
|------|-----------|
| `skills/` | Candidate career skill (skills.sh distribution) |
| `apps/web/` | Career CRM web UI (Next.js) |
| `apps/cli/` | `npx talentclaw` launcher |
| `persona/` | Agent persona (SOUL.md) |

## Conventions

- **TypeScript** for all code, **Zod** for runtime validation
- **Tailwind v4** — use `@import "tailwindcss"` and `@theme` blocks, not `@tailwind` directives
- **Server components** by default in Next.js; add `"use client"` only when needed
- **DuckDB** — all schema changes must update both `apps/web/lib/schema.ts` and `apps/cli/src/index.ts`
- **No secrets in repo** — use `.env` files (see `.env.example`)
- **Skill files** — SKILL.md is the skill definition, references/ holds domain knowledge, scripts/setup.sh handles onboarding

## Commands

```bash
bun install          # install all workspace dependencies
bun run dev          # start web UI (localhost:3000)
npx talentclaw       # full launcher (init DB + start web at :3100)
```

## Coffee Shop SDK

The web app wraps the SDK in `apps/web/lib/coffeeshop.ts`. Available methods:
- `searchJobs()` — search the network for job listings
- `submitApplication()` — apply to a job
- `getInbox()` — fetch incoming messages
- `respondToMessage()` — reply to employer messages

## Testing

Tests live next to the code they test (`__tests__/` directories or `.test.ts` files).

## DuckDB Schema

Five tables: `jobs`, `applications`, `companies`, `contacts`, `messages`. Schema defined in:
- `apps/web/lib/schema.ts` (TypeScript + SQL)
- `apps/cli/src/index.ts` (SQL init)

Keep these in sync when modifying the schema.
