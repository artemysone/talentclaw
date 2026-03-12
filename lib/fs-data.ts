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
} from "./types"

// Base directory
export function getDataDir(): string {
  return process.env.TALENTCLAW_DIR || path.join(os.homedir(), ".talentclaw")
}

// Ensure directory exists
async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true })
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
  const filePath = path.join(getDataDir(), "jobs", `${slug}.md`)
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
  const dir = path.join(getDataDir(), "jobs")
  await ensureDir(dir)
  const filePath = path.join(dir, `${slug}.md`)
  const fileContent = matter.stringify(content, frontmatter)
  await fs.writeFile(filePath, fileContent, "utf-8")
}

export async function updateJobStatus(
  slug: string,
  status: string,
): Promise<void> {
  const filePath = path.join(getDataDir(), "jobs", `${slug}.md`)
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
  if (!fullPath.startsWith(path.resolve(dataDir))) {
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

