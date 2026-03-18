import Link from "next/link"
import { STAGE_LABELS } from "@/lib/ui-utils"
import type { FunnelStage } from "@/lib/analytics"

const stageFillColors: Record<string, string> = {
  discovered: "bg-slate-400",
  saved: "bg-blue-500",
  applied: "bg-accent",
  interviewing: "bg-violet-500",
  offer: "bg-emerald-500",
  accepted: "bg-green-500",
}

const stageTextColors: Record<string, string> = {
  discovered: "text-slate-600",
  saved: "text-blue-600",
  applied: "text-accent",
  interviewing: "text-violet-600",
  offer: "text-emerald-600",
  accepted: "text-green-600",
}

interface PipelineFunnelChartProps {
  funnel: FunnelStage[]
}

export function PipelineFunnelChart({ funnel }: PipelineFunnelChartProps) {
  const maxCount = Math.max(...funnel.map((s) => s.count), 1)
  const totalJobs = funnel[0]?.count ?? 0

  return (
    <div className="bg-surface-raised rounded-2xl border border-border-subtle p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-prose text-lg text-text-primary">Pipeline Funnel</h3>
        <Link
          href="/pipeline"
          className="text-xs text-accent hover:text-accent-hover transition-colors"
        >
          View board &rarr;
        </Link>
      </div>

      {totalJobs === 0 ? (
        <div className="py-6 text-center">
          <p className="text-sm text-text-muted">No jobs in your pipeline yet.</p>
          <p className="text-xs text-text-muted mt-1">
            Run{" "}
            <code className="text-accent bg-accent/5 px-1 py-0.5 rounded text-[0.7rem]">
              talentclaw search
            </code>{" "}
            or ask your agent to discover opportunities.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {funnel.map((stage) => {
            const widthPercent = Math.max(
              (stage.count / maxCount) * 100,
              stage.count > 0 ? 8 : 0,
            )
            const fill = stageFillColors[stage.stage] ?? "bg-slate-300"
            const textColor = stageTextColors[stage.stage] ?? "text-text-secondary"

            return (
              <div key={stage.stage} className="flex items-center gap-3">
                <div className="w-24 shrink-0 text-right">
                  <span className="text-xs font-medium text-text-secondary">
                    {STAGE_LABELS[stage.stage]}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="h-7 bg-surface-overlay rounded-lg overflow-hidden relative">
                    {stage.count > 0 && (
                      <div
                        className={`h-full ${fill} rounded-lg transition-all duration-500 ease-out flex items-center`}
                        style={{ width: `${widthPercent}%`, minWidth: "2rem" }}
                      >
                        <span className="text-xs font-semibold text-white px-2.5 whitespace-nowrap">
                          {stage.count}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="w-14 shrink-0 text-right">
                  {stage.conversionFromPrevious !== null ? (
                    <span className={`text-xs font-medium ${textColor}`}>
                      {stage.conversionFromPrevious}%
                    </span>
                  ) : (
                    <span className="text-xs text-text-muted">&mdash;</span>
                  )}
                </div>
              </div>
            )
          })}

          <div className="mt-2 pt-3 border-t border-border-subtle flex items-center justify-between">
            <span className="text-[10px] text-text-muted uppercase tracking-wider">
              Stage
            </span>
            <span className="text-[10px] text-text-muted uppercase tracking-wider">
              Conversion
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
