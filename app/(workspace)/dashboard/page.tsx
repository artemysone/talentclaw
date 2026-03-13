import {
  listJobs,
  listApplications,
  getActivityLog,
  getProfile,
} from "@/lib/fs-data"
import { buildCareerGraph } from "@/lib/graph-data"
import { PIPELINE_STAGES } from "@/lib/types"
import { ProfileCard } from "@/components/hub/profile-card"
import { ActivityFeed } from "@/components/hub/activity-feed"
import { UpcomingActions } from "@/components/hub/upcoming-actions"
import CareerGraphWrapper from "@/components/graph/career-graph-wrapper"

export default async function DashboardPage() {
  const [jobs, applications, activityLog, profile, graph] = await Promise.all([
    listJobs(),
    listApplications(),
    getActivityLog(10),
    getProfile(),
    buildCareerGraph(),
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

  return (
    <div className="p-6 max-w-6xl xl:max-w-[1400px] 2xl:max-w-[1600px] mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-5 xl:grid-cols-7 gap-6">
        {/* Left column */}
        <div className="lg:col-span-3 xl:col-span-4 space-y-6">
          <ProfileCard
            profile={profile.frontmatter}
            isFirstRun={isFirstRun}
            stageCounts={stageCounts}
          />
          {graph.nodes.length > 1 && (
            <div className="bg-surface-raised rounded-2xl border border-border-subtle overflow-hidden h-[480px] xl:h-[560px] 2xl:h-[640px]">
              <CareerGraphWrapper nodes={graph.nodes} edges={graph.edges} />
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 xl:col-span-3 space-y-6">
          <UpcomingActions actions={upcomingActions} />
          <ActivityFeed entries={activityLog} />
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
