import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/lib/agent", () => ({
  getActiveRun: vi.fn(),
  buildSseResponse: vi.fn(),
}))

import { GET } from "@/app/api/agent/stream/route"
import { buildSseResponse, getActiveRun } from "@/lib/agent"

const mockedGetActiveRun = vi.mocked(getActiveRun)
const mockedBuildSseResponse = vi.mocked(buildSseResponse)

describe("app/api/agent/stream GET", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedBuildSseResponse.mockImplementation((sessionId) => Response.json({ ok: true, sessionId }))
  })

  it("requires the sessionId query parameter", async () => {
    const response = await GET(new Request("http://localhost/api/agent/stream"))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ error: "sessionId query parameter is required" })
  })

  it("returns 404 when the session has no active run", async () => {
    mockedGetActiveRun.mockReturnValue(null)

    const response = await GET(new Request("http://localhost/api/agent/stream?sessionId=session-1"))

    expect(mockedGetActiveRun).toHaveBeenCalledWith("session-1")
    expect(response.status).toBe(404)
    await expect(response.json()).resolves.toEqual({ error: "No active or recent run for this session" })
  })

  it("replays events for active sessions", async () => {
    mockedGetActiveRun.mockReturnValue({ status: "running" } as never)

    const response = await GET(new Request("http://localhost/api/agent/stream?sessionId=session-1"))

    expect(mockedBuildSseResponse).toHaveBeenCalledWith("session-1", { replay: true })
    await expect(response.json()).resolves.toEqual({ ok: true, sessionId: "session-1" })
  })
})
