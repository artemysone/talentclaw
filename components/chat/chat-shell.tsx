"use client"

import type { ReactNode } from "react"
import { ChatProvider, useChatContext } from "./chat-provider"
import { ChatPanel } from "./chat-panel"
import { ChatToggle } from "./chat-toggle"

function ChatOverlay() {
  const { isOpen, setIsOpen, isAvailable } = useChatContext()
  return (
    <>
      <ChatPanel />
      <ChatToggle
        isOpen={isOpen}
        onToggle={() => setIsOpen(!isOpen)}
        isAvailable={isAvailable}
      />
    </>
  )
}

export function ChatShell({ children }: { children: ReactNode }) {
  return (
    <ChatProvider>
      {children}
      <ChatOverlay />
    </ChatProvider>
  )
}
