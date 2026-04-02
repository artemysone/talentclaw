import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/lib/api-auth", () => ({
  requireLocalMutation: vi.fn(),
}))

vi.mock("@/lib/fs-data", () => ({
  saveBaseResume: vi.fn(),
}))

import { POST } from "@/app/api/upload/text/route"
import { requireLocalMutation } from "@/lib/api-auth"
import { saveBaseResume } from "@/lib/fs-data"

const mockedRequireLocalMutation = vi.mocked(requireLocalMutation)
const mockedSaveBaseResume = vi.mocked(saveBaseResume)

describe("app/api/upload/text POST", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedRequireLocalMutation.mockReturnValue(null)
  })

  it("rejects non-local mutation requests", async () => {
    mockedRequireLocalMutation.mockReturnValueOnce(Response.json({ error: "Forbidden" }, { status: 403 }))

    const response = await POST(new Request("http://localhost/api/upload/text", { method: "POST" }))

    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toEqual({ error: "Forbidden" })
  })

  it("rejects invalid json bodies", async () => {
    const response = await POST(new Request("http://localhost/api/upload/text", {
      method: "POST",
      body: "nope",
      headers: { "content-type": "application/json" },
    }))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ error: "Invalid JSON body" })
  })

  it("requires non-empty text", async () => {
    const response = await POST(new Request("http://localhost/api/upload/text", {
      method: "POST",
      body: JSON.stringify({ text: "   " }),
      headers: { "content-type": "application/json" },
    }))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ error: "text is required" })
  })

  it("trims and saves resume text", async () => {
    const response = await POST(new Request("http://localhost/api/upload/text", {
      method: "POST",
      body: JSON.stringify({ text: "  resume body  " }),
      headers: { "content-type": "application/json" },
    }))

    expect(mockedSaveBaseResume).toHaveBeenCalledWith("resume body")
    await expect(response.json()).resolves.toEqual({ ok: true })
  })

  it("returns 500 when persistence fails", async () => {
    mockedSaveBaseResume.mockRejectedValueOnce(new Error("disk full"))

    const response = await POST(new Request("http://localhost/api/upload/text", {
      method: "POST",
      body: JSON.stringify({ text: "resume body" }),
      headers: { "content-type": "application/json" },
    }))

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({ error: "Failed to save resume text" })
  })
})
