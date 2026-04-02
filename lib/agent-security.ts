import { getTrustedResumeSessionId } from "@/lib/agent"
import { hasConversationSession } from "@/lib/fs-data"

export async function resolveTrustedResumeSession(
  sessionId: string,
  requestedResumeSessionId: unknown,
): Promise<string | undefined> {
  if (typeof requestedResumeSessionId !== "string" || requestedResumeSessionId.length === 0) {
    return undefined
  }

  const activeResumeSessionId = getTrustedResumeSessionId(sessionId)
  if (activeResumeSessionId === requestedResumeSessionId) {
    return requestedResumeSessionId
  }

  if (await hasConversationSession(requestedResumeSessionId)) {
    return requestedResumeSessionId
  }

  return undefined
}
