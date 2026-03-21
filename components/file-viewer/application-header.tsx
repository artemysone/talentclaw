import { formatDate, STATUS_COLORS } from "@/lib/ui-utils"

interface ApplicationHeaderProps {
  frontmatter: Record<string, unknown>
}

export function ApplicationHeader({ frontmatter }: ApplicationHeaderProps) {
  const job = frontmatter.job as string | undefined
  const status = (frontmatter.status as string) || "applied"
  const appliedAt = frontmatter.applied_at as string | undefined
  const nextStep = frontmatter.next_step as string | undefined
  const nextStepDate = frontmatter.next_step_date as string | undefined
  const colors = STATUS_COLORS[status as keyof typeof STATUS_COLORS] || STATUS_COLORS.applied

  return (
    <div className="bg-surface-raised border border-border-subtle rounded-xl p-6 space-y-4">
      {/* Top row */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold text-text-primary leading-tight">
            Application
          </h1>
          {job && (
            <p className="text-text-secondary mt-0.5">
              Job: <span className="font-medium text-text-primary">{job}</span>
            </p>
          )}
        </div>
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${colors.bg} ${colors.text}`}
        >
          {status}
        </span>
      </div>

      {/* Details */}
      <div className="flex flex-wrap items-center gap-3 text-sm text-text-secondary">
        {appliedAt && (
          <span>Applied {formatDate(appliedAt)}</span>
        )}
      </div>

      {/* Next step */}
      {nextStep && (
        <div className="bg-surface-overlay border border-border-subtle rounded-lg p-4">
          <p className="text-xs uppercase text-text-muted tracking-wide mb-1">
            Next Step
          </p>
          <p className="text-sm text-text-primary font-medium">{nextStep}</p>
          {nextStepDate && (
            <p className="text-xs text-text-muted mt-1">
              {formatDate(nextStepDate)}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
