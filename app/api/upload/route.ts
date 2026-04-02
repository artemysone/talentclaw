export const runtime = "nodejs"

import fs from "node:fs/promises"
import path from "node:path"
import { requireLocalMutation } from "@/lib/api-auth"
import { getDataDir, saveBaseResume } from "@/lib/fs-data"

const MAX_SIZE = 10 * 1024 * 1024 // 10 MB
const ALLOWED_EXTENSIONS = new Set([".pdf", ".docx", ".doc", ".txt"])

export async function POST(request: Request) {
  const forbidden = requireLocalMutation(request)
  if (forbidden) return forbidden

  try {
    const formData = await request.formData()
    const file = formData.get("file")

    if (!file || !(file instanceof File)) {
      return Response.json({ error: "No file provided" }, { status: 400 })
    }

    const ext = path.extname(file.name).toLowerCase()
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return Response.json(
        { error: "Unsupported file type. Please upload a PDF, DOCX, or TXT file." },
        { status: 400 },
      )
    }

    if (file.size > MAX_SIZE) {
      return Response.json(
        { error: "File too large. Maximum size is 10 MB." },
        { status: 400 },
      )
    }

    const dataDir = getDataDir()
    const originalsDir = path.join(dataDir, "resumes", "originals")
    await fs.mkdir(originalsDir, { recursive: true })

    // Save original file to originals/ with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)
    const originalName = file.name.replace(/\s+/g, "-").toLowerCase()
    const versionedName = `${timestamp}_${originalName}`
    const filePath = path.join(originalsDir, versionedName)

    const buffer = Buffer.from(await file.arrayBuffer())
    await fs.writeFile(filePath, buffer)

    // Extract text from the uploaded file
    const { extractText } = await import("@/lib/document")
    const extraction = await extractText(filePath)

    // Write base.md — the immutable canonical markdown
    if (extraction.text) {
      await saveBaseResume(extraction.text)
    }

    return Response.json({
      ok: true,
      path: filePath,
      extractedText: extraction.text || null,
    })
  } catch {
    return Response.json(
      { error: "Upload failed. Please try again." },
      { status: 500 },
    )
  }
}
