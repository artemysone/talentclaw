// Agent SDK configuration. Reads ANTHROPIC_API_KEY from environment.

import type { AgentConfig } from "./types"

const DEFAULT_MODEL = "claude-sonnet-4-6"

export function getAgentConfig(): AgentConfig {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY environment variable is required")
  }
  return {
    apiKey,
    model: process.env.TALENTCLAW_MODEL ?? DEFAULT_MODEL,
  }
}

export function isAgentConfigured(): boolean {
  return !!process.env.ANTHROPIC_API_KEY
}
