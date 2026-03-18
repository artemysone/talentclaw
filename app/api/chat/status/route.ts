export const runtime = "nodejs"

import { isOpenClawConfigured, checkGatewayReachable } from "@/lib/openclaw"

let cachedResult: { available: boolean; connected: boolean } | null = null
let cachedAt = 0
const CACHE_TTL = 5_000

export async function GET() {
  const now = Date.now()

  if (cachedResult && now - cachedAt < CACHE_TTL) {
    return Response.json(cachedResult)
  }

  const available = await isOpenClawConfigured()

  if (!available) {
    const result = { available: false, connected: false }
    cachedResult = result
    cachedAt = now
    return Response.json(result)
  }

  const connected = await checkGatewayReachable()
  const result = { available: true, connected }
  cachedResult = result
  cachedAt = Date.now()

  return Response.json(result)
}
