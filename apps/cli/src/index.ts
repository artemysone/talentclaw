#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir, platform } from "node:os";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn, exec } from "node:child_process";

// ---------------------------------------------------------------------------
// 1. Check Node.js version >= 22
// ---------------------------------------------------------------------------
const [major] = process.versions.node.split(".").map(Number);
if (major < 22) {
  console.error(
    `\nTalentClaw requires Node.js 22 or later (you have ${process.versions.node}).` +
      `\nInstall the latest LTS from https://nodejs.org or use a version manager like fnm / nvm.\n`
  );
  process.exit(1);
}

// ---------------------------------------------------------------------------
// 2. Scaffold ~/.talentclaw/ directory structure
// ---------------------------------------------------------------------------
const dataDir = process.env.TALENTCLAW_DIR || join(homedir(), ".talentclaw");
const dirs = [
  dataDir,
  join(dataDir, "jobs"),
  join(dataDir, "applications"),
  join(dataDir, "companies"),
  join(dataDir, "contacts"),
  join(dataDir, "messages"),
];

let created = false;
for (const dir of dirs) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
    created = true;
  }
}
if (created) {
  console.log(`Created workspace at ${dataDir}`);
}

// ---------------------------------------------------------------------------
// 3. Create template files on first run
// ---------------------------------------------------------------------------
const configPath = join(dataDir, "config.yaml");
if (!existsSync(configPath)) {
  writeFileSync(
    configPath,
    `# TalentClaw Configuration
# See: https://github.com/artemyshq/talentclaw

# Coffee Shop API credentials
# coffeeshop_api_key: ""
# coffeeshop_agent_id: ""

# UI preferences
# theme: system
`,
    "utf-8"
  );
  console.log("Created config.yaml");
}

const profilePath = join(dataDir, "profile.md");
if (!existsSync(profilePath)) {
  writeFileSync(
    profilePath,
    `---
# Your career profile — edit this file to get started
# display_name: Your Name
# headline: "Your Role | Your Specialty"
# skills: [TypeScript, React, Node.js]
# experience_years: 5
# preferred_roles: [Senior Engineer, Staff Engineer]
# preferred_locations: [Remote]
# remote_preference: remote_ok
# salary_range: { min: 150000, max: 200000, currency: USD }
# availability: active
---

## Summary

Tell TalentClaw about your experience and what you're looking for.

## Notes

Add any notes about your job search here.
`,
    "utf-8"
  );
  console.log("Created profile.md — edit it to set up your career profile");
}

// Create activity log if missing
const activityPath = join(dataDir, "activity.log");
if (!existsSync(activityPath)) {
  writeFileSync(activityPath, "", "utf-8");
}

console.log(`Workspace ready at ${dataDir}`);

// ---------------------------------------------------------------------------
// 4. Check for Coffee Shop credentials
// ---------------------------------------------------------------------------
let apiKey: string | undefined = process.env.COFFEESHOP_API_KEY;

if (!apiKey) {
  // Try reading from config.yaml
  try {
    const configContent = readFileSync(configPath, "utf-8");
    const match = configContent.match(/^coffeeshop_api_key:\s*["']?(.+?)["']?\s*$/m);
    if (match && match[1]) {
      apiKey = match[1];
    }
  } catch {
    // Config unreadable — ignore
  }
}

if (apiKey) {
  console.log("Coffee Shop API key found.");
} else {
  console.log(
    "\nNo Coffee Shop API key detected." +
      "\nTo connect to the Coffee Shop network, either:" +
      "\n  1. Run: coffeeshop register" +
      "\n  2. Set the COFFEESHOP_API_KEY environment variable" +
      "\n  3. Add coffeeshop_api_key to ~/.talentclaw/config.yaml" +
      "\n\nContinuing in offline mode...\n"
  );
}

// ---------------------------------------------------------------------------
// 5. Start Next.js dev server at localhost:3100
// ---------------------------------------------------------------------------
const __dirname = dirname(fileURLToPath(import.meta.url));
const webDir = resolve(__dirname, "../../web");

console.log("Starting TalentClaw at http://localhost:3100 ...\n");

const nextProcess = spawn("npx", ["next", "dev", "--port", "3100"], {
  cwd: webDir,
  stdio: "inherit",
  shell: true,
});

nextProcess.on("error", (err) => {
  console.error("Failed to start Next.js dev server:", err.message);
  process.exit(1);
});

// ---------------------------------------------------------------------------
// 6. Open browser after a short delay
// ---------------------------------------------------------------------------
setTimeout(() => {
  const url = "http://localhost:3100";
  const openCmd =
    platform() === "darwin"
      ? "open"
      : platform() === "win32"
        ? "start"
        : "xdg-open";

  exec(`${openCmd} ${url}`, (err) => {
    if (err) {
      console.log(`Open ${url} in your browser to get started.`);
    }
  });
}, 3000);

// ---------------------------------------------------------------------------
// 7. Graceful shutdown
// ---------------------------------------------------------------------------
process.on("SIGINT", () => {
  console.log("\nShutting down TalentClaw...");
  nextProcess.kill("SIGINT");
  process.exit(0);
});
