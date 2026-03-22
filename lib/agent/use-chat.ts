"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import type { ChatMessage, SseEvent, ToolCallInfo } from "./types"
import type { ConversationFile } from "@/lib/types"

export type ConversationSummary = Omit<ConversationFile, "messages">

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const sessionIdRef = useRef<string | null>(null)
  // Use ref for slug to avoid stale closures in saveConversation
  const slugRef = useRef<string | null>(null)
  const [conversationSlug, setConversationSlug] = useState<string | null>(null)
  const queuedMessageRef = useRef<string | null>(null)
  const isStreamingRef = useRef(false)

  // Check agent availability on mount
  useEffect(() => {
    let cancelled = false
    fetch("/api/agent/status")
      .then((r) => r.json())
      .then((data: { available: boolean; connected: boolean }) => {
        if (!cancelled) setIsAvailable(data.available && data.connected)
      })
      .catch(() => {
        if (!cancelled) setIsAvailable(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Load conversation list on mount
  const refreshConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/conversations")
      if (res.ok) {
        const data = await res.json()
        setConversations(data)
      }
    } catch {
      // Silently fail
    }
  }, [])

  useEffect(() => {
    refreshConversations()
  }, [refreshConversations])

  // Save current conversation to filesystem
  const saveConversation = useCallback(
    async (msgs: ChatMessage[]) => {
      if (msgs.length === 0) return
      const firstUserMsg = msgs.find((m) => m.role === "user")
      const title = firstUserMsg?.content.slice(0, 80) || "New conversation"

      // Use ref to get/set slug atomically — no stale closure issues
      if (!slugRef.current) {
        slugRef.current = `chat-${Date.now()}`
        setConversationSlug(slugRef.current)
      }
      const slug = slugRef.current

      const toSave = msgs
        .filter((m) => m.content) // Skip empty assistant placeholders
        .map((m) => ({ role: m.role, content: m.content, createdAt: m.createdAt }))

      try {
        await fetch("/api/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug, title, messages: toSave }),
        })
        refreshConversations()
      } catch {
        // Silently fail
      }
    },
    [refreshConversations],
  )

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed) return

      // Queue the message if already streaming
      if (isStreamingRef.current) {
        queuedMessageRef.current = trimmed
        return
      }

      setError(null)
      setIsStreaming(true)
      isStreamingRef.current = true

      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: trimmed,
        createdAt: Date.now(),
      }
      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "",
        toolCalls: [],
        createdAt: Date.now(),
      }

      setMessages((prev) => [...prev, userMsg, assistantMsg])
      const assistantId = assistantMsg.id

      // Track final messages for save (populated after stream)
      let finalMessages: ChatMessage[] = []

      try {
        const res = await fetch("/api/agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: trimmed,
            sessionId: sessionIdRef.current,
          }),
        })

        if (!res.ok) {
          const errBody = await res.json().catch(() => ({ error: "Request failed" }))
          throw new Error(errBody.error || `HTTP ${res.status}`)
        }

        const reader = res.body?.getReader()
        if (!reader) throw new Error("No response stream")

        const decoder = new TextDecoder()
        let buffer = ""
        let streamEnded = false

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split("\n")
          buffer = lines.pop() ?? ""

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue
            const json = line.slice(6)

            let event: SseEvent
            try {
              event = JSON.parse(json)
            } catch {
              continue
            }

            switch (event.type) {
              case "session":
                sessionIdRef.current = event.sessionId
                break

              case "text_delta":
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? { ...m, content: m.content + event.content }
                      : m
                  )
                )
                break

              case "tool_use":
                setMessages((prev) =>
                  prev.map((m) => {
                    if (m.id !== assistantId) return m
                    const tc: ToolCallInfo = {
                      toolCallId: event.toolCallId,
                      name: event.name,
                      input: event.input,
                      status: "running",
                    }
                    return { ...m, toolCalls: [...(m.toolCalls ?? []), tc] }
                  })
                )
                break

              case "tool_result":
                setMessages((prev) =>
                  prev.map((m) => {
                    if (m.id !== assistantId) return m
                    return {
                      ...m,
                      toolCalls: (m.toolCalls ?? []).map((tc) =>
                        tc.toolCallId === event.toolCallId
                          ? { ...tc, status: "complete" as const, output: event.output }
                          : tc
                      ),
                    }
                  })
                )
                break

              case "complete":
                streamEnded = true
                setIsStreaming(false)
                break

              case "error":
                streamEnded = true
                setError(event.message)
                setIsStreaming(false)
                break
            }
          }
        }

        if (!streamEnded) setIsStreaming(false)
        isStreamingRef.current = false

        // Read final messages and save (outside of state updater)
        setMessages((prev) => {
          finalMessages = prev
          return prev
        })
        // Use setTimeout to ensure state has flushed before saving
        setTimeout(() => {
          if (finalMessages.length > 0) saveConversation(finalMessages)
        }, 100)

        // Process queued message
        const queued = queuedMessageRef.current
        if (queued) {
          queuedMessageRef.current = null
          // Small delay to let React flush the state updates
          setTimeout(() => sendMessage(queued), 50)
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Something went wrong"
        setError(msg)
        setIsStreaming(false)
        isStreamingRef.current = false
        setMessages((prev) => {
          const last = prev[prev.length - 1]
          if (last?.id === assistantId && !last.content && !last.toolCalls?.length) {
            return prev.slice(0, -1)
          }
          return prev
        })
      }
    },
    [saveConversation]
  )

  // Load a previous conversation
  const loadConversation = useCallback(async (slug: string) => {
    try {
      const res = await fetch(`/api/conversations/${slug}`)
      if (!res.ok) return
      const data = await res.json()
      const loaded: ChatMessage[] = data.messages.map(
        (m: { role: string; content: string; createdAt: number }, i: number) => ({
          id: `loaded-${i}`,
          role: m.role,
          content: m.content,
          createdAt: m.createdAt,
        })
      )
      setMessages(loaded)
      slugRef.current = slug
      setConversationSlug(slug)
      setError(null)
      sessionIdRef.current = null
    } catch {
      // Failed to load
    }
  }, [])

  const clearMessages = useCallback(() => {
    setMessages([])
    setError(null)
    slugRef.current = null
    setConversationSlug(null)
    sessionIdRef.current = null
  }, [])

  return {
    messages,
    isStreaming,
    isAvailable,
    error,
    sendMessage,
    clearMessages,
    conversations,
    conversationSlug,
    loadConversation,
    refreshConversations,
  }
}
