import { SidebarNav } from "./sidebar-nav"

interface SidebarProps {
  jobCount: number
}

export function Sidebar({
  jobCount,
}: SidebarProps) {
  return (
    <SidebarNav
      jobCount={jobCount}
    />
  )
}
