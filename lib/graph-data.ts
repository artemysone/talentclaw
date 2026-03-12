import fs from "node:fs/promises"
import path from "node:path"
import matter from "gray-matter"
import type { GraphNode, GraphEdge } from "@/components/graph/graph-types"
import { CompanyFrontmatterSchema, ContactFrontmatterSchema } from "./types"
import type { CompanyFrontmatter, ContactFrontmatter, ProfileFrontmatter } from "./types"
import { getProfile, listJobs, getDataDir } from "./fs-data"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Normalize a string into a stable, URL-safe identifier fragment. */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

/** Prefixed node ID. */
function nodeId(
  type: "skill" | "company" | "role" | "project" | "goal" | "edu" | "industry" | "person" | "contact",
  name: string,
): string {
  return `${type}-${normalize(name)}`
}

/** Base visual size per node type. */
const BASE_SIZE: Record<string, number> = {
  company: 8,
  role: 8,
  skill: 6,
  project: 7,
  education: 8,
  goal: 8,
  industry: 7,
  contact: 7,
  person: 20,
}

// ---------------------------------------------------------------------------
// Company file reader (no listCompanies in fs-data, so we read directly)
// ---------------------------------------------------------------------------

interface CompanyEntry {
  slug: string
  frontmatter: CompanyFrontmatter
}

async function readCompanies(): Promise<CompanyEntry[]> {
  const dir = path.join(getDataDir(), "companies")
  try {
    const files = await fs.readdir(dir)
    const mdFiles = files.filter((f) => f.endsWith(".md"))
    const results: CompanyEntry[] = []
    for (const file of mdFiles) {
      const raw = await fs.readFile(path.join(dir, file), "utf-8")
      const { data } = matter(raw)
      const parsed = CompanyFrontmatterSchema.safeParse(data)
      if (parsed.success) {
        results.push({
          slug: file.replace(/\.md$/, ""),
          frontmatter: parsed.data,
        })
      }
    }
    return results
  } catch {
    return []
  }
}

// ---------------------------------------------------------------------------
// Contact file reader
// ---------------------------------------------------------------------------

interface ContactEntry {
  slug: string
  frontmatter: ContactFrontmatter
}

async function readContacts(): Promise<ContactEntry[]> {
  const dir = path.join(getDataDir(), "contacts")
  try {
    const files = await fs.readdir(dir)
    const mdFiles = files.filter((f) => f.endsWith(".md"))
    const results: ContactEntry[] = []
    for (const file of mdFiles) {
      const raw = await fs.readFile(path.join(dir, file), "utf-8")
      const { data } = matter(raw)
      const parsed = ContactFrontmatterSchema.safeParse(data)
      if (parsed.success) {
        results.push({
          slug: file.replace(/\.md$/, ""),
          frontmatter: parsed.data,
        })
      }
    }
    return results
  } catch {
    return []
  }
}

// ---------------------------------------------------------------------------
// Builder
// ---------------------------------------------------------------------------

export async function buildCareerGraph(): Promise<{
  nodes: GraphNode[]
  edges: GraphEdge[]
}> {
  // ---- Load data ----------------------------------------------------------
  const [profile, jobs, companies, contacts] = await Promise.all([
    getProfile(),
    listJobs(),
    readCompanies(),
    readContacts(),
  ])

  const fm: ProfileFrontmatter = profile.frontmatter

  // ---- Accumulators -------------------------------------------------------
  const nodeMap = new Map<string, GraphNode>()
  const edgeSet = new Set<string>()
  const edges: GraphEdge[] = []

  // Track how many edges touch each node so we can adjust sizing later.
  const connectionCount = new Map<string, number>()

  function incConnections(id: string): void {
    connectionCount.set(id, (connectionCount.get(id) ?? 0) + 1)
  }

  // ---- Node helpers -------------------------------------------------------

  function ensureNode(
    id: string,
    label: string,
    type: GraphNode["type"],
    cluster: GraphNode["cluster"],
    detail?: string,
  ): void {
    if (!nodeMap.has(id)) {
      nodeMap.set(id, { id, label, type, cluster, detail, size: 0 })
    }
  }

  function addEdge(source: string, target: string): void {
    const key = [source, target].sort().join("--")
    if (edgeSet.has(key)) return
    // Only add if both endpoints exist
    if (!nodeMap.has(source) || !nodeMap.has(target)) return
    edgeSet.add(key)
    edges.push({ source, target })
    incConnections(source)
    incConnections(target)
  }

  // ---- Center node --------------------------------------------------------

  const personLabel = fm.display_name || "You"
  const personId = nodeId("person", personLabel)
  ensureNode(personId, personLabel, "person", "center", fm.headline || "Career Hub")

  // ---- Profile skills -----------------------------------------------------

  for (const skill of fm.skills ?? []) {
    const id = nodeId("skill", skill)
    ensureNode(id, skill, "skill", "skills")
    addEdge(personId, id)
  }

  // ---- Preferred roles (aspirational — trajectory cluster) ----------------

  for (const role of fm.preferred_roles ?? []) {
    const roleId = nodeId("goal", `target-${role}`)
    ensureNode(roleId, role, "goal", "trajectory", "Target role")
    addEdge(personId, roleId)
  }

  // ---- Experience ---------------------------------------------------------

  for (const exp of fm.experience ?? []) {
    const compId = nodeId("company", exp.company)
    const endLabel = exp.end || "present"
    ensureNode(compId, exp.company, "company", "companies", `${exp.start} - ${endLabel}`)

    const roleId = nodeId("role", `${exp.title}-at-${exp.company}`)
    ensureNode(roleId, exp.title, "role", "titles", `${exp.title} at ${exp.company}`)

    addEdge(personId, compId)
    addEdge(personId, roleId)
    addEdge(compId, roleId)

    // Experience skills
    for (const skill of exp.skills ?? []) {
      const skillId = nodeId("skill", skill)
      ensureNode(skillId, skill, "skill", "skills")
      addEdge(roleId, skillId)
    }

    // Experience projects — match against profile project nodes
    for (const projName of exp.projects ?? []) {
      const projId = nodeId("project", projName)
      // Ensure project node exists (may already exist from profile.projects)
      ensureNode(projId, projName, "project", "projects")
      addEdge(compId, projId)
      addEdge(roleId, projId)
    }

    // Industry
    if (exp.industry) {
      const indId = nodeId("industry", exp.industry)
      ensureNode(indId, exp.industry, "industry", "trajectory", "Industry")
      addEdge(compId, indId)
    }
  }

  // ---- Education ----------------------------------------------------------

  for (const edu of fm.education ?? []) {
    const eduId = nodeId("edu", edu.institution)
    ensureNode(eduId, edu.institution, "education", "companies", edu.degree)

    addEdge(personId, eduId)

    for (const skill of edu.skills ?? []) {
      const skillId = nodeId("skill", skill)
      ensureNode(skillId, skill, "skill", "skills")
      addEdge(eduId, skillId)
    }
  }

  // ---- Projects -----------------------------------------------------------

  for (const proj of fm.projects ?? []) {
    const projId = nodeId("project", proj.name)
    ensureNode(projId, proj.name, "project", "projects", proj.description)

    addEdge(personId, projId)

    for (const skill of proj.skills ?? []) {
      const skillId = nodeId("skill", skill)
      ensureNode(skillId, skill, "skill", "skills")
      addEdge(projId, skillId)
    }
  }

  // ---- Goals --------------------------------------------------------------

  for (const goal of fm.goals ?? []) {
    const goalId = nodeId("goal", goal.title)
    ensureNode(goalId, goal.title, "goal", "trajectory", goal.description)
    addEdge(personId, goalId)
  }

  // ---- Contacts -----------------------------------------------------------

  for (const contact of contacts) {
    const cf = contact.frontmatter
    const contactId = nodeId("contact", cf.name)
    const detail = cf.title && cf.company
      ? `${cf.title} at ${cf.company}`
      : cf.title || cf.company || ""
    ensureNode(contactId, cf.name, "contact", "network", detail)
    addEdge(personId, contactId)

    // Bridge to company node if it exists in the graph
    if (cf.company) {
      const compId = nodeId("company", cf.company)
      if (nodeMap.has(compId)) {
        addEdge(contactId, compId)
      }
    }
  }

  // ---- Jobs ---------------------------------------------------------------
  // Jobs don't become nodes themselves, but their companies and tags merge
  // into the graph.

  for (const job of jobs) {
    const companyName = job.frontmatter.company
    const compId = nodeId("company", companyName)

    if (!nodeMap.has(compId)) {
      ensureNode(compId, companyName, "company", "companies", companyName)
      addEdge(personId, compId)
    }

    for (const tag of job.frontmatter.tags ?? []) {
      const skillId = nodeId("skill", tag)
      ensureNode(skillId, tag, "skill", "skills")
      addEdge(personId, skillId)
      addEdge(compId, skillId) // company → skill bridge
    }
  }

  // ---- Companies directory ------------------------------------------------

  for (const comp of companies) {
    const compId = nodeId("company", comp.frontmatter.name)
    if (!nodeMap.has(compId)) {
      ensureNode(compId, comp.frontmatter.name, "company", "companies", comp.frontmatter.name)
    }

    if (comp.frontmatter.industry) {
      const indId = nodeId("industry", comp.frontmatter.industry)
      ensureNode(indId, comp.frontmatter.industry, "industry", "trajectory", "Industry")
      addEdge(compId, indId)
    }
  }

  // ---- Compute final sizes ------------------------------------------------

  for (const node of nodeMap.values()) {
    if (node.type === "person") {
      node.size = BASE_SIZE.person
    } else {
      const base = BASE_SIZE[node.type] ?? 6
      const conns = connectionCount.get(node.id) ?? 0
      node.size = Math.min(14, Math.max(5, base + conns * 0.5))
    }
  }

  return {
    nodes: Array.from(nodeMap.values()),
    edges,
  }
}
