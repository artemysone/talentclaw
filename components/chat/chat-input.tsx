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
    el.style.height = `${Math.min(el.scrollHeight, 192)}px`
  }, [])

  useEffect(() => {
    resize()
  }, [value, resize])

  const handleSend = useCallback(() => {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setValue("")
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
    <div
      className="bg-surface-raised border border-border-subtle rounded-2xl
        focus-within:border-accent/30 transition-colors shadow-sm"
    >
      {/* Textarea area */}
      <div className="px-5 pt-4 pb-2">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? "Waiting for response..." : "How can I help you today?"}
          disabled={disabled}
          rows={1}
          className="w-full resize-none bg-transparent text-base text-text-primary placeholder:text-text-muted
            outline-none min-h-[28px] max-h-[192px] leading-7 disabled:opacity-60"
          aria-label="Chat message input"
        />
      </div>

      {/* Bottom toolbar */}
      <div className="flex items-center justify-end px-3 pb-3">
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
