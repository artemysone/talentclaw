"use client"

import { useEffect, useRef, useState } from "react"
import { ChevronDown, SquarePen } from "lucide-react"
import { CrabLogo } from "@/components/crab-logo"
import { getGreeting } from "@/lib/ui-utils"
import { useChatContext } from "./chat-provider"
import { ChatMessageBubble } from "./chat-message"
import { ChatInput } from "./chat-input"
import { SuggestionChips } from "./suggestion-chips"

function NewChatView({
  displayName,
  onSend,
}: {
  displayName: string
  onSend: (text: string) => void
}) {
  const firstName = displayName.split(" ")[0]
  const { conversations } = useChatContext()

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header — same position as active chat */}
      {conversations.length > 0 && (
        <div className="flex items-center gap-2 px-5 py-3 shrink-0">
          <ConversationDropdown label="Recent conversations" />
        </div>
      )}

      {/* Centered content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-[12vh]">
        <h1 className="font-display text-4xl text-text-primary mb-8 flex items-center gap-3">
          <CrabLogo className="w-10 h-10 text-accent" />
          {getGreeting()}
          {firstName ? `, ${firstName}` : ""}
        </h1>
        <div className="w-full max-w-[680px]">
          <ChatInput onSend={onSend} autoFocus />
          <SuggestionChips onSelect={onSend} />
        </div>
      </div>
    </div>
  )
}

function getDayLabel(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate())

  if (target.getTime() === today.getTime()) return "Today"
  if (target.getTime() === yesterday.getTime()) return "Yesterday"

  // Same year → "March 20", different year → "March 20, 2025"
  const opts: Intl.DateTimeFormatOptions =
    date.getFullYear() === now.getFullYear()
      ? { month: "long", day: "numeric" }
      : { month: "long", day: "numeric", year: "numeric" }
  return date.toLocaleDateString("en-US", opts)
}

function groupByDay(
  items: { slug: string; frontmatter: { title: string; created_at: string; updated_at: string; message_count: number } }[]
): { label: string; items: typeof items }[] {
  const groups: Map<string, typeof items> = new Map()
  for (const item of items) {
    const label = getDayLabel(item.frontmatter.created_at)
    const existing = groups.get(label)
    if (existing) existing.push(item)
    else groups.set(label, [item])
  }
  return Array.from(groups.entries()).map(([label, items]) => ({ label, items }))
}

function ConversationDropdown({ label }: { label?: string } = {}) {
  const { messages, conversations, conversationSlug, loadConversation, clearMessages } = useChatContext()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Derive current title from first user message, or use provided label
  const firstUserMsg = messages.find((m) => m.role === "user")
  const title = label
    ? label
    : firstUserMsg
      ? firstUserMsg.content.length > 40
        ? firstUserMsg.content.slice(0, 40) + "..."
        : firstUserMsg.content
      : "New conversation"

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [dropdownOpen])

  // Group all conversations by day
  const grouped = groupByDay(conversations)

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center gap-1 text-sm font-medium text-text-primary hover:text-text-secondary transition-colors cursor-pointer"
      >
        {title}
        <ChevronDown className={`w-3.5 h-3.5 text-text-muted transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
      </button>

      {dropdownOpen && (
        <div className="absolute top-full left-0 mt-1 w-72 bg-surface-raised border border-border-subtle rounded-xl shadow-md py-1 z-50 max-h-80 overflow-y-auto">
          {/* New chat option */}
          <button
            type="button"
            onClick={() => {
              clearMessages()
              setDropdownOpen(false)
            }}
            className="w-full text-left px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-overlay transition-colors cursor-pointer flex items-center gap-2"
          >
            <SquarePen className="w-3.5 h-3.5" />
            New chat
          </button>

          {grouped.length > 0 ? (
            grouped.map((group) => (
              <div key={group.label} className="border-t border-border-subtle">
                <div className="px-3 py-1.5 text-[11px] uppercase tracking-wider text-text-muted">
                  {group.label}
                </div>
                {group.items.map((c) => {
                  const isActive = c.slug === conversationSlug
                  return (
                    <button
                      key={c.slug}
                      type="button"
                      onClick={() => {
                        loadConversation(c.slug)
                        setDropdownOpen(false)
                      }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-surface-overlay transition-colors cursor-pointer flex items-baseline gap-2 ${isActive ? "text-accent font-medium" : "text-text-secondary hover:text-text-primary"}`}
                    >
                      <span className="truncate">{c.frontmatter.title}</span>
                      <span className={`shrink-0 text-[11px] ${isActive ? "text-accent/70" : "text-text-muted"}`}>
                        {new Date(c.frontmatter.created_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                      </span>
                    </button>
                  )
                })}
              </div>
            ))
          ) : (
            <div className="px-3 py-3 text-xs text-text-muted text-center">
              No previous conversations
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ActiveChatView({
  onSend,
  onNewChat,
}: {
  onSend: (text: string) => void
  onNewChat: () => void
}) {
  const { messages, isStreaming, error } = useChatContext()
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [messages])

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header with conversation title + new chat */}
      <div className="flex items-center gap-2 px-5 py-3 shrink-0">
        <ConversationDropdown />
        <button
          type="button"
          onClick={onNewChat}
          title="New chat"
          className="ml-auto p-1.5 rounded-lg border border-border-subtle text-text-muted hover:text-text-primary hover:bg-surface-overlay transition-colors cursor-pointer"
        >
          <SquarePen className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto chat-scrollbar px-6 pb-4"
      >
        <div className="max-w-3xl mx-auto flex flex-col gap-4">
          {(() => {
            const lastAssistantIdx = messages.reduce(
              (acc, m, i) => (m.role === "assistant" ? i : acc), -1
            )
            return messages.map((msg, i) => (
              <ChatMessageBubble
                key={msg.id}
                message={msg}
                isLastAssistant={i === lastAssistantIdx}
                isStreaming={isStreaming}
              />
            ))
          })()}
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="max-w-3xl mx-auto w-full px-6 mb-2">
          <div className="px-3 py-2 rounded-lg bg-danger/8 text-danger text-xs">
            {error}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-6 pb-6 pt-2 shrink-0">
        <div className="max-w-3xl mx-auto">
          <ChatInput onSend={onSend} disabled={isStreaming} autoFocus />
        </div>
      </div>
    </div>
  )
}

export function ChatPage({ displayName = "" }: { displayName?: string }) {
  const { messages, isAvailable, sendMessage, clearMessages, pendingMessage, clearPending } =
    useChatContext()

  // Auto-send pending message from sendPrefilled navigation
  useEffect(() => {
    if (pendingMessage) {
      sendMessage(pendingMessage)
      clearPending()
    }
  }, [pendingMessage, sendMessage, clearPending])

  if (isAvailable === false) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <CrabLogo className="w-12 h-12 text-text-muted mb-4" />
        <h2 className="font-display text-xl text-text-primary mb-2">Agent not available</h2>
        <p className="text-sm text-text-secondary max-w-sm">
          Make sure Claude Code is installed and running, then reload the page.
        </p>
      </div>
    )
  }

  const isEmpty = messages.length === 0

  if (isEmpty) {
    return <NewChatView displayName={displayName} onSend={sendMessage} />
  }

  return (
    <ActiveChatView
      onSend={sendMessage}
      onNewChat={clearMessages}
    />
  )
}
