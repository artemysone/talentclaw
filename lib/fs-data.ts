import fs from "node:fs/promises"
import path from "node:path"
import os from "node:os"
import matter from "gray-matter"
import crypto from "node:crypto"
import {
  JobFrontmatterSchema,
  ApplicationFrontmatterSchema,
  ProfileFrontmatterSchema,
  ActivityEntrySchema,
  ThreadFrontmatterSchema,
  MessageFrontmatterSchema,
  ContactFrontmatterSchema,
  CompanyFrontmatterSchema,
  ResumeVariantFrontmatterSchema,
} from "./types"
/**
 * Coerce YAML Date objects to ISO strings in parsed frontmatter.
 * gray-matter auto-parses unquoted dates (e.g. 2026-03-23) into Date objects,
 * which breaks Zod z.string() validators.
 */
function coerceDates(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    if (value instanceof Date) {
      result[key] = value.toISOString()
    } else if (Array.isArray(value)) {
      result[key] = value.map((item) =>
        item && typeof item === "object" && !(item instanceof Date)
          ? coerceDates(item as Record<string, unknown>)
          : item instanceof Date
            ? item.toISOString()
            : item
      )
    } else if (value && typeof value === "object") {
      result[key] = coerceDates(value as Record<string, unknown>)
    } else {
      result[key] = value
    }
  }
  return result
}

import type {
  JobFile,
  ApplicationFile,
  ProfileFile,
  ActivityEntry,
  ThreadFile,
  ThreadFrontmatter,
  MessageFrontmatter,
  MessageFile,
  ProfileFrontmatter,
  ContactFile,
  CompanyFile,
  ConversationFile,
  ConversationFrontmatter,
  ResumeVariantFile,
} from "./types"

// Per-file async mutex to prevent concurrent read-modify-write corruption
const fileLocks = new Map<string, Promise<void>>()

async function withFileLock<T>(filePath: string, fn: () => Promise<T>): Promise<T> {
  const prev = fileLocks.get(filePath) || Promise.resolve()
  let resolve: () => void
  const next = new Promise<void>(r => { resolve = r })
  fileLocks.set(filePath, next)
  await prev
  try {
    return await fn()
  } finally {
    resolve!()
    if (fileLocks.get(filePath) === next) {
      fileLocks.delete(filePath)
    }
  }
}

// Base directory
export function getDataDir(): string {
  return process.env.TALENTCLAW_DIR || path.join(os.homedir(), ".talentclaw")
}

// Ensure directory exists
async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true })
}

function assertSafeSlug(slug: string, label: string = "slug"): void {
  if (!slug || slug.includes("..") || slug.includes("/") || slug.includes("\\")) {
    throw new Error(`Invalid ${label}: ${slug}`)
  }
}

// Validate slug and resolve a safe path within a subdirectory
function safePath(subdir: string, slug: string, label: string = "slug"): string {
  assertSafeSlug(slug, label)
  const dir = path.join(getDataDir(), subdir)
  const filePath = path.join(dir, `${slug}.md`)
  const resolved = path.resolve(filePath)
  const safePrefix = path.resolve(dir) + path.sep
  if (!resolved.startsWith(safePrefix)) {
    throw new Error(`Path escapes data directory: ${slug}`)
  }
  return resolved
}

// --- Graph Dirty Flag ---

let _graphDirty = false

export function markGraphDirty(): void {
  _graphDirty = true
}

export function isGraphDirty(): boolean {
  return _graphDirty
}

export function clearGraphDirty(): void {
  _graphDirty = false
}

// --- Generic Entity Helpers ---

interface ListEntitiesResult<T> {
  items: { slug: string; frontmatter: T; content: string }[]
  warnings: string[]
}

async function listEntities<T>(
  subdir: string,
  schema: { safeParse: (data: unknown) => { success: true; data: T } | { success: false; error: { message: string } } },
): Promise<ListEntitiesResult<T>> {
  const dir = path.join(getDataDir(), subdir)
  await ensureDir(dir)
  const files = await fs.readdir(dir)
  const mdFiles = files.filter((f) => f.endsWith(".md"))

  const items: { slug: string; frontmatter: T; content: string }[] = []
  const warnings: string[] = []

  const results = await Promise.all(
    mdFiles.map(async (file) => {
      try {
        const content = await fs.readFile(path.join(dir, file), "utf-8")
        const { data, content: body } = matter(content)
        return { file, data, body, error: null }
      } catch (err) {
        return { file, data: null, body: null, error: err }
      }
    })
  )

  for (const { file, data, body, error } of results) {
    if (error || !data) {
      warnings.push(`${subdir}/${file}: read error`)
      continue
    }
    const parsed = schema.safeParse(coerceDates(data))
    if (parsed.success) {
      items.push({
        slug: file.replace(/\.md$/, ""),
        frontmatter: parsed.data,
        content: (body ?? "").trim(),
      })
    } else {
      warnings.push(`${subdir}/${file}: ${parsed.error.message}`)
    }
  }
  return { items, warnings }
}

// Exported for graph module to reuse
export { listEntities }

// --- Generic single-entity helpers ---

async function getEntity<T>(
  subdir: string,
  schema: { safeParse: (data: unknown) => { success: true; data: T } | { success: false } },
  slug: string,
): Promise<{ slug: string; frontmatter: T; content: string } | null> {
  const filePath = safePath(subdir, slug)
  try {
    const content = await fs.readFile(filePath, "utf-8")
    const { data, content: body } = matter(content)
    const parsed = schema.safeParse(coerceDates(data))
    if (!parsed.success) return null
    return { slug, frontmatter: parsed.data, content: body.trim() }
  } catch {
    return null
  }
}

async function createEntity<T>(
  subdir: string,
  schema: { parse: (data: unknown) => T },
  slug: string,
  frontmatter: Record<string, unknown>,
  content: string = "",
): Promise<void> {
  const filePath = safePath(subdir, slug)
  await ensureDir(path.dirname(filePath))
  const validated = schema.parse(frontmatter)
  const fileContent = matter.stringify(content, validated as Record<string, unknown>)
  await fs.writeFile(filePath, fileContent, "utf-8")

  markGraphDirty()
}

async function updateEntity<T>(
  subdir: string,
  schema: { parse: (data: unknown) => T },
  slug: string,
  data: Partial<Record<string, unknown>>,
): Promise<void> {
  const filePath = safePath(subdir, slug)
  await withFileLock(filePath, async () => {
    const raw = await fs.readFile(filePath, "utf-8")
    const { data: existing, content } = matter(raw)
    const merged = { ...existing, ...data }
    const validated = schema.parse(merged)
    await fs.writeFile(filePath, matter.stringify(content, validated as Record<string, unknown>), "utf-8")
  })

  markGraphDirty()
}

async function deleteEntity(
  subdir: string,
  entityName: string,
  slug: string,
): Promise<void> {
  const filePath = safePath(subdir, slug)
  try {
    await fs.unlink(filePath)
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && err.code === "ENOENT") {
      throw new Error(`${entityName} not found: ${slug}`)
    }
    throw err
  }

  markGraphDirty()
}

// --- Jobs ---

export async function listJobs(): Promise<JobFile[]> {
  const { items } = await listEntities("jobs", JobFrontmatterSchema)
  return items
}

export async function getJob(slug: string): Promise<JobFile | null> {
  return getEntity("jobs", JobFrontmatterSchema, slug)
}

export async function createJob(
  slug: string,
  frontmatter: Record<string, unknown>,
  content: string = "",
): Promise<void> {
  return createEntity("jobs", JobFrontmatterSchema, slug, frontmatter, content)
}

export async function updateJobStatus(
  slug: string,
  status: string,
): Promise<void> {
  const filePath = safePath("jobs", slug)
  await withFileLock(filePath, async () => {
    const raw = await fs.readFile(filePath, "utf-8")
    const { data, content } = matter(raw)
    data.status = status
    await fs.writeFile(filePath, matter.stringify(content, data), "utf-8")
  })

  markGraphDirty()
}

// --- Applications ---

export async function listApplications(): Promise<ApplicationFile[]> {
  const { items } = await listEntities("applications", ApplicationFrontmatterSchema)
  return items
}

export async function getApplication(slug: string): Promise<ApplicationFile | null> {
  return getEntity("applications", ApplicationFrontmatterSchema, slug)
}

// --- Profile ---

export async function getProfile(): Promise<ProfileFile> {
  const filePath = path.join(getDataDir(), "profile.md")
  try {
    const content = await fs.readFile(filePath, "utf-8")
    const { data, content: body } = matter(content)
    const parsed = ProfileFrontmatterSchema.safeParse(coerceDates(data))
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

// --- Profile Update ---

export async function updateProfile(
  data: Partial<ProfileFrontmatter>,
): Promise<void> {
  const filePath = path.join(getDataDir(), "profile.md")
  await withFileLock(filePath, async () => {
    let existingFrontmatter: Record<string, unknown> = {}
    let existingContent = ""

    try {
      const raw = await fs.readFile(filePath, "utf-8")
      const parsed = matter(raw)
      existingFrontmatter = parsed.data
      existingContent = parsed.content
    } catch {
      // profile.md doesn't exist yet — start fresh
      await ensureDir(path.dirname(filePath))
    }

    const merged = { ...existingFrontmatter, ...data, updated_at: new Date().toISOString() }
    const validated = ProfileFrontmatterSchema.parse(merged)
    await fs.writeFile(filePath, matter.stringify(existingContent, validated), "utf-8")
  })

  markGraphDirty()
}

// --- Delete Job ---

export async function deleteJob(slug: string): Promise<void> {
  return deleteEntity("jobs", "Job", slug)
}

// --- Applications CRUD ---

export async function createApplication(
  slug: string,
  frontmatter: Record<string, unknown>,
  content: string = "",
): Promise<void> {
  return createEntity("applications", ApplicationFrontmatterSchema, slug, frontmatter, content)
}

export async function updateApplication(
  slug: string,
  data: Partial<Record<string, unknown>>,
): Promise<void> {
  return updateEntity("applications", ApplicationFrontmatterSchema, slug, data)
}

// --- Threads / Messages ---

export async function listThreads(): Promise<ThreadFile[]> {
  const messagesDir = path.join(getDataDir(), "messages")
  await ensureDir(messagesDir)
  const entries = await fs.readdir(messagesDir, { withFileTypes: true })
  const threads: ThreadFile[] = []

  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    const threadDir = path.join(messagesDir, entry.name)
    const threadFilePath = path.join(threadDir, "thread.md")
    try {
      const raw = await fs.readFile(threadFilePath, "utf-8")
      const { data } = matter(raw)
      const parsed = ThreadFrontmatterSchema.safeParse(coerceDates(data))
      if (parsed.success) {
        threads.push({
          slug: entry.name,
          frontmatter: parsed.data,
          messages: [], // list view omits full message bodies
        })
      }
    } catch {
      // skip threads without a valid thread.md
    }
  }

  return threads
}

export async function getThread(threadId: string): Promise<ThreadFile | null> {
  assertSafeSlug(threadId, "thread ID")
  const threadDir = path.join(getDataDir(), "messages", threadId)
  const threadFilePath = path.join(threadDir, "thread.md")

  try {
    const raw = await fs.readFile(threadFilePath, "utf-8")
    const { data } = matter(raw)
    const parsed = ThreadFrontmatterSchema.safeParse(data)
    if (!parsed.success) return null

    // Read all message files (numbered *.md, excluding thread.md)
    const files = await fs.readdir(threadDir)
    const messageFiles = files
      .filter((f) => f.endsWith(".md") && f !== "thread.md")
      .sort()

    const messages: MessageFile[] = []
    for (const file of messageFiles) {
      const msgRaw = await fs.readFile(path.join(threadDir, file), "utf-8")
      const { data: msgData, content: msgContent } = matter(msgRaw)
      const msgParsed = MessageFrontmatterSchema.safeParse(coerceDates(msgData))
      if (msgParsed.success) {
        messages.push({
          filename: file,
          frontmatter: msgParsed.data,
          content: msgContent.trim(),
        })
      }
    }

    // Sort by sent_at
    messages.sort(
      (a, b) =>
        new Date(a.frontmatter.sent_at).getTime() -
        new Date(b.frontmatter.sent_at).getTime(),
    )

    return {
      slug: threadId,
      frontmatter: parsed.data,
      messages,
    }
  } catch {
    return null
  }
}

export async function getUnreadCount(): Promise<number> {
  const threads = await listThreads()
  return threads.filter((t) => t.frontmatter.unread).length
}

export async function createMessage(
  threadId: string,
  frontmatter: MessageFrontmatter,
  content: string,
): Promise<void> {
  if (threadId.includes("..") || threadId.includes("/") || threadId.includes("\\")) {
    throw new Error(`Invalid thread ID: ${threadId}`)
  }
  const threadDir = path.join(getDataDir(), "messages", threadId)
  await ensureDir(threadDir)

  // Determine next message number
  const files = await fs.readdir(threadDir)
  const numbered = files
    .filter((f) => /^\d+\.md$/.test(f))
    .map((f) => parseInt(f.replace(".md", ""), 10))
    .sort((a, b) => a - b)

  const nextNum = numbered.length > 0 ? numbered[numbered.length - 1] + 1 : 1
  const fileName = String(nextNum).padStart(3, "0") + ".md"
  const filePath = path.join(threadDir, fileName)

  const validated = MessageFrontmatterSchema.parse(frontmatter)
  await fs.writeFile(filePath, matter.stringify(content, validated), "utf-8")

  // Update thread.md last_active
  const threadFilePath = path.join(threadDir, "thread.md")
  await withFileLock(threadFilePath, async () => {
    try {
      const raw = await fs.readFile(threadFilePath, "utf-8")
      const { data, content: threadContent } = matter(raw)
      data.last_active = new Date().toISOString()
      await fs.writeFile(
        threadFilePath,
        matter.stringify(threadContent, data),
        "utf-8",
      )
    } catch {
      // thread.md doesn't exist yet — skip update
    }
  })

  markGraphDirty()
}

// --- Contacts CRUD ---

export async function listContacts(): Promise<ContactFile[]> {
  const { items } = await listEntities("contacts", ContactFrontmatterSchema)
  return items
}

export const getContact = (slug: string) => getEntity("contacts", ContactFrontmatterSchema, slug)
export const createContact = (slug: string, fm: Record<string, unknown>, content = "") =>
  createEntity("contacts", ContactFrontmatterSchema, slug, fm, content)
export const updateContact = (slug: string, data: Partial<Record<string, unknown>>) =>
  updateEntity("contacts", ContactFrontmatterSchema, slug, data)
export const deleteContact = (slug: string) => deleteEntity("contacts", "Contact", slug)

// --- Companies CRUD ---

export async function listCompanies(): Promise<CompanyFile[]> {
  const { items } = await listEntities("companies", CompanyFrontmatterSchema)
  return items
}

export const getCompany = (slug: string) => getEntity("companies", CompanyFrontmatterSchema, slug)
export const createCompany = (slug: string, fm: Record<string, unknown>, content = "") =>
  createEntity("companies", CompanyFrontmatterSchema, slug, fm, content)
export const updateCompany = (slug: string, data: Partial<Record<string, unknown>>) =>
  updateEntity("companies", CompanyFrontmatterSchema, slug, data)
export const deleteCompany = (slug: string) => deleteEntity("companies", "Company", slug)

// --- Conversations ---

export async function listConversations(): Promise<Omit<ConversationFile, "messages">[]> {
  const dir = path.join(getDataDir(), "conversations")
  await ensureDir(dir)
  const files = await fs.readdir(dir)
  const mdFiles = files.filter((f) => f.endsWith(".md"))

  const results = await Promise.all(
    mdFiles.map(async (file) => {
      try {
        const raw = await fs.readFile(path.join(dir, file), "utf-8")
        const { data } = matter(raw)
        return {
          slug: file.replace(/\.md$/, ""),
          frontmatter: data as ConversationFrontmatter,
        }
      } catch {
        return null
      }
    })
  )

  const convos = results.filter((r): r is NonNullable<typeof r> => r !== null)
  convos.sort((a, b) => b.frontmatter.updated_at.localeCompare(a.frontmatter.updated_at))
  return convos
}

export async function getConversation(slug: string): Promise<ConversationFile | null> {
  const filePath = safePath("conversations", slug, "conversation slug")
  try {
    const raw = await fs.readFile(filePath, "utf-8")
    const { data, content } = matter(raw)
    const messages = content.trim() ? JSON.parse(content) : []
    return {
      slug,
      frontmatter: data as ConversationFrontmatter,
      messages,
    }
  } catch {
    return null
  }
}

// Cache created_at timestamps to avoid re-reading files on every save
const createdAtCache = new Map<string, string>()

export async function saveConversation(
  slug: string,
  title: string,
  messages: ConversationFile["messages"],
  sessionId?: string,
): Promise<void> {
  const dir = path.join(getDataDir(), "conversations")
  await ensureDir(dir)
  const filePath = safePath("conversations", slug, "conversation slug")

  const now = new Date().toISOString()
  const created_at = createdAtCache.get(slug) ?? now
  if (!createdAtCache.has(slug)) createdAtCache.set(slug, created_at)

  const fm: ConversationFrontmatter = {
    title,
    created_at,
    updated_at: now,
    message_count: messages.length,
    ...(sessionId && { session_id: sessionId }),
  }

  const content = matter.stringify(JSON.stringify(messages, null, 2), fm)
  await withFileLock(filePath, () => fs.writeFile(filePath, content, "utf-8"))
}

export async function deleteConversation(slug: string): Promise<void> {
  const filePath = safePath("conversations", slug, "conversation slug")
  await fs.unlink(filePath).catch(() => {})
}

export async function hasConversationSession(sessionId: string): Promise<boolean> {
  const dir = path.join(getDataDir(), "conversations")

  try {
    const files = await fs.readdir(dir)
    const mdFiles = files.filter((file) => file.endsWith(".md"))

    for (const file of mdFiles) {
      try {
        const raw = await fs.readFile(path.join(dir, file), "utf-8")
        const { data } = matter(raw)
        if ((data as ConversationFrontmatter).session_id === sessionId) {
          return true
        }
      } catch {
        // Ignore malformed conversation files while checking trusted sessions.
      }
    }
  } catch {
    return false
  }

  return false
}

// --- Resumes ---

const VARIANTS_SUBDIR = "resumes/variants"

export function computeContentHash(content: string): string {
  return crypto.createHash("sha256").update(content).digest("hex")
}

/** Falls back to legacy current.md during migration. */
export async function getBaseResume(): Promise<{ content: string; hash: string } | null> {
  const resumesDir = path.join(getDataDir(), "resumes")
  for (const name of ["base.md", "current.md"]) {
    try {
      const content = await fs.readFile(path.join(resumesDir, name), "utf-8")
      return { content, hash: computeContentHash(content) }
    } catch { /* try next */ }
  }
  return null
}

export async function saveBaseResume(content: string): Promise<string> {
  const resumesDir = path.join(getDataDir(), "resumes")
  await ensureDir(resumesDir)
  await fs.writeFile(path.join(resumesDir, "base.md"), content)
  return computeContentHash(content)
}

export async function listVariants(): Promise<ResumeVariantFile[]> {
  const { items } = await listEntities(VARIANTS_SUBDIR, ResumeVariantFrontmatterSchema)
  return items
}

export async function getVariant(slug: string): Promise<ResumeVariantFile | null> {
  return getEntity(VARIANTS_SUBDIR, ResumeVariantFrontmatterSchema, slug)
}

export async function createVariant(
  slug: string,
  opts: { job?: string; label?: string } = {},
): Promise<string> {
  const base = await getBaseResume()
  if (!base) throw new Error("No base resume found. Upload a resume first.")

  await createEntity(
    VARIANTS_SUBDIR,
    ResumeVariantFrontmatterSchema,
    slug,
    {
      parent: "base.md",
      base_hash: base.hash,
      status: "draft" as const,
      created: new Date().toISOString().slice(0, 10),
      job: opts.job,
      label: opts.label,
    },
    base.content,
  )
  return slug
}

export async function updateVariant(
  slug: string,
  data: Partial<Record<string, unknown>>,
): Promise<void> {
  await updateEntity(VARIANTS_SUBDIR, ResumeVariantFrontmatterSchema, slug, data)
}

export async function isVariantStale(
  slug: string,
  baseHash?: string,
): Promise<boolean> {
  const [variant, hash] = await Promise.all([
    getVariant(slug),
    baseHash != null
      ? Promise.resolve(baseHash)
      : getBaseResume().then(b => b?.hash),
  ])
  if (!variant || !hash) return false
  return variant.frontmatter.base_hash !== hash
}

export async function exportVariantPdf(slug: string): Promise<string> {
  const variant = await getVariant(slug)
  if (!variant) throw new Error(`Variant not found: ${slug}`)

  const { markdownToPdf } = await import("@/lib/pdf-gen")
  const resumesDir = path.join(getDataDir(), "resumes")
  const pdfBuffer = await markdownToPdf(variant.content, { baseDir: resumesDir })

  const exportsDir = path.join(getDataDir(), "resumes", "exports")
  await ensureDir(exportsDir)
  const pdfPath = path.join(exportsDir, `${slug}.pdf`)
  await fs.writeFile(pdfPath, pdfBuffer)
  return pdfPath
}

// --- Onboarding Check ---

export async function hasCompletedOnboarding(): Promise<boolean> {
  const profile = await getProfile()

  // Check 1: Profile fields set
  if (profile.frontmatter.display_name || profile.frontmatter.headline) return true

  // Check 2: Resume uploaded (new base.md or legacy current.*)
  const resumesDir = path.join(getDataDir(), "resumes")
  try {
    const files = await fs.readdir(resumesDir)
    if (files.includes("base.md") || files.some(f => f.startsWith("current."))) return true
  } catch { /* dir doesn't exist */ }

  // Check 3: Has conversation history (user has interacted with agent)
  const conversationsDir = path.join(getDataDir(), "conversations")
  try {
    const files = await fs.readdir(conversationsDir)
    if (files.length > 0) return true
  } catch { /* dir doesn't exist */ }

  return false
}
