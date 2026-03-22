"use client"

import { PanelLeftClose, PanelLeftOpen } from "lucide-react"
import { CrabLogo } from "@/components/crab-logo"
import { useSidebar } from "./sidebar-wrapper"

export function SidebarBrand() {
  const { collapsed, toggleCollapsed } = useSidebar()

  if (collapsed) {
    return (
      <div className="px-3 h-14 flex items-center justify-center shrink-0">
        <button
          onClick={toggleCollapsed}
          title="Expand sidebar"
          className="w-7 h-7 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-overlay transition-colors cursor-pointer"
        >
          <PanelLeftOpen className="w-4 h-4" />
        </button>
      </div>
    )
  }

  return (
    <div className="px-3 h-14 flex items-center gap-2.5 shrink-0">
      <div className="w-7 h-7 flex items-center justify-center shrink-0">
        <CrabLogo className="w-7 h-7 text-accent" />
      </div>
      <span className="text-[15px] font-semibold tracking-tight text-text-primary whitespace-nowrap overflow-hidden">
        talentclaw
      </span>
      <button
        onClick={toggleCollapsed}
        title="Collapse sidebar"
        className="ml-auto w-7 h-7 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-overlay transition-colors cursor-pointer shrink-0"
      >
        <PanelLeftClose className="w-4 h-4" />
      </button>
    </div>
  )
}
