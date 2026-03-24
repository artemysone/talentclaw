"use client"

import { usePathname } from "next/navigation"
import { Menu } from "lucide-react"
import { useSidebar } from "./sidebar-wrapper"

const pageNames: Record<string, string> = {
  "/dashboard": "Career Hub",
  "/pipeline": "Pipeline",
}

const hiddenTopBarRoutes = new Set([...Object.keys(pageNames), "/profile", "/chat"])

export function TopBar() {
  const pathname = usePathname()
  const { toggle } = useSidebar()
  const pageName = pageNames[pathname] || "Career Hub"

  if (hiddenTopBarRoutes.has(pathname)) return null

  return (
    <header className="h-12 flex items-center justify-between px-5 border-b border-border-subtle bg-surface/80 backdrop-blur-sm shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={toggle}
          className="md:hidden p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-overlay transition-colors cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>
        <span className="text-sm font-medium text-text-primary">
          {pageName}
        </span>
      </div>
    </header>
  )
}
