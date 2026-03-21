import type { PipelineStage } from "@/lib/types"
import { formatDate, STATUS_COLORS, isSafeUrl, formatCompensation } from "@/lib/ui-utils"

interface JobHeaderProps {
  frontmatter: Record<string, unknown>
}

const sourceLabels: Record<string, string> = {
  web_search: "Web Search",
  manual: "Manual",
  referral: "Referral",
}

function scoreColor(score: number): string {
  if (score >= 80) return "bg-emerald-500"
  if (score >= 60) return "bg-amber-500"
  return "bg-red-400"
}

export function JobHeader({ frontmatter }: JobHeaderProps) {
  const title = frontmatter.title as string | undefined
  const company = frontmatter.company as string | undefined
  const status = (frontmatter.status as PipelineStage) || "discovered"
  const location = frontmatter.location as string | undefined
  const remote = frontmatter.remote as string | undefined
  const compensation = frontmatter.compensation as Record<string, unknown> | undefined
  const matchScore = frontmatter.match_score as number | undefined
  const tags = frontmatter.tags as string[] | undefined
  const source = frontmatter.source as string | undefined
  const discoveredAt = frontmatter.discovered_at as string | undefined
  const url = frontmatter.url as string | undefined

  const compString = compensation ? formatCompensation(compensation) : null
  const colors = STATUS_COLORS[status] || STATUS_COLORS.discovered

  return (
    <div className="bg-surface-raised border border-border-subtle rounded-xl p-6 space-y-4">
      {/* Title row */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold text-text-primary leading-tight">
            {title || "Untitled"}
          </h1>
          {company && (
            <p className="text-text-secondary mt-0.5">{company}</p>
          )}
        </div>
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${colors.bg} ${colors.text}`}
        >
          {status}
        </span>
      </div>

      {/* Details row */}
      <div className="flex flex-wrap items-center gap-3 text-sm text-text-secondary">
        {location && <span>{location}</span>}
        {remote && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
            {remote}
          </span>
        )}
        {compString && (
          <span className="font-medium text-text-primary">{compString}</span>
        )}
        {source && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-surface-overlay text-text-secondary">
            {sourceLabels[source] || source}
          </span>
        )}
        {discoveredAt && (
          <span className="text-text-muted text-xs">
            {formatDate(discoveredAt)}
          </span>
        )}
      </div>

      {/* Match score */}
      {typeof matchScore === "number" && (
        <div className="flex items-center gap-3">
          <span className="text-xs text-text-muted uppercase tracking-wide">
            Match
          </span>
          <div className="flex-1 max-w-48 h-2 bg-surface-overlay rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${scoreColor(matchScore)}`}
              style={{ width: `${matchScore}%` }}
            />
          </div>
          <span className="text-xs font-medium text-text-primary">
            {matchScore}%
          </span>
        </div>
      )}

      {/* Tags */}
      {tags && tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-surface-overlay text-text-secondary"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* URL */}
      {url && isSafeUrl(url) && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-accent hover:underline"
        >
          View listing &rarr;
        </a>
      )}
    </div>
  )
}
