import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

// We test scaffold logic by importing from the CLI module.
// Set TALENTCLAW_DIR before importing so dataDir() picks it up.
const testDir = join(tmpdir(), `talentclaw-test-${Date.now()}`);
process.env.TALENTCLAW_DIR = testDir;

// Dynamic import after env is set
const { scaffold, dataDir, TEMPLATE_CONFIG, TEMPLATE_PROFILE } = await import(
  "../../bin/cli.ts"
);

describe("scaffold", () => {
  beforeEach(() => {
    // Ensure clean slate
    rmSync(testDir, { recursive: true, force: true });
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it("creates all required subdirectories", () => {
    scaffold();

    const expected = ["jobs", "applications", "companies", "contacts", "messages"];
    for (const sub of expected) {
      expect(existsSync(join(testDir, sub))).toBe(true);
    }
  });

  it("writes template config.yaml when missing", () => {
    scaffold();

    const content = readFileSync(join(testDir, "config.yaml"), "utf-8");
    expect(content).toBe(TEMPLATE_CONFIG);
  });

  it("writes template profile.md when missing", () => {
    scaffold();

    const content = readFileSync(join(testDir, "profile.md"), "utf-8");
    expect(content).toBe(TEMPLATE_PROFILE);
    expect(content).toContain("display_name:");
    expect(content).toContain("remote_preference: flexible");
  });

  it("writes empty activity.log when missing", () => {
    scaffold();

    const content = readFileSync(join(testDir, "activity.log"), "utf-8");
    expect(content).toBe("");
  });

  it("does not overwrite existing files", () => {
    // Pre-create config.yaml with custom content
    mkdirSync(testDir, { recursive: true });
    const customContent = "custom: true\n";
    writeFileSync(join(testDir, "config.yaml"), customContent, "utf-8");

    scaffold();

    const content = readFileSync(join(testDir, "config.yaml"), "utf-8");
    expect(content).toBe(customContent);
  });

  it("respects TALENTCLAW_DIR env var", () => {
    expect(dataDir()).toBe(testDir);

    scaffold();

    // Verify files are in testDir, not ~/.talentclaw
    expect(existsSync(join(testDir, "config.yaml"))).toBe(true);
    expect(existsSync(join(testDir, "profile.md"))).toBe(true);
  });

  it("is idempotent — running twice does not error", () => {
    scaffold();
    expect(() => scaffold()).not.toThrow();
  });
});
