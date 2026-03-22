export const runtime = "nodejs"

import { getActiveRun, buildSseResponse } from "@/lib/agent"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const sessionId = searchParams.get("sessionId")

  if (!sessionId) {
    return Response.json({ error: "sessionId query parameter is required" }, { status: 400 })
  }

  const runInfo = getActiveRun(sessionId)
  if (!runInfo) {
    return Response.json({ error: "No active or recent run for this session" }, { status: 404 })
  }

  return buildSseResponse(sessionId, { replay: true })
}
