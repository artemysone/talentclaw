<p align="center">
  <img src="assets/talentclaw-logo.svg" alt="talentclaw" width="180" />
</p>

<h1 align="center">talentclaw</h1>

<p align="center">
  <strong>Your AI career agent that searches, applies, and follows up.</strong>
</p>

<p align="center">
  <a href="#get-talentclaw"><img src="https://img.shields.io/badge/npx-talentclaw-000?style=for-the-badge&logo=npm&logoColor=white" alt="npx talentclaw"></a>&nbsp;
  <a href="https://github.com/artemysone/talentclaw/stargazers"><img src="https://img.shields.io/github/stars/artemysone/talentclaw?style=for-the-badge" alt="GitHub stars"></a>&nbsp;
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge" alt="MIT License"></a>
</p>

<p align="center">
  <a href="#get-talentclaw">Install</a> ·
  <a href="#what-talentclaw-does">Features</a> ·
  <a href="#how-it-works">How It Works</a> ·
  <a href="#development">Development</a>
</p>

---

TalentClaw finds jobs that match your skills, applies on your behalf, and manages your entire pipeline — profile, applications, interviews, offers. It's a career advisor that never sleeps, powered by Claude.

All your career data stays on your machine.

---

## Get TalentClaw

### Mac App

Download the desktop app — double-click and go, no terminal required.

**[Download for Mac](https://talentclaw.sh)** (macOS 12+, Apple Silicon)

### npm

```bash
npx talentclaw
```

Scaffolds your workspace, launches a career dashboard at `localhost:3100`, and opens your browser. Requires Node 22+.

### Claude Plugin

If you already use Claude Code, Claude Desktop, or Cowork:

```
/plugin install talentclaw
```

This gives Claude career advisor capabilities directly in your conversations — profile optimization, job search, application strategy, and employer communication.

---

## What TalentClaw Does

### Career Dashboard

See your profile strength, active pipeline, recent activity, and career map in one view. A real workspace for managing your search, not another job board.

### Career Context Graph

Your career profile lives as a connected map of your skills, experience, goals, and what you're looking for — stored as plain text files you can open, read, and edit yourself.

### Pipeline & Tracking

A visual pipeline to manage your job search end-to-end. Drag opportunities through stages — discovered, saved, applied, interviewing, offer — and see match scores against your profile.

### Apply Anywhere

TalentClaw's agent applies to jobs on your behalf across Greenhouse, Lever, LinkedIn, and other platforms. You review and approve — the agent handles the forms.

### The Agent Works, You Decide

TalentClaw researches companies, evaluates fit, and drafts applications. You review what it found and make the calls. It never applies without your explicit confirmation.

### Yours, Locally

Everything lives on your machine as plain files in `~/.talentclaw/`. No cloud databases, no data harvesting. Read them, back them up, or move them — they're yours.

---

## How It Works

TalentClaw starts by getting to know you. Have a conversation about your career — where you've been, what you're good at, what you're looking for — and it builds a rich career profile. If you have a resume, it can work from that too.

From there, it searches for opportunities using your profile as the filter. It evaluates fit, drafts targeted application notes, and can submit applications directly on job sites. When employers respond, it summarizes their messages and helps you reply.

Three modes adapt to where you are:

- **Active search** — daily searches, quick applications, inbox monitoring
- **Passive** — weekly searches, only surfaces standout matches
- **Monitoring** — keeps your profile fresh, watches for exceptional inbound only

Your career data is stored as markdown files with YAML frontmatter — human-readable, git-friendly, and completely portable:

```
~/.talentclaw/
├── profile.md           # Your career profile and context graph
├── jobs/                # One file per opportunity
├── applications/        # One file per application
├── companies/           # Company research notes
├── contacts/            # People in your network
├── messages/            # Conversation threads with employers
└── activity.log         # Activity feed
```

---

## Development

<details>
<summary>For contributors</summary>

### Stack

- **Web:** Next.js 15, React 19, Tailwind CSS v4
- **CLI:** TypeScript (`bin/cli.ts`)
- **Desktop:** Electron
- **Data:** Filesystem (markdown + YAML frontmatter)
- **AI:** Claude Agent SDK

### Commands

```bash
bun install              # install dependencies
bun run dev              # web UI dev mode
bun run build            # production build
bun run test             # run tests

node bin/cli.ts          # scaffold + start web UI
node bin/cli.ts setup    # scaffold + register skill

bun run dev:desktop      # desktop app dev mode
bun run build:desktop    # desktop app production build
```

### Project Structure

```
talentclaw/
├── app/                 # Next.js pages and routes
├── components/          # React components
├── lib/                 # Data layer (types, filesystem I/O, utilities)
├── bin/                 # CLI entry point
├── desktop/             # Electron app (main + preload)
├── skills/              # Agent skill definition + reference docs
└── persona/             # Agent persona
```

</details>

---

## License

MIT Licensed. Fork it, extend it, make it yours.

<p align="center">
  Built by <a href="https://github.com/artemysone">Jeff</a>
</p>
