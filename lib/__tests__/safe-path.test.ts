import { describe, it, expect, beforeEach, afterEach } from "vitest"
import {
  createTempDataDir,
  cleanupTempDataDir,
  writeMockJob,
} from "@/lib/test-helpers"
import { getJob, deleteJob, createJob } from "@/lib/fs-data"

/**
 * Tests for safePath() validation — exercised indirectly through the public
 * CRUD functions that rely on it (getJob, deleteJob, createJob).
 * safePath prevents directory traversal and path injection.
 */

let tmpDir: string

beforeEach(async () => {
  tmpDir = await createTempDataDir()
})

afterEach(async () => {
  await cleanupTempDataDir(tmpDir)
})

describe("safePath — path traversal prevention", () => {
  it("rejects slug with ../", async () => {
    await expect(getJob("../secret")).rejects.toThrow("Invalid slug")
  })

  it("rejects slug with ../../", async () => {
    await expect(getJob("../../etc/passwd")).rejects.toThrow("Invalid slug")
  })

  it("rejects slug with forward slash", async () => {
    await expect(getJob("sub/dir")).rejects.toThrow("Invalid slug")
  })

  it("rejects slug with backslash", async () => {
    await expect(getJob("sub\\dir")).rejects.toThrow("Invalid slug")
  })

  it("rejects slug with mixed traversal", async () => {
    await expect(getJob("..\\..\\windows\\system32")).rejects.toThrow("Invalid slug")
  })

  it("rejects slug starting with ..", async () => {
    await expect(deleteJob("..")).rejects.toThrow("Invalid slug")
  })

  it("allows valid slug with hyphens and numbers", async () => {
    await writeMockJob(tmpDir, "acme-corp-sre-123", {
      title: "SRE",
      company: "Acme Corp",
      status: "discovered",
      source: "manual",
    })
    const job = await getJob("acme-corp-sre-123")
    expect(job).not.toBeNull()
    expect(job!.frontmatter.title).toBe("SRE")
  })

  it("allows valid slug with dots (not traversal)", async () => {
    await writeMockJob(tmpDir, "acme.corp-v2.0", {
      title: "Engineer",
      company: "Acme.Corp",
      status: "discovered",
      source: "manual",
    })
    const job = await getJob("acme.corp-v2.0")
    expect(job).not.toBeNull()
  })

  it("rejects traversal in createJob", async () => {
    await expect(
      createJob("../../etc/shadow", {
        title: "Malicious",
        company: "Evil",
        status: "discovered",
        source: "manual",
      })
    ).rejects.toThrow("Invalid slug")
  })

  it("rejects traversal in deleteJob", async () => {
    await expect(deleteJob("../../../important-file")).rejects.toThrow("Invalid slug")
  })
})
