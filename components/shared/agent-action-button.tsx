"use client"

import { useState, type ReactNode } from "react"
import { useChatContext } from "@/components/chat/chat-provider"
import { Loader2 } from "lucide-react"

interface AgentActionButtonProps {
  prompt: string
  label: string
  icon?: ReactNode
  size?: "sm" | "md"
  variant?: "primary" | "secondary"
}

export function AgentActionButton({
  prompt,
  label,
  icon,
  size = "sm",
  variant = "secondary",
}: AgentActionButtonProps) {
  const { sendPrefilled } = useChatContext()
  const [checking, setChecking] = useState(false)
  const [unavailable, setUnavailable] = useState(false)

  const handleClick = async (e: React.MouseEvent) => {
    // Stop propagation so it doesn't interfere with drag handlers on pipeline cards
    e.stopPropagation()

    setChecking(true)
    setUnavailable(false)

    try {
      const res = await fetch("/api/agent/status")
      const data: { available: boolean; connected: boolean } = await res.json()

      if (data.available && data.connected) {
        sendPrefilled(prompt)
      } else {
        setUnavailable(true)
        setTimeout(() => setUnavailable(false), 3000)
      }
    } catch {
      setUnavailable(true)
      setTimeout(() => setUnavailable(false), 3000)
    } finally {
      setChecking(false)
    }
  }

  const sizeClasses =
    size === "sm"
      ? "px-2.5 py-1 text-[0.7rem] gap-1"
      : "px-3.5 py-1.5 text-xs gap-1.5"

  const variantClasses =
    variant === "primary"
      ? "bg-accent text-white hover:bg-accent-hover"
      : "bg-accent-subtle text-accent hover:bg-accent/15"

  if (unavailable) {
    return (
      <span
        className={`inline-flex items-center rounded-md font-medium text-text-muted bg-surface-overlay ${sizeClasses}`}
      >
        Agent not connected
      </span>
    )
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={checking}
      className={`inline-flex items-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50 ${sizeClasses} ${variantClasses}`}
    >
      {checking ? (
        <Loader2 className={`animate-spin ${size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"}`} />
      ) : (
        icon
      )}
      {label}
    </button>
  )
}
