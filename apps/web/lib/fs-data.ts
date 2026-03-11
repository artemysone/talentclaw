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
