#!/usr/bin/env node

import { execFileSync, execSync, spawn, spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function dataDir(): string {
  return process.env.TALENTCLAW_DIR || join(homedir(), ".talentclaw");
}

function packageRoot(): string {
  return resolve(__dirname, "..");
}

function which(cmd: string): boolean {
  try {
    execFileSync("which", [cmd], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function check(label: string, ok: boolean, detail: string): void {
  const icon = ok ? "\x1b[32m[ok]\x1b[0m" : "\x1b[33m[!!]\x1b[0m";
  console.log(detail ? `  ${icon} ${label} — ${detail}` : `  ${icon} ${label}`);
}

function promptYesNo(question: string): boolean {
  if (!process.stdin.isTTY) return false;
  process.stdout.write(`  ${question} [Y/n] `);
  try {
    const result = spawnSync("bash", ["-c", "read -r ans && echo \"$ans\""], {
      stdio: ["inherit", "pipe", "inherit"],
      timeout: 30000,
    });
    const answer = result.stdout?.toString().trim().toLowerCase();
    return answer === "" || answer === "y" || answer === "yes";
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Templates (ported from scaffold.rs)
// ---------------------------------------------------------------------------

export const TEMPLATE_CONFIG = `# TalentClaw configuration
# coffeeshop_api_key: "your-key-here"
# theme: "auto"
`;

export const TEMPLATE_PROFILE = `---
display_name: ""
headline: ""
skills: []
preferred_roles: []
preferred_locations: []
remote_preference: flexible
experience_years: 0
---

# About

<!-- Write a brief summary of your background and what you're looking for -->
`;

// ---------------------------------------------------------------------------
// Scaffold
// ---------------------------------------------------------------------------

export function scaffold(): void {
  const dir = dataDir();
  const subdirs = ["jobs", "applications", "companies", "contacts", "messages"];

  for (const sub of subdirs) {
    mkdirSync(join(dir, sub), { recursive: true });
  }

  writeIfMissing(join(dir, "config.yaml"), TEMPLATE_CONFIG);
  writeIfMissing(join(dir, "profile.md"), TEMPLATE_PROFILE);
  writeIfMissing(join(dir, "activity.log"), "");
}

function writeIfMissing(path: string, content: string): void {
  if (!existsSync(path)) {
    writeFileSync(path, content, "utf-8");
  }
}

// ---------------------------------------------------------------------------
// Dependency checks
// ---------------------------------------------------------------------------

interface DepStatus {
  hasCoffeeshop: boolean;
  hasAgentBrowser: boolean;
  hasApiKey: boolean;
  hasClaude: boolean;
}

function checkDeps(autoInstall = false): DepStatus {
  let hasCoffeeshop = which("coffeeshop");
  if (!hasCoffeeshop) {
    if (autoInstall) {
      const shouldInstall = promptYesNo(
        "Coffee Shop CLI not found. Install it? (npm install -g @artemyshq/coffeeshop)"
      );
      if (shouldInstall) {
        try {
          execSync("npm install -g @artemyshq/coffeeshop", { stdio: "inherit" });
          hasCoffeeshop = which("coffeeshop");
        } catch {
          console.log("  Failed to install. Install manually: npm install -g @artemyshq/coffeeshop");
        }
      }
    } else {
      console.log("! Coffee Shop CLI not found — install with: npm install -g @artemyshq/coffeeshop");
    }
  }

  let hasAgentBrowser = which("agent-browser");
  if (!hasAgentBrowser) {
    if (autoInstall) {
      const shouldInstall = promptYesNo(
        "agent-browser lets TalentClaw apply to jobs on sites like Greenhouse and LinkedIn. Install it? (npm install -g agent-browser)"
      );
      if (shouldInstall) {
        try {
          execSync("npm install -g agent-browser", { stdio: "inherit" });
          hasAgentBrowser = which("agent-browser");
          if (hasAgentBrowser) {
            console.log("  Setting up browser...");
            execSync("agent-browser install", { stdio: "inherit" });
          }
        } catch {
          console.log("  Failed to install. Install manually: npm install -g agent-browser");
        }
      }
    } else {
      console.log("! agent-browser not found — install with: npm install -g agent-browser");
    }
  }

  const hasApiKey = !!process.env.ANTHROPIC_API_KEY;
  const hasClaude = which("claude");

  return { hasCoffeeshop, hasAgentBrowser, hasApiKey, hasClaude };
}

// ---------------------------------------------------------------------------
// Checklist
// ---------------------------------------------------------------------------

function printChecklist(deps: DepStatus, webUrl?: string, webError?: string): void {
  console.log();
  check("Workspace", true, dataDir());
  check("Coffee Shop CLI", deps.hasCoffeeshop, deps.hasCoffeeshop ? "installed" : "npm install -g @artemyshq/coffeeshop");
  check("agent-browser", deps.hasAgentBrowser, deps.hasAgentBrowser ? "installed" : "npm install -g agent-browser");
  check("Auth", deps.hasApiKey || deps.hasClaude, deps.hasApiKey ? "API key" : deps.hasClaude ? "Claude subscription" : "run: claude login");

  if (webError) {
    check("Web UI", false, webError);
  } else if (webUrl) {
    check("Web UI", true, webUrl);
  } else {
    check("Web UI", false, "starting...");
  }
  console.log();
}

// ---------------------------------------------------------------------------
// Server
// ---------------------------------------------------------------------------

function openBrowser(url: string): void {
  const cmd = process.platform === "darwin" ? "open" : "xdg-open";
  try { execSync(`${cmd} ${url}`, { stdio: "ignore" }); } catch { /* ignore */ }
}

function startServer(deps: DepStatus): void {
  const root = packageRoot();
  const serverJs = join(root, ".next", "standalone", "server.js");

  if (!existsSync(serverJs)) {
    printChecklist(deps, undefined, "server.js not found — run 'npm run build' first");
    process.exit(1);
  }

  const child = spawn("node", [serverJs], {
    cwd: dirname(serverJs),
    env: { ...process.env, PORT: "3100", HOSTNAME: "0.0.0.0" },
    stdio: ["ignore", "pipe", "pipe"],
  });

  let ready = false;
  let portInUse = false;

  child.stdout?.on("data", (data: Buffer) => {
    const lower = data.toString().toLowerCase();
    if (!ready && (lower.includes("ready") || lower.includes("listening") || lower.includes("started server"))) {
      ready = true;
      printChecklist(deps, "http://localhost:3100");
      openBrowser("http://localhost:3100");
    }
  });

  child.stderr?.on("data", (data: Buffer) => {
    if (data.toString().includes("EADDRINUSE")) {
      portInUse = true;
      printChecklist(deps, undefined, "port 3100 already in use — kill the existing process: lsof -ti :3100 | xargs kill");
      child.kill();
      process.exit(1);
    }
  });

  // If no ready signal after 5s, assume ready
  setTimeout(() => {
    if (!ready && !portInUse) {
      ready = true;
      printChecklist(deps, "http://localhost:3100");
      openBrowser("http://localhost:3100");
    }
  }, 5000);

  const cleanup = () => {
    child.kill("SIGTERM");
    process.exit(0);
  };
  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);

  child.on("exit", (code) => {
    if (code && code !== 0) {
      console.error(`Server exited with code ${code}`);
    }
    process.exit(code ?? 0);
  });
}

// ---------------------------------------------------------------------------
// Setup command
// ---------------------------------------------------------------------------

function setup(): void {
  console.log("\ntalentclaw setup\n");

  // 1. Scaffold workspace
  scaffold();
  console.log("  Workspace scaffolded: " + dataDir());

  // 2. Check deps with auto-install (before MCP registration so coffeeshop is available)
  const deps = checkDeps(true);

  // 3. Register Coffee Shop MCP server
  const claudeDir = join(homedir(), ".claude");
  const mcpPath = join(claudeDir, "mcp_servers.json");

  mkdirSync(claudeDir, { recursive: true });

  let mcpConfig: Record<string, unknown> = {};
  if (existsSync(mcpPath)) {
    try {
      mcpConfig = JSON.parse(readFileSync(mcpPath, "utf-8"));
    } catch { /* malformed file — start fresh */ }
  }

  const mcpServers = (mcpConfig.mcpServers ?? {}) as Record<string, unknown>;
  mcpServers.coffeeshop = { command: "coffeeshop", args: ["mcp-server"] };
  mcpConfig.mcpServers = mcpServers;
  writeFileSync(mcpPath, JSON.stringify(mcpConfig, null, 2) + "\n", "utf-8");
  console.log("  Coffee Shop MCP registered: " + mcpPath);

  // 4. Symlink skill
  const skillSource = join(packageRoot(), "skills");
  const skillTarget = join(claudeDir, "skills", "talentclaw");

  if (!existsSync(skillTarget)) {
    mkdirSync(join(claudeDir, "skills"), { recursive: true });
    try {
      symlinkSync(skillSource, skillTarget);
      console.log("  Skill linked: " + skillTarget + " -> " + skillSource);
    } catch {
      console.log("  Skill link skipped (permission error)");
    }
  } else {
    console.log("  Skill already linked: " + skillTarget);
  }

  // 5. Print summary
  printChecklist(deps);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const command = process.argv[2];

if (command === "setup") {
  setup();
} else {
  console.log("\ntalentclaw — your AI career agent\n");
  scaffold();
  const deps = checkDeps();
  startServer(deps);
}
