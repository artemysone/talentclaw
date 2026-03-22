export const runtime = "nodejs"

import crypto from "node:crypto"
import { startRun, isAgentConfigured, DuplicateRunError, buildSseResponse } from "@/lib/agent"

export async function POST(req: Request) {
  let body: { message?: unknown; sessionId?: unknown }
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const { message, sessionId: rawSessionId } = body

  if (typeof message !== "string" || message.trim().length === 0) {
    return Response.json({ error: "message is required and must be a non-empty string" }, { status: 400 })
  }

  const sessionId = typeof rawSessionId === "string" && rawSessionId.length > 0
    ? rawSessionId
    : crypto.randomUUID()

  // Check agent availability before attempting the run
  if (!isAgentConfigured()) {
    return Response.json({ error: "Agent is not configured (ANTHROPIC_API_KEY missing)" }, { status: 503 })
  }

  // Start the agent run
  try {
    await startRun(sessionId, message.trim())
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
