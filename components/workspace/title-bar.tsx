"use client"

import { useState, useEffect } from "react"
import { PanelLeftClose, PanelLeftOpen } from "lucide-react"
import { CrabLogo } from "@/components/crab-logo"
import { useSidebar } from "./sidebar-wrapper"

/** Full-width window title bar — houses macOS traffic lights and toolbar.
 *  Only renders inside Electron (detected via window.talentclaw from preload).
 *  The entire bar is a drag region; interactive elements opt out. */
export function TitleBar() {
  const { collapsed, toggleCollapsed } = useSidebar()
  const [isElectron, setIsElectron] = useState(false)

  useEffect(() => {
    setIsElectron("talentclaw" in window)
  }, [])

  if (!isElectron) return null

  return (
    <header
      style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
      className="shrink-0 h-[40px] relative flex items-center border-b border-border-sidebar bg-surface-sidebar"
    >
      {/* Center: branding (absolute so it doesn't affect button layout) */}
      <div className="absolute inset-0 flex items-center justify-center gap-1.5 pointer-events-none">
        <CrabLogo className="w-4 h-4 text-accent" />
        <span className="text-[13px] font-semibold tracking-tight text-text-muted">
          talentclaw
        </span>
      </div>

      {/* Left: traffic lights live here (rendered by OS), then sidebar toggle */}
      <div
        style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
        className="relative z-10 flex items-center pl-[88px]"
      >
        <button
          onClick={toggleCollapsed}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-overlay transition-colors cursor-pointer"
        >
          {collapsed ? (
            <PanelLeftOpen className="w-[18px] h-[18px]" />
          ) : (
            <PanelLeftClose className="w-[18px] h-[18px]" />
          )}
        </button>
      </div>
    </header>
  )
}
