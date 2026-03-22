import { NextResponse } from "next/server"
import { getConversation, deleteConversation } from "@/lib/fs-data"

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const convo = await getConversation(slug)
  if (!convo) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(convo)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  await deleteConversation(slug)
  return NextResponse.json({ ok: true })
}
