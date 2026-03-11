#!/usr/bin/env node

import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  cpSync,
} from "node:fs";
import { homedir, platform } from "node:os";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn, exec, execSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function log(icon: string, msg: string) {
  console.log(`${icon} ${msg}`);
}

function check(label: string, ok: boolean, detail?: string) {
  const status = ok ? "\x1b[32m[ok]\x1b[0m" : "\x1b[33m[!!]\x1b[0m";
  console.log(`${status} ${label}${detail ? ` — ${detail}` : ""}`);
  return ok;
}

function which(cmd: string): string | null {
  try {
    return execSync(`which ${cmd}`, { encoding: "utf-8" }).trim();
  } catch {
    return null;
  }
}

function cmdVersion(cmd: string): string | null {
  try {
    return execSync(`${cmd} --version`, { encoding: "utf-8" }).trim();
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// 1. Check Node.js version >= 22
// ---------------------------------------------------------------------------
const [major] = process.versions.node.split(".").map(Number);
if (major < 22) {
  console.error(
    `\nTalentClaw requires Node.js 22 or later (you have ${process.versions.node}).` +
      `\nInstall the latest LTS from https://nodejs.org or use a version manager like fnm / nvm.\n`,
  );
  process.exit(1);
}

console.log("\n\x1b[1mTalentClaw\x1b[0m — your AI career agent\n");

// ---------------------------------------------------------------------------
// 2. Detect agent runtimes
// ---------------------------------------------------------------------------
type Runtime = {
  name: string;
  cmd: string;
  version: string | null;
  skillDir: string;
};

let runtime: Runtime | null = null;

log("◆", "Checking for agent runtimes...");

// Check OpenClaw
const openclawPath = which("openclaw");
if (openclawPath) {
  const version = cmdVersion("openclaw");
  runtime = {
    name: "OpenClaw",
    cmd: "openclaw",
    version,
    skillDir: join(homedir(), ".openclaw", "workspace", "skills", "talentclaw"),
  };
  log("  ✓", `OpenClaw detected${version ? ` (${version})` : ""}`);
}

// Check ZeroClaw
if (!runtime) {
  const zeroclawPath = which("zeroclaw");
  if (zeroclawPath) {
    const version = cmdVersion("zeroclaw");
    runtime = {
      name: "ZeroClaw",
      cmd: "zeroclaw",
      version,
      skillDir: join(
        homedir(),
        ".zeroclaw",
        "workspace",
        "skills",
        "talentclaw",
      ),
    };
    log("  ✓", `ZeroClaw detected${version ? ` (${version})` : ""}`);
  }
}

// Check Claude Code
if (!runtime) {
  const claudePath = which("claude");
  if (claudePath) {
    runtime = {
      name: "Claude Code",
      cmd: "claude",
      version: null,
      skillDir: "", // Claude Code uses MCP, not file-based skills
    };
    log("  ✓", "Claude Code detected");
  }
}

// ---------------------------------------------------------------------------
// 3. Install OpenClaw if no runtime found
// ---------------------------------------------------------------------------
if (!runtime) {
  log("  ⚠", "No agent runtime detected.");
  log("◆", "Installing OpenClaw...");

  try {
    execSync("npm install -g openclaw", { stdio: "inherit" });
    const version = cmdVersion("openclaw");
    runtime = {
      name: "OpenClaw",
      cmd: "openclaw",
      version,
      skillDir: join(
        homedir(),
        ".openclaw",
        "workspace",
        "skills",
        "talentclaw",
      ),
    };
    log("  ✓", "OpenClaw installed globally");
  } catch {
    log(
      "  ✗",
      "Failed to install OpenClaw. Install it manually: npm install -g openclaw",
    );
    log("", "Continuing without agent runtime...\n");
  }
}

// ---------------------------------------------------------------------------
// 4. Install TalentClaw skill into runtime
// ---------------------------------------------------------------------------
const skillSrc = resolve(__dirname, "../../../skills");
let skillInstalled = false;

if (runtime && runtime.skillDir && existsSync(skillSrc)) {
  log("◆", "Installing TalentClaw skill...");

  try {
    mkdirSync(runtime.skillDir, { recursive: true });
    cpSync(skillSrc, runtime.skillDir, { recursive: true });

    // Don't copy the workspace package.json into the skill dir
    const pkgInSkill = join(runtime.skillDir, "package.json");
    if (existsSync(pkgInSkill)) {
      const { unlinkSync } = await import("node:fs");
      unlinkSync(pkgInSkill);
    }

    skillInstalled = true;
    log("  ✓", `Skill installed into ${runtime.name} workspace`);
  } catch (err) {
    log("  ✗", `Failed to install skill: ${(err as Error).message}`);
  }
} else if (runtime?.name === "Claude Code") {
  log("◆", "Claude Code detected — skill available via MCP");
  log(
    "  ℹ",
    "Add the Coffee Shop MCP server to ~/.claude/mcp_servers.json",
  );
  log(
    "  ℹ",
    'See: https://github.com/artemyshq/talentclaw#candidate-skill-agent-runtimes',
  );
  skillInstalled = true;
}

// ---------------------------------------------------------------------------
// 5. Scaffold ~/.talentclaw/ directory structure
// ---------------------------------------------------------------------------
log("◆", "Scaffolding workspace...");

const dataDir = process.env.TALENTCLAW_DIR || join(homedir(), ".talentclaw");
const dirs = [
  dataDir,
  join(dataDir, "jobs"),
  join(dataDir, "applications"),
  join(dataDir, "companies"),
  join(dataDir, "contacts"),
  join(dataDir, "messages"),
];

for (const dir of dirs) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

// Create template files on first run
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
    "utf-8",
  );
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
    "utf-8",
  );
}

const activityPath = join(dataDir, "activity.log");
if (!existsSync(activityPath)) {
  writeFileSync(activityPath, "", "utf-8");
}

log("  ✓", `${dataDir}`);

// ---------------------------------------------------------------------------
// 6. Check Coffee Shop credentials
// ---------------------------------------------------------------------------
let hasApiKey = false;
let apiKey: string | undefined = process.env.COFFEESHOP_API_KEY;

if (!apiKey) {
  try {
    const configContent = readFileSync(configPath, "utf-8");
    const match = configContent.match(
      /^coffeeshop_api_key:\s*["']?(.+?)["']?\s*$/m,
    );
    if (match && match[1]) {
      apiKey = match[1];
    }
  } catch {
    // Config unreadable — ignore
  }
}

hasApiKey = !!apiKey;

// ---------------------------------------------------------------------------
// 7. Check gateway health (OpenClaw / ZeroClaw)
// ---------------------------------------------------------------------------
let gatewayReachable = false;

if (runtime && (runtime.name === "OpenClaw" || runtime.name === "ZeroClaw")) {
  log("◆", "Checking gateway...");
  try {
    const result = execSync(`${runtime.cmd} status`, {
      encoding: "utf-8",
      timeout: 5000,
    });
    gatewayReachable = true;
    log("  ✓", "Gateway reachable");
  } catch {
    log("  ⚠", "Gateway not reachable — start it with: openclaw start");
    gatewayReachable = false;
  }
}

// ---------------------------------------------------------------------------
// 8. Start Next.js dev server at localhost:3100
// ---------------------------------------------------------------------------
log("◆", "Starting web UI...");

const webDir = resolve(__dirname, "../../web");

const nextProcess = spawn("npx", ["next", "dev", "--port", "3100"], {
  cwd: webDir,
  stdio: "pipe",
  shell: true,
});

// Wait for the server to be ready before printing checklist
let uiReady = false;

nextProcess.stdout?.on("data", (data: Buffer) => {
  const text = data.toString();
  if (!uiReady && text.includes("Ready")) {
    uiReady = true;
    printChecklist();
  }
});

nextProcess.stderr?.on("data", (data: Buffer) => {
  // Suppress noisy Next.js dev output, but log real errors
  const text = data.toString();
  if (text.includes("Error") || text.includes("error")) {
    process.stderr.write(data);
  }
});

nextProcess.on("error", (err) => {
  console.error("Failed to start web UI:", err.message);
  process.exit(1);
});

// Fallback: print checklist after timeout if "Ready" never appears
setTimeout(() => {
  if (!uiReady) {
    uiReady = true;
    printChecklist();
  }
}, 8000);

// ---------------------------------------------------------------------------
// 9. Print bootstrap checklist
// ---------------------------------------------------------------------------
function printChecklist() {
  console.log("\n\x1b[2m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m");
  console.log("\x1b[1mBootstrap checklist\x1b[0m\n");

  check("Agent runtime", !!runtime, runtime?.name || "none");
  check("TalentClaw skill", skillInstalled);
  check("Workspace", existsSync(dataDir), dataDir);
  check("Coffee Shop", hasApiKey, hasApiKey ? "connected" : "run coffeeshop register");
  if (runtime?.name === "OpenClaw" || runtime?.name === "ZeroClaw") {
    check("Gateway", gatewayReachable, gatewayReachable ? "reachable" : `start with: ${runtime.cmd} start`);
  }
  check("Web UI", true, "http://localhost:3100");

  console.log("\n\x1b[2m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m");
  console.log(`\n\x1b[1mTalentClaw ready\x1b[0m — http://localhost:3100\n`);

  // Open browser
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
}

// ---------------------------------------------------------------------------
// 10. Graceful shutdown
// ---------------------------------------------------------------------------
process.on("SIGINT", () => {
  console.log("\nShutting down TalentClaw...");
  nextProcess.kill("SIGINT");
  process.exit(0);
});
