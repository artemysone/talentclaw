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
    log("  ✓", "Claude Code detected — use the talentclaw skill in your agent");
    return true;
  }

  return false;
}
