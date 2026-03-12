import { formatRelativeTime } from "@/lib/ui-utils"

interface WorkspaceStatusProps {
  fileCount: number
  lastModified: string | null
  dataDir: string
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
