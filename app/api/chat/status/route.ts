export const runtime = "nodejs"

import { isAgentConfigured } from "@/lib/agent"

export async function GET() {
  const available = isAgentConfigured()
  return Response.json({ available, connected: available })
}
