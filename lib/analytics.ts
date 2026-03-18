import type { JobFile, ProfileFrontmatter } from "./types"
import { PIPELINE_STAGES } from "./types"
import type { PipelineStage } from "./types"

/**
 * Calculate funnel counts: how many jobs are at each pipeline stage.
 */
export function calculateFunnel(
  jobs: JobFile[],
): Record<PipelineStage, number> {
  const counts = {} as Record<PipelineStage, number>
  for (const stage of PIPELINE_STAGES) {
    counts[stage] = 0
  }
  for (const job of jobs) {
    const stage = job.frontmatter.status
    if (stage in counts) {
      counts[stage]++
    }
  }
  return counts
}

/**
 * Profile completeness fields. Returns a score from 0-100.
 */
const COMPLETENESS_FIELDS: (keyof ProfileFrontmatter)[] = [
  "display_name",
  "headline",
  "skills",
  "experience_years",
  "preferred_roles",
  "remote_preference",
  "availability",
  "experience",
  "education",
]

export function calculateCompleteness(
  profile: ProfileFrontmatter,
): number {
  let filled = 0
  for (const field of COMPLETENESS_FIELDS) {
    const value = profile[field]
    if (value !== undefined && value !== null) {
      // Arrays count as filled only if non-empty
      if (Array.isArray(value)) {
        if (value.length > 0) filled++
      } else {
        filled++
      }
    }
  }
  return Math.round((filled / COMPLETENESS_FIELDS.length) * 100)
}

/**
 * Generate a dashboard briefing summary.
 */
export interface Briefing {
  newJobsCount: number
  upcomingActionsCount: number
  totalJobs: number
  summary: string
}

export function generateBriefing(
  jobs: JobFile[],
  recentActivityDays: number = 7,
): Briefing {
  const now = Date.now()
  const cutoff = now - recentActivityDays * 24 * 60 * 60 * 1000

  const newJobs = jobs.filter((j) => {
    const discovered = j.frontmatter.discovered_at
    if (!discovered) return false
    return new Date(discovered).getTime() > cutoff
  })

  const upcomingActions = jobs.filter(
    (j) =>
      j.frontmatter.status === "interviewing" ||
      j.frontmatter.status === "offer",
  )

  const parts: string[] = []
  if (newJobs.length > 0) {
    parts.push(`${newJobs.length} new job${newJobs.length === 1 ? "" : "s"}`)
  }
  if (upcomingActions.length > 0) {
    parts.push(
      `${upcomingActions.length} upcoming action${upcomingActions.length === 1 ? "" : "s"}`,
    )
  }

  return {
    newJobsCount: newJobs.length,
    upcomingActionsCount: upcomingActions.length,
    totalJobs: jobs.length,
    summary: parts.length > 0 ? parts.join(", ") : "No new activity",
  }
}
