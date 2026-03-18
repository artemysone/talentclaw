// Server-side singleton managing agent run lifecycles.
//
// This module uses a module-level singleton (client + runs map) which works
// because TalentClaw runs as a persistent Next.js server (via `npx talentclaw`),
// not as serverless functions. The state lives for the lifetime of the process.

import { GatewayClient } from "./gateway-client"
import { getGatewayConfig } from "./config"
import type { GatewayConfig, SseEvent, RunStatus, ActiveRunInfo } from "./types"

export class DuplicateRunError extends Error {
  readonly code = "DUPLICATE_RUN" as const
  constructor(sessionId: string) {
    super(`Run already active for session ${sessionId}`)
    this.name = "DuplicateRunError"
  }
}

const RUN_CLEANUP_DELAY = 5 * 60 * 1000 // 5 minutes after completion

type ActiveRun = {
  sessionId: string
  status: RunStatus
  eventBuffer: SseEvent[]
  subscribers: Set<(event: SseEvent | null) => void>
  unsubscribeGateway?: () => void
  cleanupTimer?: ReturnType<typeof setTimeout>
  error?: string
}

// Module-level singleton state
let client: GatewayClient | null = null
let connectingPromise: Promise<GatewayClient> | null = null
let cachedConfig: GatewayConfig | null = null
const runs = new Map<string, ActiveRun>()

/**
 * Ensure the gateway client is connected. Reuses existing connection.
 * Concurrent calls share the same in-flight connection attempt.
 */
async function ensureClient(): Promise<GatewayClient> {
  if (client?.isConnected) return client
  if (connectingPromise) return connectingPromise

  connectingPromise = (async () => {
    if (!cachedConfig) cachedConfig = await getGatewayConfig()
    client = new GatewayClient(cachedConfig)
    await client.connect()
    return client
  })().finally(() => {
    connectingPromise = null
  })
  return connectingPromise
}

/**
 * Push an SSE event to a run's buffer and fan out to live subscribers.
 */
function emitEvent(run: ActiveRun, event: SseEvent): void {
  run.eventBuffer.push(event)
  for (const cb of run.subscribers) {
    try {
      cb(event)
    } catch {
      // Don't let a subscriber error break the fan-out
    }
  }
}

/**
 * Signal run completion to all subscribers (callback with null).
 */
function signalComplete(run: ActiveRun): void {
  for (const cb of run.subscribers) {
    try {
      cb(null)
    } catch {
      // Ignore subscriber errors
    }
  }
}

/**
 * Schedule cleanup of a completed run after the delay period.
 */
function scheduleCleanup(sessionId: string): void {
  const run = runs.get(sessionId)
  if (!run) return

  run.cleanupTimer = setTimeout(() => {
    runs.delete(sessionId)
  }, RUN_CLEANUP_DELAY)
}

/**
 * Mark a run as finished (complete or error) and clean up gateway subscriptions.
 */
function finishRun(run: ActiveRun, status: "complete" | "error", error?: string): void {
  run.status = status
  if (error) run.error = error

  // Emit the terminal event
  if (status === "error") {
    emitEvent(run, { type: "error", message: error ?? "Unknown error" })
  } else {
    emitEvent(run, { type: "complete" })
  }

  signalComplete(run)
  run.unsubscribeGateway?.()
  scheduleCleanup(run.sessionId)
}

/**
 * Map a gateway event to an SseEvent. Returns null if the event isn't relevant.
 *
 * TODO: The exact gateway event names are based on DenchClaw reference code
 * and may need adjustment when tested against a live OpenClaw instance.
 * Known candidates:
 *   - agent.text_delta / agent.text -> text_delta
 *   - tool-invocation / agent.tool_use -> tool_use
 *   - tool-output-available / agent.tool_result -> tool_result
 *   - agent.complete / agent.done -> complete
 *   - agent.error -> error
 */
function mapGatewayEvent(eventName: string, payload: unknown): SseEvent | null {
  const data = payload as Record<string, unknown> | undefined

  switch (eventName) {
    // TODO: Confirm event name with live OpenClaw gateway
    case "agent.text_delta":
    case "agent.text": {
      const content = typeof data?.content === "string"
        ? data.content
        : typeof data?.text === "string"
          ? data.text
          : typeof data?.delta === "string"
            ? data.delta
            : null
      if (content === null) return null
      return { type: "text_delta", content }
    }

    // TODO: Confirm event name with live OpenClaw gateway
    case "agent.tool_use":
    case "tool-invocation": {
      const toolCallId = typeof data?.toolCallId === "string"
        ? data.toolCallId
        : typeof data?.id === "string"
          ? data.id
          : ""
      const name = typeof data?.name === "string" ? data.name : "unknown"
      const input = (typeof data?.input === "object" && data.input !== null)
        ? data.input as Record<string, unknown>
        : {}
      return { type: "tool_use", toolCallId, name, input }
    }

    // TODO: Confirm event name with live OpenClaw gateway
    case "agent.tool_result":
    case "tool-output-available": {
      const toolCallId = typeof data?.toolCallId === "string"
        ? data.toolCallId
        : typeof data?.id === "string"
          ? data.id
          : ""
      const name = typeof data?.name === "string" ? data.name : "unknown"
      const output = typeof data?.output === "string"
        ? data.output
        : typeof data?.result === "string"
          ? data.result
          : JSON.stringify(data?.output ?? "")
      return { type: "tool_result", toolCallId, name, output }
    }

    // TODO: Confirm event name with live OpenClaw gateway
    case "agent.complete":
    case "agent.done":
      return { type: "complete" }

    // TODO: Confirm event name with live OpenClaw gateway
    case "agent.error": {
      const message = typeof data?.message === "string"
        ? data.message
        : typeof data?.error === "string"
          ? data.error
          : "Agent error"
      return { type: "error", message }
    }

    default:
      return null
  }
}

/**
 * Start an agent run for the given session.
 *
 * 1. Connects the gateway client if not already connected.
 * 2. Sends the `agent` RPC to kick off the run.
 * 3. Subscribes to gateway events and buffers/fans out SSE events.
 */
export async function startRun(sessionId: string, message: string): Promise<void> {
  // Prevent duplicate runs for the same session
  const existing = runs.get(sessionId)
  if (existing && existing.status === "running") {
    throw new DuplicateRunError(sessionId)
  }

  // Clean up any stale run for this session
  if (existing) {
    existing.unsubscribeGateway?.()
    if (existing.cleanupTimer) clearTimeout(existing.cleanupTimer)
    runs.delete(sessionId)
  }

  const gw = await ensureClient()

  // Create the run record
  const run: ActiveRun = {
    sessionId,
    status: "running",
    eventBuffer: [],
    subscribers: new Set(),
  }
  runs.set(sessionId, run)

  // Subscribe to all gateway events for this run
  // TODO: The gateway may scope events by session/run ID. For now we subscribe
  // to the event names we know about and filter by matching. If the gateway
  // provides a way to scope subscriptions (e.g., event prefix), use that instead.
  const eventNames = [
    "agent.text_delta",
    "agent.text",
    "agent.tool_use",
    "tool-invocation",
    "agent.tool_result",
    "tool-output-available",
    "agent.complete",
    "agent.done",
    "agent.error",
  ]

  const unsubs: (() => void)[] = []
  for (const eventName of eventNames) {
    const unsub = gw.subscribe(eventName, (payload) => {
      // Only process if run is still active
      if (run.status !== "running") return

      const sseEvent = mapGatewayEvent(eventName, payload)
      if (!sseEvent) return

      if (sseEvent.type === "complete") {
        finishRun(run, "complete")
      } else if (sseEvent.type === "error") {
        finishRun(run, "error", sseEvent.message)
      } else {
        emitEvent(run, sseEvent)
      }
    })
    unsubs.push(unsub)
  }

  run.unsubscribeGateway = () => {
    for (const unsub of unsubs) unsub()
  }

  // Fire the agent RPC
  try {
    await gw.request("agent", {
      message,
      channel: "webchat",
      deliver: false,
    })
  } catch (err) {
    finishRun(run, "error", err instanceof Error ? err.message : String(err))
    throw err
  }
}

/**
 * Get info about an active (or recently completed) run.
 */
export function getActiveRun(sessionId: string): ActiveRunInfo | null {
  const run = runs.get(sessionId)
  if (!run) return null

  return {
    sessionId: run.sessionId,
    status: run.status,
    eventCount: run.eventBuffer.length,
    error: run.error,
  }
}

/**
 * Subscribe to SSE events from a run.
 *
 * If `replay` is true, immediately replays all buffered events before
 * subscribing to live events.
 *
 * The callback receives `null` when the run completes (terminal signal).
 *
 * Returns an unsubscribe function, or `null` if the run doesn't exist.
 */
export function subscribeToRun(
  sessionId: string,
  callback: (event: SseEvent | null) => void,
  options?: { replay?: boolean }
): (() => void) | null {
  const run = runs.get(sessionId)
  if (!run) return null

  // Subscribe to live events first to avoid missing terminal signal
  // that could fire between replay and subscribe.
  const isRunning = run.status === "running"
  if (isRunning) {
    run.subscribers.add(callback)
  }

  // Replay buffered events
  if (options?.replay) {
    for (const event of run.eventBuffer) {
      try {
        callback(event)
      } catch {
        // Ignore callback errors during replay
      }
    }
  }

  // If already finished (or finished during replay), send terminal signal
  if (!isRunning) {
    try {
      callback(null)
    } catch {
      // Ignore
    }
    return () => {}
  }

  return () => {
    run.subscribers.delete(callback)
  }
}

/**
 * Check if the gateway is reachable.
 * If the singleton client is already connected, returns true immediately.
 * Otherwise, attempts a real connection (which becomes the singleton).
 */
export async function checkGatewayReachable(): Promise<boolean> {
  if (client?.isConnected) return true
  try {
    await ensureClient()
    return true
  } catch {
    return false
  }
}
