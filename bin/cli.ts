#!/usr/bin/env node

import { execFileSync, execSync, spawn, spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { isServerReady } from "../lib/server-constants";
import { hasClaudeCredentialFiles } from "../lib/claude-auth";

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
  hasAgentBrowser: boolean;
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

function checkDeps(autoInstall = false): DepStatus {
  const interactive = autoInstall || !!process.stdin.isTTY;

  // --- Claude Code (required for AI chat) ---
  let hasClaude = which("claude");

  if (!hasClaude && interactive) {
    console.log();
    console.log("  Claude Code powers TalentClaw's AI chat assistant.");
    console.log("  It requires a Claude Pro or Max subscription.");
    console.log();
    const shouldInstall = promptYesNo(
      "Install Claude Code? (npm install -g @anthropic-ai/claude-code)"
    );
    if (shouldInstall) {
      try {
        console.log();
        execSync("npm install -g @anthropic-ai/claude-code", { stdio: "inherit" });
        hasClaude = which("claude");
        if (hasClaude) {
          console.log("\n  \x1b[32m[ok]\x1b[0m Claude Code installed");
        }
      } catch {
        console.log("\n  Install failed. Try manually: npm install -g @anthropic-ai/claude-code");
      }
    }
  }

  // --- Auth (Claude login or API key) ---
  let hasClaudeAuth = false;

  if (hasClaude) {
    hasClaudeAuth = checkClaudeAuth();

    if (!hasClaudeAuth && interactive) {
      console.log();
      console.log("  Sign in to your Claude account to enable the AI assistant.");
      console.log("  This opens your browser to authenticate with Anthropic.");
      console.log();
      const shouldLogin = promptYesNo("Sign in now?");
      if (shouldLogin) {
        try {
          console.log();
          spawnSync("claude", ["login"], { stdio: "inherit", timeout: 120000 });
          hasClaudeAuth = checkClaudeAuth();
          if (hasClaudeAuth) {
            console.log("\n  \x1b[32m[ok]\x1b[0m Signed in to Claude");
          }
        } catch {
          console.log("\n  Sign-in failed or timed out. Run 'claude login' later to enable chat.");
        }
      }
    }
  }

  // --- agent-browser (optional — only prompt during setup) ---
  let hasAgentBrowser = which("agent-browser");
  if (!hasAgentBrowser && autoInstall) {
    console.log();
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
  }

  return { hasClaude, hasClaudeAuth, hasAgentBrowser };
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
    "agent-browser",
    deps.hasAgentBrowser,
    deps.hasAgentBrowser ? "installed" : "optional — npm install -g agent-browser",
  );

  if (webError) {
    check("Web UI", false, webError);
  } else if (webUrl) {
    check("Web UI", true, webUrl);
  } else {
    check("Web UI", false, "starting...");
  }

  if (!deps.hasClaude || !deps.hasClaudeAuth) {
    console.log();
    console.log("  \x1b[33mNote:\x1b[0m AI chat requires Claude Code + sign-in. The dashboard works without it.");
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
  const deps = checkDeps(true);

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
