"use client"

import { useEffect, useRef } from "react"
import { X, Sparkles } from "lucide-react"
import { useChatContext } from "./chat-provider"
import { ChatMessageBubble } from "./chat-message"
import { ChatInput } from "./chat-input"

function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
      <div className="w-10 h-10 rounded-full bg-accent-subtle flex items-center justify-center mb-3">
        <Sparkles className="w-5 h-5 text-accent" />
      </div>
      <h3 className="text-sm font-semibold text-text-primary mb-1">
        Hey, I&apos;m TalentClaw
      </h3>
      <p className="text-xs text-text-secondary leading-relaxed max-w-[260px]">
        I can search for jobs, manage your pipeline, update your profile, and
        handle messages on Coffee Shop.
      </p>
    </div>
  )
}

export function ChatPanel() {
  const { isOpen, setIsOpen, messages, isStreaming, isAvailable, error, sendMessage } =
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
        fixed top-0 right-0 h-full w-[400px] z-40
        bg-surface-raised border-l border-border-subtle
        shadow-[-4px_0_24px_rgba(0,0,0,0.08)]
        flex flex-col
        chat-panel-enter
        ${isOpen ? "translate-x-0" : "translate-x-full"}
      `}
      role="dialog"
      aria-label="Chat with TalentClaw"
      aria-hidden={!isOpen}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-accent" />
          <h2 className="text-sm font-semibold text-text-primary">TalentClaw</h2>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted
            hover:text-text-primary hover:bg-surface-overlay transition-colors
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          aria-label="Close chat panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto chat-scrollbar px-4 py-4 flex flex-col gap-4"
      >
        {messages.length === 0 ? (
          <EmptyState />
        ) : (
          messages.map((msg) => (
            <ChatMessageBubble key={msg.id} message={msg} />
          ))
        )}
      </div>

      {/* Error banner */}
      {error && (
        <div className="mx-4 mb-2 px-3 py-2 rounded-lg bg-red-50 text-red-700 text-xs">
          {error}
        </div>
      )}

      {/* Input */}
      <div className="px-4 pb-4 pt-2 border-t border-border-subtle">
        <ChatInput
          onSend={sendMessage}
          disabled={isStreaming}
          showSuggestions={messages.length === 0}
        />
      </div>
    </div>
  )
}
