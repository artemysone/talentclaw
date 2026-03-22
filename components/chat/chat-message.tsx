"use client"

import Markdown from "react-markdown"
import type { ChatMessage } from "@/lib/agent/types"
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
  const hasContent = !!message.content
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
          max-w-[85%] lg:max-w-2xl rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed
          ${isUser
            ? "bg-accent-subtle text-text-primary rounded-br-md"
            : "bg-surface-overlay text-text-primary rounded-bl-md"
          }
        `}
      >
        {hasContent ? (
          <div className="chat-prose">
            <Markdown>{message.content}</Markdown>
          </div>
        ) : (
          <TypingIndicator />
        )}
      </div>
    </div>
  )
}
