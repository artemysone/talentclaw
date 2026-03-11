import Link from "next/link"
import { Cog } from "lucide-react"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { ActivityFeed } from "@/components/dashboard/activity-feed"
import { listJobs, listApplications, getActivityLog, getProfile } from "@/lib/fs-data"
import type { ActivityEntry } from "@/lib/types"

export default async function DashboardPage() {
  const [jobs, applications, activityLog, profile] = await Promise.all([
    listJobs(),
    listApplications(),
    getActivityLog(10),
    getProfile(),
  ])

  // Calculate stats from real data
  const totalJobs = jobs.length
  const appliedCount = jobs.filter((j) =>
    ["applied", "interviewing", "offer", "accepted"].includes(j.frontmatter.status)
  ).length
  const interviewingCount = jobs.filter((j) => j.frontmatter.status === "interviewing").length
  const responseRate = appliedCount > 0
    ? Math.round((jobs.filter((j) => ["interviewing", "offer", "accepted"].includes(j.frontmatter.status)).length / appliedCount) * 100)
    : 0

  const stats = {
    totalJobs,
    appliedCount,
    interviewingCount,
    responseRate,
  }

  // Get upcoming deadlines from applications
  const deadlines = applications
    .filter((app) => app.frontmatter.next_step && app.frontmatter.next_step_date)
    .map((app) => ({
      title: app.frontmatter.next_step!,
      company: app.slug,
      date: app.frontmatter.next_step_date!,
      urgent: isWithinDays(app.frontmatter.next_step_date!, 3),
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5)

  // Check if this is a first-run (empty profile)
  const isFirstRun = !profile.frontmatter.display_name && !profile.frontmatter.headline

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-surface/95 backdrop-blur-md border-b border-border-subtle">
        <div className="max-w-[1200px] mx-auto px-5 flex items-center justify-between h-14">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="w-7 h-7 rounded-md bg-accent flex items-center justify-center">
                <Cog className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-base font-semibold tracking-tight text-text-primary">
                TalentClaw
              </span>
            </Link>
            <span className="text-text-muted">/</span>
            <span className="text-sm font-medium text-text-primary">Dashboard</span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/pipeline"
              className="text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              Pipeline
            </Link>
            <Link
              href="/jobs"
              className="text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              Jobs
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-5 py-8">
        {isFirstRun ? (
          /* Welcome state for first-run */
          <div className="max-w-lg mx-auto text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-6">
              <Cog className="w-8 h-8 text-accent" />
            </div>
            <h1 className="text-2xl font-bold text-text-primary mb-3">Welcome to TalentClaw</h1>
            <p className="text-text-secondary mb-8">
              Your AI career agent is ready. Set up your profile to get started with job discovery and pipeline management.
            </p>
            <div className="space-y-3">
              <div className="bg-surface-raised rounded-xl border border-border-subtle p-5 text-left">
                <h3 className="text-sm font-semibold text-text-primary mb-1">Build your profile</h3>
                <p className="text-xs text-text-secondary mb-3">
                  Edit <code className="text-accent bg-accent/5 px-1.5 py-0.5 rounded text-[0.7rem]">~/.talentclaw/profile.md</code> with your skills, experience, and preferences.
                </p>
              </div>
              <div className="bg-surface-raised rounded-xl border border-border-subtle p-5 text-left">
                <h3 className="text-sm font-semibold text-text-primary mb-1">Connect to Coffee Shop</h3>
                <p className="text-xs text-text-secondary">
                  Run <code className="text-accent bg-accent/5 px-1.5 py-0.5 rounded text-[0.7rem]">coffeeshop register</code> to connect to the agent network for job discovery.
                </p>
              </div>
              <div className="bg-surface-raised rounded-xl border border-border-subtle p-5 text-left">
                <h3 className="text-sm font-semibold text-text-primary mb-1">Add jobs to your pipeline</h3>
                <p className="text-xs text-text-secondary">
                  Create markdown files in <code className="text-accent bg-accent/5 px-1.5 py-0.5 rounded text-[0.7rem]">~/.talentclaw/jobs/</code> or let your agent discover them.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-text-primary mb-1">Dashboard</h1>
              <p className="text-sm text-text-secondary">Your career search at a glance.</p>
            </div>

            <StatsCards stats={stats} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
              {/* Activity Feed */}
              <div className="lg:col-span-2">
                <ActivityFeed entries={activityLog} />
              </div>

              {/* Upcoming deadlines */}
              <div>
                <div className="bg-surface-raised rounded-2xl border border-border-subtle p-6">
                  <h3 className="text-sm font-semibold text-text-primary mb-5">Upcoming Deadlines</h3>
                  {deadlines.length > 0 ? (
                    <div className="space-y-4">
                      {deadlines.map((deadline) => (
                        <div key={`${deadline.company}-${deadline.date}`} className="flex items-start gap-3">
                          <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                            deadline.urgent ? "bg-warning" : "bg-accent"
                          }`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-text-primary font-medium truncate">
                              {deadline.title}
                            </p>
                            <p className="text-xs text-text-muted">
                              {deadline.company} &middot; {deadline.date}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-text-muted">No upcoming deadlines.</p>
                  )}
                </div>

                {/* Quick actions */}
                <div className="bg-surface-raised rounded-2xl border border-border-subtle p-6 mt-5">
                  <h3 className="text-sm font-semibold text-text-primary mb-4">Quick Actions</h3>
                  <div className="space-y-2">
                    <Link
                      href="/jobs"
                      className="block w-full text-left px-4 py-3 rounded-xl bg-surface-overlay border border-border-subtle text-sm text-text-secondary hover:text-text-primary hover:border-accent/30 transition-colors"
                    >
                      Browse jobs
                    </Link>
                    <Link
                      href="/pipeline"
                      className="block w-full text-left px-4 py-3 rounded-xl bg-surface-overlay border border-border-subtle text-sm text-text-secondary hover:text-text-primary hover:border-accent/30 transition-colors"
                    >
                      View pipeline
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}

function isWithinDays(dateStr: string, days: number): boolean {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = date.getTime() - now.getTime()
  return diffMs >= 0 && diffMs <= days * 24 * 60 * 60 * 1000
}
