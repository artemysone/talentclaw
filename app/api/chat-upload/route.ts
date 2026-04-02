export const runtime = "nodejs"

import fs from "node:fs/promises"
import path from "node:path"
import { requireLocalMutation } from "@/lib/api-auth"
import { getDataDir } from "@/lib/fs-data"

const MAX_SIZE = 10 * 1024 * 1024 // 10 MB
const MAX_FILES = 5

// Allow common document, image, and data types
const ALLOWED_EXTENSIONS = new Set([
  ".pdf", ".docx", ".doc", ".txt", ".md", ".csv", ".json",
  ".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg",
  ".xls", ".xlsx", ".rtf", ".html",
])

export async function POST(request: Request) {
  const forbidden = requireLocalMutation(request)
  if (forbidden) return forbidden

  try {
    const formData = await request.formData()
    const files = formData.getAll("files")

    if (files.length === 0) {
      return Response.json({ error: "No files provided" }, { status: 400 })
    }

    if (files.length > MAX_FILES) {
      return Response.json(
        { error: `Too many files. Maximum is ${MAX_FILES}.` },
        { status: 400 },
      )
    }

    const uploadsDir = path.join(getDataDir(), "uploads")
    await fs.mkdir(uploadsDir, { recursive: true })

    const results: { name: string; path: string; size: number }[] = []

    for (const entry of files) {
      if (!(entry instanceof File)) continue

      const ext = path.extname(entry.name).toLowerCase()
      if (!ALLOWED_EXTENSIONS.has(ext)) {
        return Response.json(
          { error: `Unsupported file type: ${ext}` },
          { status: 400 },
        )
      }

      if (entry.size > MAX_SIZE) {
        return Response.json(
          { error: `File "${entry.name}" is too large. Maximum is 10 MB.` },
          { status: 400 },
        )
      }

      const timestamp = Date.now()
      const safeName = entry.name.replace(/[^a-zA-Z0-9._-]/g, "-").toLowerCase()
      const destName = `${timestamp}-${safeName}`
      const destPath = path.join(uploadsDir, destName)

      const buffer = Buffer.from(await entry.arrayBuffer())
      await fs.writeFile(destPath, buffer)

      results.push({ name: entry.name, path: destPath, size: entry.size })
    }

    return Response.json({ ok: true, files: results })
  } catch {
    return Response.json({ error: "Upload failed" }, { status: 500 })
  }
}
