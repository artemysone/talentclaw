import type { ProfileFrontmatter } from "./types"

// Node/edge types for the career context graph

export type CareerNodeType = "profile" | "skill" | "company" | "title" | "project" | "education"

export interface CareerNode {
  slug: string
  type: CareerNodeType
  label: string
}

export interface CareerEdge {
  from: string
  to: string
  rel: string
}

export interface CareerGraphData {
  nodes: CareerNode[]
  edges: CareerEdge[]
}

/**
 * Build a career context graph from profile frontmatter.
 * Extracts: skills, experience (company + title separately), projects, education.
 */
export function buildCareerGraph(profile: ProfileFrontmatter): CareerGraphData {
  const nodes: CareerNode[] = []
  const edges: CareerEdge[] = []
  const slugSet = new Set<string>()
  const edgeSet = new Set<string>()

  function addNode(slug: string, type: CareerNodeType, label: string) {
    if (slugSet.has(slug)) return
    slugSet.add(slug)
    nodes.push({ slug, type, label })
  }

  function addEdge(from: string, to: string, rel: string) {
    if (!slugSet.has(from) || !slugSet.has(to)) return
    const key = `${from}:${to}:${rel}`
    if (edgeSet.has(key)) return
    edgeSet.add(key)
    edges.push({ from, to, rel })
  }

  function toSlug(prefix: string, name: string): string {
    return `${prefix}-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "")}`
  }

  // Profile node
  const profileLabel = profile.display_name || "You"
  addNode("profile", "profile", profileLabel)

  // Skills
  const skills = profile.skills ?? []
  for (const skill of skills) {
    const slug = toSlug("skill", skill)
    addNode(slug, "skill", skill)
    addEdge("profile", slug, "has_skill")
  }

  // Experience → company + title as separate nodes
  const experience = profile.experience ?? []
  for (const exp of experience) {
    const companySlug = toSlug("company", exp.company)
    const titleSlug = toSlug("title", `${exp.title}-${exp.company}`)

    addNode(companySlug, "company", exp.company)
    addNode(titleSlug, "title", exp.title)

    addEdge("profile", companySlug, "worked_at")
    addEdge("profile", titleSlug, "held_title")
    addEdge(companySlug, titleSlug, "role_at")

    // Experience → skills used (connect to profile, company, and title)
    for (const skill of exp.skills ?? []) {
      const skillSlug = toSlug("skill", skill)
      addNode(skillSlug, "skill", skill)
      addEdge("profile", skillSlug, "has_skill")
      addEdge(companySlug, skillSlug, "used_skill")
      addEdge(titleSlug, skillSlug, "used_skill")
    }

    // Experience → projects built during role
    for (const proj of exp.projects ?? []) {
      const projSlug = toSlug("project", proj)
      addEdge(titleSlug, projSlug, "produced")
    }
  }

  // Projects
  const projects = profile.projects ?? []
  for (const proj of projects) {
    const slug = toSlug("project", proj.name)
    addNode(slug, "project", proj.name)
    addEdge("profile", slug, "built")

    // Project → skills (also connect to profile)
    for (const skill of proj.skills ?? []) {
      const skillSlug = toSlug("skill", skill)
      addNode(skillSlug, "skill", skill)
      addEdge("profile", skillSlug, "has_skill")
      addEdge(slug, skillSlug, "uses_skill")
    }
  }

  // Education
  const education = profile.education ?? []
  for (const edu of education) {
    const slug = toSlug("edu", `${edu.institution}-${edu.degree}`)
    const label = edu.degree ? `${edu.institution} — ${edu.degree}` : edu.institution
    addNode(slug, "education", label)
    addEdge("profile", slug, "educated_at")

    // Education → skills learned (also connect to profile)
    for (const skill of edu.skills ?? []) {
      const skillSlug = toSlug("skill", skill)
      addNode(skillSlug, "skill", skill)
      addEdge("profile", skillSlug, "has_skill")
      addEdge(slug, skillSlug, "taught_skill")
    }
  }

  return { nodes, edges }
}
