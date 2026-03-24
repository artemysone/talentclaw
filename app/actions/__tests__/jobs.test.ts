import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import {
  createTempDataDir,
  cleanupTempDataDir,
  writeMockJob,
} from "@/lib/test-helpers"
import { getJob, listJobs } from "@/lib/fs-data"

// Mock next/cache since it's not available outside Next.js
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

import {
  moveJobToStage,
  saveJobToPipeline,
  createJobAction,
  deleteJobAction,
} from "@/app/actions/jobs"

let tmpDir: string

beforeEach(async () => {
  tmpDir = await createTempDataDir()
})

afterEach(async () => {
  await cleanupTempDataDir(tmpDir)
})

describe("moveJobToStage", () => {
  it("valid stage transition succeeds", async () => {
    await writeMockJob(tmpDir, "acme-sre", {
      title: "SRE",
      company: "Acme",
      status: "discovered",
      source: "manual",
    })

    const result = await moveJobToStage("acme-sre", "applied")
    expect(result.error).toBeUndefined()

    const job = await getJob("acme-sre")
    expect(job!.frontmatter.status).toBe("applied")
  })

  it("invalid stage returns error", async () => {
    await writeMockJob(tmpDir, "acme-sre", {
      title: "SRE",
      company: "Acme",
      status: "discovered",
      source: "manual",
    })

    const result = await moveJobToStage("acme-sre", "bogus_stage")
    expect(result.error).toBeDefined()
    expect(result.error).toContain("Invalid pipeline stage")
  })
})

describe("saveJobToPipeline", () => {
  it("sets status to discovered", async () => {
    await writeMockJob(tmpDir, "startup-eng", {
      title: "Engineer",
      company: "Startup",
      status: "discovered",
      source: "manual",
    })

    const result = await saveJobToPipeline("startup-eng")
    expect(result.error).toBeUndefined()

    const job = await getJob("startup-eng")
    expect(job!.frontmatter.status).toBe("discovered")
  })
})

describe("createJobAction", () => {
  it("valid data creates a job file", async () => {
    const result = await createJobAction({
      title: "Backend Developer",
      company: "TechCo",
    })
    expect(result.error).toBeUndefined()

    // Slug is auto-generated as "techco-backend-developer"
    const job = await getJob("techco-backend-developer")
    expect(job).not.toBeNull()
    expect(job!.frontmatter.title).toBe("Backend Developer")
    expect(job!.frontmatter.company).toBe("TechCo")
    expect(job!.frontmatter.status).toBe("discovered") // default
  })

  it("invalid data returns error", async () => {
    const result = await createJobAction({
      // missing required fields (title and company)
      url: "https://example.com",
    })
    expect(result.error).toBeDefined()
    expect(result.error).toContain("Validation failed")
  })
})

describe("deleteJobAction", () => {
  it("existing job is deleted", async () => {
    await writeMockJob(tmpDir, "to-delete", {
      title: "Delete Me",
      company: "Gone Inc",
      status: "rejected",
      source: "manual",
    })

    const result = await deleteJobAction("to-delete")
    expect(result.error).toBeUndefined()

    const job = await getJob("to-delete")
    expect(job).toBeNull()
  })

  it("missing job returns error", async () => {
    const result = await deleteJobAction("no-such-job")
    expect(result.error).toBeDefined()
    expect(result.error).toContain("Failed to delete job")
  })
})
