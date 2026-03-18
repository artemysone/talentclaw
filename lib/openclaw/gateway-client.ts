// WebSocket client for the OpenClaw gateway. Server-side only (uses `ws` package).

import crypto from "node:crypto"
import WebSocket from "ws"
import type { GatewayConfig, GatewayResponse, GatewayEvent, GatewayFrame } from "./types"

const CONNECT_TIMEOUT = 5_000
const REQUEST_TIMEOUT = 30_000

type PendingRequest = {
  resolve: (payload: unknown) => void
  reject: (error: Error) => void
  timeout: ReturnType<typeof setTimeout>
}

export class GatewayClient {
  private ws: WebSocket | null = null
  private pending = new Map<string, PendingRequest>()
  private listeners = new Map<string, Set<(payload: unknown) => void>>()
  private connected = false

  constructor(private config: GatewayConfig) {}

  get isConnected(): boolean {
    return this.connected
  }

  /**
   * Open WebSocket and perform the gateway handshake.
   * Sends a `connect` RPC with operator role and scopes.
   */
  async connect(): Promise<void> {
    if (this.connected) return

    return new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.cleanup()
        reject(new Error("Gateway connection timed out"))
      }, CONNECT_TIMEOUT)

      const ws = new WebSocket(this.config.url)

      ws.on("open", async () => {
        this.ws = ws
        this.setupMessageHandler()

        try {
          await this.request("connect", {
            role: "operator",
            scopes: ["operator.read", "operator.write"],
            auth: this.config.token ? { token: this.config.token } : undefined,
          })
          this.connected = true
          clearTimeout(timer)
          resolve()
        } catch (err) {
          clearTimeout(timer)
          this.cleanup()
          reject(err instanceof Error ? err : new Error(String(err)))
        }
      })

      ws.on("error", (err) => {
        clearTimeout(timer)
        this.cleanup()
        reject(err)
      })

      ws.on("close", () => {
        this.handleClose()
      })
    })
  }

  /**
   * Send an RPC request and wait for the response.
   */
  async request(method: string, params?: unknown): Promise<unknown> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      // Allow the `connect` method itself to call request() before connected flag is set
      if (method !== "connect") {
        throw new Error("Gateway not connected")
      }
    }

    const id = crypto.randomUUID()
    const frame = JSON.stringify({ type: "req", id, method, params })

    return new Promise<unknown>((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pending.delete(id)
        reject(new Error(`Request "${method}" timed out after ${REQUEST_TIMEOUT}ms`))
      }, REQUEST_TIMEOUT)

      this.pending.set(id, { resolve, reject, timeout })
      this.ws!.send(frame)
    })
  }

  /**
   * Subscribe to gateway events by name.
   * Returns an unsubscribe function.
   */
  subscribe(eventName: string, callback: (payload: unknown) => void): () => void {
    let subs = this.listeners.get(eventName)
    if (!subs) {
      subs = new Set()
      this.listeners.set(eventName, subs)
    }
    subs.add(callback)

    return () => {
      subs!.delete(callback)
      if (subs!.size === 0) {
        this.listeners.delete(eventName)
      }
    }
  }

  /**
   * Cleanly close the connection.
   */
  disconnect(): void {
    this.cleanup()
  }

  // --- Internal ---

  private setupMessageHandler(): void {
    if (!this.ws) return

    this.ws.on("message", (data) => {
      let frame: GatewayFrame
      try {
        frame = JSON.parse(String(data)) as GatewayFrame
      } catch {
        return // Ignore malformed frames
      }

      if (frame.type === "res") {
        this.handleResponse(frame)
      } else if (frame.type === "event") {
        this.handleEvent(frame)
      }
      // Ignore unexpected frame types
    })
  }

  private handleResponse(frame: GatewayResponse): void {
    const pending = this.pending.get(frame.id)
    if (!pending) return

    this.pending.delete(frame.id)
    clearTimeout(pending.timeout)

    if (frame.ok) {
      pending.resolve(frame.payload)
    } else {
      const msg = frame.error?.message ?? "Unknown gateway error"
      const code = frame.error?.code ? ` [${frame.error.code}]` : ""
      pending.reject(new Error(`${msg}${code}`))
    }
  }

  private handleEvent(frame: GatewayEvent): void {
    const subs = this.listeners.get(frame.event)
    if (!subs) return

    for (const cb of subs) {
      try {
        cb(frame.payload)
      } catch {
        // Don't let a subscriber error break the event loop
      }
    }
  }

  private handleClose(): void {
    this.connected = false

    // Reject all pending requests
    for (const [id, pending] of this.pending) {
      clearTimeout(pending.timeout)
      pending.reject(new Error("Gateway connection closed"))
      this.pending.delete(id)
    }
  }

  private cleanup(): void {
    this.connected = false

    if (this.ws) {
      // Remove listeners to prevent handleClose from firing during intentional cleanup
      this.ws.removeAllListeners()
      if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
        this.ws.close()
      }
      this.ws = null
    }

    // Reject all pending
    for (const [id, pending] of this.pending) {
      clearTimeout(pending.timeout)
      pending.reject(new Error("Gateway client disconnected"))
      this.pending.delete(id)
    }
  }
}
