"use client"

import { type ReactNode, useEffect, useRef } from "react"
import { ChatProvider, useChatContext } from "./chat-provider"
import { ChatToggle } from "./chat-toggle"
import { useSidebar } from "@/components/workspace/sidebar-wrapper"

function ChatEffects() {
  const { isOpen, setIsOpen, isAvailable } = useChatContext()
  const { collapsed, setCollapsed } = useSidebar()
  const wasCollapsedBeforeChat = useRef(false)

  // Auto-collapse sidebar when chat opens, restore when it closes
  useEffect(() => {
    if (isOpen) {
      wasCollapsedBeforeChat.current = collapsed
      setCollapsed(true)
    } else {
      setCollapsed(wasCollapsedBeforeChat.current)
    }
  }, [isOpen, setCollapsed]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <ChatToggle
      isOpen={isOpen}
      onToggle={() => setIsOpen(!isOpen)}
      isAvailable={isAvailable}
    />
  )
}

export function ChatShell({ children, displayName = "" }: { children: ReactNode; displayName?: string }) {
  return (
    <ChatProvider displayName={displayName}>
      {children}
      <ChatEffects />
    </ChatProvider>
  )
}
