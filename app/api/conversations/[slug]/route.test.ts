import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/lib/api-auth", () => ({
  requireLocalMutation: vi.fn(),
}))

vi.mock("@/lib/fs-data", () => ({
  getConversation: vi.fn(),
  deleteConversation: vi.fn(),
}))

import { DELETE, GET } from "@/app/api/conversations/[slug]/route"
import { requireLocalMutation } from "@/lib/api-auth"
import { deleteConversation, getConversation } from "@/lib/fs-data"

const mockedRequireLocalMutation = vi.mocked(requireLocalMutation)
const mockedGetConversation = vi.mocked(getConversation)
const mockedDeleteConversation = vi.mocked(deleteConversation)

describe("app/api/conversations/[slug]", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedRequireLocalMutation.mockReturnValue(null)
  })

  it("returns 404 for missing conversations", async () => {
    mockedGetConversation.mockResolvedValueOnce(null)

    const response = await GET(new Request("http://localhost/api/conversations/session-1"), {
      params: Promise.resolve({ slug: "session-1" }),
    })

    expect(response.status).toBe(404)
    await expect(response.json()).resolves.toEqual({ error: "Not found" })
  })

  it("returns the requested conversation", async () => {
    mockedGetConversation.mockResolvedValueOnce({ slug: "session-1", title: "Chat" } as never)

    const response = await GET(new Request("http://localhost/api/conversations/session-1"), {
      params: Promise.resolve({ slug: "session-1" }),
    })

    expect(mockedGetConversation).toHaveBeenCalledWith("session-1")
    await expect(response.json()).resolves.toEqual({ slug: "session-1", title: "Chat" })
  })

  it("deletes the requested conversation", async () => {
    const response = await DELETE(new Request("http://localhost/api/conversations/session-1"), {
      params: Promise.resolve({ slug: "session-1" }),
    })

    expect(mockedDeleteConversation).toHaveBeenCalledWith("session-1")
    await expect(response.json()).resolves.toEqual({ ok: true })
  })

  it("rejects non-local delete requests", async () => {
    mockedRequireLocalMutation.mockReturnValueOnce(Response.json({ error: "Forbidden" }, { status: 403 }))

    const response = await DELETE(new Request("http://localhost/api/conversations/session-1"), {
      params: Promise.resolve({ slug: "session-1" }),
    })

    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toEqual({ error: "Forbidden" })
    expect(mockedDeleteConversation).not.toHaveBeenCalled()
  })
})
