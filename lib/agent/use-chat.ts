"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import type { ChatMessage, SseEvent, ToolCallInfo } from "./types"
import type { ConversationFile } from "@/lib/types"

export type ConversationSummary = Omit<ConversationFile, "messages">

// --- Shared SSE stream consumer ---

type SSEEventHandlers = {
  onSession?: (sessionId: string) => void
  onSdkSession?: (sdkSessionId: string) => void
  onTextDelta: (content: string, hadToolSinceLastText: boolean) => void
  onToolUse: (tc: ToolCallInfo) => void
  onToolResult: (toolCallId: string, output: string) => void
  onComplete: () => void
  onError: (message: string) => void
}

/**
 * Consume an SSE stream from the agent API, dispatching parsed events to handlers.
 * Shared by both sendMessage and reconnect to avoid duplicating the decode/parse loop.
 */
async function consumeSSEStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  handlers: SSEEventHandlers,
  signal?: { cancelled: boolean },
): Promise<{ streamEnded: boolean }> {
  const decoder = new TextDecoder()
  let buffer = ""
  let streamEnded = false
  let hadToolSinceLastText = false

  while (true) {
    const { done, value } = await reader.read()
    if (done || signal?.cancelled) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split("\n")
    buffer = lines.pop() ?? ""

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue
      let event: SseEvent
      try {
        event = JSON.parse(line.slice(6))
      } catch {
        continue
      }

      switch (event.type) {
        case "session":
          handlers.onSession?.(event.sessionId)
          break
        case "sdk_session":
          handlers.onSdkSession?.(event.sdkSessionId)
          break
        case "text_delta":
          handlers.onTextDelta(event.content, hadToolSinceLastText)
          hadToolSinceLastText = false
          break
        case "tool_use":
          handlers.onToolUse({
            toolCallId: event.toolCallId,
            name: event.name,
            input: event.input,
            status: "running",
          })
          break
        case "tool_result":
          hadToolSinceLastText = true
          handlers.onToolResult(event.toolCallId, event.output)
          break
        case "complete":
          streamEnded = true
          handlers.onComplete()
          break
        case "error":
          streamEnded = true
          handlers.onError(event.message)
          break
      }
    }
  }

  return { streamEnded }
}

// --- Hook ---

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const sessionIdRef = useRef<string | null>(null)
  // SDK session ID — tracks the Agent SDK's persistent session for resume
  const sdkSessionIdRef = useRef<string | null>(null)
  // Use ref for slug to avoid stale closures in saveConversation
  const slugRef = useRef<string | null>(null)
  const [conversationSlug, setConversationSlug] = useState<string | null>(null)
  const queuedMessageRef = useRef<string | null>(null)
  const isStreamingRef = useRef(false)
  const revalidateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const saveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const reconnectAttemptedRef = useRef(false)
  const messagesRef = useRef<ChatMessage[]>([])
  // Dirty flag for auto-save — set on any message mutation, cleared after save
  const isDirtyRef = useRef(false)

  // Revalidate server-side caches and notify DataRefreshProvider
  const triggerRevalidate = useCallback(async () => {
    try {
      await fetch("/api/revalidate", { method: "POST" })
    } catch {
      // Silently fail
    }
    window.dispatchEvent(new Event("dataVersionChange"))
  }, [])

  const scheduleRevalidate = useCallback(() => {
    if (revalidateTimerRef.current) clearTimeout(revalidateTimerRef.current)
    revalidateTimerRef.current = setTimeout(() => {
      revalidateTimerRef.current = null
      triggerRevalidate()
    }, 2000)
  }, [triggerRevalidate])

  const immediateRevalidate = useCallback(() => {
    if (revalidateTimerRef.current) {
      clearTimeout(revalidateTimerRef.current)
      revalidateTimerRef.current = null
    }
    triggerRevalidate()
  }, [triggerRevalidate])

  // --- Shared stream lifecycle helpers ---

  function stopSaveTimer() {
    if (saveTimerRef.current) {
      clearInterval(saveTimerRef.current)
      saveTimerRef.current = null
    }
  }

  function clearActiveSession() {
    localStorage.removeItem("talentclaw-active-session")
  }

  /** Update messages, keep ref in sync immediately, and mark dirty for auto-save */
  function updateMessages(updater: (prev: ChatMessage[]) => ChatMessage[]) {
    setMessages((prev) => {
      const next = updater(prev)
      messagesRef.current = next
      isDirtyRef.current = true
      return next
    })
  }

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
          body: JSON.stringify({ slug, title, messages: toSave, sessionId: sdkSessionIdRef.current }),
        })
        refreshConversations()
      } catch {
        // Silently fail
      }
    },
    [refreshConversations],
  )

  /** Start periodic auto-save (with dirty check) */
  function startSaveTimer() {
    if (saveTimerRef.current) return
    saveTimerRef.current = setInterval(() => {
      const current = messagesRef.current
      if (current.length > 0 && isDirtyRef.current) {
        isDirtyRef.current = false
        saveConversation(current)
      }
    }, 10000)
  }

  // Auto-reconnect to active run on page load
  useEffect(() => {
    if (reconnectAttemptedRef.current) return
    reconnectAttemptedRef.current = true

    const storedSessionId = localStorage.getItem("talentclaw-active-session")
    if (!storedSessionId) return

    const signal = { cancelled: false }

    async function reconnect() {
      try {
        const res = await fetch(`/api/agent/stream?sessionId=${encodeURIComponent(storedSessionId!)}`)
        if (!res.ok || signal.cancelled) {
          clearActiveSession()
          return
        }

        sessionIdRef.current = storedSessionId
        setIsStreaming(true)
        isStreamingRef.current = true

        const reader = res.body?.getReader()
        if (!reader) {
          clearActiveSession()
          setIsStreaming(false)
          isStreamingRef.current = false
          return
        }

        // Create a reconnect assistant message to hold incoming content
        const assistantId = `reconnect-${Date.now()}`
        let activeAssistantId = assistantId
        updateMessages((prev) => {
          if (prev.length > 0) return prev
          return [{ id: assistantId, role: "assistant" as const, content: "", toolCalls: [], createdAt: Date.now() }]
        })

        startSaveTimer()

        const resolveAssistantId = () => {
          const last = [...messagesRef.current].reverse().find((m) => m.role === "assistant")
          if (last) activeAssistantId = last.id
          return activeAssistantId
        }

        const { streamEnded } = await consumeSSEStream(reader, {
          onSession: (id) => { sessionIdRef.current = id },
          onSdkSession: (id) => { sdkSessionIdRef.current = id },
          onTextDelta: (content, hadTool) => {
            const sep = hadTool ? "\n\n" : ""
            const targetId = resolveAssistantId()
            updateMessages((prev) =>
              prev.map((m) =>
                m.id === targetId
                  ? { ...m, content: (m.content ? m.content + sep : "") + content }
                  : m
              )
            )
          },
          onToolUse: (tc) => {
            const targetId = resolveAssistantId()
            updateMessages((prev) =>
              prev.map((m) => m.id !== targetId ? m : { ...m, toolCalls: [...(m.toolCalls ?? []), tc] })
            )
          },
          onToolResult: (toolCallId, output) => {
            updateMessages((prev) =>
              prev.map((m) => m.id !== activeAssistantId ? m : {
                ...m,
                toolCalls: (m.toolCalls ?? []).map((tc) =>
                  tc.toolCallId === toolCallId ? { ...tc, status: "complete" as const, output } : tc
                ),
              })
            )
            scheduleRevalidate()
          },
          onComplete: () => {
            setIsStreaming(false)
            immediateRevalidate()
          },
          onError: (message) => {
            setError(message)
            setIsStreaming(false)
          },
        }, signal)

        if (!streamEnded) setIsStreaming(false)
        isStreamingRef.current = false
        stopSaveTimer()
        clearActiveSession()

        // Final save
        const final = messagesRef.current
        if (final.length > 0) {
          setTimeout(() => saveConversation(final), 100)
        }
      } catch {
        clearActiveSession()
        setIsStreaming(false)
        isStreamingRef.current = false
        stopSaveTimer()
      }
    }

    reconnect()

    return () => {
      signal.cancelled = true
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

      updateMessages((prev) => [...prev, userMsg, assistantMsg])
      const assistantId = assistantMsg.id

      try {
        const res = await fetch("/api/agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: trimmed,
            sessionId: sessionIdRef.current,
            resumeSessionId: sdkSessionIdRef.current,
          }),
        })

        if (!res.ok) {
          const errBody = await res.json().catch(() => ({ error: "Request failed" }))
          throw new Error(errBody.error || `HTTP ${res.status}`)
        }

        const reader = res.body?.getReader()
        if (!reader) throw new Error("No response stream")

        const { streamEnded } = await consumeSSEStream(reader, {
          onSession: (id) => {
            sessionIdRef.current = id
            localStorage.setItem("talentclaw-active-session", id)
            startSaveTimer()
          },
          onSdkSession: (id) => { sdkSessionIdRef.current = id },
          onTextDelta: (content, hadTool) => {
            const sep = hadTool ? "\n\n" : ""
            updateMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, content: (m.content ? m.content + sep : "") + content }
                  : m
              )
            )
          },
          onToolUse: (tc) => {
            updateMessages((prev) =>
              prev.map((m) => m.id !== assistantId ? m : { ...m, toolCalls: [...(m.toolCalls ?? []), tc] })
            )
          },
          onToolResult: (toolCallId, output) => {
            updateMessages((prev) =>
              prev.map((m) => m.id !== assistantId ? m : {
                ...m,
                toolCalls: (m.toolCalls ?? []).map((tc) =>
                  tc.toolCallId === toolCallId ? { ...tc, status: "complete" as const, output } : tc
                ),
              })
            )
            scheduleRevalidate()
          },
          onComplete: () => {
            setIsStreaming(false)
            immediateRevalidate()
          },
          onError: (message) => {
            setError(message)
            setIsStreaming(false)
          },
        })

        if (!streamEnded) setIsStreaming(false)
        isStreamingRef.current = false
        stopSaveTimer()
        clearActiveSession()

        // Final save
        const final = messagesRef.current
        if (final.length > 0) {
          setTimeout(() => saveConversation(final), 100)
        }

        // Process queued message
        const queued = queuedMessageRef.current
        if (queued) {
          queuedMessageRef.current = null
          setTimeout(() => sendMessage(queued), 50)
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Something went wrong"
        setError(msg)
        setIsStreaming(false)
        isStreamingRef.current = false
        stopSaveTimer()
        clearActiveSession()
        updateMessages((prev) => {
          const last = prev[prev.length - 1]
          if (last?.id === assistantId && !last.content && !last.toolCalls?.length) {
            return prev.slice(0, -1)
          }
          return prev
        })
      }
    },
    [saveConversation, scheduleRevalidate, immediateRevalidate]
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
      // Restore SDK session ID from frontmatter for conversation resume
      sdkSessionIdRef.current = data.frontmatter?.session_id ?? null
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
    sdkSessionIdRef.current = null
    clearActiveSession()
  }, [clearActiveSession])

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
