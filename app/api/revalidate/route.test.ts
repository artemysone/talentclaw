import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

vi.mock("@/lib/api-auth", () => ({
  requireLocalMutation: vi.fn(),
}))

import { POST } from "@/app/api/revalidate/route"
import { revalidatePath } from "next/cache"
import { requireLocalMutation } from "@/lib/api-auth"

const mockedRevalidatePath = vi.mocked(revalidatePath)
const mockedRequireLocalMutation = vi.mocked(requireLocalMutation)

describe("app/api/revalidate POST", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedRequireLocalMutation.mockReturnValue(null)
  })

  it("rejects non-local mutation requests", async () => {
    mockedRequireLocalMutation.mockReturnValueOnce(Response.json({ error: "Forbidden" }, { status: 403 }))

    const response = await POST(new Request("http://localhost/api/revalidate", { method: "POST" }))

    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toEqual({ error: "Forbidden" })
    expect(mockedRevalidatePath).not.toHaveBeenCalled()
  })

  it("revalidates dashboard routes for local requests", async () => {
    const response = await POST(new Request("http://localhost/api/revalidate", { method: "POST" }))

    expect(mockedRevalidatePath).toHaveBeenNthCalledWith(1, "/dashboard")
    expect(mockedRevalidatePath).toHaveBeenNthCalledWith(2, "/pipeline")
    expect(mockedRevalidatePath).toHaveBeenNthCalledWith(3, "/profile")
    expect(mockedRevalidatePath).toHaveBeenNthCalledWith(4, "/file", "layout")
    await expect(response.json()).resolves.toEqual({ ok: true })
  })
})
