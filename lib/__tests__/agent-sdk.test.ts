import { describe, it, expect, vi, beforeEach } from "vitest"
import { mapSdkMessage } from "../agent/event-mapper"
import { DuplicateRunError, getActiveRun, subscribeToRun } from "../agent/active-runs"

// --- event-mapper tests ---

describe("event-mapper", () => {
  it("skips text in assistant messages (streamed via stream_event instead)", () => {
    const msg = {
      type: "assistant" as const,
      message: {
        content: [{ type: "text" as const, text: "Hello world" }],
      },
      parent_tool_use_id: null,
      uuid: "00000000-0000-0000-0000-000000000001",
      session_id: "sess-1",
    }
    const events = mapSdkMessage(msg as any)
    expect(events).toEqual([])
  })

  it("maps assistant tool_use to tool_use event", () => {
    const msg = {
      type: "assistant" as const,
      message: {
        content: [
          {
            type: "tool_use" as const,
            id: "tool-123",
            name: "search_opportunities",
            input: { query: "engineer" },
          },
        ],
      },
      parent_tool_use_id: null,
      uuid: "00000000-0000-0000-0000-000000000002",
      session_id: "sess-1",
    }
    const events = mapSdkMessage(msg as any)
    expect(events).toEqual([
      {
        type: "tool_use",
        toolCallId: "tool-123",
        name: "search_opportunities",
        input: { query: "engineer" },
      },
    ])
  })

  it("maps multiple content blocks from one assistant message", () => {
    const msg = {
      type: "assistant" as const,
      message: {
        content: [
          { type: "text" as const, text: "Let me search for jobs." },
          {
            type: "tool_use" as const,
            id: "tool-456",
            name: "search_opportunities",
            input: { skills: ["TypeScript"] },
          },
        ],
      },
      parent_tool_use_id: null,
      uuid: "00000000-0000-0000-0000-000000000003",
      session_id: "sess-1",
    }
    const events = mapSdkMessage(msg as any)
    expect(events).toHaveLength(1)
    expect(events[0]).toMatchObject({ type: "tool_use", name: "search_opportunities" })
  })

  it("maps stream_event text_delta", () => {
    const msg = {
      type: "stream_event" as const,
      event: {
        type: "content_block_delta" as const,
        delta: { type: "text_delta", text: "partial " },
        index: 0,
      },
      parent_tool_use_id: null,
      uuid: "00000000-0000-0000-0000-000000000004",
      session_id: "sess-1",
    }
    const events = mapSdkMessage(msg as any)
    expect(events).toEqual([{ type: "text_delta", content: "partial " }])
  })

  it("maps result success to complete", () => {
    const msg = {
      type: "result" as const,
      subtype: "success" as const,
      duration_ms: 1000,
      duration_api_ms: 800,
      is_error: false,
      num_turns: 1,
      result: "done",
      stop_reason: "end_turn",
      total_cost_usd: 0.01,
      usage: { input_tokens: 100, output_tokens: 50, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 },
      modelUsage: {},
      permission_denials: [],
      uuid: "00000000-0000-0000-0000-000000000005",
      session_id: "sess-1",
    }
    const events = mapSdkMessage(msg as any)
    expect(events).toEqual([{ type: "complete" }])
  })

  it("maps result error to error event", () => {
    const msg = {
      type: "result" as const,
      subtype: "error_during_execution" as const,
      duration_ms: 500,
      duration_api_ms: 400,
      is_error: true,
      num_turns: 1,
      stop_reason: null,
      total_cost_usd: 0.005,
      usage: { input_tokens: 50, output_tokens: 10, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 },
      modelUsage: {},
      permission_denials: [],
      errors: ["API rate limit exceeded", "Retry failed"],
      uuid: "00000000-0000-0000-0000-000000000006",
      session_id: "sess-1",
    }
    const events = mapSdkMessage(msg as any)
    expect(events).toEqual([
      { type: "error", message: "API rate limit exceeded; Retry failed" },
    ])
  })

  it("maps user tool_result content to tool_result event", () => {
    const msg = {
      type: "user" as const,
      message: {
        role: "user",
        content: [
          {
            type: "tool_result",
            tool_use_id: "tool-123",
            content: [{ type: "text", text: "Found 5 jobs matching your criteria" }],
          },
        ],
      },
      parent_tool_use_id: "tool-123",
      isSynthetic: true,
      session_id: "sess-1",
    }
    const events = mapSdkMessage(msg as any)
    expect(events).toEqual([
      {
        type: "tool_result",
        toolCallId: "tool-123",
        name: "",
        output: "Found 5 jobs matching your criteria",
      },
    ])
  })

  it("maps user tool_result with string content", () => {
    const msg = {
      type: "user" as const,
      message: {
        role: "user",
        content: [
          {
            type: "tool_result",
            tool_use_id: "tool-456",
            content: "Application submitted successfully",
          },
        ],
      },
      parent_tool_use_id: "tool-456",
      isSynthetic: true,
      session_id: "sess-1",
    }
    const events = mapSdkMessage(msg as any)
    expect(events).toEqual([
      {
        type: "tool_result",
        toolCallId: "tool-456",
        name: "",
        output: "Application submitted successfully",
      },
    ])
  })

  it("returns empty array for unknown message types", () => {
    const msg = {
      type: "system" as const,
      subtype: "status",
      status: "idle",
      uuid: "00000000-0000-0000-0000-000000000007",
      session_id: "sess-1",
    }
    const events = mapSdkMessage(msg as any)
    expect(events).toEqual([])
  })
})

// --- config tests ---

describe("config", () => {
  beforeEach(() => {
    vi.unstubAllEnvs()
  })

  it("isAgentConfigured returns true (SDK uses Claude Code subscription auth)", async () => {
    const { isAgentConfigured } = await import("../agent/config")
    expect(isAgentConfigured()).toBe(true)
  })

  it("getAgentConfig returns config with API key when set", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "sk-test-123")
    const { getAgentConfig } = await import("../agent/config")
    const config = getAgentConfig()
    expect(config.apiKey).toBe("sk-test-123")
    expect(config.model).toBe("claude-opus-4-6")
  })

  it("getAgentConfig returns config without API key (uses subscription auth)", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "")
    const { getAgentConfig } = await import("../agent/config")
    const config = getAgentConfig()
    expect(config.apiKey).toBeFalsy()
    expect(config.model).toBe("claude-opus-4-6")
  })
})

// --- active-runs tests ---

describe("active-runs", () => {
  it("DuplicateRunError has correct properties", () => {
    const err = new DuplicateRunError("sess-abc")
    expect(err.name).toBe("DuplicateRunError")
    expect(err.code).toBe("DUPLICATE_RUN")
    expect(err.message).toContain("sess-abc")
  })

  it("getActiveRun returns null for unknown session", () => {
    expect(getActiveRun("nonexistent")).toBeNull()
  })

  it("subscribeToRun returns null for unknown session", () => {
    const result = subscribeToRun("nonexistent", () => {})
    expect(result).toBeNull()
  })
})
