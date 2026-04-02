import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/lib/api-auth", () => ({
  requireLocalMutation: vi.fn(),
}))

vi.mock("node:fs/promises", () => ({
  default: {
    mkdir: vi.fn(),
    writeFile: vi.fn(),
  },
}))

vi.mock("@/lib/fs-data", () => ({
  getDataDir: vi.fn(),
}))

import fs from "node:fs/promises"
import { POST } from "@/app/api/chat-upload/route"
import { requireLocalMutation } from "@/lib/api-auth"
import { getDataDir } from "@/lib/fs-data"

const mockedFs = vi.mocked(fs)
const mockedRequireLocalMutation = vi.mocked(requireLocalMutation)
const mockedGetDataDir = vi.mocked(getDataDir)

describe("app/api/chat-upload POST", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-04-02T12:34:56.789Z"))
    mockedRequireLocalMutation.mockReturnValue(null)
    mockedGetDataDir.mockReturnValue("/tmp/talentclaw")
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("requires at least one file", async () => {
    const response = await POST(new Request("http://localhost/api/chat-upload", {
      method: "POST",
      body: new FormData(),
    }))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ error: "No files provided" })
  })

  it("rejects non-local mutation requests", async () => {
    mockedRequireLocalMutation.mockReturnValueOnce(Response.json({ error: "Forbidden" }, { status: 403 }))

    const response = await POST(new Request("http://localhost/api/chat-upload", { method: "POST" }))

    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toEqual({ error: "Forbidden" })
    expect(mockedFs.writeFile).not.toHaveBeenCalled()
  })

  it("rejects requests above the file count limit", async () => {
    const formData = new FormData()
    for (let i = 0; i < 6; i++) {
      formData.append("files", new File([`file-${i}`], `resume-${i}.txt`, { type: "text/plain" }))
    }

    const response = await POST(new Request("http://localhost/api/chat-upload", {
      method: "POST",
      body: formData,
    }))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ error: "Too many files. Maximum is 5." })
  })

  it("rejects unsupported file types", async () => {
    const formData = new FormData()
    formData.append("files", new File(["body"], "payload.exe", { type: "application/octet-stream" }))

    const response = await POST(new Request("http://localhost/api/chat-upload", {
      method: "POST",
      body: formData,
    }))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ error: "Unsupported file type: .exe" })
  })

  it("rejects oversized files", async () => {
    const formData = new FormData()
    formData.append("files", new File([new Uint8Array(10 * 1024 * 1024 + 1)], "notes.txt", { type: "text/plain" }))

    const response = await POST(new Request("http://localhost/api/chat-upload", {
      method: "POST",
      body: formData,
    }))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ error: 'File "notes.txt" is too large. Maximum is 10 MB.' })
  })

  it("stores files with sanitized deterministic names", async () => {
    const formData = new FormData()
    formData.append("files", new File(["body"], "Project Plan (Final).md", { type: "text/markdown" }))

    const response = await POST(new Request("http://localhost/api/chat-upload", {
      method: "POST",
      body: formData,
    }))

    expect(mockedFs.mkdir).toHaveBeenCalledWith("/tmp/talentclaw/uploads", { recursive: true })
    expect(mockedFs.writeFile).toHaveBeenCalledWith(
      "/tmp/talentclaw/uploads/1775133296789-project-plan--final-.md",
      expect.any(Buffer),
    )
    await expect(response.json()).resolves.toEqual({
      ok: true,
      files: [{
        name: "Project Plan (Final).md",
        path: "/tmp/talentclaw/uploads/1775133296789-project-plan--final-.md",
        size: 4,
      }],
    })
  })
})
