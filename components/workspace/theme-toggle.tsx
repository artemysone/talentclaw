"use client"

import { useCallback, useEffect, useState } from "react"
import { Sun, Moon, Monitor } from "lucide-react"
import {
  type Theme,
  getStoredTheme,
  setStoredTheme,
  applyTheme,
} from "@/lib/theme"

const themes: { value: Theme; icon: typeof Sun; label: string }[] = [
  { value: "light", icon: Sun, label: "Light" },
  { value: "dark", icon: Moon, label: "Dark" },
  { value: "system", icon: Monitor, label: "System" },
]

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setTheme(getStoredTheme())
    setMounted(true)
  }, [])

  // Listen for system preference changes when in "system" mode
  useEffect(() => {
    if (theme !== "system") return

    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    const handler = () => applyTheme("system")
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [theme])

  const handleSetTheme = useCallback((next: Theme) => {
    setTheme(next)
    setStoredTheme(next)
    applyTheme(next)
  }, [])

  // Avoid hydration mismatch — render a placeholder until mounted
  if (!mounted) {
    return (
      <div className="flex items-center gap-0.5 rounded-lg bg-surface-overlay/50 p-0.5">
        {themes.map((t) => (
          <div
            key={t.value}
            className="w-7 h-7 rounded-md"
          />
        ))}
      </div>
    )
  }

  return (
    <div
      className="flex items-center gap-0.5 rounded-lg bg-surface-overlay/50 p-0.5"
      role="radiogroup"
      aria-label="Theme"
    >
      {themes.map((t) => {
        const isActive = t.value === theme
        const Icon = t.icon
        return (
          <button
            key={t.value}
            role="radio"
            aria-checked={isActive}
            aria-label={t.label}
            onClick={() => handleSetTheme(t.value)}
            className={`flex items-center justify-center w-7 h-7 rounded-md transition-colors cursor-pointer ${
              isActive
                ? "bg-surface-raised text-text-primary shadow-sm"
                : "text-text-muted hover:text-text-secondary"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
          </button>
        )
      })}
    </div>
  )
}
