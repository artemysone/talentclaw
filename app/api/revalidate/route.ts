import { revalidatePath } from "next/cache"
import { NextResponse } from "next/server"

export async function POST() {
  revalidatePath("/dashboard")
  revalidatePath("/pipeline")
  revalidatePath("/profile")
  revalidatePath("/file", "layout")
  return NextResponse.json({ ok: true })
}
