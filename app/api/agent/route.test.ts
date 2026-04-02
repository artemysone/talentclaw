import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/lib/api-auth", () => ({
  requireLocalMutation: vi.fn(),
}))

vi.mock("@/lib/agent", () => {
  class DuplicateRunError extends Error {}

  return {
    startRun: vi.fn(),
    isAgentConfigured: vi.fn(),
    buildSseResponse: vi.fn(),
    DuplicateRunError,
  }
})

vi.mock("@/lib/agent-security", () => ({
  resolveTrustedResumeSession: vi.fn(),
}))

import { POST } from "@/app/api/agent/route"
import { buildSseResponse, DuplicateRunError, isAgentConfigured, startRun } from "@/lib/agent"
import { requireLocalMutation } from "@/lib/api-auth"
import { resolveTrustedResumeSession } from "@/lib/agent-security"

const mockedStartRun = vi.mocked(startRun)
const mockedIsAgentConfigured = vi.mocked(isAgentConfigured)
const mockedBuildSseResponse = vi.mocked(buildSseResponse)
const mockedRequireLocalMutation = vi.mocked(requireLocalMutation)
const mockedResolveTrustedResumeSession = vi.mocked(resolveTrustedResumeSession)

describe("app/api/agent POST", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedRequireLocalMutation.mockReturnValue(null)
    mockedIsAgentConfigured.mockReturnValue(true)
    mockedResolveTrustedResumeSession.mockImplementation(async (_sessionId, resumeSessionId) =>
      typeof resumeSessionId === "string" ? resumeSessionId : undefined
    )
    mockedBuildSseResponse.mockImplementation((sessionId) =>
      Response.json({ ok: true, sessionId }, { status: 202 })
    )
  })

  it("rejects non-local mutation requests", async () => {
    mockedRequireLocalMutation.mockReturnValueOnce(Response.json({ error: "Forbidden" }, { status: 403 }))

    const response = await POST(new Request("http://localhost/api/agent", { method: "POST" }))

    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toEqual({ error: "Forbidden" })
    expect(mockedStartRun).not.toHaveBeenCalled()
  })

  it("rejects invalid json bodies", async () => {
    const req = new Request("http://localhost/api/agent", {
      method: "POST",
      body: "not-json",
      headers: { "content-type": "application/json" },
    })

    const response = await POST(req)

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ error: "Invalid JSON body" })
  })

  it("rejects empty messages before starting a run", async () => {
    const response = await POST(new Request("http://localhost/api/agent", {
      method: "POST",
      body: JSON.stringify({ message: "   " }),
      headers: { "content-type": "application/json" },
    }))

    expect(response.status).toBe(400)
    expect(mockedStartRun).not.toHaveBeenCalled()
  })

  it("returns 503 when the local agent is unavailable", async () => {
    mockedIsAgentConfigured.mockReturnValue(false)

    const response = await POST(new Request("http://localhost/api/agent", {
      method: "POST",
      body: JSON.stringify({ message: "hello" }),
      headers: { "content-type": "application/json" },
    }))

    expect(response.status).toBe(503)
    await expect(response.json()).resolves.toEqual({
      error: "Agent is not configured",
    })
    expect(mockedStartRun).not.toHaveBeenCalled()
  })

  it("rejects untrusted resume session ids", async () => {
    mockedResolveTrustedResumeSession.mockResolvedValueOnce(undefined)

    const response = await POST(new Request("http://localhost/api/agent", {
      method: "POST",
      body: JSON.stringify({ message: "hello", sessionId: "session-1", resumeSessionId: "remote-99" }),
      headers: { "content-type": "application/json" },
    }))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: "resumeSessionId must come from a local TalentClaw session",
    })
    expect(mockedStartRun).not.toHaveBeenCalled()
  })

  it("maps duplicate runs to 409", async () => {
    mockedStartRun.mockRejectedValueOnce(new DuplicateRunError("Run already active"))

    const response = await POST(new Request("http://localhost/api/agent", {
      method: "POST",
      body: JSON.stringify({ message: "hello", sessionId: "session-1" }),
      headers: { "content-type": "application/json" },
    }))

    expect(response.status).toBe(409)
    await expect(response.json()).resolves.toEqual({ error: "Run already active" })
  })

  it("maps unexpected run failures to 502", async () => {
    mockedStartRun.mockRejectedValueOnce(new Error("upstream failed"))

    const response = await POST(new Request("http://localhost/api/agent", {
      method: "POST",
      body: JSON.stringify({ message: "hello", sessionId: "session-1" }),
      headers: { "content-type": "application/json" },
    }))

    expect(response.status).toBe(502)
    await expect(response.json()).resolves.toEqual({ error: "upstream failed" })
  })

  it("starts the run with trimmed values and returns the stream response", async () => {
    const response = await POST(new Request("http://localhost/api/agent", {
      method: "POST",
      body: JSON.stringify({
        message: "  help me refine this resume  ",
        sessionId: "session-1",
        resumeSessionId: "resume-7",
      }),
      headers: { "content-type": "application/json" },
    }))

    expect(mockedStartRun).toHaveBeenCalledWith("session-1", "help me refine this resume", "resume-7")
    expect(mockedBuildSseResponse).toHaveBeenCalledWith("session-1", {
      replay: true,
      prelude: [{ type: "session", sessionId: "session-1" }],
    })
    expect(response.status).toBe(202)
    await expect(response.json()).resolves.toEqual({ ok: true, sessionId: "session-1" })
  })
})
