import {
  PIPELINE_STAGES,
  PROGRESSED_STATUSES,
  OFFER_STATUSES,
  type JobFile,
  type ApplicationFile,
  type ActivityEntry,
  type ThreadFrontmatter,
  type ProfileFrontmatter,
  type ProfileCompletenessResult,
} from "./types"
import type { MatchBreakdown } from "./match-scoring"
import { formatActionTitle } from "./ui-utils"

// --- Funnel ---

export interface FunnelStage {
  stage: string
  count: number
  conversion: number // conversion rate from previous stage (0-1)
}

export interface FunnelResult {
  stages: Record<string, number>
  conversions: Record<string, number> // e.g. "discovered→saved": 0.45
}

export function calculateFunnel(jobs: JobFile[]): FunnelResult {
  const stages: Record<string, number> = {}
  for (const stage of PIPELINE_STAGES) {
    stages[stage] = 0
  }
  for (const job of jobs) {
    const status = job.frontmatter.status
    if (status in stages) {
      stages[status]++
    }
  }

  // Calculate conversion ratios between adjacent stages
  const conversions: Record<string, number> = {}
  for (let i = 0; i < PIPELINE_STAGES.length - 1; i++) {
    const from = PIPELINE_STAGES[i]
    const to = PIPELINE_STAGES[i + 1]
    const fromCount = stages[from]
    // "to" count is cumulative — anyone who reached that stage or beyond
    let toCount = 0
    for (let j = i + 1; j < PIPELINE_STAGES.length; j++) {
      toCount += stages[PIPELINE_STAGES[j]]
    }
    conversions[`${from}\u2192${to}`] = fromCount > 0 ? toCount / fromCount : 0
  }

  return { stages, conversions }
}

export function funnelToStages(result: FunnelResult): FunnelStage[] {
  const stageOrder = PIPELINE_STAGES.filter(s => s !== "rejected")
  return stageOrder.map((stage, i) => {
    const prevStage = i > 0 ? stageOrder[i - 1] : null
    const convKey = prevStage ? `${prevStage}\u2192${stage}` : ""
    return {
      stage,
      count: result.stages[stage] || 0,
      conversion: prevStage ? (result.conversions[convKey] || 0) : 1,
    }
  })
}

// --- Time in Stage ---

export interface TimeInStageResult {
  averageDays: Record<string, number>
}

export function calculateTimeInStage(
  jobs: JobFile[],
  activityLog: ActivityEntry[],
): TimeInStageResult {
  const stageDurations: Record<string, number[]> = {}
  for (const stage of PIPELINE_STAGES) {
    stageDurations[stage] = []
  }

  // Build timeline per job from activity log
  for (const job of jobs) {
    const slug = job.slug
    const jobEvents = activityLog
      .filter((e) => e.slug === slug && e.type === "status_changed")
      .sort(
        (a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime(),
      )

    for (let i = 0; i < jobEvents.length - 1; i++) {
      const current = jobEvents[i]
      const next = jobEvents[i + 1]
      // Extract stage from summary: "Moved slug to <stage>"
      const stageMatch = current.summary.match(/to (\w+)$/)
      if (stageMatch) {
        const stage = stageMatch[1]
        const days =
          (new Date(next.ts).getTime() - new Date(current.ts).getTime()) /
          (1000 * 60 * 60 * 24)
        if (stage in stageDurations) {
          stageDurations[stage].push(days)
        }
      }
    }
  }

  const averageDays: Record<string, number> = {}
  for (const [stage, durations] of Object.entries(stageDurations)) {
    if (durations.length > 0) {
      averageDays[stage] =
        Math.round(
          (durations.reduce((a, b) => a + b, 0) / durations.length) * 10,
        ) / 10
    } else {
      averageDays[stage] = 0
    }
  }

  return { averageDays }
}

// --- Dashboard Briefing ---

export interface BriefingResult {
  newJobs: number
  unreadMessages: number
  upcomingActions: Array<{ title: string; date: string; type: string }>
  agentActions: number
}

interface BriefingInput {
  jobs: JobFile[]
  applications: ApplicationFile[]
  threads: Array<{ threadId: string; frontmatter: ThreadFrontmatter }>
  profile: ProfileFrontmatter
  activityLog?: ActivityEntry[]
  jobMap?: Map<string, JobFile>
}

export function generateBriefing(input: BriefingInput): BriefingResult {
  const { jobs, applications, threads, activityLog, jobMap: existingJobMap } = input
  // Count jobs discovered in the last 7 days
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const newJobs = jobs.filter((j) => {
    const discovered = j.frontmatter.discovered_at
    if (!discovered) return false
    return new Date(discovered) >= sevenDaysAgo
  }).length

  // Count unread threads
  const unreadMessages = threads.filter((t) => t.frontmatter.unread).length

  // Collect upcoming actions from applications with next_step_date
  const jobMap = existingJobMap ?? new Map(jobs.map((j) => [j.slug, j]))
  const upcomingActions: Array<{ title: string; date: string; type: string }> =
    []
  for (const app of applications) {
    if (app.frontmatter.next_step && app.frontmatter.next_step_date) {
      const job = jobMap.get(app.frontmatter.job)
      const company = job?.frontmatter.company ?? app.slug
      upcomingActions.push({
        title: formatActionTitle(app.frontmatter.next_step, company),
        date: app.frontmatter.next_step_date,
        type: "application",
      })
    }
  }

  // Sort by date ascending
  upcomingActions.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  )

  // Count agent actions from enriched activity log (last 7 days)
  const agentActions = (activityLog || []).filter((e) => {
    const meta = e.metadata as Record<string, unknown> | undefined
    if (!meta || meta.type !== "agent_action") return false
    return new Date(e.ts) >= sevenDaysAgo
  }).length

  return { newJobs, unreadMessages, upcomingActions, agentActions }
}

// --- Profile Completeness ---

export function calculateCompleteness(
  profile: ProfileFrontmatter,
): ProfileCompletenessResult {
  const fields: Array<{
    key: keyof ProfileFrontmatter
    label: string
    suggestion: string
  }> = [
    {
      key: "display_name",
      label: "display name",
      suggestion: "Add your name so employers know who you are",
    },
    {
      key: "headline",
      label: "headline",
      suggestion:
        "Write a headline that summarizes your professional identity",
    },
    {
      key: "skills",
      label: "skills",
      suggestion: "List your key skills to improve job matching",
    },
    {
      key: "experience_years",
      label: "experience years",
      suggestion: "Add your total years of experience",
    },
    {
      key: "preferred_roles",
      label: "preferred roles",
      suggestion: "Specify the roles you're targeting",
    },
    {
      key: "preferred_locations",
      label: "preferred locations",
      suggestion: "Set your location preferences for better matches",
    },
    {
      key: "remote_preference",
      label: "remote preference",
      suggestion: "Indicate your remote work preference",
    },
    {
      key: "salary_range",
      label: "salary range",
      suggestion: "Set your salary expectations for alignment scoring",
    },
    {
      key: "experience",
      label: "experience",
      suggestion: "Add your work history for stronger match analysis",
    },
    {
      key: "education",
      label: "education",
      suggestion: "Include your education background",
    },
  ]

  const missing: string[] = []
  const suggestions: string[] = []

  for (const field of fields) {
    const value = profile[field.key]
    const isEmpty =
      value === undefined ||
      value === null ||
      value === "" ||
      (Array.isArray(value) && value.length === 0)

    if (isEmpty) {
      missing.push(field.label)
      suggestions.push(field.suggestion)
    }
  }

  const filled = fields.length - missing.length
  const percentage = Math.round((filled / fields.length) * 100)

  return { percentage, missing, suggestions }
}

// --- Momentum ---

export interface MomentumResult {
  score: number | null
  trend: "up" | "flat" | "down"
  qualifier: string
}

function dataQualifier(count: number, noun: string): string {
  if (count < 3) return `Not enough data`
  if (count < 5) return `Limited data \u2014 ${count} ${noun}`
  return `Based on ${count} ${noun}`
}

export function computeMomentum(
  jobs: JobFile[],
  applications: ApplicationFile[],
  activityLog: ActivityEntry[],
): MomentumResult {
  const appCount = applications.length
  if (appCount < 3) {
    return { score: null, trend: "flat", qualifier: dataQualifier(appCount, "applications") }
  }

  // Factors: application rate (last 14d vs prior 14d), interview rate, response rate
  const now = Date.now()
  const twoWeeksMs = 14 * 24 * 60 * 60 * 1000

  const recentApps = applications.filter(
    (a) => a.frontmatter.applied_at && now - new Date(a.frontmatter.applied_at).getTime() < twoWeeksMs
  ).length
  const olderApps = applications.filter(
    (a) =>
      a.frontmatter.applied_at &&
      now - new Date(a.frontmatter.applied_at).getTime() >= twoWeeksMs &&
      now - new Date(a.frontmatter.applied_at).getTime() < twoWeeksMs * 2
  ).length

  // Interview conversion rate
  const interviewingOrBeyond = applications.filter((a) =>
    (PROGRESSED_STATUSES as readonly string[]).includes(a.frontmatter.status)
  ).length
  const interviewRate = appCount > 0 ? interviewingOrBeyond / appCount : 0

  // Activity rate — recent events per day
  const recentActivity = activityLog.filter(
    (e) => now - new Date(e.ts).getTime() < twoWeeksMs
  ).length
  const activityPerDay = recentActivity / 14

  // Composite score (0-100)
  let score = 0
  // Application volume (30 points): 5+ apps in 2 weeks = max
  score += Math.min(30, (recentApps / 5) * 30)
  // Interview conversion (40 points): 30%+ = max
  score += Math.min(40, (interviewRate / 0.3) * 40)
  // Activity engagement (30 points): 2+ events/day = max
  score += Math.min(30, (activityPerDay / 2) * 30)
  score = Math.round(score)

  // Trend from application rate comparison
  let trend: "up" | "flat" | "down" = "flat"
  if (olderApps > 0) {
    const ratio = recentApps / olderApps
    if (ratio > 1.25) trend = "up"
    else if (ratio < 0.75) trend = "down"
  } else if (recentApps > 0) {
    trend = "up"
  }

  return { score, trend, qualifier: dataQualifier(appCount, "applications") }
}

// --- Confidence Breakdown ---

export interface ConfidenceResult {
  score: number
  reasoning: string
  qualifier: string
}

export function computeConfidenceBreakdown(
  matchBreakdown: MatchBreakdown,
  applicationHistory: ApplicationFile[],
): ConfidenceResult {
  const historyCount = applicationHistory.length

  // Start from the match score
  let score = matchBreakdown.overall

  // Adjust based on historical success for similar-scoring jobs
  const pastWithOffers = applicationHistory.filter((a) =>
    (OFFER_STATUSES as readonly string[]).includes(a.frontmatter.status)
  ).length
  const pastInterviews = applicationHistory.filter((a) =>
    (PROGRESSED_STATUSES as readonly string[]).includes(a.frontmatter.status)
  ).length

  if (historyCount >= 3) {
    const successRate = pastWithOffers / historyCount
    const interviewRate = pastInterviews / historyCount

    // Blend match score with historical performance (70/30 split)
    const historyScore = (successRate * 60 + interviewRate * 40) * 100
    score = Math.round(score * 0.7 + historyScore * 0.3)
  }

  score = Math.max(0, Math.min(100, score))

  // Build reasoning
  const parts: string[] = []
  parts.push(`Match score: ${matchBreakdown.overall}%`)
  if (historyCount >= 3) {
    parts.push(`${pastWithOffers}/${historyCount} past applications led to offers`)
    parts.push(`${pastInterviews}/${historyCount} reached interview stage`)
  }

  return {
    score,
    reasoning: parts.join(". ") + ".",
    qualifier: dataQualifier(historyCount, "applications"),
  }
}
