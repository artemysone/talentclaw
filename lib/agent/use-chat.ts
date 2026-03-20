"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import type { ChatMessage, SseEvent, ToolCallInfo } from "./types"

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)
  const sessionIdRef = useRef<string | null>(null)

  // Check agent availability on mount
  useEffect(() => {
    let cancelled = false
    fetch("/api/chat/status")
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

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (isStreaming || !trimmed) return

      setError(null)
      setIsStreaming(true)

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

      try {
        const res = await fetch("/api/chat", {
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

        // Stream ended without explicit complete/error event
        if (!streamEnded) setIsStreaming(false)
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Something went wrong"
        setError(msg)
        setIsStreaming(false)
        // Agent may be down — mark as unavailable so UI hides chat
        setIsAvailable(false)
        // Remove the empty assistant message on hard failure
        setMessages((prev) => {
          const last = prev[prev.length - 1]
          if (last?.id === assistantId && !last.content && !last.toolCalls?.length) {
            return prev.slice(0, -1)
          }
          return prev
        })
      }
    },
    [isStreaming]
  )

  const clearMessages = useCallback(() => {
    setMessages([])
    setError(null)
    sessionIdRef.current = null
  }, [])

  return { messages, isStreaming, isAvailable, error, sendMessage, clearMessages }
}
