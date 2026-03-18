"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import { useChat } from "@/lib/openclaw/use-chat"
import type { ChatMessage } from "@/lib/openclaw/types"

type ChatContextValue = {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  messages: ChatMessage[]
  isStreaming: boolean
  isAvailable: boolean | null
  error: string | null
  sendMessage: (text: string) => void
  clearMessages: () => void
}

const ChatContext = createContext<ChatContextValue | null>(null)

export function ChatProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const chat = useChat()

  return (
    <ChatContext.Provider value={{ isOpen, setIsOpen, ...chat }}>
      {children}
    </ChatContext.Provider>
  )
}

export function useChatContext(): ChatContextValue {
  const ctx = useContext(ChatContext)
  if (!ctx) throw new Error("useChatContext must be used within a ChatProvider")
  return ctx
}
