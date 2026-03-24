export const runtime = "nodejs"

import fs from "node:fs/promises"
import path from "node:path"
import { getDataDir } from "@/lib/fs-data"

const MAX_SIZE = 10 * 1024 * 1024 // 10 MB
const ALLOWED_EXTENSIONS = new Set([".pdf", ".docx", ".doc", ".txt"])

export async function POST(request: Request) {
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
    const resumesDir = path.join(dataDir, "resumes")
    await fs.mkdir(resumesDir, { recursive: true })

    // Save original file with timestamp for version tracking
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)
    const originalName = file.name.replace(/\s+/g, "-").toLowerCase()
    const versionedName = `${timestamp}_${originalName}`
    const filePath = path.join(resumesDir, versionedName)

    const buffer = Buffer.from(await file.arrayBuffer())
    await fs.writeFile(filePath, buffer)

    // Copy to "current" and extract text in parallel (both depend only on filePath)
    const currentPath = path.join(resumesDir, `current${ext}`)
    const { extractText } = await import("@/lib/document")
    const [extraction] = await Promise.all([
      extractText(filePath),
      fs.copyFile(filePath, currentPath),
    ])

    // Save extracted markdown and generate PDF
    if (extraction.text) {
      const mdPath = path.join(resumesDir, "current.md")
      await fs.writeFile(mdPath, extraction.text)

      // Generate PDF from markdown for ATS submission
      if (ext !== ".pdf") {
        try {
          const { markdownToPdf } = await import("@/lib/pdf-gen")
          const pdfBuffer = await markdownToPdf(extraction.text)
          await fs.writeFile(path.join(resumesDir, "current.pdf"), pdfBuffer)
        } catch (e) {
          console.error("PDF generation failed:", e)
        }
      }
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
