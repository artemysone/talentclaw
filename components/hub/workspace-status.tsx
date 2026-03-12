interface WorkspaceStatusProps {
  fileCount: number
  lastModified: string | null
  dataDir: string
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function WorkspaceStatus({
  fileCount,
  lastModified,
  dataDir,
}: WorkspaceStatusProps) {
  const shortDir = dataDir.replace(/^\/Users\/[^/]+/, "~")

  return (
    <div className="bg-surface-raised rounded-2xl border border-border-subtle p-5">
      <div className="font-mono text-xs text-text-muted space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-accent">$</span>
          <span>
            {shortDir} | {fileCount} files
            {lastModified && ` | updated ${formatRelativeTime(lastModified)}`}
          </span>
        </div>
      </div>
    </div>
  )
}
