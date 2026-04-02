// Core agent wrapper around the Claude Agent SDK.
// The SDK spawns a Claude Code process that uses whatever auth Claude Code has configured.

import fs from "node:fs/promises"
import { homedir } from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { getAgentConfig } from "./config"
import { mapSdkMessage } from "./event-mapper"
import type { SseEvent } from "./types"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

type ClaudeSdkModule = {
  query: (input: {
    prompt: string
    options: Record<string, unknown>
  }) => AsyncIterable<ClaudeSdkMessage>
}

type ClaudeSdkMessage = {
  session_id?: string
  [key: string]: unknown
}

// Cache the system prompt across runs (skip cache in dev for prompt iteration)
let cachedSystemPrompt: string | null = null

async function loadSystemPrompt(): Promise<string> {
  if (cachedSystemPrompt && process.env.NODE_ENV !== "development") return cachedSystemPrompt

  // Resolve project root relative to this file (lib/agent/ → project root)
  const projectRoot = path.resolve(__dirname, "..", "..")
  const [skillPrompt, soulPrompt] = await Promise.all([
    fs.readFile(path.join(projectRoot, "skills", "SKILL.md"), "utf-8").catch(() => ""),
    fs.readFile(path.join(projectRoot, "persona", "SOUL.md"), "utf-8").catch(() => ""),
  ])

  // Combine: SOUL.md as identity + SKILL.md as capabilities
  const parts: string[] = []
  if (soulPrompt) parts.push(soulPrompt)
  if (skillPrompt) parts.push(skillPrompt)

  cachedSystemPrompt = parts.join("\n\n---\n\n")
  return cachedSystemPrompt
}

async function loadClaudeSdk(): Promise<ClaudeSdkModule> {
  try {
    const runtimeImport = new Function("specifier", "return import(specifier)") as (
      specifier: string,
    ) => Promise<ClaudeSdkModule>
    return await runtimeImport("@anthropic-ai/claude-agent-sdk")
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(
      `Claude Agent SDK is not installed. Install optional dependencies locally to enable agent chat. (${message})`,
    )
  }
}

/**
 * Run the agent with the Claude Agent SDK.
 * Streams SseEvents to the caller via callbacks.
 */
export async function runAgent(
  message: string,
  options: { sessionId?: string; resumeSessionId?: string },
  onEvent: (event: SseEvent) => void,
  onComplete: () => void,
  onError: (error: string) => void,
): Promise<{ abort: () => void }> {
  const config = getAgentConfig()
  const systemPrompt = await loadSystemPrompt()
  const abortController = new AbortController()

  const home = homedir()

  // Start the agent query in the background
  ;(async () => {
    try {
      const claudePath = process.env.TALENTCLAW_CLAUDE_PATH || undefined

      const { query } = await loadClaudeSdk()
      const conversation = query({
        prompt: message,
        options: {
          abortController,
          systemPrompt,
          model: config.model,
          cwd: home,
          includePartialMessages: true,
          persistSession: true,
          ...(options.resumeSessionId && { resume: options.resumeSessionId }),
          permissionMode: "bypassPermissions",
          allowDangerouslySkipPermissions: true,
          mcpServers: undefined,
          env: process.env as Record<string, string>,
          ...(claudePath && { pathToClaudeCodeExecutable: claudePath }),
        },
      })

      let gotResult = false
      let emittedSdkSession = false

      for await (const msg of conversation) {
        if (abortController.signal.aborted) break

        // Capture the SDK session ID from the first message that carries it
        if (!emittedSdkSession && typeof msg.session_id === "string" && msg.session_id.length > 0) {
          onEvent({ type: "sdk_session", sdkSessionId: msg.session_id })
          emittedSdkSession = true
        }

        const events = mapSdkMessage(msg as Parameters<typeof mapSdkMessage>[0])
        for (const event of events) {
          if (event.type === "complete" || event.type === "error") {
            gotResult = true
          }
          onEvent(event)
        }
      }

      // If the generator ended without a result message, emit complete
      if (!gotResult) {
        onEvent({ type: "complete" })
      }
      onComplete()
    } catch (err) {
      if (abortController.signal.aborted) return
      const msg = err instanceof Error ? err.message : String(err)
      onError(msg)
    }
  })()

  return {
    abort: () => abortController.abort(),
  }
}
