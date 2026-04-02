import { revalidatePath } from "next/cache"
import { NextResponse } from "next/server"
import { requireLocalMutation } from "@/lib/api-auth"

export async function POST(request: Request) {
  const forbidden = requireLocalMutation(request)
  if (forbidden) return forbidden

  revalidatePath("/dashboard")
  revalidatePath("/pipeline")
  revalidatePath("/profile")
  revalidatePath("/file", "layout")
  return NextResponse.json({ ok: true })
}
