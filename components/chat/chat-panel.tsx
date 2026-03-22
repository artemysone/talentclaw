"use client"

import { useEffect, useRef } from "react"
import { CrabLogo } from "@/components/crab-logo"
import { useChatContext } from "./chat-provider"
import { ChatMessageBubble } from "./chat-message"
import { ChatInput } from "./chat-input"

function EmptyState({ displayName }: { displayName: string }) {
  const firstName = displayName.split(" ")[0]

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
      <CrabLogo className="w-10 h-10 text-accent mb-4" />
      <h3 className="font-prose text-xl text-text-primary mb-1">
        {firstName ? `Hey, ${firstName}!` : "Hey there!"}
      </h3>
      <p className="text-sm text-text-secondary leading-relaxed max-w-[260px]">
        How can I help?
      </p>
    </div>
  )
}

export function ChatPanel({ displayName = "" }: { displayName?: string }) {
  const { isOpen, messages, isStreaming, isAvailable, error, sendMessage } =
    useChatContext()
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [messages])

  if (isAvailable === false) return null

  return (
    <div
      className={`
        h-full flex-shrink-0 overflow-hidden
        transition-[width] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
        ${isOpen ? "max-sm:w-full w-[480px]" : "w-0"}
      `}
    >
      <div
        className="max-sm:w-full w-[480px] h-full flex flex-col
          bg-surface-raised border-l border-border-subtle
          shadow-[-4px_0_24px_rgba(0,0,0,0.08)]"
        role="dialog"
        aria-label="Chat with TalentClaw"
        aria-hidden={!isOpen}
      >
        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto chat-scrollbar px-4 py-4 flex flex-col gap-4"
        >
          {messages.length === 0 ? (
            <EmptyState displayName={displayName} />
          ) : (
            messages.map((msg) => (
              <ChatMessageBubble key={msg.id} message={msg} />
            ))
          )}
        </div>

        {/* Error banner */}
        {error && (
          <div className="mx-4 mb-2 px-3 py-2 rounded-lg bg-danger/8 text-danger text-xs">
            {error}
          </div>
        )}

        {/* Input */}
        <div className="px-4 pb-4 pt-2 border-t border-border-subtle">
          <ChatInput
            onSend={sendMessage}
            disabled={isStreaming}
          />
        </div>
      </div>
    </div>
  )
}
