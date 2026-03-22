"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, MessageCircle, Briefcase, KanbanSquare, User, X } from "lucide-react"
import { useSidebar } from "./sidebar-wrapper"
import { FileTree } from "./file-tree"
import type { TreeNode } from "@/lib/types"

interface SidebarNavProps {
  jobCount: number
  activeCount: number
  tree: TreeNode[]
}

export function SidebarNav({
  jobCount,
  activeCount,
  tree,
}: SidebarNavProps) {
  const pathname = usePathname()
  const { setOpen, collapsed } = useSidebar()

  const navItems = [
    {
      href: "/dashboard",
      label: "Career Hub",
      icon: <Home className="w-4 h-4" />,
      count: 0,
    },
    {
      href: "/chat",
      label: "Chat",
      icon: <MessageCircle className="w-4 h-4" />,
      count: 0,
    },
    {
      href: "/jobs",
      label: "Jobs",
      icon: <Briefcase className="w-4 h-4" />,
      count: jobCount,
    },
    {
      href: "/pipeline",
      label: "Pipeline",
      icon: <KanbanSquare className="w-4 h-4" />,
      count: activeCount,
    },
    {
      href: "/profile",
      label: "Profile",
      icon: <User className="w-4 h-4" />,
      count: 0,
    },
  ]

  const handleNav = () => setOpen(false)

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden">
      {/* Mobile close button */}
      <div className="flex items-center justify-end px-3 pt-2 md:hidden">
        <button
          onClick={() => setOpen(false)}
          className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-overlay transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Views section label */}
      {!collapsed && (
        <div className="text-[11px] font-medium uppercase tracking-wider text-text-muted px-3 py-2 pt-4">
          Views
        </div>
      )}

      {/* Main nav */}
      <nav className={`px-2 pb-3 ${collapsed ? "pt-3" : ""}`}>
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={handleNav}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-3 rounded-lg text-sm transition-colors ${
                collapsed
                  ? `w-8 h-8 justify-center mx-auto mb-1 ${
                      isActive
                        ? "bg-accent-subtle text-accent"
                        : "text-text-secondary hover:text-text-primary hover:bg-surface-overlay"
                    }`
                  : `px-3 py-2 ${
                      isActive
                        ? "bg-accent-subtle text-accent font-medium border-l-2 border-accent -ml-[2px]"
                        : "text-text-secondary hover:text-text-primary hover:bg-surface-overlay"
                    }`
              }`}
            >
              {item.icon}
              {!collapsed && <span>{item.label}</span>}
              {!collapsed && item.count > 0 && (
                <span className="ml-auto text-[11px] text-text-muted bg-surface-overlay px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                  {item.count}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Files section — hidden when collapsed */}
      {!collapsed && (
        <>
          <div className="text-[11px] font-medium uppercase tracking-wider text-text-muted px-3 py-2">
            Files
          </div>
          <div className="px-2 pb-4">
            <FileTree tree={tree} />
          </div>
        </>
      )}
    </div>
  )
}
