// Shared SSE stream builder used by the chat API routes.

import { subscribeToRun } from "./active-runs"
import type { SseEvent } from "./types"

const KEEPALIVE_INTERVAL = 15_000

const SSE_HEADERS = {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache, no-transform",
  "Connection": "keep-alive",
} as const

type BuildSseStreamOptions = {
  /** Replay buffered events before streaming live ones. */
  replay?: boolean
  /** Extra SSE events to send before subscribing (e.g., session event). */
  prelude?: SseEvent[]
}

/**
 * Build an SSE ReadableStream for a given run session.
 * Handles keepalive, subscribe/unsubscribe, and cleanup.
 */
export function buildSseResponse(
  sessionId: string,
  options: BuildSseStreamOptions = {},
): Response {
  const encoder = new TextEncoder()
  let keepalive: ReturnType<typeof setInterval> | undefined
  let unsubscribe: (() => void) | null = null

  const stream = new ReadableStream({
    start(controller) {
      // Send prelude events (e.g., session ID)
      if (options.prelude) {
        for (const event of options.prelude) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
        }
      }

      keepalive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": keepalive\n\n"))
        } catch {
          clearInterval(keepalive)
        }
      }, KEEPALIVE_INTERVAL)

      unsubscribe = subscribeToRun(sessionId, (event: SseEvent | null) => {
        if (event === null) {
          clearInterval(keepalive)
          try {
            controller.close()
          } catch {
            // Already closed
          }
          return
        }

        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
        } catch {
          clearInterval(keepalive)
          unsubscribe?.()
        }
      }, { replay: options.replay ?? false })
    },
    cancel() {
      clearInterval(keepalive)
      unsubscribe?.()
    },
  })

  return new Response(stream, { headers: SSE_HEADERS })
}
