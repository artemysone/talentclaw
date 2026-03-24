"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import Markdown from "react-markdown"
import remarkGfm from "remark-gfm"
import type { ChatMessage, ToolCallInfo } from "@/lib/agent/types"
import { getToolLabel } from "./tool-call-badge"

function getThinkingLabel(toolCalls?: ToolCallInfo[]): string {
  if (!toolCalls || toolCalls.length === 0) return "Thinking..."
  const running = [...toolCalls].reverse().find((tc) => tc.status === "running")
  if (!running) return "Thinking..."
  const label = getToolLabel(running.name, "running")
  return `${label}...`
}

function TypingIndicator({ toolCalls }: { toolCalls?: ToolCallInfo[] }) {
  const label = getThinkingLabel(toolCalls)

  return (
    <div className="flex items-center py-1" aria-label={label}>
      <span className="thinking-shimmer text-[15px] font-medium">
        {label}
      </span>
    </div>
  )
}

/** Strip <internal>...</internal> blocks from agent output */
function stripInternalTags(text: string, isStreaming: boolean): string {
  // Remove complete <internal>...</internal> blocks (including multiline)
  let result = text.replace(/<internal>[\s\S]*?<\/internal>/g, "")
  if (isStreaming) {
    // During streaming, hide content after an unclosed <internal> tag
    const openIdx = result.lastIndexOf("<internal>")
    if (openIdx !== -1) {
      result = result.slice(0, openIdx)
    }
  }
  return result.trim()
}

/** Normalize agent output to proper markdown */
function normalizeMarkdown(text: string): string {
  let result = text

  // Replace Unicode bullet lines → markdown list items
  result = result.replace(/•\s*/g, "\n- ")
  result = result.replace(/^\n- /, "- ")
  // Ensure blank line before list blocks for proper markdown parsing
  result = result.replace(/([^\n])\n(- )/g, "$1\n\n$2")

  return result
}

/**
 * Typewriter hook — reveals content character by character during streaming.
 *
 * Uses a recursive setTimeout chain (not RAF or setInterval) for:
 * - Exactly 1 character per tick → true typing feel
 * - Adaptive delay → fast when buffer is large, slow when trickling
 * - Refs for target length → timer survives content changes without restart
 */
function useTypewriter(fullContent: string, active: boolean): string {
  const [revealedLen, setRevealedLen] = useState(0)
  const revealedRef = useRef(0)
  const targetLenRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Track latest target length via ref (no effect restart needed)
  targetLenRef.current = fullContent.length

  useEffect(() => {
    if (!active) {
      // Streaming stopped — snap to full content, kill timer
      revealedRef.current = fullContent.length
      setRevealedLen(fullContent.length)
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
      return
    }

    // Streaming started — begin character-by-character reveal
    function tick() {
      const target = targetLenRef.current
      const current = revealedRef.current

      if (current >= target) {
        // Caught up — poll infrequently until new content arrives
        timerRef.current = setTimeout(tick, 200)
        return
      }

      // Reveal exactly 1 character
      revealedRef.current = current + 1
      setRevealedLen(current + 1)

      // Adaptive delay: fast catch-up when lots pending, natural typing when close
      const pending = target - current - 1
      let delay: number
      if (pending > 80) delay = 8       // 125 chars/sec — fast catch-up
      else if (pending > 40) delay = 12  // 83 chars/sec
      else if (pending > 15) delay = 18  // 55 chars/sec
      else if (pending > 5) delay = 25   // 40 chars/sec
      else delay = 35                    // 28 chars/sec — visible typing

      timerRef.current = setTimeout(tick, delay)
    }

    tick()

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [active]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!active) return fullContent
  return fullContent.slice(0, revealedLen)
}

export function ChatMessageBubble({
  message,
  isLastAssistant = false,
  isStreaming = false,
}: {
  message: ChatMessage
  isLastAssistant?: boolean
  isStreaming?: boolean
}) {
  const isUser = message.role === "user"
  const hasContent = !!message.content
  const isActivelyStreaming = isLastAssistant && isStreaming && !isUser

  const displayedContent = useTypewriter(message.content, isActivelyStreaming)

  if (isUser) {
    return (
      <div className="flex justify-end animate-[chat-appear_0.3s_ease-out]">
        <div className="bg-surface-overlay text-text-primary rounded-2xl px-5 py-3 text-[15px] leading-[1.6] max-w-[75%] lg:max-w-lg">
          {message.content}
        </div>
      </div>
    )
  }

  const normalized = useMemo(
    () => normalizeMarkdown(stripInternalTags(displayedContent, isActivelyStreaming)),
    [displayedContent, isActivelyStreaming]
  )

  return (
    <div className="animate-[chat-appear_0.3s_ease-out]">
      {hasContent ? (
        <div className={`chat-prose text-[15px] leading-[1.7] text-text-primary ${isActivelyStreaming ? "streaming" : ""}`}>
          <Markdown remarkPlugins={[remarkGfm]}>{normalized}</Markdown>
        </div>
      ) : (
        <TypingIndicator toolCalls={message.toolCalls} />
      )}
    </div>
  )
}
