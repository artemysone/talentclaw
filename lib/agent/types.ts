// Agent SDK types and domain types for the TalentClaw chat integration.

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

// --- SSE events sent to browser (preserved exactly) ---

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

// --- Agent config ---

export type AgentConfig = {
  apiKey?: string
  model: string
}

