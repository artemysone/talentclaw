import fs from "node:fs/promises"
import path from "node:path"
import os from "node:os"
import matter from "gray-matter"
import {
  JobFrontmatterSchema,
  ApplicationFrontmatterSchema,
  ProfileFrontmatterSchema,
  ActivityEntrySchema,
} from "./types"
import type {
  JobFile,
  ApplicationFile,
  ProfileFile,
  ActivityEntry,
  TreeNode,
  MessageFile,
} from "./types"

// Thread frontmatter shape (inline, no schema needed — threads are internal)
export interface ThreadFrontmatter {
  subject: string
  participants: string[]
  last_active: string
  unread: boolean
}

export interface ThreadFile {
  slug: string
  frontmatter: ThreadFrontmatter
  messages: MessageFile[]
}

// Base directory
export function getDataDir(): string {
  return process.env.TALENTCLAW_DIR || path.join(os.homedir(), ".talentclaw")
}

// Ensure directory exists
async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true })
}

// Validate slug and resolve a safe path within a subdirectory
function safePath(subdir: string, slug: string): string {
  if (slug.includes("..") || slug.includes("/") || slug.includes("\\")) {
    throw new Error(`Invalid slug: ${slug}`)
  }
  const dir = path.join(getDataDir(), subdir)
  const filePath = path.join(dir, `${slug}.md`)
  const resolved = path.resolve(filePath)
  const safePrefix = path.resolve(dir) + path.sep
  if (!resolved.startsWith(safePrefix)) {
    throw new Error(`Path escapes data directory: ${slug}`)
  }
  return resolved
}

// --- Jobs ---

export async function listJobs(): Promise<JobFile[]> {
  const dir = path.join(getDataDir(), "jobs")
  await ensureDir(dir)
  const files = await fs.readdir(dir)
  const mdFiles = files.filter((f) => f.endsWith(".md"))

  const jobs: JobFile[] = []
  for (const file of mdFiles) {
    const content = await fs.readFile(path.join(dir, file), "utf-8")
    const { data, content: body } = matter(content)
    const parsed = JobFrontmatterSchema.safeParse(data)
    if (parsed.success) {
      jobs.push({
        slug: file.replace(/\.md$/, ""),
        frontmatter: parsed.data,
        content: body.trim(),
      })
    }
  }
  return jobs
}

export async function getJob(slug: string): Promise<JobFile | null> {
  const filePath = safePath("jobs", slug)
  try {
    const content = await fs.readFile(filePath, "utf-8")
    const { data, content: body } = matter(content)
    const parsed = JobFrontmatterSchema.safeParse(data)
    if (!parsed.success) return null
    return { slug, frontmatter: parsed.data, content: body.trim() }
  } catch {
    return null
  }
}

export async function createJob(
  slug: string,
  frontmatter: Record<string, unknown>,
  content: string = "",
): Promise<void> {
  const filePath = safePath("jobs", slug)
  await ensureDir(path.dirname(filePath))
  const validated = JobFrontmatterSchema.parse(frontmatter)
  const fileContent = matter.stringify(content, validated)
  await fs.writeFile(filePath, fileContent, "utf-8")
}

export async function updateJobStatus(
  slug: string,
  status: string,
): Promise<void> {
  const filePath = safePath("jobs", slug)
  const raw = await fs.readFile(filePath, "utf-8")
  const { data, content } = matter(raw)
  data.status = status
  await fs.writeFile(filePath, matter.stringify(content, data), "utf-8")
}

// --- Applications ---

export async function listApplications(): Promise<ApplicationFile[]> {
  const dir = path.join(getDataDir(), "applications")
  await ensureDir(dir)
  const files = await fs.readdir(dir)
  const mdFiles = files.filter((f) => f.endsWith(".md"))

  const apps: ApplicationFile[] = []
  for (const file of mdFiles) {
    const content = await fs.readFile(path.join(dir, file), "utf-8")
    const { data, content: body } = matter(content)
    const parsed = ApplicationFrontmatterSchema.safeParse(data)
    if (parsed.success) {
      apps.push({
        slug: file.replace(/\.md$/, ""),
        frontmatter: parsed.data,
        content: body.trim(),
      })
    }
  }
  return apps
}

// --- Profile ---

export async function getProfile(): Promise<ProfileFile> {
  const filePath = path.join(getDataDir(), "profile.md")
  try {
    const content = await fs.readFile(filePath, "utf-8")
    const { data, content: body } = matter(content)
    const parsed = ProfileFrontmatterSchema.safeParse(data)
    return {
      frontmatter: parsed.success ? parsed.data : {},
      content: body.trim(),
    }
  } catch {
    return { frontmatter: {}, content: "" }
  }
}

// --- Activity Log ---

export async function getActivityLog(
  limit: number = 20,
): Promise<ActivityEntry[]> {
  const filePath = path.join(getDataDir(), "activity.log")
  try {
    const content = await fs.readFile(filePath, "utf-8")
    const lines = content.trim().split("\n").filter(Boolean)
    const entries: ActivityEntry[] = []
    // Read from end (most recent first)
    for (let i = lines.length - 1; i >= 0 && entries.length < limit; i--) {
      try {
        const parsed = ActivityEntrySchema.safeParse(JSON.parse(lines[i]))
        if (parsed.success) entries.push(parsed.data)
      } catch {
        // skip malformed lines
      }
    }
    return entries
  } catch {
    return []
  }
}

export async function appendActivity(
  entry: Omit<ActivityEntry, "ts">,
): Promise<void> {
  const filePath = path.join(getDataDir(), "activity.log")
  const line =
    JSON.stringify({ ts: new Date().toISOString(), ...entry }) + "\n"
  await fs.appendFile(filePath, line, "utf-8")
}

// --- Workspace Tree ---

export async function getWorkspaceTree(): Promise<{ tree: TreeNode[]; fileCount: number }> {
  const dataDir = getDataDir()

  async function buildTree(dir: string, relativeTo: string): Promise<TreeNode[]> {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true })

      // Separate dirs and files, sort alphabetically
      const dirs = entries.filter((e) => e.isDirectory() && !e.name.startsWith("."))
      const files = entries.filter((e) => e.isFile() && !e.name.startsWith("."))
      dirs.sort((a, b) => a.name.localeCompare(b.name))
      files.sort((a, b) => a.name.localeCompare(b.name))

      // Read subdirectories in parallel
      const dirNodes = await Promise.all(
        dirs.map(async (entry) => {
          const fullPath = path.join(dir, entry.name)
          const relPath = path.relative(relativeTo, fullPath)
          const children = await buildTree(fullPath, relativeTo)
          const count = countFiles(children)
          return { name: entry.name, path: relPath, type: "directory" as const, children, count }
        })
      )

      // File nodes
      const fileNodes = files.map((entry) => {
        const fullPath = path.join(dir, entry.name)
        const relPath = path.relative(relativeTo, fullPath)
        return { name: entry.name, path: relPath, type: "file" as const }
      })

      return [...dirNodes, ...fileNodes]
    } catch {
      return []
    }
  }

  const tree = await buildTree(dataDir, dataDir)
  return { tree, fileCount: countFiles(tree) }
}

function countFiles(nodes: TreeNode[]): number {
  let count = 0
  for (const node of nodes) {
    if (node.type === "file") count++
    else if (node.children) count += countFiles(node.children)
  }
  return count
}

// --- Read File By Path ---

export async function readFileByPath(
  relativePath: string
): Promise<{ frontmatter: Record<string, unknown>; content: string } | null> {
  // Security: reject traversal attempts
  if (relativePath.includes("..") || path.isAbsolute(relativePath)) {
    return null
  }

  const dataDir = getDataDir()
  // Append .md if no extension
  let filePath = relativePath
  if (!path.extname(filePath)) {
    filePath = filePath + ".md"
  }

  const fullPath = path.resolve(dataDir, filePath)

  // Security: ensure resolved path stays within data dir
  const safeDirPrefix = path.resolve(dataDir) + path.sep
  if (!fullPath.startsWith(safeDirPrefix) && fullPath !== path.resolve(dataDir)) {
    return null
  }

  try {
    const raw = await fs.readFile(fullPath, "utf-8")

    if (filePath.endsWith(".md")) {
      const { data, content } = matter(raw)
      return { frontmatter: data, content: content.trim() }
    }

    // Non-markdown files: return raw content
    return { frontmatter: {}, content: raw }
  } catch {
    return null
  }
}

// --- Workspace Stats (used by dashboard for mtime info) ---

// --- Coffee Shop Connection ---

export interface CoffeeShopStatus {
  connected: boolean
  agentId?: string
  displayName?: string
}

export async function getCoffeeShopStatus(): Promise<CoffeeShopStatus> {
  const configPath = path.join(os.homedir(), ".coffeeshop", "config.json")
  try {
    const raw = await fs.readFile(configPath, "utf-8")
    const config = JSON.parse(raw)
    return {
      connected: true,
      agentId: config.agent_id || config.agentId,
      displayName: config.display_name || config.displayName,
    }
  } catch {
    return { connected: false }
  }
}

// --- Workspace Stats (used by dashboard for mtime info) ---

export async function getWorkspaceStats(): Promise<{
  fileCount: number
  lastModified: string | null
  dataDir: string
}> {
  const dataDir = getDataDir()
  let fileCount = 0
  let latestMtime = 0

  async function countDir(dir: string): Promise<void> {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true })
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)
        if (entry.isDirectory()) {
          await countDir(fullPath)
        } else if (entry.name.endsWith(".md")) {
          fileCount++
          try {
            const stat = await fs.stat(fullPath)
            if (stat.mtimeMs > latestMtime) {
              latestMtime = stat.mtimeMs
            }
          } catch {
            // skip
          }
        }
      }
    } catch {
      // directory doesn't exist yet
    }
  }

  await countDir(dataDir)

  return {
    fileCount,
    lastModified: latestMtime > 0 ? new Date(latestMtime).toISOString() : null,
    dataDir,
  }
}

// --- Profile CRUD ---

export async function updateProfile(
  updates: Record<string, unknown>,
  content?: string,
): Promise<void> {
  const filePath = path.join(getDataDir(), "profile.md")
  await ensureDir(path.dirname(filePath))

  let existingData: Record<string, unknown> = {}
  let existingContent = ""

  try {
    const raw = await fs.readFile(filePath, "utf-8")
    const parsed = matter(raw)
    existingData = parsed.data
    existingContent = parsed.content
  } catch {
    // File doesn't exist — start from scratch
  }

  const merged = { ...existingData, ...updates }
  const validated = ProfileFrontmatterSchema.parse(merged)
  const body = content !== undefined ? content : existingContent
  await fs.writeFile(filePath, matter.stringify(body, validated), "utf-8")
}

// --- Job Delete ---

export async function deleteJob(slug: string): Promise<void> {
  const filePath = safePath("jobs", slug)
  try {
    await fs.access(filePath)
  } catch {
    throw new Error(`Job not found: ${slug}`)
  }
  await fs.unlink(filePath)
}

// --- Application CRUD ---

export async function createApplication(
  slug: string,
  frontmatter: Record<string, unknown>,
  content: string = "",
): Promise<void> {
  const filePath = safePath("applications", slug)
  await ensureDir(path.dirname(filePath))
  const validated = ApplicationFrontmatterSchema.parse(frontmatter)
  const fileContent = matter.stringify(content, validated)
  await fs.writeFile(filePath, fileContent, "utf-8")
}

export async function updateApplication(
  slug: string,
  updates: Record<string, unknown>,
): Promise<void> {
  const filePath = safePath("applications", slug)
  const raw = await fs.readFile(filePath, "utf-8")
  const { data, content } = matter(raw)
  const merged = { ...data, ...updates }
  const validated = ApplicationFrontmatterSchema.parse(merged)
  await fs.writeFile(filePath, matter.stringify(content, validated), "utf-8")
}

// --- Messages / Threads ---

export async function listThreads(): Promise<
  { slug: string; frontmatter: ThreadFrontmatter }[]
> {
  const dir = path.join(getDataDir(), "messages")
  await ensureDir(dir)

  const entries = await fs.readdir(dir, { withFileTypes: true })
  const threadDirs = entries.filter((e) => e.isDirectory())

  const threads: { slug: string; frontmatter: ThreadFrontmatter }[] = []
  for (const entry of threadDirs) {
    const threadFile = path.join(dir, entry.name, "thread.md")
    try {
      const raw = await fs.readFile(threadFile, "utf-8")
      const { data } = matter(raw)
      threads.push({
        slug: entry.name,
        frontmatter: data as ThreadFrontmatter,
      })
    } catch {
      // skip directories without thread.md
    }
  }

  // Sort by last_active descending (most recent first)
  threads.sort(
    (a, b) =>
      new Date(b.frontmatter.last_active).getTime() -
      new Date(a.frontmatter.last_active).getTime(),
  )

  return threads
}

export async function getThread(slug: string): Promise<ThreadFile | null> {
  const dir = path.join(getDataDir(), "messages", slug)
  const threadFile = path.join(dir, "thread.md")

  let frontmatter: ThreadFrontmatter
  try {
    const raw = await fs.readFile(threadFile, "utf-8")
    const { data } = matter(raw)
    frontmatter = data as ThreadFrontmatter
  } catch {
    return null
  }

  // Read message files (NNN.md)
  const files = await fs.readdir(dir)
  const msgFiles = files.filter((f) => f !== "thread.md" && f.endsWith(".md"))
  msgFiles.sort() // 001.md, 002.md, ...

  const messages: MessageFile[] = []
  for (const file of msgFiles) {
    const raw = await fs.readFile(path.join(dir, file), "utf-8")
    const { data, content } = matter(raw)
    messages.push({
      filename: file,
      frontmatter: data as MessageFile["frontmatter"],
      content: content.trim(),
    })
  }

  // Sort by sent_at
  messages.sort(
    (a, b) =>
      new Date(a.frontmatter.sent_at).getTime() -
      new Date(b.frontmatter.sent_at).getTime(),
  )

  return { slug, frontmatter, messages }
}

export async function getUnreadCount(): Promise<number> {
  const threads = await listThreads()
  return threads.filter((t) => t.frontmatter.unread).length
}

export async function createMessage(
  threadSlug: string,
  messageFrontmatter: Record<string, unknown>,
  content: string = "",
): Promise<string> {
  const dir = path.join(getDataDir(), "messages", threadSlug)
  await ensureDir(dir)

  // Find next message number
  const files = await fs.readdir(dir)
  const msgFiles = files.filter((f) => f !== "thread.md" && f.endsWith(".md"))
  const nextNum = msgFiles.length + 1
  const filename = String(nextNum).padStart(3, "0") + ".md"
  const filePath = path.join(dir, filename)

  const fileContent = matter.stringify(content, messageFrontmatter)
  await fs.writeFile(filePath, fileContent, "utf-8")

  // Update thread.md last_active
  const threadFile = path.join(dir, "thread.md")
  try {
    const raw = await fs.readFile(threadFile, "utf-8")
    const { data, content: threadContent } = matter(raw)
    data.last_active = new Date().toISOString()
    await fs.writeFile(
      threadFile,
      matter.stringify(threadContent, data),
      "utf-8",
    )
  } catch {
    // thread.md doesn't exist — skip update
  }

  return filename
}

export async function markThreadRead(threadSlug: string): Promise<void> {
  const threadFile = path.join(
    getDataDir(),
    "messages",
    threadSlug,
    "thread.md",
  )
  const raw = await fs.readFile(threadFile, "utf-8")
  const { data, content } = matter(raw)
  data.unread = false
  await fs.writeFile(threadFile, matter.stringify(content, data), "utf-8")
}

