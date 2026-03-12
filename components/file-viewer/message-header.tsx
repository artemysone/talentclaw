import { formatDate } from "@/lib/ui-utils"

interface MessageHeaderProps {
  frontmatter: Record<string, unknown>
}

export function MessageHeader({ frontmatter }: MessageHeaderProps) {
  const direction = frontmatter.direction as string | undefined
  const from = frontmatter.from as string | undefined
  const to = frontmatter.to as string | undefined
  const sentAt = frontmatter.sent_at as string | undefined
  const coffeeshopId = frontmatter.coffeeshop_message_id as string | undefined

  const isInbound = direction === "inbound"

  return (
    <div className="bg-surface-raised border border-border-subtle rounded-xl p-6 space-y-4">
      {/* Direction + date */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold text-text-primary leading-tight">
            Message
          </h1>
        </div>
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${
            isInbound
              ? "bg-blue-100 text-blue-700"
              : "bg-emerald-100 text-emerald-700"
          }`}
        >
          {isInbound ? "Received" : "Sent"}
        </span>
      </div>

      {/* From / To */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        {from && (
          <div>
            <span className="text-xs uppercase text-text-muted tracking-wide">
              From
            </span>
            <p className="text-text-primary mt-0.5">{from}</p>
          </div>
        )}
        {to && (
          <div>
            <span className="text-xs uppercase text-text-muted tracking-wide">
              To
            </span>
            <p className="text-text-primary mt-0.5">{to}</p>
          </div>
        )}
      </div>

      {/* Footer details */}
      <div className="flex flex-wrap items-center gap-3 text-sm text-text-secondary">
        {sentAt && (
          <span className="text-text-muted text-xs">{formatDate(sentAt, { includeTime: true })}</span>
        )}
        {coffeeshopId && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-surface-overlay text-text-secondary">
            Coffee Shop
          </span>
        )}
      </div>
    </div>
  )
}
