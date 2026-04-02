import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("node:child_process", () => ({
  execFileSync: vi.fn(),
}));

import { which } from "../deps";
import { execFileSync } from "node:child_process";

const mockExecFileSync = vi.mocked(execFileSync);

beforeEach(() => {
  vi.resetAllMocks();
});

// ---------------------------------------------------------------------------
// which()
// ---------------------------------------------------------------------------

describe("which", () => {
  it("returns true when command exists", () => {
    mockExecFileSync.mockReturnValue(Buffer.from("/usr/bin/node"));
    expect(which("node")).toBe(true);
    expect(mockExecFileSync).toHaveBeenCalledWith("which", ["node"], { stdio: "ignore" });
  });

  it("returns false when command does not exist", () => {
    mockExecFileSync.mockImplementation(() => { throw new Error("not found"); });
    expect(which("nonexistent-tool-xyz")).toBe(false);
  });
});

