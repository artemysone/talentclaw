export const runtime = "nodejs"

import crypto from "node:crypto"
import { startRun, isAgentConfigured, DuplicateRunError, buildSseResponse } from "@/lib/agent"
import { requireLocalMutation } from "@/lib/api-auth"
import { resolveTrustedResumeSession } from "@/lib/agent-security"

export async function POST(req: Request) {
  const forbidden = requireLocalMutation(req)
  if (forbidden) return forbidden

  let body: { message?: unknown; sessionId?: unknown; resumeSessionId?: unknown }
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const { message, sessionId: rawSessionId, resumeSessionId } = body

  if (typeof message !== "string" || message.trim().length === 0) {
    return Response.json({ error: "message is required and must be a non-empty string" }, { status: 400 })
  }

  const sessionId = typeof rawSessionId === "string" && rawSessionId.length > 0
    ? rawSessionId
    : crypto.randomUUID()

  // Check agent availability before attempting the run
  if (!isAgentConfigured()) {
    return Response.json({ error: "Agent is not configured" }, { status: 503 })
  }

  // Start the agent run
  try {
    const resume = await resolveTrustedResumeSession(sessionId, resumeSessionId)
    if (typeof resumeSessionId === "string" && resumeSessionId.length > 0 && !resume) {
      return Response.json({ error: "resumeSessionId must come from a local TalentClaw session" }, { status: 400 })
    }
    await startRun(sessionId, message.trim(), resume)
  } catch (err) {
    if (err instanceof DuplicateRunError) {
      return Response.json({ error: err.message }, { status: 409 })
    }
    const msg = err instanceof Error ? err.message : String(err)
    return Response.json({ error: msg }, { status: 502 })
  }

  return buildSseResponse(sessionId, {
    replay: true,
    prelude: [{ type: "session", sessionId }],
  })
}
