// Maps Claude Agent SDK messages to our SSE event contract.

import type { SDKMessage } from "@anthropic-ai/claude-agent-sdk"
import type { SseEvent } from "./types"

/**
 * Map an SDK message to zero or more SseEvents.
 * Returns an array because a single assistant message can contain
 * multiple content blocks (text + tool_use).
 */
export function mapSdkMessage(msg: SDKMessage): SseEvent[] {
  switch (msg.type) {
    case "assistant": {
      // When includePartialMessages is true, text arrives incrementally via
      // stream_event messages. The final assistant message contains the full
      // text, so we only extract tool_use blocks here to avoid doubling text.
      const events: SseEvent[] = []
      for (const block of msg.message.content) {
        if (block.type === "tool_use") {
          events.push({
            type: "tool_use",
            toolCallId: block.id,
            name: block.name,
            input: (block.input as Record<string, unknown>) ?? {},
          })
        }
      }
      return events
    }

    case "user": {
      // Synthetic user messages contain tool_result content blocks
      const events: SseEvent[] = []
      const message = msg.message as { content?: unknown }
      const content = Array.isArray(message.content) ? message.content : []
      for (const block of content) {
        const b = block as { type?: string; tool_use_id?: string; content?: unknown }
        if (b.type === "tool_result" && b.tool_use_id) {
          const output = typeof b.content === "string"
            ? b.content
            : Array.isArray(b.content)
              ? (b.content as Array<{ text?: string }>).map(c => c.text ?? "").join("")
              : ""
          events.push({
            type: "tool_result",
            toolCallId: b.tool_use_id,
            name: "",
            output,
          })
        }
      }
      return events
    }

    case "stream_event": {
      // Partial streaming events for incremental text
      const event = msg.event
      if (event.type === "content_block_delta") {
        const delta = event.delta as { type: string; text?: string }
        if (delta.type === "text_delta" && delta.text) {
          return [{ type: "text_delta", content: delta.text }]
        }
      }
      return []
    }

    case "result": {
      if (msg.subtype === "success") {
        return [{ type: "complete" }]
      }
      // Error results
      const errorMsg = "errors" in msg && Array.isArray(msg.errors)
        ? msg.errors.join("; ")
        : `Agent run failed: ${msg.subtype}`
      return [{ type: "error", message: errorMsg }]
    }

    default:
      return []
  }
}
