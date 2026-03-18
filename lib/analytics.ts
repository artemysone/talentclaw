import type { JobFile, ApplicationFile, ProfileFile, ActivityEntry } from "./types"
import type { PipelineStage } from "./types"

// --- Pipeline Funnel ---

export interface FunnelStage {
  stage: PipelineStage
  count: number
  conversionFromPrevious: number | null // null for first stage
}

/**
 * Calculate pipeline funnel data showing count and conversion rate at each stage.
 * Only includes forward-progression stages (excludes "rejected").
 */
export function calculateFunnel(jobs: JobFile[]): FunnelStage[] {
  const orderedStages: PipelineStage[] = [
    "discovered",
    "saved",
    "applied",
    "interviewing",
    "offer",
    "accepted",
  ]

  // Count cumulative: a job at "applied" passed through "discovered" and "saved"
  const stageCounts: Record<string, number> = {}
  for (const stage of orderedStages) {
    stageCounts[stage] = 0
  }
  for (const job of jobs) {
    const status = job.frontmatter.status
    if (status === "rejected") continue
    const idx = orderedStages.indexOf(status as PipelineStage)
    if (idx >= 0) {
      // Count at current stage and all prior stages
      for (let i = 0; i <= idx; i++) {
        stageCounts[orderedStages[i]]++
      }
    }
  }

  return orderedStages.map((stage, i) => {
    const count = stageCounts[stage]
    const prev = i > 0 ? stageCounts[orderedStages[i - 1]] : null
    const conversionFromPrevious =
      prev !== null && prev > 0 ? Math.round((count / prev) * 100) : null
    return { stage, count, conversionFromPrevious }
  })
}

// --- Time in Stage ---

export interface StageTime {
  stage: PipelineStage
  avgDays: number
  count: number
}

/**
 * Calculate average time spent in each stage based on activity log entries.
 * Returns an estimate based on discovered_at dates and current status.
 */
export function calculateTimeInStage(
  jobs: JobFile[],
  _activities: ActivityEntry[],
): StageTime[] {
  const orderedStages: PipelineStage[] = [
    "discovered",
    "saved",
    "applied",
    "interviewing",
    "offer",
  ]

  // Simple estimate: days since discovered_at for jobs at each stage
  const stageDays: Record<string, number[]> = {}
  for (const stage of orderedStages) {
    stageDays[stage] = []
  }

  const now = Date.now()
  for (const job of jobs) {
    const status = job.frontmatter.status
    const discoveredAt = job.frontmatter.discovered_at
    if (!discoveredAt || status === "rejected" || status === "accepted") continue

    const discovered = new Date(discoveredAt).getTime()
    if (isNaN(discovered)) continue

    const days = Math.max(0, Math.floor((now - discovered) / (24 * 60 * 60 * 1000)))
    if (stageDays[status]) {
      stageDays[status].push(days)
    }
  }

  return orderedStages.map((stage) => {
    const times = stageDays[stage]
    const avgDays =
      times.length > 0
        ? Math.round(times.reduce((a, b) => a + b, 0) / times.length)
        : 0
    return { stage, avgDays, count: times.length }
  })
}

// --- Morning Briefing ---

export interface Briefing {
  newJobsCount: number
  unreadMessagesCount: number
  upcomingActions: {
    title: string
    company: string
    date: string
    type: "interview" | "follow-up" | "deadline"
  }[]
  activeApplicationsCount: number
  totalPipelineCount: number
}

/**
 * Generate a morning briefing summarizing key metrics.
 */
export function generateBriefing(
  jobs: JobFile[],
  applications: ApplicationFile[],
  activities: ActivityEntry[],
): Briefing {
  const now = Date.now()
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000
  const threeDaysFromNow = now + 3 * 24 * 60 * 60 * 1000

  // New jobs discovered in last 7 days
  const newJobsCount = jobs.filter((j) => {
    const d = j.frontmatter.discovered_at
    if (!d) return false
    const ts = new Date(d).getTime()
    return !isNaN(ts) && ts >= sevenDaysAgo
  }).length

  // Unread messages: count "message" activity entries in last 7 days
  const unreadMessagesCount = activities.filter((a) => {
    const ts = new Date(a.ts).getTime()
    return a.type === "message" && !isNaN(ts) && ts >= sevenDaysAgo
  }).length

  // Upcoming actions from applications with next_step_date within 3 days
  const upcomingActions = applications
    .filter((app) => {
      if (!app.frontmatter.next_step || !app.frontmatter.next_step_date) return false
      const date = new Date(app.frontmatter.next_step_date).getTime()
      return !isNaN(date) && date <= threeDaysFromNow && date >= now - 24 * 60 * 60 * 1000
    })
    .map((app) => {
      const step = app.frontmatter.next_step!.toLowerCase()
      let type: "interview" | "follow-up" | "deadline" = "deadline"
      if (step.includes("interview")) type = "interview"
      else if (step.includes("follow")) type = "follow-up"
      return {
        title: app.frontmatter.next_step!,
        company: app.slug,
        date: app.frontmatter.next_step_date!,
        type,
      }
    })
    .sort((a, b) => a.date.localeCompare(b.date))

  // Active applications
  const activeApplicationsCount = applications.filter((a) =>
    ["applied", "interviewing"].includes(a.frontmatter.status),
  ).length

  // Total pipeline (non-rejected)
  const totalPipelineCount = jobs.filter(
    (j) => j.frontmatter.status !== "rejected",
  ).length

  return {
    newJobsCount,
    unreadMessagesCount,
    upcomingActions,
    activeApplicationsCount,
    totalPipelineCount,
  }
}

// --- Profile Completeness ---

export interface CompletenessResult {
  percentage: number
  missingFields: {
    field: string
    suggestion: string
  }[]
}

/**
 * Calculate profile completeness as a percentage with suggestions for missing fields.
 */
export function calculateCompleteness(profile: ProfileFile): CompletenessResult {
  const checks: {
    field: string
    present: boolean
    suggestion: string
  }[] = [
    {
      field: "Display name",
      present: !!profile.frontmatter.display_name,
      suggestion: "Add your name so employers know who you are.",
    },
    {
      field: "Headline",
      present: !!profile.frontmatter.headline,
      suggestion: "Write a short headline describing your expertise.",
    },
    {
      field: "Skills",
      present: (profile.frontmatter.skills?.length ?? 0) > 0,
      suggestion: "List your key technical and professional skills.",
    },
    {
      field: "Experience",
      present: (profile.frontmatter.experience?.length ?? 0) > 0,
      suggestion: "Add your work experience to build your career graph.",
    },
    {
      field: "Education",
      present: (profile.frontmatter.education?.length ?? 0) > 0,
      suggestion: "Add your educational background.",
    },
    {
      field: "Preferred roles",
      present: (profile.frontmatter.preferred_roles?.length ?? 0) > 0,
      suggestion: "Specify what roles you're targeting.",
    },
    {
      field: "Remote preference",
      present: !!profile.frontmatter.remote_preference,
      suggestion: "Set your remote/onsite preference for better matches.",
    },
    {
      field: "Salary range",
      present: !!profile.frontmatter.salary_range,
      suggestion: "Add a target salary range to filter opportunities.",
    },
    {
      field: "Availability",
      present: !!profile.frontmatter.availability,
      suggestion: "Indicate if you're actively looking, passive, or not looking.",
    },
    {
      field: "Bio",
      present: profile.content.length > 0,
      suggestion: "Write a short bio in your profile markdown body.",
    },
  ]

  const completed = checks.filter((c) => c.present).length
  const percentage = Math.round((completed / checks.length) * 100)

  const missingFields = checks
    .filter((c) => !c.present)
    .map(({ field, suggestion }) => ({ field, suggestion }))

  return { percentage, missingFields }
}
