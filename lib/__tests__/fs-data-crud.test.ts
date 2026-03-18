import { describe, it, expect, beforeEach, afterEach } from "vitest"
import fs from "node:fs/promises"
import path from "node:path"
import matter from "gray-matter"
import {
  createTempDataDir,
  cleanupTempDataDir,
  writeMockJob,
  writeMockProfile,
  writeMockApplication,
} from "@/lib/test-helpers"
import {
  updateProfile,
  getProfile,
  deleteJob,
  getJob,
  createApplication,
  listApplications,
  updateApplication,
  createJob,
} from "@/lib/fs-data"

let tmpDir: string

beforeEach(async () => {
  tmpDir = await createTempDataDir()
})

afterEach(async () => {
  await cleanupTempDataDir(tmpDir)
})

describe("updateProfile", () => {
  it("writes valid profile data correctly", async () => {
    await writeMockProfile(tmpDir, { display_name: "Alice" }, "Original bio.")

    await updateProfile({ display_name: "Alice", headline: "Engineer" })

    const profile = await getProfile()
    expect(profile.frontmatter.display_name).toBe("Alice")
    expect(profile.frontmatter.headline).toBe("Engineer")
    // Content should be preserved
    expect(profile.content).toBe("Original bio.")
  })

  it("partial update merges with existing data", async () => {
    await writeMockProfile(tmpDir, {
      display_name: "Bob",
      headline: "Designer",
      skills: ["Figma"],
    })

    await updateProfile({ skills: ["Figma", "CSS"] })

    const profile = await getProfile()
    expect(profile.frontmatter.display_name).toBe("Bob")
    expect(profile.frontmatter.headline).toBe("Designer")
    expect(profile.frontmatter.skills).toEqual(["Figma", "CSS"])
  })

  it("creates profile.md if it does not exist", async () => {
    // No profile file exists yet
    await updateProfile({ display_name: "Charlie" })

    const profile = await getProfile()
    expect(profile.frontmatter.display_name).toBe("Charlie")
  })
})

describe("deleteJob", () => {
  it("deletes an existing job", async () => {
    await writeMockJob(tmpDir, "acme-sre", {
      title: "SRE",
      company: "Acme",
      status: "discovered",
      source: "manual",
    })

    // Confirm it exists
    const before = await getJob("acme-sre")
    expect(before).not.toBeNull()

    await deleteJob("acme-sre")

    const after = await getJob("acme-sre")
    expect(after).toBeNull()
  })

  it("throws when deleting a non-existent job", async () => {
    await expect(deleteJob("no-such-job")).rejects.toThrow("Job not found")
  })
})

describe("createApplication", () => {
  it("creates a valid application file", async () => {
    await createApplication("acme-sre-app", {
      job: "acme-sre",
      status: "applied",
      applied_at: "2026-03-15",
    })

    const apps = await listApplications()
    expect(apps).toHaveLength(1)
    expect(apps[0].slug).toBe("acme-sre-app")
    expect(apps[0].frontmatter.job).toBe("acme-sre")
    expect(apps[0].frontmatter.status).toBe("applied")
  })

  it("validates with Zod and rejects invalid data", async () => {
    await expect(
      createApplication("bad-app", {
        // missing required 'job' field
        status: "applied",
      }),
    ).rejects.toThrow()
  })
})

describe("updateApplication", () => {
  it("partial update merges correctly", async () => {
    await writeMockApplication(tmpDir, "acme-sre-app", {
      job: "acme-sre",
      status: "applied",
      applied_at: "2026-03-15",
    })

    await updateApplication("acme-sre-app", {
      status: "interviewing",
      next_step: "Phone screen",
    })

    const apps = await listApplications()
    expect(apps).toHaveLength(1)
    expect(apps[0].frontmatter.status).toBe("interviewing")
    expect(apps[0].frontmatter.next_step).toBe("Phone screen")
    // Original fields preserved
    expect(apps[0].frontmatter.job).toBe("acme-sre")
    expect(apps[0].frontmatter.applied_at).toBe("2026-03-15")
  })
})
