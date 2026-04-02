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
  saveBaseResume: vi.fn(),
}))

vi.mock("@/lib/document", () => ({
  extractText: vi.fn(),
}))

import fs from "node:fs/promises"
import { POST } from "@/app/api/upload/route"
import { requireLocalMutation } from "@/lib/api-auth"
import { extractText } from "@/lib/document"
import { getDataDir, saveBaseResume } from "@/lib/fs-data"

const mockedFs = vi.mocked(fs)
const mockedRequireLocalMutation = vi.mocked(requireLocalMutation)
const mockedExtractText = vi.mocked(extractText)
const mockedGetDataDir = vi.mocked(getDataDir)
const mockedSaveBaseResume = vi.mocked(saveBaseResume)

describe("app/api/upload POST", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-04-02T12:34:56.789Z"))
    mockedRequireLocalMutation.mockReturnValue(null)
    mockedGetDataDir.mockReturnValue("/tmp/talentclaw")
    mockedExtractText.mockResolvedValue({ text: "parsed resume" } as never)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("rejects requests without a file", async () => {
    const formData = new FormData()

    const response = await POST(new Request("http://localhost/api/upload", {
      method: "POST",
      body: formData,
    }))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ error: "No file provided" })
  })

  it("rejects non-local mutation requests", async () => {
    mockedRequireLocalMutation.mockReturnValueOnce(Response.json({ error: "Forbidden" }, { status: 403 }))

    const response = await POST(new Request("http://localhost/api/upload", { method: "POST" }))

    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toEqual({ error: "Forbidden" })
    expect(mockedFs.writeFile).not.toHaveBeenCalled()
  })

  it("rejects unsupported file extensions", async () => {
    const formData = new FormData()
    formData.set("file", new File(["body"], "resume.exe", { type: "application/octet-stream" }))

    const response = await POST(new Request("http://localhost/api/upload", {
      method: "POST",
      body: formData,
    }))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: "Unsupported file type. Please upload a PDF, DOCX, or TXT file.",
    })
  })

  it("rejects oversized files", async () => {
    const formData = new FormData()
    formData.set("file", new File([new Uint8Array(10 * 1024 * 1024 + 1)], "resume.pdf", {
      type: "application/pdf",
    }))

    const response = await POST(new Request("http://localhost/api/upload", {
      method: "POST",
      body: formData,
    }))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ error: "File too large. Maximum size is 10 MB." })
  })

  it("stores the original file and extracted text", async () => {
    const formData = new FormData()
    formData.set("file", new File(["pdf-bytes"], "My Resume.PDF", { type: "application/pdf" }))

    const response = await POST(new Request("http://localhost/api/upload", {
      method: "POST",
      body: formData,
    }))

    expect(mockedFs.mkdir).toHaveBeenCalledWith("/tmp/talentclaw/resumes/originals", { recursive: true })
    expect(mockedFs.writeFile).toHaveBeenCalledWith(
      "/tmp/talentclaw/resumes/originals/2026-04-02T12-34-56_my-resume.pdf",
      expect.anything(),
    )
    expect(mockedExtractText).toHaveBeenCalledWith(
      "/tmp/talentclaw/resumes/originals/2026-04-02T12-34-56_my-resume.pdf",
    )
    expect(mockedSaveBaseResume).toHaveBeenCalledWith("parsed resume")
    await expect(response.json()).resolves.toEqual({
      ok: true,
      path: "/tmp/talentclaw/resumes/originals/2026-04-02T12-34-56_my-resume.pdf",
      extractedText: "parsed resume",
    })
  })

  it("returns 500 when upload processing fails", async () => {
    mockedFs.writeFile.mockRejectedValueOnce(new Error("disk full"))
    const formData = new FormData()
    formData.set("file", new File(["pdf-bytes"], "resume.pdf", { type: "application/pdf" }))

    const response = await POST(new Request("http://localhost/api/upload", {
      method: "POST",
      body: formData,
    }))

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({ error: "Upload failed. Please try again." })
  })
})
