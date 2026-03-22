export const runtime = "nodejs"

import fs from "node:fs/promises"
import path from "node:path"
import { getDataDir } from "@/lib/fs-data"

const MAX_SIZE = 10 * 1024 * 1024 // 10 MB
const ALLOWED_EXTENSIONS = new Set([".pdf", ".docx", ".doc", ".txt"])

function getExtension(filename: string): string {
  const dot = filename.lastIndexOf(".")
  return dot >= 0 ? filename.slice(dot).toLowerCase() : ""
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file")

    if (!file || !(file instanceof File)) {
      return Response.json({ error: "No file provided" }, { status: 400 })
    }

    const ext = getExtension(file.name)
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

    // Save the file to ~/.talentclaw/resume.<ext>
    // The agent subprocess will read it directly with its built-in file tools
    const dataDir = getDataDir()
    await fs.mkdir(dataDir, { recursive: true })
    const filePath = path.join(dataDir, `resume${ext}`)

    const buffer = Buffer.from(await file.arrayBuffer())
    await fs.writeFile(filePath, buffer)

    return Response.json({ ok: true, path: filePath })
  } catch {
    return Response.json(
      { error: "Upload failed. Please try again." },
      { status: 500 },
    )
  }
}
