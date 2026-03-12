import { execSync } from "node:child_process";
import { log } from "./utils.js";
import type { Runtime } from "./detect-runtime.js";

export function checkGateway(runtime: Runtime | null): boolean {
  if (!runtime || (runtime.name !== "OpenClaw" && runtime.name !== "ZeroClaw")) {
    return false;
  }

  log("◆", "Checking gateway...");
  try {
    execSync(`${runtime.cmd} status`, {
      encoding: "utf-8",
      timeout: 5000,
    });
    log("  ✓", "Gateway reachable");
    return true;
  } catch {
    log("  ⚠", `Gateway not reachable — start it with: ${runtime.cmd} start`);
    return false;
  }
}
