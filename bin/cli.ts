#!/usr/bin/env node

import { execSync, spawn, spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  realpathSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { isServerReady } from "../lib/server-constants";
import { hasClaudeCredentialFiles } from "../lib/claude-auth";
import { which, findPython311, hasBrowserUseBin } from "../lib/deps";

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

function check(label: string, ok: boolean, detail: string): void {
  const icon = ok ? "\x1b[32m[ok]\x1b[0m" : "\x1b[33m[!!]\x1b[0m";
  console.log(detail ? `  ${icon} ${label} — ${detail}` : `  ${icon} ${label}`);
}


// ---------------------------------------------------------------------------
// Templates (ported from scaffold.rs)
// ---------------------------------------------------------------------------

export const TEMPLATE_CONFIG = `# TalentClaw configuration
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
  hasClaude: boolean;
  hasClaudeAuth: boolean;
  hasBrowserUse: boolean;
}

function checkClaudeAuth(): boolean {
  // API key is the most explicit auth signal
  if (process.env.ANTHROPIC_API_KEY) return true;

  // Check if Claude Code has been authenticated via `claude login`.
  // The SDK spawns a Claude Code subprocess that inherits its auth,
  // so we just need to verify the user has logged in at least once.
  try {
    const result = spawnSync("claude", ["auth", "status"], {
      stdio: "pipe",
      timeout: 5000,
    });
    // Exit 0 means authenticated
    if (result.status === 0) return true;
  } catch {
    // Command may not exist in older versions — fall through
  }

  return hasClaudeCredentialFiles();
}

function installPython(): string | null {
  if (process.platform === "darwin") {
    // macOS — use Homebrew
    if (which("brew")) {
      try {
        execSync("brew install python@3.13", { stdio: "pipe", timeout: 300000 });
        return "python3.13";
      } catch { /* fall through */ }
    }
  }
  // Linux — try apt if available
  if (process.platform === "linux" && which("apt-get")) {
    try {
      execSync("sudo apt-get update -qq && sudo apt-get install -y -qq python3 python3-pip", {
        stdio: "pipe",
        timeout: 300000,
      });
      return "python3";
    } catch { /* fall through */ }
  }
  return null;
}

function checkDeps(): DepStatus {
  console.log("  Setting up...\n");

  // --- Claude Code (required — auto-install) ---
  let hasClaude = which("claude");
  if (!hasClaude) {
    try {
      console.log("  Installing Claude Code...");
      execSync("npm install -g @anthropic-ai/claude-code", { stdio: "pipe" });
      hasClaude = which("claude");
    } catch {
      // Will show as missing in checklist
    }
  }

  // --- Auth (requires browser interaction — auto-launch) ---
  let hasClaudeAuth = false;
  if (hasClaude) {
    hasClaudeAuth = checkClaudeAuth();
    if (!hasClaudeAuth) {
      try {
        console.log("  Opening browser to sign in to Claude...\n");
        spawnSync("claude", ["login"], { stdio: "inherit", timeout: 120000 });
        hasClaudeAuth = checkClaudeAuth();
      } catch {
        // Will show as missing in checklist
      }
    }
  }

  // --- Python 3.11+ (required for browser-use — auto-install) ---
  let pythonBin = findPython311();
  if (!pythonBin) {
    console.log("  Installing Python...");
    pythonBin = installPython();
  }

  // --- browser-use (required — auto-install, needs Python) ---
  let hasBrowserUse = hasBrowserUseBin();
  if (!hasBrowserUse && pythonBin) {
    try {
      console.log("  Installing browser-use...");
      // Use the discovered python3.x binary so the install script
      // picks up 3.11+ even when the system python3 is older (e.g. macOS 3.9)
      execSync(`curl -fsSL https://browser-use.com/cli/install.sh | PYTHON=${pythonBin} bash`, { stdio: "pipe", timeout: 300000 });
      hasBrowserUse = hasBrowserUseBin();
      if (!hasBrowserUse) {
        // Fallback: install via pip directly with the correct python
        execSync(`${pythonBin} -m pip install browser-use`, { stdio: "pipe", timeout: 300000 });
        hasBrowserUse = hasBrowserUseBin();
      }
      if (hasBrowserUse) {
        console.log("  Installing Chromium...");
        execSync("browser-use install", { stdio: "pipe", timeout: 300000 });
      }
    } catch {
      // Will show as missing in checklist
    }
  }

  return { hasClaude, hasClaudeAuth, hasBrowserUse };
}

// ---------------------------------------------------------------------------
// Checklist
// ---------------------------------------------------------------------------

function printChecklist(deps: DepStatus, webUrl?: string, webError?: string): void {
  console.log();
  check("Workspace", true, dataDir());
  check(
    "Claude Code",
    deps.hasClaude,
    deps.hasClaude ? "installed" : "npm install -g @anthropic-ai/claude-code",
  );
  check(
    "Auth",
    deps.hasClaudeAuth,
    deps.hasClaudeAuth
      ? (process.env.ANTHROPIC_API_KEY ? "API key" : "Claude subscription")
      : (deps.hasClaude ? "run: claude login" : "install Claude Code first"),
  );
  check(
    "browser-use",
    deps.hasBrowserUse,
    deps.hasBrowserUse ? "installed" : "failed — run: curl -fsSL https://browser-use.com/cli/install.sh | bash",
  );

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
    if (!ready && isServerReady(data.toString())) {
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

  // 2. Check deps with auto-install
  const deps = checkDeps();

  // 3. Symlink skill
  const claudeDir = join(homedir(), ".claude");
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

  // 4. Print summary
  printChecklist(deps);
}

// ---------------------------------------------------------------------------
// Main — only runs when executed directly, not when imported by tests
// ---------------------------------------------------------------------------

const isDirectExecution = process.argv[1] !== undefined &&
  realpathSync(fileURLToPath(import.meta.url)) === realpathSync(resolve(process.argv[1]));

if (isDirectExecution) {
  const command = process.argv[2];

  if (command === "setup") {
    setup();
  } else {
    console.log("\ntalentclaw — your AI career agent\n");
    scaffold();
    const deps = checkDeps();
    startServer(deps);
  }
}
