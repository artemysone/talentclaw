import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/lib/agent/config", () => ({
  isAgentConfigured: vi.fn(),
}))

import { GET } from "@/app/api/agent/status/route"
import { isAgentConfigured } from "@/lib/agent/config"

const mockedIsAgentConfigured = vi.mocked(isAgentConfigured)

describe("app/api/agent/status GET", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("reports availability consistently", async () => {
    mockedIsAgentConfigured.mockReturnValue(true)

    const response = await GET()

    await expect(response.json()).resolves.toEqual({ available: true, connected: true })
  })

  it("reports unavailable agents consistently", async () => {
    mockedIsAgentConfigured.mockReturnValue(false)

    const response = await GET()

    await expect(response.json()).resolves.toEqual({ available: false, connected: false })
  })
})
