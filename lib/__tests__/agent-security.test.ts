import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/lib/agent", () => ({
  getTrustedResumeSessionId: vi.fn(),
}))

vi.mock("@/lib/fs-data", () => ({
  hasConversationSession: vi.fn(),
}))

import { getTrustedResumeSessionId } from "@/lib/agent"
import { hasConversationSession } from "@/lib/fs-data"
import { resolveTrustedResumeSession } from "@/lib/agent-security"

const mockedGetTrustedResumeSessionId = vi.mocked(getTrustedResumeSessionId)
const mockedHasConversationSession = vi.mocked(hasConversationSession)

describe("resolveTrustedResumeSession", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedGetTrustedResumeSessionId.mockReturnValue(null)
    mockedHasConversationSession.mockResolvedValue(false)
  })

  it("allows the server-tracked resume session for the current chat session", async () => {
    mockedGetTrustedResumeSessionId.mockReturnValue("sdk-session-1")

    await expect(resolveTrustedResumeSession("chat-session-1", "sdk-session-1")).resolves.toBe("sdk-session-1")
    expect(mockedHasConversationSession).not.toHaveBeenCalled()
  })

  it("allows resume sessions already saved in local conversations", async () => {
    mockedHasConversationSession.mockResolvedValue(true)

    await expect(resolveTrustedResumeSession("chat-session-1", "saved-sdk-session")).resolves.toBe("saved-sdk-session")
  })

  it("rejects arbitrary client-supplied resume sessions", async () => {
    await expect(resolveTrustedResumeSession("chat-session-1", "untrusted-session")).resolves.toBeUndefined()
  })
})
