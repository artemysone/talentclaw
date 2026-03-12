import { execSync } from "node:child_process";
import { log, which } from "../helpers.js";

export { log, which };

export function check(label: string, ok: boolean, detail?: string): boolean {
  const status = ok ? "\x1b[32m[ok]\x1b[0m" : "\x1b[33m[!!]\x1b[0m";
  console.log(`${status} ${label}${detail ? ` — ${detail}` : ""}`);
  return ok;
}

export function cmdVersion(cmd: string): string | null {
  try {
    return execSync(`${cmd} --version`, { encoding: "utf-8" }).trim();
  } catch {
    return null;
  }
}
