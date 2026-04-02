/**
 * Dependency detection helpers for the CLI onboarding flow.
 *
 * Extracted from bin/cli.ts so they can be unit-tested without
 * triggering the CLI's top-level side effects (server start, etc.).
 */

import { execFileSync } from "node:child_process";

/** Return true if `cmd` is found on PATH. */
export function which(cmd: string): boolean {
  try {
    execFileSync("which", [cmd], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

