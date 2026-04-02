// Server-side singleton managing agent run lifecycles.
//
// This module uses a module-level singleton (runs map) which works
// because TalentClaw runs as a persistent Next.js server (via `npx talentclaw`),
// not as serverless functions. The state lives for the lifetime of the process.

import { runAgent } from "./sdk-client"
import type { SseEvent, RunStatus, ActiveRunInfo } from "./types"

export class DuplicateRunError extends Error {
  readonly code = "DUPLICATE_RUN" as const
  constructor(sessionId: string) {
    super(`Run already active for session ${sessionId}`)
    this.name = "DuplicateRunError"
  }
}

const RUN_CLEANUP_DELAY = 15 * 60 * 1000 // 15 minutes after completion
const MAX_EVENT_BUFFER = 200
const trustedResumeSessions = new Map<string, string>()

type ActiveRun = {
  sessionId: string
  status: RunStatus
  eventBuffer: SseEvent[]
  subscribers: Set<(event: SseEvent | null) => void>
  abortRun?: () => void
  cleanupTimer?: ReturnType<typeof setTimeout>
  error?: string
}

// Module-level singleton state
const runs = new Map<string, ActiveRun>()

/**
 * Push an SSE event to a run's buffer and fan out to live subscribers.
 */
function emitEvent(run: ActiveRun, event: SseEvent): void {
  run.eventBuffer.push(event)
  if (run.eventBuffer.length > MAX_EVENT_BUFFER) {
    run.eventBuffer.shift()
  }
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
 * Mark a run as finished (complete or error) and clean up.
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
  scheduleCleanup(run.sessionId)
}

/**
 * Start an agent run for the given session.
 *
 * 1. Validates no duplicate run exists.
 * 2. Calls runAgent() to start the Claude Agent SDK query.
 * 3. Maps SDK events to SSE events and fans out to subscribers.
 */
export async function startRun(sessionId: string, message: string, resumeSessionId?: string): Promise<void> {
  // Prevent duplicate runs for the same session
  const existing = runs.get(sessionId)
  if (existing && existing.status === "running") {
    throw new DuplicateRunError(sessionId)
  }

  // Clean up any stale run for this session
  if (existing) {
    existing.abortRun?.()
    if (existing.cleanupTimer) clearTimeout(existing.cleanupTimer)
    runs.delete(sessionId)
  }

  // Create the run record
  const run: ActiveRun = {
    sessionId,
    status: "running",
    eventBuffer: [],
    subscribers: new Set(),
  }
  runs.set(sessionId, run)
  if (resumeSessionId) {
    trustedResumeSessions.set(sessionId, resumeSessionId)
  }

  // Start the agent
  try {
    const { abort } = await runAgent(
      message,
      { sessionId, resumeSessionId },
      (event: SseEvent) => {
        if (run.status !== "running") return

        if (event.type === "sdk_session") {
          trustedResumeSessions.set(sessionId, event.sdkSessionId)
        }

        if (event.type === "complete") {
          finishRun(run, "complete")
        } else if (event.type === "error") {
          finishRun(run, "error", event.message)
        } else {
          emitEvent(run, event)
        }
      },
      () => {
        // onComplete — if run is still "running", mark it done
        if (run.status === "running") {
          finishRun(run, "complete")
        }
      },
      (error: string) => {
        if (run.status === "running") {
          finishRun(run, "error", error)
        }
      },
    )
    run.abortRun = abort
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

export function getTrustedResumeSessionId(sessionId: string): string | null {
  return trustedResumeSessions.get(sessionId) ?? null
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
