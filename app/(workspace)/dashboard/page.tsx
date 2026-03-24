import { redirect } from "next/navigation"
import {
  listJobs,
  listApplications,
  getActivityLog,
  getProfile,
  hasCompletedOnboarding,
} from "@/lib/fs-data"
import { buildCareerGraph } from "@/lib/career-graph-data"
import { generateBriefing, calculateCompleteness, computeMomentum } from "@/lib/analytics"
import { PIPELINE_STAGES, PROGRESSED_STATUSES, type ApplicationFile, type JobFile } from "@/lib/types"
import { ProfileCard } from "@/components/hub/profile-card"
import { ActivityFeed } from "@/components/hub/activity-feed"
import { UpcomingActions } from "@/components/hub/upcoming-actions"
import { AgentQueue } from "@/components/hub/agent-queue"
import CareerGraphWrapper from "@/components/graph/career-graph-wrapper"

export default async function DashboardPage() {
  // Check onboarding status — redirect before loading everything else
  const onboarded = await hasCompletedOnboarding()
  if (!onboarded) {
    redirect("/onboarding")
  }

  const profile = await getProfile()

  const [jobs, applications, activityLog] = await Promise.all([
    listJobs(),
    listApplications(),
    getActivityLog(50),
  ])

  const careerGraph = buildCareerGraph(profile.frontmatter)

  // Stage counts
  const stageCounts: Record<string, number> = {}
  for (const stage of PIPELINE_STAGES) {
    stageCounts[stage] = 0
  }
  for (const job of jobs) {
    const stage = job.frontmatter.status
    if (stageCounts[stage] !== undefined) {
      stageCounts[stage]++
    }
  }

  // Upcoming actions from applications
  const upcomingActions = applications
    .filter(
      (app) => app.frontmatter.next_step && app.frontmatter.next_step_date
    )
    .map((app) => ({
      title: app.frontmatter.next_step!,
      company: app.slug,
      date: app.frontmatter.next_step_date!,
      urgent: isWithinDays(app.frontmatter.next_step_date!, 3),
      overdue: isOverdue(app.frontmatter.next_step_date!),
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5)

  // Analytics
  const briefing = generateBriefing({ jobs, applications, threads: [], profile: profile.frontmatter, activityLog })
  const completeness = calculateCompleteness(profile.frontmatter)
  const momentum = computeMomentum(jobs, applications, activityLog)

  // Agent queue — applications with workflow_status "queued" or "review_required"
  const jobMap = new Map(jobs.map((j) => [j.slug, j]))
  const queueItems = applications
    .filter((app) =>
      app.frontmatter.workflow_status === "queued" ||
      app.frontmatter.workflow_status === "review_required"
    )
    .map((app) => ({
      application: app,
      job: jobMap.get(app.frontmatter.job) ?? null,
    }))

  // Derive agent insights for the profile card
  const insights = deriveInsights(applications, jobMap)

  return (
    <div className="p-6 max-w-6xl xl:max-w-[1400px] 2xl:max-w-[1600px] mx-auto space-y-6">
      {/* Profile Card */}
      <ProfileCard
        profile={profile.frontmatter}
        isFirstRun={false}
        stageCounts={stageCounts}
        briefing={briefing}
        completeness={completeness}
        momentum={momentum}
        insights={insights}
      />

      {/* Agent Queue (conditional — hidden when empty) */}
      {queueItems.length > 0 && <AgentQueue items={queueItems} />}

      {/* Career Context Graph */}
      {careerGraph.nodes.length > 1 && (
        <div className="bg-surface-raised rounded-2xl border border-border-subtle overflow-hidden h-[480px] xl:h-[560px] 2xl:h-[640px]">
          <CareerGraphWrapper data={careerGraph} />
        </div>
      )}

      {/* Activity Feed + Upcoming Actions (2-col on lg) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActivityFeed entries={activityLog} />
        <UpcomingActions actions={upcomingActions} />
      </div>
    </div>
  )
}

function isWithinDays(dateStr: string, days: number): boolean {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = date.getTime() - now.getTime()
  return diffMs >= 0 && diffMs <= days * 24 * 60 * 60 * 1000
}

function isOverdue(dateStr: string): boolean {
  return new Date(dateStr).getTime() < Date.now()
}

function deriveInsights(
  applications: ApplicationFile[],
  jobMap: Map<string, JobFile>
): string[] {
  const insights: string[] = []

  const interviewing = applications.filter((a) =>
    (PROGRESSED_STATUSES as readonly string[]).includes(a.frontmatter.status)
  )
  if (applications.length >= 3) {
    const rate = Math.round((interviewing.length / applications.length) * 100)
    insights.push(`${rate}% of your applications have progressed to interviews or beyond.`)
  }

  const companiesWithResponse = new Set<string>()
  for (const app of interviewing) {
    const job = jobMap.get(app.frontmatter.job)
    if (job) companiesWithResponse.add(job.frontmatter.company)
  }
  if (companiesWithResponse.size > 0) {
    const names = Array.from(companiesWithResponse).slice(0, 3).join(", ")
    insights.push(`Companies that responded well: ${names}.`)
  }

  const allJobs = Array.from(jobMap.values())
  const remoteJobs = allJobs.filter((j) => j.frontmatter.remote === "remote")
  const onsiteJobs = allJobs.filter((j) => j.frontmatter.remote === "onsite")
  if (remoteJobs.length > onsiteJobs.length * 2 && remoteJobs.length >= 3) {
    insights.push("You tend to gravitate toward remote roles. Your agent will prioritize these.")
  }

  return insights.slice(0, 3)
}
