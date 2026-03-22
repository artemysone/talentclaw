import { NextResponse } from "next/server"
import { listConversations, saveConversation } from "@/lib/fs-data"

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
  const body = await req.json()
  const { slug, title, messages } = body
  if (!slug || !title || !Array.isArray(messages)) {
    return NextResponse.json({ error: "Missing slug, title, or messages" }, { status: 400 })
  }
  await saveConversation(slug, title, messages)
  return NextResponse.json({ ok: true })
}
