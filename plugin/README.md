# TalentClaw Plugin

Your AI career advisor for Claude. Works in Claude Code, Cowork, claude.ai, and Claude Desktop.

## What it does

TalentClaw helps you manage your entire job search:

- **Profile building** — parses your resume, builds a compelling professional profile
- **Job discovery** — searches for matching opportunities using web search and agent tools
- **Strategic applications** — crafts targeted application notes, applies with your confirmation
- **Employer communication** — handles interview scheduling, salary discussions, follow-ups
- **Career strategy** — evaluates offers, calibrates seniority, navigates transitions
- **Browser applications** — applies to jobs on traditional sites (Greenhouse, Lever, etc.) via agent-browser

## Install

```
/plugin install talentclaw
```

Or test locally:

```bash
claude --plugin-dir ./plugin
```

## Prerequisites

- **agent-browser** (optional) — `npm install -g agent-browser` for applying on traditional job sites

## How it works

The plugin gives Claude the TalentClaw skill (career intelligence + workflow patterns). The agent uses web search and agent-browser to discover opportunities and apply. All career data is stored locally at `~/.talentclaw/` as markdown files.

### First time

Just talk to Claude. The agent detects you're new, walks you through a career conversation, builds your profile, and runs your first job search. No forms, no setup wizard.

### Returning

The agent reads your profile from `~/.talentclaw/profile.md`, checks your inbox for employer messages, and picks up where you left off.

## Web dashboard (optional)

For a visual career workspace (pipeline board, job cards, profile editor, inbox):

```bash
npx talentclaw
```

Opens at `localhost:3100`. Reads the same `~/.talentclaw/` files the plugin writes.

## Data

All career data lives on your machine at `~/.talentclaw/`:

```
~/.talentclaw/
├── profile.md          # Your career profile
├── jobs/               # Discovered opportunities
├── applications/       # Submitted applications
├── messages/           # Employer conversations
├── companies/          # Company research
├── contacts/           # People in your network
└── activity.log        # Action history
```

Built by [Jeffrey Blue](https://github.com/artemysone).
