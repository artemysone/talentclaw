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
import { log, which, DATA_DIR } from "./helpers.js";
import { runSearch } from "./search.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(__dirname, "..");
const skillSrcDir = join(packageRoot, "skills");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function check(label: string, ok: boolean, detail?: string) {
  const status = ok ? "\x1b[32m[ok]\x1b[0m" : "\x1b[33m[!!]\x1b[0m";
  console.log(`${status} ${label}${detail ? ` — ${detail}` : ""}`);
  return ok;
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
    `\ntalentclaw requires Node.js 22 or later (you have ${process.versions.node}).` +
      `\nInstall the latest LTS from https://nodejs.org or use a version manager like fnm / nvm.\n`,
  );
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Subcommand routing
// ---------------------------------------------------------------------------
const subcommand = process.argv[2];
if (subcommand === "search") {
  await runSearch(process.argv.slice(3));
  process.exit(0);
}

console.log("\n\x1b[1mtalentclaw\x1b[0m — your AI career agent\n");

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
// 4. Install Coffee Shop CLI
// ---------------------------------------------------------------------------
let hasCoffeeshop = !!which("coffeeshop");

if (hasCoffeeshop) {
  const csVersion = cmdVersion("coffeeshop");
  log("◆", `Coffee Shop detected${csVersion ? ` (${csVersion})` : ""}`);
} else {
  log("◆", "Installing Coffee Shop...");
  try {
    execSync("npm install -g coffeeshop", { stdio: "inherit" });
    hasCoffeeshop = true;
    log("  ✓", "Coffee Shop installed globally");
  } catch {
    log(
      "  ✗",
      "Failed to install Coffee Shop. Install it manually: npm install -g coffeeshop",
    );
  }
}

// ---------------------------------------------------------------------------
// 5. Install talentclaw skill into runtime
// ---------------------------------------------------------------------------
let skillInstalled = false;

if (runtime && runtime.skillDir && existsSync(skillSrcDir)) {
  log("◆", "Installing talentclaw skill...");

  try {
    mkdirSync(runtime.skillDir, { recursive: true });
    cpSync(skillSrcDir, runtime.skillDir, { recursive: true });
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

const dataDir = DATA_DIR;
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

const profilePath = join(dataDir, "profile.md");
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

const nextProcess = spawn("npx", ["next", "dev", "--port", "3100"], {
  cwd: packageRoot,
  stdio: "pipe",
  shell: true,
});

// Wait for the server to be ready before printing checklist
let uiReady = false;
let uiFailed = false;
let uiError = "";

nextProcess.stdout?.on("data", (data: Buffer) => {
  const text = data.toString();
  if (!uiReady && !uiFailed && text.includes("Ready")) {
    uiReady = true;
    printChecklist();
  }
});

nextProcess.stderr?.on("data", (data: Buffer) => {
  const text = data.toString();
  if (text.includes("EADDRINUSE")) {
    uiFailed = true;
    uiError = "port 3100 is already in use";
    process.stderr.write(data);
    printChecklist();
  } else if (text.includes("Error") || text.includes("error")) {
    process.stderr.write(data);
  }
});

nextProcess.on("exit", (code) => {
  if (code !== null && code !== 0 && !uiReady && !uiFailed) {
    uiFailed = true;
    uiError = uiError || `server exited with code ${code}`;
    printChecklist();
  }
});

nextProcess.on("error", (err) => {
  uiFailed = true;
  uiError = err.message;
  printChecklist();
});

// Fallback: print checklist after timeout if "Ready" never appears
setTimeout(() => {
  if (!uiReady && !uiFailed) {
    uiReady = true;
    printChecklist();
  }
}, 8000);

// ---------------------------------------------------------------------------
// 9. Print bootstrap checklist
// ---------------------------------------------------------------------------
let checklistPrinted = false;

function printChecklist() {
  if (checklistPrinted) return;
  checklistPrinted = true;

  console.log("\n\x1b[2m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m");
  console.log("\x1b[1mBootstrap checklist\x1b[0m\n");

  check("Agent runtime", !!runtime, runtime?.name || "none");
  check("talentclaw skill", skillInstalled);
  check("Workspace", existsSync(dataDir), dataDir);
  check("Coffee Shop CLI", hasCoffeeshop, hasCoffeeshop ? "installed" : "npm install -g coffeeshop");
  check("Coffee Shop account", hasApiKey, hasApiKey ? "connected" : "your agent will set this up");
  if (runtime?.name === "OpenClaw" || runtime?.name === "ZeroClaw") {
    check("Gateway", gatewayReachable, gatewayReachable ? "reachable" : `start with: ${runtime.cmd} start`);
  }

  const uiOk = uiReady && !uiFailed;
  check("Web UI", uiOk, uiOk ? "http://localhost:3100" : uiError || "failed to start");

  console.log("\n\x1b[2m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m");

  if (uiOk) {
    console.log(`\n\x1b[1mtalentclaw ready\x1b[0m — http://localhost:3100\n`);

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
  } else {
    console.log(`\n\x1b[33mWeb UI failed to start\x1b[0m — ${uiError}`);
    if (uiError.includes("already in use")) {
      console.log(`  Kill the existing process: \x1b[1mlsof -ti :3100 | xargs kill\x1b[0m`);
      console.log(`  Then re-run: \x1b[1mnpx talentclaw\x1b[0m\n`);
    }
  }
}

// ---------------------------------------------------------------------------
// 10. Graceful shutdown
// ---------------------------------------------------------------------------
process.on("SIGINT", () => {
  console.log("\nShutting down talentclaw...");
  nextProcess.kill("SIGINT");
  process.exit(0);
});
