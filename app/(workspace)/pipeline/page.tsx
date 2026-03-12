import { KanbanBoard } from "@/components/kanban/board"
import { PIPELINE_STAGES } from "@/lib/types"
import { listJobs } from "@/lib/fs-data"
import type { KanbanCardData } from "@/components/kanban/card"

export default async function PipelinePage() {
  const jobs = await listJobs()

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
    <div className="p-5">
      {jobs.length === 0 ? (
        <div className="text-center py-24">
          <p className="text-text-secondary text-sm">
            No jobs in your pipeline yet.
          </p>
          <p className="text-text-muted text-xs mt-1">
            Run{" "}
            <code className="text-accent bg-accent/5 px-1.5 py-0.5 rounded text-[0.7rem]">
              talentclaw search
            </code>{" "}
            to discover opportunities.
          </p>
        </div>
      ) : (
        <KanbanBoard initialData={data} />
      )}
    </div>
  )
}
