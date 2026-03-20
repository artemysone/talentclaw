// Agent SDK configuration.
// The Agent SDK spawns a Claude Code process, which uses whatever auth
// Claude Code has configured — subscription (Pro/Max), API key, or org.
// ANTHROPIC_API_KEY is optional; the SDK inherits Claude Code's auth.

import type { AgentConfig } from "./types"

const DEFAULT_MODEL = "claude-sonnet-4-6"

export function getAgentConfig(): AgentConfig {
  return {
    apiKey: process.env.ANTHROPIC_API_KEY,
    model: process.env.TALENTCLAW_MODEL ?? DEFAULT_MODEL,
  }
}

export function isAgentConfigured(): boolean {
  // The Agent SDK spawns Claude Code, which handles its own auth.
  // If ANTHROPIC_API_KEY is set, it's used. Otherwise, Claude Code
  // uses its subscription login (claude login). We consider the agent
  // "configured" as long as Claude Code is likely available.
  // A missing API key is fine — the SDK will use subscription auth.
  return true
}
