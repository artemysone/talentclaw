import { NextResponse } from "next/server"
import { listConversations, saveConversation } from "@/lib/fs-data"
import { requireLocalMutation } from "@/lib/api-auth"

export async function GET() {
  try {
    const conversations = await listConversations()
    return NextResponse.json(conversations)
  } catch (err) {
    console.error("Failed to list conversations:", err)
    return NextResponse.json([], { status: 200 })
  }
}

export async function POST(req: Request) {
  const forbidden = requireLocalMutation(req)
  if (forbidden) return forbidden

  let body: { slug?: unknown; title?: unknown; messages?: unknown; sessionId?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const { slug, title, messages, sessionId } = body
  if (typeof slug !== "string" || typeof title !== "string" || !Array.isArray(messages)) {
    return NextResponse.json({ error: "Missing slug, title, or messages" }, { status: 400 })
  }
  await saveConversation(slug, title, messages, sessionId as string | undefined)
  return NextResponse.json({ ok: true })
}
