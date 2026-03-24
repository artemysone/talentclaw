/**
 * E2E smoke test for the CLI onboarding flow.
 *
 * Runs `bin/cli.ts` in subshells with controlled PATH to simulate
 * different machine states (fresh install, missing python, etc.)
 * WITHOUT uninstalling anything from the real environment.
 *
 * Strategy: override PATH so `which` can't find tools, and use a
 * temp TALENTCLAW_DIR so scaffold doesn't touch the real workspace.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { execSync } from "node:child_process";
import { mkdtempSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const CLI_PATH = join(__dirname, "..", "cli.ts");

/** Minimal PATH with node/npx but hiding most tools. Computed once — PATH doesn't change during tests. */
const MINIMAL_PATH: string = (() => {
  const nodeBin = execSync("which node", { encoding: "utf-8" }).trim();
  const nodeDir = join(nodeBin, "..");
  let npxDir = nodeDir;
  try {
    const npxBin = execSync("which npx", { encoding: "utf-8" }).trim();
    npxDir = join(npxBin, "..");
  } catch { /* same dir */ }
  return `${nodeDir}:${npxDir}:/usr/bin:/bin`;
})();

let tmpDir: string;

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), "talentclaw-e2e-"));
});

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

describe("CLI onboarding E2E", () => {
  it("scaffolds workspace directory structure", () => {
    // Run just enough of the CLI to scaffold — we'll kill it before server start
    // by passing a bogus command that triggers setup-only path
    try {
      execSync(`npx tsx ${CLI_PATH} setup`, {
        encoding: "utf-8",
        timeout: 30000,
        env: {
          ...process.env,
          TALENTCLAW_DIR: tmpDir,
          // Don't try to auto-install anything
          PATH: MINIMAL_PATH,
        },
      });
    } catch {
      // setup may exit non-zero if deps aren't found — that's fine,
      // we're testing that scaffold ran
    }

    expect(existsSync(join(tmpDir, "config.yaml"))).toBe(true);
    expect(existsSync(join(tmpDir, "profile.md"))).toBe(true);
    expect(existsSync(join(tmpDir, "activity.log"))).toBe(true);
    expect(existsSync(join(tmpDir, "jobs"))).toBe(true);
    expect(existsSync(join(tmpDir, "applications"))).toBe(true);
    expect(existsSync(join(tmpDir, "companies"))).toBe(true);
    expect(existsSync(join(tmpDir, "contacts"))).toBe(true);
    expect(existsSync(join(tmpDir, "messages"))).toBe(true);
  });

  it("detects missing browser-use when not on PATH and no venv", { timeout: 35000 }, () => {
    // Run with a PATH that excludes browser-use, and a HOME that has no venv
    const fakeHome = mkdtempSync(join(tmpdir(), "fakehome-"));
    try {
      const output = execSync(`npx tsx ${CLI_PATH} setup`, {
        encoding: "utf-8",
        timeout: 30000,
        env: {
          ...process.env,
          TALENTCLAW_DIR: tmpDir,
          HOME: fakeHome,
          PATH: MINIMAL_PATH,
        },
        stdio: ["pipe", "pipe", "pipe"],
      });
      // Should show [!!] for browser-use
      expect(output).toContain("[!!]");
      expect(output).toContain("browser-use");
    } catch (e: any) {
      // Command may fail — check stdout/stderr for the checklist
      const combined = (e.stdout || "") + (e.stderr || "");
      expect(combined).toContain("browser-use");
    } finally {
      rmSync(fakeHome, { recursive: true, force: true });
    }
  });

  it("detects browser-use via venv fallback path", { timeout: 35000 }, () => {
    // Create a fake venv with a browser-use binary
    const fakeHome = mkdtempSync(join(tmpdir(), "fakehome-"));
    const venvBin = join(fakeHome, ".browser-use-env", "bin");
    execSync(`mkdir -p "${venvBin}" && touch "${venvBin}/browser-use" && chmod +x "${venvBin}/browser-use"`);

    try {
      const output = execSync(`npx tsx ${CLI_PATH} setup`, {
        encoding: "utf-8",
        timeout: 30000,
        env: {
          ...process.env,
          TALENTCLAW_DIR: tmpDir,
          HOME: fakeHome,
          PATH: MINIMAL_PATH,
        },
        stdio: ["pipe", "pipe", "pipe"],
      });
      // browser-use should show as [ok] via the venv fallback
      expect(output).toMatch(/\[ok\].*browser-use/);
    } catch (e: any) {
      const combined = (e.stdout || "") + (e.stderr || "");
      // Even if exit code is non-zero, the checklist should show browser-use as ok
      expect(combined).toMatch(/\[ok\].*browser-use/);
    } finally {
      rmSync(fakeHome, { recursive: true, force: true });
    }
  });

  it("detects python3.13 when system python3 is old", () => {
    // Create a fake python3 that reports < 3.11, and a python3.13 that reports >= 3.11
    const fakeBin = mkdtempSync(join(tmpdir(), "fakebin-"));

    // Fake python3 — always prints False (simulates macOS system python 3.9)
    execSync(`cat > "${fakeBin}/python3" << 'SCRIPT'
#!/bin/sh
echo "False"
SCRIPT
chmod +x "${fakeBin}/python3"`);

    // Fake python3.13 — prints True
    execSync(`cat > "${fakeBin}/python3.13" << 'SCRIPT'
#!/bin/sh
echo "True"
SCRIPT
chmod +x "${fakeBin}/python3.13"`);

    // Use only our fake bin + minimal system tools
    const testPath = `${fakeBin}:${MINIMAL_PATH}`;

    try {
      const output = execSync(`npx tsx ${CLI_PATH} setup`, {
        encoding: "utf-8",
        timeout: 30000,
        env: {
          ...process.env,
          TALENTCLAW_DIR: tmpDir,
          PATH: testPath,
        },
        stdio: ["pipe", "pipe", "pipe"],
      });
      // Should NOT see "Installing Python..." since python3.13 is found
      expect(output).not.toContain("Installing Python...");
    } catch (e: any) {
      const combined = (e.stdout || "") + (e.stderr || "");
      expect(combined).not.toContain("Installing Python...");
    } finally {
      rmSync(fakeBin, { recursive: true, force: true });
    }
  });
});
