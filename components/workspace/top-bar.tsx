"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { Menu } from "lucide-react"
import { useSidebar } from "./sidebar-wrapper"

const pageNames: Record<string, string> = {
  "/dashboard": "Career Hub",
  "/pipeline": "Pipeline",
  "/jobs": "Jobs",
}

function FileBreadcrumb({ pathname }: { pathname: string }) {
  const raw = pathname.replace(/^\/file\//, "")
  const segments = raw.split("/").filter(Boolean).map(decodeURIComponent)

  return (
    <nav className="flex items-center gap-1 font-mono text-xs text-text-muted min-w-0">
      <Link
        href="/dashboard"
        className="hover:text-text-primary transition-colors shrink-0"
      >
        ~/.talentclaw
      </Link>
      {segments.map((seg, i) => {
        const isLast = i === segments.length - 1
        return (
          <span key={i} className="flex items-center gap-1 min-w-0">
            <span className="text-text-muted/40 shrink-0">/</span>
            <span
              className={
                isLast
                  ? "text-text-primary font-medium truncate"
                  : "truncate"
              }
            >
              {seg}
            </span>
          </span>
        )
      })}
    </nav>
  )
}

export function TopBar() {
  const pathname = usePathname()
  const { toggle } = useSidebar()
  const pageName = pageNames[pathname] || "Career Hub"
  const isFilePath = pathname.startsWith("/file/")

  if (pathname === "/dashboard" || pathname === "/jobs" || pathname === "/pipeline") return null

  return (
    <header className="h-12 flex items-center justify-between px-5 border-b border-border-subtle bg-surface/80 backdrop-blur-sm shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={toggle}
          className="md:hidden p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-overlay transition-colors cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>
        {isFilePath ? (
          <FileBreadcrumb pathname={pathname} />
        ) : (
          <span className="text-sm font-medium text-text-primary">
            {pageName}
          </span>
        )}
      </div>
    </header>
  )
}
