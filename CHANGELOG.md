# Changelog

All notable changes to TalentClaw are documented here.

## 0.4.8 — 2026-03-24

### Fixed

- **CLI silent exit via npx** — the `isDirectExecution` guard compared a symlink path against a real path, causing the CLI to exit silently when run via `npx talentclaw`. Now uses `realpathSync` to resolve symlinks before comparing.

## 0.4.7 — 2026-03-24

### Fixed

- **Chat message replay** — prevented message duplication and conversation replay when switching between chats.
- **CLI Python detection** — onboarding now detects versioned Python binaries (`python3.13`, `python3.12`, `python3.11`) and the browser-use venv path, fixing setup on systems where `python3` points to an older version.

### Changed

- **Vendored skills removed** — removed bundled gstack skills; skills are now managed externally.
- **Test coverage expanded** — added new test suites and fixed E2E timeout issues.
- **Gitignore updated** — added `coverage/` and `.context/` to `.gitignore`.

## 0.4.6 — 2026-03-24

### New

- **Fizzy pipeline board** — redesigned pipeline with a thermometer layout. Each stage is a collapsed pill that expands to show full job details (company, location, remote status, compensation, posting link).
- **Chat file attachments** — upload files via the + button or drag-and-drop. Files are saved to `~/.talentclaw/uploads/` and included in messages.
- **Resume viewer** — new "Resume" tab in the profile editor displays your base resume as formatted markdown.
- **Static sidebar with branding** — sidebar is always visible at 220px with the TalentClaw logo. Conversation history moved from the chat dropdown into the sidebar for easier access.

### Changed

- **Filesystem view removed** — the file tree and generic file viewer are gone. All career data is now accessible through purpose-built views: pipeline, profile, inbox, and dashboard. This is a cleaner, more focused experience.
- **"Saved" stage merged into "Discovered"** — the pipeline no longer shows "saved" as a separate column. Saved jobs appear under "Discovered" to reduce clutter.
- **Default agent model upgraded to Opus 4.6** — takes advantage of the 1M context window for richer career conversations.
- **Dashboard labels humanized** — removed raw file slugs, ISO timestamps, and `activity.log` labels. Activity feed and upcoming actions now show resolved company and role names with friendly dates.
- **Pipeline stage colors refined** — warm, muted palette derived from hex values, eliminating duplicate color definitions.

### Fixed

- **Chat streaming scroll** — replaced unreliable MutationObserver with simple 100ms polling. Chat now reliably pins to the bottom during streaming without snap-back glitches.
- **Electron desktop app** — fixed dock icon click reconnecting to a running server (previously relaunched), added dark mode support matching the system theme, and window position/size now persists across sessions.
- **Momentum ring and agent insights** — dashboard cards now show a "—" placeholder when fewer than 3 applications exist, maintaining consistent card layout.
- **Career graph highlight** — fixed node connectivity highlighting for all node types.
- **YAML date coercion** — frontmatter date fields that parsed as JavaScript Date objects are now properly coerced to strings.

## 0.4.5 — 2026-03-22

- Strip dev artifacts and wrong-platform vendor binaries from npm and Electron packages.
- Stable versionless download URL for the Mac .dmg.

## 0.4.4 — 2026-03-21

- Landing page cleanup and "Download for Mac" button.

## 0.4.3 — 2026-03-20

- Initial public release.
