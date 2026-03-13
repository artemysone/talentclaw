"use client"

import {
  Search,
  Send,
  MessageSquare,
  CheckCircle,
  Bookmark,
  Star,
  Activity,
} from "lucide-react"
import type { ActivityEntry } from "@/lib/types"
import { formatRelativeTime } from "@/lib/ui-utils"

const activityIcons: Record<string, React.ReactNode> = {
  discovered: <Search className="w-4 h-4" />,
  applied: <Send className="w-4 h-4" />,
  message: <MessageSquare className="w-4 h-4" />,
  saved: <Bookmark className="w-4 h-4" />,
  status_changed: <Activity className="w-4 h-4" />,
  interview: <Star className="w-4 h-4" />,
  offer: <CheckCircle className="w-4 h-4" />,
}

const activityColors: Record<string, string> = {
  discovered: "bg-accent-subtle text-accent",
  applied: "bg-violet-500/10 text-violet-500",
  message: "bg-emerald-500/10 text-emerald-500",
  saved: "bg-blue-500/10 text-blue-500",
  status_changed: "bg-slate-500/10 text-slate-400",
  interview: "bg-amber-500/10 text-amber-500",
  offer: "bg-green-500/10 text-green-500",
}

interface ActivityFeedProps {
  entries: ActivityEntry[]
}

export function ActivityFeed({ entries }: ActivityFeedProps) {
  return (
    <div className="bg-surface-raised rounded-2xl border border-border-subtle p-6 h-[350px] xl:h-[420px] 2xl:h-[480px] flex flex-col">
      <div className="flex items-center gap-3 mb-5 shrink-0">
        <h3 className="text-sm font-semibold text-text-primary">
          Recent Activity
        </h3>
        <span className="text-[10px] font-mono text-text-muted/60">
          activity.log
        </span>
      </div>

      {entries.length > 0 ? (
        <>
          <div className="space-y-1 overflow-y-auto min-h-0">
            {entries.map((entry, i) => (
              <div
                key={`${entry.ts}-${i}`}
                className="flex items-start gap-3.5 py-3 border-b border-border-subtle last:border-0"
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    activityColors[entry.type] ||
                    "bg-surface-overlay text-text-muted"
                  }`}
                >
                  {activityIcons[entry.type] || (
                    <Activity className="w-4 h-4" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary">
                    {entry.summary}
                  </p>
                  {entry.slug && (
                    <p className="text-xs text-text-secondary mt-0.5 truncate">
                      {entry.slug}
                    </p>
                  )}
                </div>

                <span className="text-xs text-text-muted shrink-0 whitespace-nowrap">
                  {formatRelativeTime(entry.ts)}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-border-subtle">
            <span className="text-xs text-text-muted">
              Showing last {entries.length} entries
            </span>
          </div>
        </>
      ) : (
        <p className="text-sm text-text-muted py-4">
          No activity yet. Start by adding jobs to your pipeline.
        </p>
      )}
    </div>
  )
}
