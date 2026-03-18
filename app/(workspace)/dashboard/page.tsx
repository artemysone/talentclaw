import {
  listJobs,
  listApplications,
  getActivityLog,
  getProfile,
} from "@/lib/fs-data"
import { buildTimelineData } from "@/lib/timeline-data"
import { PIPELINE_STAGES } from "@/lib/types"
import { ProfileCard } from "@/components/hub/profile-card"

import { ActivityFeed } from "@/components/hub/activity-feed"
import { UpcomingActions } from "@/components/hub/upcoming-actions"
import CareerGraphWrapper from "@/components/graph/career-graph-wrapper"

export default async function DashboardPage() {
  const [jobs, applications, activityLog, profile] = await Promise.all([
    listJobs(),
    listApplications(),
    getActivityLog(10),
    getProfile(),
  ])

  const isFirstRun =
    !profile.frontmatter.display_name && !profile.frontmatter.headline

  const timelineBranches = buildTimelineData(profile.frontmatter)

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
    <div className="p-6 max-w-6xl xl:max-w-[1400px] 2xl:max-w-[1600px] mx-auto space-y-6">
      {/* Profile greeting + pipeline funnel */}
      <ProfileCard
        profile={profile.frontmatter}
        isFirstRun={isFirstRun}
        stageCounts={stageCounts}
      />

      {/* Career timeline — full width */}
      {timelineBranches.length > 0 && (
        <div className="bg-surface-raised rounded-2xl border border-border-subtle overflow-hidden">
          <div className="px-6 pt-5 pb-0">
            <h3 className="font-prose text-lg text-text-primary">Career Graph</h3>
          </div>
          <div className="h-[300px] xl:h-[360px] 2xl:h-[420px]">
            <CareerGraphWrapper branches={timelineBranches} />
          </div>
        </div>
      )}

      {/* Info cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <UpcomingActions actions={upcomingActions} />
        <ActivityFeed entries={activityLog} />
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
