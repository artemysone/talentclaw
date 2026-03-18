import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import matter from "gray-matter"

export async function createTempDataDir(): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "talentclaw-test-"))
  // Create standard subdirectories
  await fs.mkdir(path.join(dir, "jobs"), { recursive: true })
  await fs.mkdir(path.join(dir, "applications"), { recursive: true })
  await fs.mkdir(path.join(dir, "companies"), { recursive: true })
  await fs.mkdir(path.join(dir, "contacts"), { recursive: true })
  await fs.mkdir(path.join(dir, "messages"), { recursive: true })
  process.env.TALENTCLAW_DIR = dir
  return dir
}

export async function cleanupTempDataDir(dir: string): Promise<void> {
  delete process.env.TALENTCLAW_DIR
  await fs.rm(dir, { recursive: true, force: true })
}

// Helper to write mock data files
export async function writeMockJob(
  dir: string,
  slug: string,
  frontmatter: Record<string, unknown>,
  content = "",
): Promise<void> {
  const filePath = path.join(dir, "jobs", `${slug}.md`)
  await fs.writeFile(filePath, matter.stringify(content, frontmatter), "utf-8")
}

export async function writeMockProfile(
  dir: string,
  frontmatter: Record<string, unknown>,
  content = "",
): Promise<void> {
  const filePath = path.join(dir, "profile.md")
  await fs.writeFile(filePath, matter.stringify(content, frontmatter), "utf-8")
}

export async function writeMockApplication(
  dir: string,
  slug: string,
  frontmatter: Record<string, unknown>,
  content = "",
): Promise<void> {
  const filePath = path.join(dir, "applications", `${slug}.md`)
  await fs.writeFile(filePath, matter.stringify(content, frontmatter), "utf-8")
}

export async function writeMockThread(
  dir: string,
  threadId: string,
  threadFrontmatter: Record<string, unknown>,
  messages: Array<{ frontmatter: Record<string, unknown>; content: string }>,
): Promise<void> {
  const threadDir = path.join(dir, "messages", threadId)
  await fs.mkdir(threadDir, { recursive: true })

  // Write thread.md
  await fs.writeFile(
    path.join(threadDir, "thread.md"),
    matter.stringify("", threadFrontmatter),
    "utf-8",
  )

  // Write numbered message files
  for (let i = 0; i < messages.length; i++) {
    const num = String(i + 1).padStart(3, "0")
    await fs.writeFile(
      path.join(threadDir, `${num}.md`),
      matter.stringify(messages[i].content, messages[i].frontmatter),
      "utf-8",
    )
  }
}
