// Read OpenClaw gateway connection settings.
// Priority: environment variables -> ~/.openclaw/openclaw.json -> defaults.

import fs from "node:fs/promises"
import path from "node:path"
import os from "node:os"
import type { GatewayConfig } from "./types"

const DEFAULT_PORT = 18789
const DEFAULT_HOST = "127.0.0.1"

function getConfigPath(): string {
  return path.join(os.homedir(), ".openclaw", "openclaw.json")
}

/**
 * Strip single-line comments and trailing commas from JSON5-ish config.
 * Avoids adding a json5 dependency for a config file that only uses these two features.
 */
function sanitizeJson(raw: string): string {
  // Remove single-line comments (// ...) but not inside strings.
  // Simple heuristic: only strip // that appear after whitespace or at line start.
  const lines = raw.split("\n")
  const cleaned = lines.map((line) => {
    // Find // that isn't inside a string
    let inString = false
    let escape = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (escape) {
        escape = false
        continue
      }
      if (ch === "\\") {
        escape = true
        continue
      }
      if (ch === '"') {
        inString = !inString
        continue
      }
      if (!inString && ch === "/" && line[i + 1] === "/") {
        return line.slice(0, i)
      }
    }
    return line
  })

  let result = cleaned.join("\n")

  // Remove trailing commas before } or ]
  result = result.replace(/,\s*([}\]])/g, "$1")

  return result
}

type OpenClawConfigFile = {
  gateway?: {
    port?: number
    bind?: string
    auth?: {
      token?: string
    }
  }
}

async function readConfigFile(): Promise<OpenClawConfigFile | null> {
  const configPath = getConfigPath()
  try {
    const raw = await fs.readFile(configPath, "utf-8")
    const sanitized = sanitizeJson(raw)
    return JSON.parse(sanitized) as OpenClawConfigFile
  } catch {
    return null
  }
}

/**
 * Resolve gateway URL and auth token.
 * Env vars OPENCLAW_GATEWAY_URL and OPENCLAW_GATEWAY_TOKEN take precedence.
 */
export async function getGatewayConfig(): Promise<GatewayConfig> {
  // Env var overrides
  const envUrl = process.env.OPENCLAW_GATEWAY_URL
  const envToken = process.env.OPENCLAW_GATEWAY_TOKEN

  if (envUrl) {
    return { url: envUrl, token: envToken ?? null }
  }

  // Read config file
  const config = await readConfigFile()
  const port = config?.gateway?.port ?? DEFAULT_PORT
  const host = config?.gateway?.bind ?? DEFAULT_HOST
  // If bind is "0.0.0.0" or "lan", connect to localhost
  const connectHost = host === "0.0.0.0" || host === "lan" ? DEFAULT_HOST : host
  const url = `ws://${connectHost}:${port}`
  const token = envToken ?? config?.gateway?.auth?.token ?? null

  return { url, token }
}

let _configuredCache: boolean | null = null

/**
 * Check whether OpenClaw appears to be configured (config file exists or env var set).
 * Does NOT ping the gateway -- use checkGatewayReachable() for that.
 * Result is memoized since the config file doesn't appear/disappear at runtime.
 */
export async function isOpenClawConfigured(): Promise<boolean> {
  if (_configuredCache !== null) return _configuredCache

  if (process.env.OPENCLAW_GATEWAY_URL) {
    return (_configuredCache = true)
  }

  try {
    await fs.access(getConfigPath())
    return (_configuredCache = true)
  } catch {
    return (_configuredCache = false)
  }
}
