"use client"

import { useEffect, useRef, useState } from "react"
import { ChevronDown, SquarePen } from "lucide-react"
import { CrabLogo } from "@/components/crab-logo"
import { useChatContext } from "./chat-provider"
import { ChatMessageBubble } from "./chat-message"
import type { ChatMessage } from "@/lib/agent/types"
import { ChatInput } from "./chat-input"
import { SuggestionChips } from "./suggestion-chips"

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning"
  if (hour < 17) return "Good afternoon"
  return "Good evening"
}

function NewChatView({
  displayName,
  onSend,
}: {
  displayName: string
  onSend: (text: string) => void
}) {
  const firstName = displayName.split(" ")[0]

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 pb-[12vh]">
      <h1 className="font-display text-4xl text-text-primary mb-8 flex items-center gap-3">
        <CrabLogo className="w-10 h-10 text-accent" />
        {getGreeting()}
        {firstName ? `, ${firstName}` : ""}
      </h1>
      <div className="w-full max-w-[680px]">
        <ChatInput onSend={onSend} />
        <SuggestionChips onSelect={onSend} />
      </div>
    </div>
  )
}

function ConversationTitle({ messages }: { messages: ChatMessage[] }) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Derive title from first user message
  const firstUserMsg = messages.find((m) => m.role === "user")
  const title = firstUserMsg
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
        <div className="absolute top-full left-0 mt-1 w-64 bg-surface-raised border border-border-subtle rounded-xl shadow-md py-1 z-50">
          {/* Current conversation */}
          <div className="px-3 py-2 text-sm text-text-primary bg-accent-subtle/50 truncate">
            {title}
          </div>
          {/* Placeholder for future conversation history */}
          <div className="px-3 py-3 text-xs text-text-muted text-center">
            No previous conversations
          </div>
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
        <ConversationTitle messages={messages} />
        <button
          type="button"
          onClick={onNewChat}
          title="New chat"
          className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-overlay transition-colors cursor-pointer"
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
          {messages.map((msg) => (
            <ChatMessageBubble key={msg.id} message={msg} />
          ))}
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
          <ChatInput onSend={onSend} disabled={isStreaming} />
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
