import { CrabLogo } from "@/components/crab-logo"
import { SidebarNav } from "./sidebar-nav"
import type { TreeNode } from "@/lib/types"

interface SidebarProps {
  jobCount: number
  activeCount: number
  tree: TreeNode[]
}

export function Sidebar({
  jobCount,
  activeCount,
  tree,
}: SidebarProps) {
  return (
    <>
      {/* Brand */}
      <div className="px-5 h-14 flex items-center gap-2.5 border-b border-border-sidebar shrink-0">
        <CrabLogo className="w-7 h-7 text-accent" />
        <span className="text-[15px] font-semibold tracking-tight text-text-primary">
          talentclaw
        </span>
      </div>

      {/* Navigation (client) */}
      <SidebarNav
        jobCount={jobCount}
        activeCount={activeCount}
        tree={tree}
      />
    </>
  )
}
