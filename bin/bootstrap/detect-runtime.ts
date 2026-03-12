import { homedir } from "node:os";
import { join } from "node:path";
import { log, which, cmdVersion } from "./utils.js";

export type Runtime = {
  name: string;
  cmd: string;
  version: string | null;
  skillDir: string;
};

export function detectRuntime(): Runtime | null {
  log("◆", "Checking for agent runtimes...");

  // Check OpenClaw
  if (which("openclaw")) {
    const version = cmdVersion("openclaw");
    log("  ✓", `OpenClaw detected${version ? ` (${version})` : ""}`);
    return {
      name: "OpenClaw",
      cmd: "openclaw",
      version,
      skillDir: join(homedir(), ".openclaw", "workspace", "skills", "talentclaw"),
    };
  }

  // Check ZeroClaw
  if (which("zeroclaw")) {
    const version = cmdVersion("zeroclaw");
    log("  ✓", `ZeroClaw detected${version ? ` (${version})` : ""}`);
    return {
      name: "ZeroClaw",
      cmd: "zeroclaw",
      version,
      skillDir: join(homedir(), ".zeroclaw", "workspace", "skills", "talentclaw"),
    };
  }

  // Check Claude Code
  if (which("claude")) {
    log("  ✓", "Claude Code detected");
    return {
      name: "Claude Code",
      cmd: "claude",
      version: null,
      skillDir: "",
    };
  }

  log("  ⚠", "No agent runtime detected.");
  return null;
}
