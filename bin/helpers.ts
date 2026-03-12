import { homedir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

export const DATA_DIR =
  process.env.TALENTCLAW_DIR || join(homedir(), ".talentclaw");

export function log(icon: string, msg: string) {
  console.log(`${icon} ${msg}`);
}

export function which(cmd: string): string | null {
  try {
    return execFileSync("which", [cmd], { encoding: "utf-8" }).trim();
  } catch {
    return null;
  }
}

// NOTE: Duplicated in lib/slugify.ts for the web app.
// bin/ is bundled separately by tsup and can't import from lib/.
export function slugify(company: string, title: string): string {
  return [company, title]
    .join("-")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
