// OpenClaw gateway protocol types and domain types for the TalentClaw integration.

// --- Gateway protocol frames ---

export type GatewayRequest = {
  type: "req"
  id: string
  method: string
  params?: unknown
}

export type GatewayResponse = {
  type: "res"
  id: string
  ok: boolean
  payload?: unknown
  error?: { code?: string; message: string }
}

export type GatewayEvent = {
  type: "event"
  event: string
  payload?: unknown
  seq?: number
}

export type GatewayFrame = GatewayRequest | GatewayResponse | GatewayEvent

// --- Connection config ---

export type GatewayConfig = {
  url: string
  token: string | null
}

// --- Chat domain types ---

export type ToolCallInfo = {
  toolCallId: string
  name: string
  input: Record<string, unknown>
  output?: string
  status: "running" | "complete" | "error"
}

export type ChatMessage = {
  id: string
  role: "user" | "assistant"
  content: string
  toolCalls?: ToolCallInfo[]
  createdAt: number
}

// --- SSE events sent to browser ---

export type SseEvent =
  | { type: "session"; sessionId: string }
  | { type: "text_delta"; content: string }
  | { type: "tool_use"; toolCallId: string; name: string; input: Record<string, unknown> }
  | { type: "tool_result"; toolCallId: string; name: string; output: string }
  | { type: "complete" }
  | { type: "error"; message: string }

// --- Run state ---

export type RunStatus = "running" | "complete" | "error"

export type ActiveRunInfo = {
  sessionId: string
  status: RunStatus
  eventCount: number
  error?: string
}
