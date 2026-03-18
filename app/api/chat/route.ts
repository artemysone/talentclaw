export const runtime = "nodejs"

import crypto from "node:crypto"
import { startRun, isOpenClawConfigured, checkGatewayReachable, DuplicateRunError, buildSseResponse } from "@/lib/openclaw"

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

  // Check gateway availability before attempting the run
  const configured = await isOpenClawConfigured()
  if (!configured) {
    return Response.json({ error: "OpenClaw is not configured" }, { status: 503 })
  }

  const reachable = await checkGatewayReachable()
  if (!reachable) {
    return Response.json({ error: "OpenClaw gateway is not reachable" }, { status: 503 })
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
    prelude: [{ type: "session", sessionId }],
  })
}
