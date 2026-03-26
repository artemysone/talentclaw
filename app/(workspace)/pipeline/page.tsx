import { PipelineBoard } from "@/components/pipeline/pipeline-board"
import { PIPELINE_DISPLAY_STAGES } from "@/lib/types"
import { listJobs, getProfile } from "@/lib/fs-data"
import { calculateMatchBreakdown } from "@/lib/match-scoring"
import { formatCompensation } from "@/lib/ui-utils"
import type { KanbanCardData } from "@/components/kanban/card"

export default async function PipelinePage() {
  const [jobs, profile] = await Promise.all([listJobs(), getProfile()])

  const data: Record<string, KanbanCardData[]> = {}
  for (const stage of PIPELINE_DISPLAY_STAGES) {
    data[stage] = []
  }

  for (const job of jobs) {
    // Merge "saved" into "discovered" — saved is no longer a visible stage
    const stage = job.frontmatter.status === "saved" ? "discovered" : job.frontmatter.status
    if (data[stage]) {
      const fm = job.frontmatter
      const breakdown = fm.match_score != null
        ? calculateMatchBreakdown(profile.frontmatter, fm)
        : null
      data[stage].push({
        id: job.slug,
        title: fm.title,
        company: fm.company,
        appliedDate: fm.discovered_at || null,
        nextAction: null,
        matchScore: fm.match_score ?? null,
        matchBreakdown: breakdown,
        location: fm.location || null,
        remote: fm.remote || null,
        compensation: fm.compensation
          ? formatCompensation({ min: fm.compensation.min, max: fm.compensation.max })
          : null,
        url: fm.url || null,
        tags: fm.tags || [],
      })
    }
  }

  return (
    <div className="w-full max-w-[1080px] mx-auto px-8 pt-14 pb-8">
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
