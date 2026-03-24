"use client"

import { useState, useEffect } from "react"
import { CrabLogo } from "@/components/crab-logo"

/** Full-width window title bar — houses macOS traffic lights and toolbar.
 *  Only renders inside Electron (detected via window.talentclaw from preload).
 *  The entire bar is a drag region; interactive elements opt out. */
export function TitleBar() {
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
      {/* Center: branding */}
      <div className="absolute inset-0 flex items-center justify-center gap-1.5 pointer-events-none">
        <CrabLogo className="w-4 h-4 text-accent" />
        <span className="text-[13px] font-semibold tracking-tight text-text-muted">
          talentclaw
        </span>
      </div>
    </header>
  )
}
