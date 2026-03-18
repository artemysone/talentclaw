import fs from "node:fs/promises"
import path from "node:path"
import os from "node:os"
import matter from "gray-matter"

/**
 * Create a temporary data directory for tests.
 * Sets TALENTCLAW_DIR so fs-data functions use it.
 * Returns the path to the temp directory.
 */
export async function createTempDataDir(): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "talentclaw-test-"))
  process.env.TALENTCLAW_DIR = dir
  return dir
}

/**
 * Remove the temp data directory and unset the env var.
 */
export async function cleanupTempDataDir(dir: string): Promise<void> {
  await fs.rm(dir, { recursive: true, force: true })
  delete process.env.TALENTCLAW_DIR
}

/**
 * Write a mock job file into the temp data directory.
 */
export async function writeMockJob(
  dataDir: string,
  slug: string,
  frontmatter: Record<string, unknown>,
  content: string = "",
): Promise<void> {
  const dir = path.join(dataDir, "jobs")
  await fs.mkdir(dir, { recursive: true })
  const fileContent = matter.stringify(content, frontmatter)
  await fs.writeFile(path.join(dir, `${slug}.md`), fileContent, "utf-8")
}

/**
 * Write a mock profile file into the temp data directory.
 */
export async function writeMockProfile(
  dataDir: string,
  frontmatter: Record<string, unknown>,
  content: string = "",
): Promise<void> {
  const fileContent = matter.stringify(content, frontmatter)
  await fs.writeFile(path.join(dataDir, "profile.md"), fileContent, "utf-8")
}

/**
 * Write a mock message thread into the temp data directory.
 * Creates messages/slug/thread.md and messages/slug/NNN.md files.
 */
export async function writeMockThread(
  dataDir: string,
  slug: string,
  threadFrontmatter: Record<string, unknown>,
  messages: { frontmatter: Record<string, unknown>; content: string }[] = [],
): Promise<void> {
  const dir = path.join(dataDir, "messages", slug)
  await fs.mkdir(dir, { recursive: true })

  const threadContent = matter.stringify("", threadFrontmatter)
  await fs.writeFile(path.join(dir, "thread.md"), threadContent, "utf-8")

  for (let i = 0; i < messages.length; i++) {
    const filename = String(i + 1).padStart(3, "0") + ".md"
    const msgContent = matter.stringify(
      messages[i].content,
      messages[i].frontmatter,
    )
    await fs.writeFile(path.join(dir, filename), msgContent, "utf-8")
  }
}

/**
 * Write a mock application file into the temp data directory.
 */
export async function writeMockApplication(
  dataDir: string,
  slug: string,
  frontmatter: Record<string, unknown>,
  content: string = "",
): Promise<void> {
  const dir = path.join(dataDir, "applications")
  await fs.mkdir(dir, { recursive: true })
  const fileContent = matter.stringify(content, frontmatter)
  await fs.writeFile(path.join(dir, `${slug}.md`), fileContent, "utf-8")
}
