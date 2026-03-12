import { Cog } from "lucide-react"
import { SidebarNav } from "./sidebar-nav"
import type { TreeNode } from "@/lib/types"

interface SidebarProps {
  profile: {
    display_name?: string
    headline?: string
    availability?: string
  }
  jobCount: number
  activeCount: number
  tree: TreeNode[]
  fileCount: number
}

const availabilityConfig: Record<string, { dot: string; label: string }> = {
  active: { dot: "bg-emerald-500", label: "Actively looking" },
  passive: { dot: "bg-amber-400", label: "Open to opportunities" },
  not_looking: { dot: "bg-stone-400", label: "Not looking" },
}

export function Sidebar({
  profile,
  jobCount,
  activeCount,
  tree,
  fileCount,
}: SidebarProps) {
  const avail = profile.availability
    ? availabilityConfig[profile.availability]
    : null

  return (
    <>
      {/* Brand */}
      <div className="px-5 h-14 flex items-center gap-2.5 border-b border-border-sidebar shrink-0">
        <div className="w-7 h-7 rounded-md bg-accent flex items-center justify-center">
          <Cog className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="text-[15px] font-semibold tracking-tight text-text-primary">
          TalentClaw
        </span>
      </div>

      {/* Profile */}
      <div className="px-5 py-4 border-b border-border-sidebar">
        {profile.display_name ? (
          <>
            <p className="text-sm font-semibold text-text-primary">
              {profile.display_name}
            </p>
            {profile.headline && (
              <p className="text-xs text-text-secondary mt-0.5 leading-snug">
                {profile.headline}
              </p>
            )}
            {avail && (
              <div className="flex items-center gap-1.5 mt-2.5">
                <div className={`w-2 h-2 rounded-full ${avail.dot}`} />
                <span className="text-[11px] text-text-muted">
                  {avail.label}
                </span>
              </div>
            )}
            <p className="text-[10px] font-mono text-text-muted/60 mt-2">
              ~/.talentclaw/
            </p>
          </>
        ) : (
          <p className="text-xs text-text-muted italic">No profile yet</p>
        )}
      </div>

      {/* Navigation (client) */}
      <SidebarNav
        jobCount={jobCount}
        activeCount={activeCount}
        tree={tree}
      />

      {/* Footer */}
      <div className="mt-auto px-5 py-4 border-t border-border-sidebar">
        <p className="text-[11px] font-mono text-text-muted">
          {fileCount} files in ~/.talentclaw/
        </p>
      </div>
    </>
  )
}
