// Core agent wrapper around the Claude Agent SDK.
// Replaces gateway-client.ts — calls Anthropic API directly via query().

import fs from "node:fs/promises"
import { homedir } from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { query } from "@anthropic-ai/claude-agent-sdk"
import { getAgentConfig } from "./config"
import { mapSdkMessage } from "./event-mapper"
import type { SseEvent } from "./types"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Cache the system prompt across runs (files don't change at runtime)
let cachedSystemPrompt: string | null = null

async function loadSystemPrompt(): Promise<string> {
  if (cachedSystemPrompt) return cachedSystemPrompt

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

/**
 * Run the agent with the Claude Agent SDK.
 * Streams SseEvents to the caller via callbacks.
 */
export async function runAgent(
  message: string,
  options: { sessionId?: string },
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
      const conversation = query({
        prompt: message,
        options: {
          abortController,
          systemPrompt,
          model: config.model,
          cwd: home,
          includePartialMessages: true,
          persistSession: false,
          permissionMode: "bypassPermissions",
          allowDangerouslySkipPermissions: true,
          mcpServers: {
            coffeeshop: {
              command: "coffeeshop",
              args: ["mcp-server"],
            },
          },
          env: process.env as Record<string, string>,
        },
      })

      let gotResult = false

      for await (const msg of conversation) {
        if (abortController.signal.aborted) break

        const events = mapSdkMessage(msg)
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
