import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { DATA_DIR, log } from "../helpers.js";

export function scaffoldWorkspace(): void {
  log("◆", "Scaffolding workspace...");

  const dirs = [
    DATA_DIR,
    join(DATA_DIR, "jobs"),
    join(DATA_DIR, "applications"),
    join(DATA_DIR, "companies"),
    join(DATA_DIR, "contacts"),
    join(DATA_DIR, "messages"),
  ];

  for (const dir of dirs) {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }

  // Create template files on first run
  const configPath = join(DATA_DIR, "config.yaml");
  if (!existsSync(configPath)) {
    writeFileSync(
      configPath,
      `# talentclaw Configuration
# See: https://github.com/artemyshq/talentclaw

# Coffee Shop API credentials
# coffeeshop_api_key: ""
# coffeeshop_agent_id: ""

# UI preferences
# theme: system
`,
      "utf-8",
    );
  }

  const profilePath = join(DATA_DIR, "profile.md");
  if (!existsSync(profilePath)) {
    writeFileSync(
      profilePath,
      `---
# Your career profile — your agent fills this in during onboarding
# display_name:
# headline:
# skills: []
# experience_years:
# preferred_roles: []
# preferred_locations: []
# remote_preference:
# salary_range: { min: 0, max: 0, currency: USD }
# availability:
---

## Career Context

Your agent builds this section during your first conversation — it captures who you are, not just what you've done.

### Career Arc

### Core Strengths

### Current Situation

### What I'm Looking For

### Constraints
`,
      "utf-8",
    );
  }

  const activityPath = join(DATA_DIR, "activity.log");
  if (!existsSync(activityPath)) {
    writeFileSync(activityPath, "", "utf-8");
  }

  log("  ✓", `${DATA_DIR}`);
}
