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
  applied: "bg-violet-subtle text-violet",
  message: "bg-emerald-500/10 text-emerald-400",
  saved: "bg-blue-500/10 text-blue-400",
  status_changed: "bg-slate-500/10 text-slate-400",
  interview: "bg-amber-500/10 text-amber-400",
  offer: "bg-green-500/10 text-green-400",
}

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return "Yesterday"
  return `${days}d ago`
}

interface ActivityFeedProps {
  entries: ActivityEntry[]
}

export function ActivityFeed({ entries }: ActivityFeedProps) {
  return (
    <div className="bg-surface-raised rounded-2xl border border-border-subtle p-6">
      <h3 className="text-sm font-semibold text-text-primary mb-5">Recent Activity</h3>

      {entries.length > 0 ? (
        <div className="space-y-1">
          {entries.map((entry, i) => (
            <div
              key={`${entry.ts}-${i}`}
              className="flex items-start gap-3.5 py-3 border-b border-border-subtle last:border-0"
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${activityColors[entry.type] || "bg-surface-overlay text-text-muted"}`}>
                {activityIcons[entry.type] || <Activity className="w-4 h-4" />}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary">{entry.summary}</p>
                {entry.slug && (
                  <p className="text-xs text-text-secondary mt-0.5 truncate">{entry.slug}</p>
                )}
              </div>

              <span className="text-xs text-text-muted shrink-0 whitespace-nowrap">
                {timeAgo(entry.ts)}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-text-muted py-4">No activity yet. Start by adding jobs to your pipeline.</p>
      )}
    </div>
  )
}
