import { z } from "zod"

// Pipeline stages
export const PIPELINE_STAGES = [
  "discovered",
  "saved",
  "applied",
  "interviewing",
  "offer",
  "accepted",
  "rejected",
] as const

export type PipelineStage = (typeof PIPELINE_STAGES)[number]

export const PipelineStageSchema = z.enum(PIPELINE_STAGES)

// Compensation
export const CompensationSchema = z.object({
  min: z.number().optional(),
  max: z.number().optional(),
  currency: z.string().default("USD"),
})

// Job frontmatter
export const JobFrontmatterSchema = z.object({
  title: z.string(),
  company: z.string(),
  location: z.string().optional(),
  remote: z.enum(["remote", "hybrid", "onsite"]).optional(),
  compensation: CompensationSchema.optional(),
  url: z.string().optional(),
  source: z.enum(["web_search", "manual", "referral"]).default("manual"),
  status: PipelineStageSchema.default("discovered"),
  match_score: z.number().min(0).max(100).optional(),
  tags: z.array(z.string()).optional(),
  discovered_at: z.string().optional(),
  contact_refs: z.array(z.string()).optional(),
  company_ref: z.string().optional(),
})

export type JobFrontmatter = z.infer<typeof JobFrontmatterSchema>

// The full job file (frontmatter + markdown body)
export interface JobFile {
  slug: string
  frontmatter: JobFrontmatter
  content: string // markdown body
}

// Application workflow status (agent sub-state, separate from PipelineStage)
export const APPLICATION_WORKFLOW_STATUSES = [
  "queued",
  "review_required",
  "approved",
  "submitted",
  "failed",
] as const

export type ApplicationWorkflowStatus =
  (typeof APPLICATION_WORKFLOW_STATUSES)[number]

export const ApplicationWorkflowStatusSchema = z.enum(
  APPLICATION_WORKFLOW_STATUSES
)

// Application frontmatter
export const ApplicationFrontmatterSchema = z.object({
  job: z.string(), // slug reference to jobs/
  status: z
    .enum(["applied", "interviewing", "offer", "accepted", "rejected"])
    .default("applied"),
  applied_at: z.string().optional(),
  next_step: z.string().optional(),
  next_step_date: z.string().optional(),
  workflow_status: ApplicationWorkflowStatusSchema.optional(),
  confidence_score: z.number().optional(),
  confidence_reasoning: z.string().optional(),
  tailored_content: z.string().optional(),
})

export type ApplicationFrontmatter = z.infer<
  typeof ApplicationFrontmatterSchema
>

export interface ApplicationFile {
  slug: string
  frontmatter: ApplicationFrontmatter
  content: string
}

// Experience entry (within profile)
export const ExperienceSchema = z.object({
  company: z.string(),
  title: z.string(),
  start: z.string(),
  end: z.string().optional(),
  skills: z.array(z.string()).optional(),
  projects: z.array(z.string()).optional(),
  industry: z.string().optional(),
})

export type Experience = z.infer<typeof ExperienceSchema>

// Education entry (within profile)
export const EducationSchema = z.object({
  institution: z.string(),
  degree: z.string(),
  year: z.string().optional(),
  skills: z.array(z.string()).optional(),
})

export type Education = z.infer<typeof EducationSchema>

// Project entry (within profile)
export const ProjectSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  skills: z.array(z.string()).optional(),
})

export type Project = z.infer<typeof ProjectSchema>

// Goal entry (within profile)
export const GoalSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
})

export type Goal = z.infer<typeof GoalSchema>

// Profile frontmatter
export const ProfileFrontmatterSchema = z.object({
  display_name: z.string().optional(),
  headline: z.string().optional(),
  skills: z.array(z.string()).optional(),
  experience_years: z.number().optional(),
  preferred_roles: z.array(z.string()).optional(),
  preferred_locations: z.array(z.string()).optional(),
  remote_preference: z
    .enum(["remote_only", "remote_ok", "hybrid", "onsite", "flexible"])
    .optional(),
  salary_range: CompensationSchema.optional(),
  availability: z.enum(["active", "passive", "not_looking"]).optional(),
  updated_at: z.string().optional(),
  experience: z.array(ExperienceSchema).optional(),
  education: z.array(EducationSchema).optional(),
  projects: z.array(ProjectSchema).optional(),
  goals: z.array(GoalSchema).optional(),
  career_arc_summary: z.string().optional(),
  core_strengths_summary: z.string().optional(),
  current_situation_summary: z.string().optional(),
  growth_edges_summary: z.string().optional(),
})

export type ProfileFrontmatter = z.infer<typeof ProfileFrontmatterSchema>

export interface ProfileFile {
  frontmatter: ProfileFrontmatter
  content: string
}

// Company frontmatter
export const CompanyFrontmatterSchema = z.object({
  name: z.string(),
  url: z.string().optional(),
  size: z.string().optional(),
  industry: z.string().optional(),
  comp_range: CompensationSchema.optional(),
  interview_stages: z.array(z.string()).optional(),
  response_rate: z.number().optional(),
})

export type CompanyFrontmatter = z.infer<typeof CompanyFrontmatterSchema>

export interface CompanyFile {
  slug: string
  frontmatter: CompanyFrontmatter
  content: string
}

// Contact frontmatter
export const ContactFrontmatterSchema = z.object({
  name: z.string(),
  company: z.string().optional(),
  title: z.string().optional(),
  email: z.string().optional(),
  linkedin: z.string().optional(),
  company_ref: z.string().optional(),
  job_refs: z.array(z.string()).optional(),
})

export type ContactFrontmatter = z.infer<typeof ContactFrontmatterSchema>

export interface ContactFile {
  slug: string
  frontmatter: ContactFrontmatter
  content: string
}

// Message frontmatter
export const MessageFrontmatterSchema = z.object({
  direction: z.enum(["inbound", "outbound"]),
  from: z.string(),
  to: z.string(),
  sent_at: z.string(),
})

export type MessageFrontmatter = z.infer<typeof MessageFrontmatterSchema>

export interface MessageFile {
  filename: string
  frontmatter: MessageFrontmatter
  content: string
}

// Thread frontmatter (messages/<thread-slug>/thread.md)
export const ThreadFrontmatterSchema = z.object({
  participant: z.string(),
  subject: z.string().optional(),
  job_ref: z.string().optional(),
  last_active: z.string(),
  unread: z.boolean().default(false),
})

export type ThreadFrontmatter = z.infer<typeof ThreadFrontmatterSchema>

export interface ThreadFile {
  slug: string
  frontmatter: ThreadFrontmatter
  messages: MessageFile[]
}

// File tree node (for sidebar)
export interface TreeNode {
  name: string // "acme-sre.md" or "jobs"
  path: string // "jobs/acme-sre.md" — relative to ~/.talentclaw/
  type: "file" | "directory"
  children?: TreeNode[]
  count?: number // file count for directories
}

// File type detection (for file viewer dispatch)
export type FileType =
  | "job"
  | "application"
  | "profile"
  | "company"
  | "contact"
  | "message"
  | "generic"

// Activity log entry (JSONL)
export const ActivityEntrySchema = z.object({
  ts: z.string(),
  type: z.string(),
  slug: z.string().optional(),
  summary: z.string(),
  metadata: z.record(z.unknown()).optional(),
})

export type ActivityEntry = z.infer<typeof ActivityEntrySchema>

// Profile completeness
export interface ProfileCompletenessResult {
  percentage: number
  missing: string[] // list of missing fields like "skills", "experience", "headline"
  suggestions: string[] // human-readable suggestions
}

// Status constants
export const PROGRESSED_STATUSES = ["interviewing", "offer", "accepted"] as const
export const OFFER_STATUSES = ["offer", "accepted"] as const

// Graph index types
export type GraphNodeType = "job" | "application" | "contact" | "company" | "thread" | "profile"
export type GraphEdgeRel = "job_at_company" | "job_contact" | "application_for_job" | "contact_at_company" | "contact_for_job" | "thread_about_job"

export interface GraphNode {
  slug: string
  type: GraphNodeType
}

export interface GraphEdge {
  from: string
  to: string
  rel: GraphEdgeRel
}

export interface GraphIndex {
  version: number
  nodes: GraphNode[]
  edges: GraphEdge[]
  updatedAt: string
}
