"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { useChat } from "@/lib/agent/use-chat"
import type { ChatMessage } from "@/lib/agent/types"

type ChatContextValue = {
  messages: ChatMessage[]
  isStreaming: boolean
  isAvailable: boolean | null
  error: string | null
  sendMessage: (text: string) => void
  sendPrefilled: (text: string) => void
  clearMessages: () => void
  pendingMessage: string | null
  clearPending: () => void
  displayName: string
}

const ChatContext = createContext<ChatContextValue | null>(null)

export function ChatProvider({ children, displayName = "" }: { children: ReactNode; displayName?: string }) {
  const router = useRouter()
  const [pendingMessage, setPendingMessage] = useState<string | null>(null)
  const chat = useChat()

  const sendPrefilled = useCallback(
    (text: string) => {
      setPendingMessage(text)
      router.push("/chat")
    },
    [router],
  )

  const clearPending = useCallback(() => {
    setPendingMessage(null)
  }, [])

  return (
    <ChatContext.Provider value={{ sendPrefilled, pendingMessage, clearPending, displayName, ...chat }}>
      {children}
    </ChatContext.Provider>
  )
}

export function useChatContext(): ChatContextValue {
  const ctx = useContext(ChatContext)
  if (!ctx) throw new Error("useChatContext must be used within a ChatProvider")
  return ctx
}
