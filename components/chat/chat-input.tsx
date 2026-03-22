"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { ArrowUp } from "lucide-react"

export function ChatInput({
  onSend,
  disabled = false,
}: {
  onSend: (text: string) => void
  disabled?: boolean
}) {
  const [value, setValue] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  const resize = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = "auto"
    // Clamp between 1 and 4 lines (approx 24px per line)
    el.style.height = `${Math.min(el.scrollHeight, 96)}px`
  }, [])

  useEffect(() => {
    resize()
  }, [value, resize])

  const handleSend = useCallback(() => {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setValue("")
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
    }
  }, [value, disabled, onSend])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend]
  )

  const canSend = value.trim().length > 0 && !disabled

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-end gap-2 bg-surface-raised border border-border-subtle rounded-xl px-3 py-2
        focus-within:border-accent/30 transition-colors">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? "Waiting for response..." : "Ask TalentClaw anything..."}
          disabled={disabled}
          rows={1}
          className="flex-1 resize-none bg-transparent text-sm text-text-primary placeholder:text-text-muted
            outline-none min-h-[24px] max-h-[96px] leading-6 disabled:opacity-60"
          aria-label="Chat message input"
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={!canSend}
          className={`
            flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all
            ${canSend
              ? "bg-accent text-white hover:bg-accent-hover active:scale-95"
              : "bg-surface-overlay text-text-muted cursor-not-allowed"
            }
          `}
          aria-label="Send message"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
