// Server-side document text extraction.
// Converts .docx, .pdf, and .txt files to plain text or markdown
// so the agent doesn't need to read binary formats.

import fs from "node:fs/promises"
import path from "node:path"

export type ExtractionResult = {
  text: string
  format: "markdown" | "text"
}

/**
 * Extract readable text from a document file.
 * - .docx → markdown via mammoth
 * - .txt  → raw text
 * - .pdf  → returns empty (agent's Read tool handles PDFs natively)
 */
export async function extractText(filePath: string): Promise<ExtractionResult> {
  const ext = path.extname(filePath).toLowerCase()

  switch (ext) {
    case ".docx":
    case ".doc":
      return extractDocx(filePath)
    case ".txt":
      return { text: await fs.readFile(filePath, "utf-8"), format: "text" }
    case ".pdf":
      // Agent's built-in Read tool handles PDFs natively.
      // Return empty so the caller can fall back to file path prompt.
      return { text: "", format: "text" }
    default:
      return { text: "", format: "text" }
  }
}

async function extractDocx(filePath: string): Promise<ExtractionResult> {
  // Dynamic import — mammoth is only needed for docx
  const mammoth = await import("mammoth")
  const buffer = await fs.readFile(filePath)

  // Extract as markdown-flavored HTML, then convert to clean markdown
  const result = await mammoth.convertToHtml({ buffer })
  const markdown = htmlToMarkdown(result.value)

  return { text: markdown, format: "markdown" }
}

/**
 * Lightweight HTML → markdown conversion for mammoth's clean HTML output.
 * Mammoth produces simple, well-structured HTML so we don't need a full converter.
 */
function htmlToMarkdown(html: string): string {
  let md = html

  // Headings
  md = md.replace(/<h1[^>]*>(.*?)<\/h1>/gi, "# $1\n\n")
  md = md.replace(/<h2[^>]*>(.*?)<\/h2>/gi, "## $1\n\n")
  md = md.replace(/<h3[^>]*>(.*?)<\/h3>/gi, "### $1\n\n")
  md = md.replace(/<h4[^>]*>(.*?)<\/h4>/gi, "#### $1\n\n")

  // Bold and italic
  md = md.replace(/<strong>(.*?)<\/strong>/gi, "**$1**")
  md = md.replace(/<b>(.*?)<\/b>/gi, "**$1**")
  md = md.replace(/<em>(.*?)<\/em>/gi, "*$1*")
  md = md.replace(/<i>(.*?)<\/i>/gi, "*$1*")

  // Links
  md = md.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, "[$2]($1)")

  // List items (before removing the list wrapper)
  md = md.replace(/<li[^>]*>(.*?)<\/li>/gi, "- $1\n")
  md = md.replace(/<\/?[uo]l[^>]*>/gi, "\n")

  // Paragraphs and line breaks
  md = md.replace(/<br\s*\/?>/gi, "\n")
  md = md.replace(/<p[^>]*>(.*?)<\/p>/gi, "$1\n\n")

  // Strip remaining HTML tags
  md = md.replace(/<[^>]+>/g, "")

  // Decode HTML entities
  md = md.replace(/&amp;/g, "&")
  md = md.replace(/&lt;/g, "<")
  md = md.replace(/&gt;/g, ">")
  md = md.replace(/&quot;/g, '"')
  md = md.replace(/&#39;/g, "'")
  md = md.replace(/&nbsp;/g, " ")

  // Clean up excessive whitespace
  md = md.replace(/\n{3,}/g, "\n\n")
  md = md.trim()

  return md
}
