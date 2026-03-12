# talentclaw — Contributor Conventions

## Project Structure

Single-package Next.js project with a CLI launcher.

## Stack

- **Runtime:** Bun + Node.js 22+
- **Web:** Next.js 15, React 19, Tailwind CSS v4
- **Data:** Filesystem (local-first, `~/.talentclaw/` markdown + YAML frontmatter)
- **Network:** Coffee Shop (agent uses SDK/CLI externally; not a project dependency)

## Key Directories

| Path | What it is |
|------|-----------|
| `app/` | Next.js pages and routes |
| `components/` | React components |
| `lib/` | Data layer (types, filesystem I/O, utilities) |
| `bin/` | CLI launcher (`talentclaw.ts`) |
| `skills/` | Agent skill definition + reference docs |
| `persona/` | Agent persona (SOUL.md) |

## Conventions

- **TypeScript** for all code, **Zod** for runtime validation
- **Tailwind v4** — use `@import "tailwindcss"` and `@theme` blocks, not `@tailwind` directives
- **Server components** by default in Next.js; add `"use client"` only when needed
- **Filesystem data** — career data lives in `~/.talentclaw/` as markdown with YAML frontmatter. Schema types in `lib/types.ts`, filesystem I/O in `lib/fs-data.ts`
- **No secrets in repo** — use `.env` files (see `.env.example`)
- **Skill files** — SKILL.md is the skill definition, references/ holds domain knowledge, scripts/setup.sh handles onboarding

## Commands

```bash
bun install          # install dependencies
bun run dev          # start web UI (localhost:3000)
bun run build:cli    # compile CLI launcher to dist/
npx talentclaw       # full launcher (scaffold workspace + start web at :3100)
```

## Coffee Shop SDK

The agent uses CoffeeShop directly via MCP tools or CLI. The web UI reads the resulting files from `~/.talentclaw/`. Available SDK methods (used by the agent, not the web UI):
- `searchJobs()` — search the network for job listings
- `submitApplication()` — apply to a job
- `getInbox()` — fetch incoming messages
- `respondToMessage()` — reply to employer messages

## Testing

Tests live next to the code they test (`__tests__/` directories or `.test.ts` files).

## Filesystem Schema

Career data lives in `~/.talentclaw/` as markdown files with YAML frontmatter. Directory structure:

- `profile.md` — user's career profile
- `jobs/` — one `.md` file per opportunity (status field drives pipeline)
- `applications/` — one `.md` file per application
- `companies/` — company research notes
- `contacts/` — people in network
- `messages/` — conversation threads
- `activity.log` — append-only JSONL activity feed
- `config.yaml` — CoffeeShop keys, UI preferences

Types defined in `lib/types.ts`. Read/write functions in `lib/fs-data.ts`.
