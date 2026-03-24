import { PipelineBoard } from "@/components/pipeline/pipeline-board"
import { PIPELINE_STAGES } from "@/lib/types"
import { listJobs, getProfile } from "@/lib/fs-data"
import { calculateMatchBreakdown } from "@/lib/match-scoring"
import type { KanbanCardData } from "@/components/kanban/card"

export default async function PipelinePage() {
  const [jobs, profile] = await Promise.all([listJobs(), getProfile()])

  const data: Record<string, KanbanCardData[]> = {}
  for (const stage of PIPELINE_STAGES) {
    data[stage] = []
  }

  for (const job of jobs) {
    const stage = job.frontmatter.status
    if (data[stage]) {
      const breakdown = job.frontmatter.match_score != null
        ? calculateMatchBreakdown(profile.frontmatter, job.frontmatter)
        : null
      data[stage].push({
        id: job.slug,
        title: job.frontmatter.title,
        company: job.frontmatter.company,
        appliedDate: job.frontmatter.discovered_at || null,
        nextAction: null,
        matchScore: job.frontmatter.match_score ?? null,
        matchBreakdown: breakdown,
      })
    }
  }

  return (
    <div className="w-full max-w-[1080px] mx-auto px-8 py-8">
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
        <PipelineBoard initialData={data} />
      )}
    </div>
  )
}
