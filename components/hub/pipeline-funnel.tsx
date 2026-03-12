import Link from "next/link"
import { PIPELINE_STAGES } from "@/lib/types"

const stageColors: Record<string, string> = {
  discovered: "bg-slate-500/15 text-slate-600 border-slate-200",
  saved: "bg-blue-500/10 text-blue-600 border-blue-200",
  applied: "bg-accent-subtle text-accent border-accent/20",
  interviewing: "bg-violet-500/10 text-violet-600 border-violet-200",
  offer: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
  accepted: "bg-green-500/10 text-green-600 border-green-200",
  rejected: "bg-red-500/10 text-red-500 border-red-200",
}

const stageLabels: Record<string, string> = {
  discovered: "Discovered",
  saved: "Saved",
  applied: "Applied",
  interviewing: "Interviewing",
  offer: "Offer",
  accepted: "Accepted",
  rejected: "Rejected",
}

const FUNNEL_STAGES = PIPELINE_STAGES.filter((s) => s !== "rejected")

interface PipelineFunnelProps {
  stageCounts: Record<string, number>
}

export function PipelineFunnel({ stageCounts }: PipelineFunnelProps) {
  const total = Object.values(stageCounts).reduce((a, b) => a + b, 0)

  return (
    <div className="bg-surface-raised rounded-2xl border border-border-subtle p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-text-primary">Pipeline</h3>
        <Link
          href="/pipeline"
          className="text-xs text-accent hover:text-accent-hover transition-colors"
        >
          View board &rarr;
        </Link>
      </div>

      {total === 0 ? (
        <p className="text-sm text-text-muted py-2">
          No jobs in your pipeline yet.
        </p>
      ) : (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {FUNNEL_STAGES.map((stage, i) => {
            const count = stageCounts[stage] || 0
            return (
              <div key={stage} className="flex items-center gap-1.5 shrink-0">
                {i > 0 && (
                  <div className="text-text-muted/40 text-xs">&rarr;</div>
                )}
                <Link
                  href="/pipeline"
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors hover:opacity-80 ${
                    count > 0
                      ? stageColors[stage]
                      : "bg-surface-overlay text-text-muted border-border-subtle"
                  }`}
                >
                  {stageLabels[stage]} {count}
                </Link>
              </div>
            )
          })}
        </div>
      )}

      {(stageCounts.rejected || 0) > 0 && (
        <div className="mt-3 pt-3 border-t border-border-subtle">
          <span className="text-xs text-text-muted">
            {stageCounts.rejected} rejected
          </span>
        </div>
      )}
    </div>
  )
}
