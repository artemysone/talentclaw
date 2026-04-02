import { saveBaseResume } from "@/lib/fs-data"
import { requireLocalMutation } from "@/lib/api-auth"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const forbidden = requireLocalMutation(request)
  if (forbidden) return forbidden

  let body: { text?: unknown }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const { text } = body
  if (typeof text !== "string" || text.trim().length === 0) {
    return Response.json({ error: "text is required" }, { status: 400 })
  }

  try {
    await saveBaseResume(text.trim())
    return Response.json({ ok: true })
  } catch {
    return Response.json({ error: "Failed to save resume text" }, { status: 500 })
  }
}
