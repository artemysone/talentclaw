import { describe, it, expect, vi, beforeEach } from "vitest"
import matter from "gray-matter"

// Mock node:fs/promises before importing the module under test
vi.mock("node:fs/promises", () => ({
  default: {
    mkdir: vi.fn().mockResolvedValue(undefined),
    readdir: vi.fn().mockResolvedValue([]),
    readFile: vi.fn().mockResolvedValue(""),
    writeFile: vi.fn().mockResolvedValue(undefined),
    appendFile: vi.fn().mockResolvedValue(undefined),
    stat: vi.fn().mockResolvedValue({ mtimeMs: 0 }),
  },
}))

// Set a deterministic data dir
process.env.TALENTCLAW_DIR = "/tmp/talentclaw-test"

import fs from "node:fs/promises"
import {
  listJobs,
  getJob,
  getProfile,
  getActivityLog,
  getWorkspaceTree,
  readFileByPath,
} from "@/lib/fs-data"

const mockedFs = vi.mocked(fs)

beforeEach(() => {
  vi.clearAllMocks()
})

describe("listJobs", () => {
  it("returns empty array when no md files exist", async () => {
    mockedFs.readdir.mockResolvedValue([] as unknown as Awaited<ReturnType<typeof fs.readdir>>)
    const jobs = await listJobs()
    expect(jobs).toEqual([])
  })

  it("parses valid job files", async () => {
    const jobContent = matter.stringify("Some notes about this role.", {
      title: "Senior Engineer",
      company: "Acme Corp",
      status: "discovered",
      source: "coffeeshop",
    })

    mockedFs.readdir.mockResolvedValue(["acme-senior.md"] as unknown as Awaited<ReturnType<typeof fs.readdir>>)
    mockedFs.readFile.mockResolvedValue(jobContent)

    const jobs = await listJobs()
    expect(jobs).toHaveLength(1)
    expect(jobs[0].slug).toBe("acme-senior")
    expect(jobs[0].frontmatter.title).toBe("Senior Engineer")
    expect(jobs[0].frontmatter.company).toBe("Acme Corp")
    expect(jobs[0].content).toBe("Some notes about this role.")
  })

  it("skips files with invalid frontmatter", async () => {
    const badContent = matter.stringify("", { invalid_field_only: true })

    mockedFs.readdir.mockResolvedValue(["bad.md"] as unknown as Awaited<ReturnType<typeof fs.readdir>>)
    mockedFs.readFile.mockResolvedValue(badContent)

    const jobs = await listJobs()
    expect(jobs).toEqual([])
  })
})

describe("getJob", () => {
  it("returns null for nonexistent job", async () => {
    mockedFs.readFile.mockRejectedValue(new Error("ENOENT"))
    const job = await getJob("nonexistent")
    expect(job).toBeNull()
  })

  it("returns parsed job for valid file", async () => {
    const jobContent = matter.stringify("Details here.", {
      title: "Backend Dev",
      company: "StartupCo",
      status: "saved",
      source: "manual",
    })
    mockedFs.readFile.mockResolvedValue(jobContent)

    const job = await getJob("startupco-backend")
    expect(job).not.toBeNull()
    expect(job!.frontmatter.title).toBe("Backend Dev")
    expect(job!.frontmatter.status).toBe("saved")
  })
})

describe("getProfile", () => {
  it("returns empty profile when file does not exist", async () => {
    mockedFs.readFile.mockRejectedValue(new Error("ENOENT"))
    const profile = await getProfile()
    expect(profile.frontmatter).toEqual({})
    expect(profile.content).toBe("")
  })

  it("parses a valid profile", async () => {
    const profileContent = matter.stringify("My career context.", {
      display_name: "Jane Doe",
      headline: "Senior Engineer",
      skills: ["TypeScript", "React"],
    })
    mockedFs.readFile.mockResolvedValue(profileContent)

    const profile = await getProfile()
    expect(profile.frontmatter.display_name).toBe("Jane Doe")
    expect(profile.frontmatter.skills).toEqual(["TypeScript", "React"])
    expect(profile.content).toBe("My career context.")
  })
})

describe("getActivityLog", () => {
  it("returns empty array when file does not exist", async () => {
    mockedFs.readFile.mockRejectedValue(new Error("ENOENT"))
    const entries = await getActivityLog()
    expect(entries).toEqual([])
  })

  it("parses valid JSONL entries in reverse order", async () => {
    const lines = [
      JSON.stringify({ ts: "2026-01-01T00:00:00Z", type: "search", summary: "first" }),
      JSON.stringify({ ts: "2026-01-02T00:00:00Z", type: "saved", slug: "x", summary: "second" }),
    ].join("\n")
    mockedFs.readFile.mockResolvedValue(lines)

    const entries = await getActivityLog()
    expect(entries).toHaveLength(2)
    expect(entries[0].summary).toBe("second")
    expect(entries[1].summary).toBe("first")
  })

  it("respects limit parameter", async () => {
    const lines = Array.from({ length: 5 }, (_, i) =>
      JSON.stringify({ ts: `2026-01-0${i + 1}T00:00:00Z`, type: "test", summary: `entry-${i}` })
    ).join("\n")
    mockedFs.readFile.mockResolvedValue(lines)

    const entries = await getActivityLog(2)
    expect(entries).toHaveLength(2)
  })
})

describe("getWorkspaceTree", () => {
  it("returns empty tree when data dir is empty", async () => {
    mockedFs.readdir.mockResolvedValue([] as unknown as Awaited<ReturnType<typeof fs.readdir>>)
    const { tree, fileCount } = await getWorkspaceTree()
    expect(tree).toEqual([])
    expect(fileCount).toBe(0)
  })
})

describe("readFileByPath", () => {
  it("rejects path traversal attempts", async () => {
    const result = await readFileByPath("../etc/passwd")
    expect(result).toBeNull()
  })

  it("rejects absolute paths", async () => {
    const result = await readFileByPath("/etc/passwd")
    expect(result).toBeNull()
  })

  it("returns null for missing files", async () => {
    mockedFs.readFile.mockRejectedValue(new Error("ENOENT"))
    const result = await readFileByPath("jobs/nonexistent")
    expect(result).toBeNull()
  })

  it("parses markdown files with frontmatter", async () => {
    const content = matter.stringify("Body text.", { title: "Test" })
    mockedFs.readFile.mockResolvedValue(content)

    const result = await readFileByPath("jobs/test")
    expect(result).not.toBeNull()
    expect(result!.frontmatter.title).toBe("Test")
    expect(result!.content).toBe("Body text.")
  })
})
