import { SidebarBrand } from "./sidebar-brand"
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
      <SidebarBrand />

      {/* Navigation (client) */}
      <SidebarNav
        jobCount={jobCount}
        activeCount={activeCount}
        tree={tree}
      />
    </>
  )
}
