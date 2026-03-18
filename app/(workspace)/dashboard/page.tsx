import {
  listJobs,
  listApplications,
  getActivityLog,
  getProfile,
  getCoffeeShopStatus,
} from "@/lib/fs-data"
import { buildCareerGraph } from "@/lib/graph-data"
import { calculateFunnel, generateBriefing, calculateCompleteness } from "@/lib/analytics"
import { PIPELINE_STAGES } from "@/lib/types"
import { ProfileCard } from "@/components/hub/profile-card"
import { CoffeeShopCard } from "@/components/hub/coffeeshop-card"
import { ActivityFeed } from "@/components/hub/activity-feed"
import { UpcomingActions } from "@/components/hub/upcoming-actions"
import { MorningBriefing } from "@/components/hub/morning-briefing"
import { PipelineFunnelChart } from "@/components/hub/pipeline-funnel-chart"
import { CompletenessMeter } from "@/components/hub/completeness-meter"
import CareerGraphWrapper from "@/components/graph/career-graph-wrapper"

export default async function DashboardPage() {
  const [jobs, applications, activityLog, profile, graph, coffeeShopStatus] = await Promise.all([
    listJobs(),
    listApplications(),
    getActivityLog(10),
    getProfile(),
    buildCareerGraph(),
    getCoffeeShopStatus(),
  ])

  const isFirstRun =
    !profile.frontmatter.display_name && !profile.frontmatter.headline

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
  const funnel = calculateFunnel(jobs)
  const briefing = generateBriefing(jobs, applications, activityLog)
  const completeness = calculateCompleteness(profile)

  return (
    <div className="p-6 max-w-6xl xl:max-w-[1400px] 2xl:max-w-[1600px] mx-auto space-y-6">
      {/* Row 1: Profile card — full width */}
      <ProfileCard
        profile={profile.frontmatter}
        isFirstRun={isFirstRun}
        stageCounts={stageCounts}
      />

      {/* Row 2: Morning Briefing + Completeness Meter (or Coffee Shop) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MorningBriefing briefing={briefing} />
        {completeness.percentage < 100 ? (
          <CompletenessMeter completeness={completeness} />
        ) : (
          <CoffeeShopCard status={coffeeShopStatus} />
        )}
      </div>

      {/* Row 3: Pipeline Funnel Chart — full width */}
      <PipelineFunnelChart funnel={funnel} />

      {/* Row 4: Career Timeline — full width (if data exists) */}
      {graph.nodes.length > 1 && (
        <div className="bg-surface-raised rounded-2xl border border-border-subtle overflow-hidden h-[480px] xl:h-[560px] 2xl:h-[640px]">
          <CareerGraphWrapper nodes={graph.nodes} edges={graph.edges} />
        </div>
      )}

      {/* Row 5: Activity Feed + Upcoming Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActivityFeed entries={activityLog} />
        <div className="space-y-6">
          <UpcomingActions actions={upcomingActions} />
          {/* Show Coffee Shop card here if completeness is 100% (shown in row 2 otherwise) */}
          {completeness.percentage >= 100 && (
            <CoffeeShopCard status={coffeeShopStatus} />
          )}
        </div>
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
