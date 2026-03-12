import { execSync } from "node:child_process";
import { homedir } from "node:os";
import { join } from "node:path";
import { log, cmdVersion } from "./utils.js";
import type { Runtime } from "./detect-runtime.js";

export function installRuntime(): Runtime | null {
  log("◆", "Installing OpenClaw...");

  try {
    execSync("npm install -g openclaw", { stdio: "inherit" });
    const version = cmdVersion("openclaw");
    log("  ✓", "OpenClaw installed globally");
    return {
      name: "OpenClaw",
      cmd: "openclaw",
      version,
      skillDir: join(homedir(), ".openclaw", "workspace", "skills", "talentclaw"),
    };
  } catch {
    log(
      "  ✗",
      "Failed to install OpenClaw. Install it manually: npm install -g openclaw",
    );
    log("", "Continuing without agent runtime...\n");
    return null;
  }
}
