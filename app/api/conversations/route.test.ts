import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/lib/api-auth", () => ({
  requireLocalMutation: vi.fn(),
}))

vi.mock("@/lib/fs-data", () => ({
  listConversations: vi.fn(),
  saveConversation: vi.fn(),
}))

import { GET, POST } from "@/app/api/conversations/route"
import { requireLocalMutation } from "@/lib/api-auth"
import { listConversations, saveConversation } from "@/lib/fs-data"

const mockedRequireLocalMutation = vi.mocked(requireLocalMutation)
const mockedListConversations = vi.mocked(listConversations)
const mockedSaveConversation = vi.mocked(saveConversation)

describe("app/api/conversations", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedRequireLocalMutation.mockReturnValue(null)
  })

  it("returns saved conversations", async () => {
    mockedListConversations.mockResolvedValueOnce([{ slug: "session-1", title: "First" }] as never)

    const response = await GET()

    await expect(response.json()).resolves.toEqual([{ slug: "session-1", title: "First" }])
  })

  it("falls back to an empty list on read errors", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined)
    mockedListConversations.mockRejectedValueOnce(new Error("disk unavailable"))

    const response = await GET()

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual([])
    errorSpy.mockRestore()
  })

  it("validates required fields before saving", async () => {
    const response = await POST(new Request("http://localhost/api/conversations", {
      method: "POST",
      body: JSON.stringify({ slug: "session-1", title: "Chat" }),
      headers: { "content-type": "application/json" },
    }))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ error: "Missing slug, title, or messages" })
    expect(mockedSaveConversation).not.toHaveBeenCalled()
  })

  it("rejects invalid json bodies", async () => {
    const response = await POST(new Request("http://localhost/api/conversations", {
      method: "POST",
      body: "not-json",
      headers: { "content-type": "application/json" },
    }))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ error: "Invalid JSON body" })
    expect(mockedSaveConversation).not.toHaveBeenCalled()
  })

  it("rejects non-local mutation requests", async () => {
    mockedRequireLocalMutation.mockReturnValueOnce(Response.json({ error: "Forbidden" }, { status: 403 }))

    const response = await POST(new Request("http://localhost/api/conversations", { method: "POST" }))

    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toEqual({ error: "Forbidden" })
    expect(mockedSaveConversation).not.toHaveBeenCalled()
  })

  it("persists valid conversations", async () => {
    const response = await POST(new Request("http://localhost/api/conversations", {
      method: "POST",
      body: JSON.stringify({
        slug: "session-1",
        title: "Chat",
        messages: [{ role: "user", content: "hello" }],
        sessionId: "abc123",
      }),
      headers: { "content-type": "application/json" },
    }))

    expect(mockedSaveConversation).toHaveBeenCalledWith(
      "session-1",
      "Chat",
      [{ role: "user", content: "hello" }],
      "abc123",
    )
    await expect(response.json()).resolves.toEqual({ ok: true })
  })
})
