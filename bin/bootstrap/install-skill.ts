import { existsSync, mkdirSync, cpSync } from "node:fs";
import { log } from "./utils.js";
import type { Runtime } from "./detect-runtime.js";

export function installSkill(
  runtime: Runtime | null,
  skillSrcDir: string,
): boolean {
  if (runtime && runtime.skillDir && existsSync(skillSrcDir)) {
    log("◆", "Installing talentclaw skill...");

    try {
      mkdirSync(runtime.skillDir, { recursive: true });
      cpSync(skillSrcDir, runtime.skillDir, { recursive: true });
      log("  ✓", `Skill installed into ${runtime.name} workspace`);
      return true;
    } catch (err) {
      log("  ✗", `Failed to install skill: ${(err as Error).message}`);
      return false;
    }
  }

  if (runtime?.name === "Claude Code") {
    log("◆", "Claude Code detected — skill available via MCP");
    log("  ℹ", "Add the Coffee Shop MCP server to ~/.claude/mcp_servers.json");
    log(
      "  ℹ",
      'See: https://github.com/artemyshq/talentclaw#candidate-skill-agent-runtimes',
    );
    return true;
  }

  return false;
}
