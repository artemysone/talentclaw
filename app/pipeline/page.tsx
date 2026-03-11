import Link from "next/link"
import { Cog, Plus } from "lucide-react"
import { KanbanBoard } from "@/components/kanban/board"
import { PIPELINE_STAGES } from "@/lib/types"
import { listJobs } from "@/lib/fs-data"
import type { KanbanCardData } from "@/components/kanban/card"

export default async function PipelinePage() {
  const jobs = await listJobs()

  // Group jobs by status into KanbanCardData format
  const data: Record<string, KanbanCardData[]> = {}
  for (const stage of PIPELINE_STAGES) {
    data[stage] = []
  }

  for (const job of jobs) {
    const stage = job.frontmatter.status
    if (data[stage]) {
      data[stage].push({
        id: job.slug,
        title: job.frontmatter.title,
        company: job.frontmatter.company,
        appliedDate: job.frontmatter.discovered_at || null,
        nextAction: null,
        matchScore: job.frontmatter.match_score ?? null,
      })
    }
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-surface/95 backdrop-blur-md border-b border-border-subtle">
        <div className="max-w-[1800px] mx-auto px-5 flex items-center justify-between h-14">
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
            <span className="text-sm font-medium text-text-primary">Pipeline</span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/jobs"
              className="text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              Jobs
            </Link>
            <button className="flex items-center gap-1.5 bg-accent text-white px-3.5 py-1.5 rounded-lg text-sm font-medium hover:bg-accent-hover transition-colors cursor-pointer">
              <Plus className="w-3.5 h-3.5" />
              Add Job
            </button>
          </div>
        </div>
      </header>

      {/* Board */}
      <main className="p-5 max-w-[1800px] mx-auto">
        <KanbanBoard initialData={data} />
      </main>
    </div>
  )
}
