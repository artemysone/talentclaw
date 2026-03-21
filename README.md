<p align="center">
  <img src="assets/talentclaw-logo.svg" alt="talentclaw" width="180" />
</p>

<h1 align="center">talentclaw</h1>

<p align="center">
  <strong>Your AI career agent — skill + product</strong><br>
  Local-first career hub with platform-agnostic agent skills.
</p>

<p align="center">
  <a href="#install"><img src="https://img.shields.io/badge/npx-talentclaw-000?style=for-the-badge&logo=npm&logoColor=white" alt="npx talentclaw"></a>&nbsp;
  <a href="https://github.com/artemyshq/talentclaw/stargazers"><img src="https://img.shields.io/github/stars/artemyshq/talentclaw?style=for-the-badge" alt="GitHub stars"></a>&nbsp;
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge" alt="MIT License"></a>
</p>

<p align="center">
  <a href="#install">Install</a> ·
  <a href="#what-it-does">Features</a> ·
  <a href="#architecture">Architecture</a> ·
  <a href="#development">Development</a> ·
  <a href="https://skills.sh">Skills Store</a>
</p>

---

talentclaw is an AI career agent that combines a **local-first career hub** with **platform-agnostic agent skills**. It helps individuals manage their job search pipeline, discover opportunities, and communicate with employers.

---

## 📦 Install

### Career Hub (full product)

```bash
# Try it now (Node 22+ required)
npx talentclaw

# Or install permanently
npm install -g talentclaw
talentclaw
```

The CLI is a TypeScript script. Scaffolds your workspace at `~/.talentclaw/`, registers the TalentClaw skill for Claude Code, and opens the career hub at `localhost:3100`.

### Claude Code Skill

```bash
npx talentclaw setup
```

Gives any AI agent career advisor capabilities — profile optimization, job search, application strategy, and employer communication.

---

## ✨ What It Does

### Career Hub

- 📋 **Kanban pipeline** — drag-and-drop stages: Discovered, Saved, Applied, Interviewing, Offer, Accepted/Rejected
- 🔍 **Job discovery** — search with filters for skills, location, remote, compensation
- 📊 **Career dashboard** — application stats, activity feed, upcoming deadlines
- 💾 **Local-first data** — markdown files at `~/.talentclaw/`, human-readable and git-friendly

### Candidate Skill

- 🧭 **Career strategy** — direction clarity, opportunity evaluation, seniority/compensation calibration
- 👤 **Profile building** — optimize from scratch or from a resume
- 🎯 **Job discovery** — smart search with match scoring
- 📝 **Applications** — targeted application notes and pipeline management
- 💬 **Employer messaging** — inbox, scheduling, follow-up

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      talentclaw                         │
│                                                         │
│  ┌──────────────┐  ┌──────────┐  ┌───────────────────┐  │
│  │  Career Hub  │  │   CLI    │  │   Agent Skills    │  │
│  │  (Next.js)   │  │  (TS)   │  │ Candidate Skill   │  │
│  └──────┬───────┘  └────┬─────┘  └────────┬──────────┘  │
│         │               │                 │              │
│         └───────────┬───┘─────────────────┘              │
│                     │                                    │
│            ┌────────┴────────┐                           │
│            │ ~/.talentclaw/  │                           │
│            │  (filesystem)   │                           │
│            └─────────────────┘                           │
└─────────────────────────────────────────────────────────┘
```

---

## 📂 Project Structure

```
talentclaw/
├── app/                         # Next.js pages and routes
│   └── (workspace)/             # Dashboard, pipeline, jobs, file viewer
├── components/                  # React components (kanban, hub, file-viewer, etc.)
├── lib/                         # Data layer (types, filesystem I/O, utilities)
├── bin/                         # CLI entry point (TypeScript)
├── skills/                      # Agent skill definition + reference docs
│   ├── SKILL.md                 # Skill definition
│   ├── references/              # Career strategy, profiles, applications, tools
│   └── scripts/setup.sh         # Setup wizard
└── persona/                     # Agent persona (SOUL.md)
```

---

## ⚙️ Prerequisites

- **Node.js 22+** — for the web UI and npm-based installation

---

## 🛠️ Development

```bash
# Web UI
bun install              # install dependencies
bun run dev              # start web UI (dev mode)

# CLI
node bin/cli.ts          # scaffold + start web UI
node bin/cli.ts setup    # scaffold + register skill + MCP
```

---

## 🌐 Ecosystem

| Project | Description |
|---------|-------------|
| [Skills Store](https://skills.sh) | Platform-agnostic AI agent skills |

---

## 📄 License

MIT Licensed. Fork it, extend it, make it yours.

<p align="center">
  <a href="https://star-history.com/?repos=artemyshq%2Ftalentclaw&type=date&legend=top-left">
    <img src="https://api.star-history.com/image?repos=artemyshq/talentclaw&type=date&legend=top-left" alt="Star History" width="620" />
  </a>
</p>
