"use client"

import type { ChatMessage } from "@/lib/agent/types"
import { ToolCallBadge } from "./tool-call-badge"
import { formatRelativeTime } from "@/lib/ui-utils"

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 py-1" aria-label="Typing">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-text-muted"
          style={{ animation: `typing-dot 1.2s ease-in-out ${i * 0.2}s infinite` }}
        />
      ))}
    </div>
  )
}

export function ChatMessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user"
  const isEmpty = !message.content && (!message.toolCalls || message.toolCalls.length === 0)
  const time = formatRelativeTime(new Date(message.createdAt).toISOString())

  return (
    <div
      className={`flex flex-col gap-0.5 animate-[chat-appear_0.3s_ease-out] ${
        isUser ? "items-end" : "items-start"
      }`}
    >
      <span className="text-[11px] text-text-muted px-1">
        {isUser ? "You" : "TalentClaw"} &middot; {time}
      </span>

      <div
        className={`
          max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed
          ${isUser
            ? "bg-accent-subtle text-text-primary rounded-br-md"
            : "bg-surface-overlay text-text-primary rounded-bl-md"
          }
        `}
      >
        {isEmpty ? (
          <TypingIndicator />
        ) : (
          <>
            {message.content && (
              <p className="whitespace-pre-wrap break-words">{message.content}</p>
            )}
            {message.toolCalls && message.toolCalls.length > 0 && (
              <div className="flex flex-col gap-0.5 mt-1">
                {message.toolCalls.map((tc, i) => (
                  <ToolCallBadge key={`${tc.name}-${i}`} toolCall={tc} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
