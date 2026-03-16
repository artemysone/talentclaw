# talentclaw — Contributor Conventions

## Project Structure

Next.js web UI + Rust CLI binary. The CLI handles bootstrapping, runtime detection, job search, and server management. The web UI is the dashboard.

## Stack

- **CLI:** Rust (clap, tokio, serde) — source in `cli/`
- **Web:** Next.js 15, React 19, Tailwind CSS v4
- **Data:** Filesystem (local-first, `~/.talentclaw/` markdown + YAML frontmatter)
- **Runtime:** Bun + Node.js 22+ (for web UI dev and Next.js server)
- **Network:** Coffee Shop (agent uses SDK/CLI externally; not a project dependency)

## Key Directories

| Path | What it is |
|------|-----------|
| `app/` | Next.js pages and routes |
| `components/` | React components |
| `lib/` | Data layer (types, filesystem I/O, utilities) |
| `cli/` | Rust CLI binary (Cargo workspace) |
| `cli/npm/` | npm distribution packages (platform binaries + JS shim) |
| `skills/` | Agent skill definition + reference docs |
| `persona/` | Agent persona (SOUL.md) |

## Conventions

- **TypeScript** for web code, **Zod** for runtime validation
- **Rust** for CLI binary — types in `cli/crates/talentclaw/src/types.rs` mirror `lib/types.ts`
- **Tailwind v4** — use `@import "tailwindcss"` and `@theme` blocks, not `@tailwind` directives
- **Server components** by default in Next.js; add `"use client"` only when needed
- **Filesystem data** — career data lives in `~/.talentclaw/` as markdown with YAML frontmatter. Schema types in `lib/types.ts`, filesystem I/O in `lib/fs-data.ts`
- **No secrets in repo** — use `.env` files (see `.env.example`)
- **Skill files** — SKILL.md is the skill definition, references/ holds domain knowledge, scripts/setup.sh handles onboarding

## Commands

```bash
# Web UI
bun install          # install dependencies
bun run dev          # start web UI (localhost:3000)
bun run build        # Next.js production build (standalone output)
bun run test         # run vitest

# CLI (Rust)
cd cli && cargo build           # debug build
cd cli && cargo build --release # release build (~3.6 MB binary)
cd cli && cargo test            # run Rust tests

# Full launcher
npx talentclaw       # scaffold workspace + detect runtime + start web at :3100
```

## Coffee Shop SDK

The agent uses CoffeeShop directly via MCP tools or CLI. The web UI reads the resulting files from `~/.talentclaw/`. Available SDK methods (used by the agent, not the web UI):
- `searchJobs()` — search the network for job listings
- `submitApplication()` — apply to a job
- `getInbox()` — fetch incoming messages
- `respondToMessage()` — reply to employer messages

## Testing

- **TypeScript tests:** live next to the code they test (`__tests__/` directories or `.test.ts` files)
- **Rust tests:** inline `#[cfg(test)]` modules in each source file

## npm Distribution

The `talentclaw` npm package ships platform-specific Rust binaries via `optionalDependencies`:
- `@artemyshq/talentclaw-cli-darwin-arm64`
- `@artemyshq/talentclaw-cli-darwin-x64`
- `@artemyshq/talentclaw-cli-linux-x64`

A thin JS shim (`cli/npm/talentclaw/bin/talentclaw.js`) detects the platform and execs the right binary.

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
Rust equivalents in `cli/crates/talentclaw/src/types.rs` and `cli/crates/talentclaw/src/frontmatter.rs`.
