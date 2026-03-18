import { CrabLogo } from "@/components/crab-logo"
import { CoffeeShopLogo } from "@/components/coffeeshop-logo"
import { SidebarNav } from "./sidebar-nav"
import { ThemeToggle } from "./theme-toggle"
import type { TreeNode } from "@/lib/types"
import type { CoffeeShopStatus } from "@/lib/fs-data"

interface SidebarProps {
  jobCount: number
  activeCount: number
  tree: TreeNode[]
  coffeeShopStatus: CoffeeShopStatus
}

export function Sidebar({
  jobCount,
  activeCount,
  tree,
  coffeeShopStatus,
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

      {/* Coffee Shop connection status */}
      <div className="shrink-0 border-t border-border-sidebar px-4 py-3">
        <div className="flex items-center gap-2.5">
          <CoffeeShopLogo className="w-5 h-5" />
          {coffeeShopStatus.connected ? (
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span className="text-xs text-text-secondary truncate">
                  {coffeeShopStatus.agentId || "Connected"}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-text-muted/40 shrink-0" />
              <span className="text-xs text-text-muted">Not connected</span>
            </div>
          )}
        </div>
      </div>

      {/* Theme toggle */}
      <div className="shrink-0 border-t border-border-sidebar px-4 py-3 flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-wider text-text-muted">
          Theme
        </span>
        <ThemeToggle />
      </div>
    </>
  )
}
