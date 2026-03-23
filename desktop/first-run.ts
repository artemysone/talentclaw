// First-run Claude Code dependency management for TalentClaw's Electron app.
// Pure Node.js — runs in Electron's main process.
// Returns structured results (no interactive prompts).

import { execFileSync, spawn } from "node:child_process"
import { existsSync, mkdirSync, symlinkSync, unlinkSync } from "node:fs"
import { homedir } from "node:os"
import { join } from "node:path"
import { hasClaudeCredentialFiles } from "../lib/claude-auth"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ClaudeStatus {
  hasBinary: boolean
  binaryPath: string | null
  hasAuth: boolean
  authMethod: "subscription" | "api_key" | null
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

const TALENTCLAW_BIN_DIR = join(homedir(), ".talentclaw", "bin")
const LOCAL_CLAUDE_PATH = join(TALENTCLAW_BIN_DIR, "claude")

/** Find claude binary on PATH. Returns absolute path or null. */
function findClaudeOnPath(): string | null {
  try {
    const result = execFileSync("which", ["claude"], {
      stdio: "pipe",
      timeout: 5000,
    })
    return result.toString().trim() || null
  } catch {
    return null
  }
}

/** Resolve the best available claude binary path. */
function resolveBinaryPath(): string | null {
  // 1. Explicit env override
  if (process.env.TALENTCLAW_CLAUDE_PATH) {
    const p = process.env.TALENTCLAW_CLAUDE_PATH
    if (existsSync(p)) return p
  }

  // 2. Local install under ~/.talentclaw/bin/
  if (existsSync(LOCAL_CLAUDE_PATH)) return LOCAL_CLAUDE_PATH

  // 3. Global PATH
  return findClaudeOnPath()
}

/** Check if the binary at `claudePath` is authenticated. */
function checkAuth(claudePath: string): boolean {
  try {
    execFileSync(claudePath, ["auth", "status"], {
      stdio: "pipe",
      timeout: 5000,
    })
    return true
  } catch {
    return false
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Check current Claude Code status — no side effects.
 */
export async function checkClaudeStatus(): Promise<ClaudeStatus> {
  // API key auth takes precedence
  if (process.env.ANTHROPIC_API_KEY) {
    const binaryPath = resolveBinaryPath()
    return {
      hasBinary: binaryPath !== null,
      binaryPath,
      hasAuth: true,
      authMethod: "api_key",
    }
  }

  const binaryPath = resolveBinaryPath()

  if (!binaryPath) {
    // No binary — check fallback auth files in case user has credentials
    const fallbackAuth = hasClaudeCredentialFiles()
    return {
      hasBinary: false,
      binaryPath: null,
      hasAuth: fallbackAuth,
      authMethod: fallbackAuth ? "subscription" : null,
    }
  }

  // Binary exists — check auth via `claude auth status`
  const hasAuth = checkAuth(binaryPath) || hasClaudeCredentialFiles()

  return {
    hasBinary: true,
    binaryPath,
    hasAuth,
    authMethod: hasAuth ? "subscription" : null,
  }
}

/**
 * Download / install Claude Code binary to ~/.talentclaw/bin/claude.
 * Uses `npm install -g @anthropic-ai/claude-code` as the install method,
 * then symlinks or copies the binary to our local bin directory.
 *
 * @param onProgress - optional callback for progress updates
 * @returns absolute path to the installed binary
 */
export async function downloadClaudeBinary(
  onProgress?: (downloaded: number, total: number) => void,
): Promise<string> {
  // Ensure target directory exists
  mkdirSync(TALENTCLAW_BIN_DIR, { recursive: true })

  // Signal start
  onProgress?.(0, 100)

  // Install Claude Code globally via npm
  onProgress?.(10, 100)

  await new Promise<void>((resolve, reject) => {
    const proc = spawn("npm", ["install", "-g", "@anthropic-ai/claude-code"], {
      stdio: "pipe",
    })

    let stderr = ""
    proc.stderr?.on("data", (chunk: Buffer) => {
      stderr += chunk.toString()
    })

    // Approximate progress during install
    let progress = 10
    const interval = setInterval(() => {
      if (progress < 80) {
        progress += 5
        onProgress?.(progress, 100)
      }
    }, 2000)

    proc.on("close", (code) => {
      clearInterval(interval)
      if (code === 0) {
        onProgress?.(80, 100)
        resolve()
      } else {
        reject(new Error(`npm install failed (exit ${code}): ${stderr.slice(-500)}`))
      }
    })

    proc.on("error", (err) => {
      clearInterval(interval)
      reject(new Error(`Failed to spawn npm: ${err.message}`))
    })
  })

  // After global install, find the binary
  onProgress?.(85, 100)
  const globalPath = findClaudeOnPath()

  if (!globalPath) {
    throw new Error(
      "npm install succeeded but 'claude' not found on PATH. " +
        "You may need to add npm's global bin directory to your PATH.",
    )
  }

  // Symlink into our local bin for reliable future lookups
  try {
    if (existsSync(LOCAL_CLAUDE_PATH)) {
      unlinkSync(LOCAL_CLAUDE_PATH)
    }
    symlinkSync(globalPath, LOCAL_CLAUDE_PATH)
  } catch {
    // Symlink may fail on some systems — that's okay, we can use the global path
  }

  onProgress?.(90, 100)

  // Verify the binary runs
  try {
    execFileSync(globalPath, ["--version"], { stdio: "pipe", timeout: 10000 })
  } catch (err) {
    throw new Error(
      `Claude Code installed but failed verification: ${err instanceof Error ? err.message : String(err)}`,
    )
  }

  onProgress?.(100, 100)
  return existsSync(LOCAL_CLAUDE_PATH) ? LOCAL_CLAUDE_PATH : globalPath
}

/**
 * Convenience wrapper: returns true if a Claude Code binary is available.
 * Used by desktop/main.ts which expects a simple boolean check.
 */
export async function checkClaudeBinary(): Promise<boolean> {
  const status = await checkClaudeStatus()
  return status.hasBinary
}

/**
 * Run `claude login` to authenticate — opens the system browser for OAuth.
 * Returns true if auth succeeded.
 *
 * When called without arguments, automatically resolves the binary path.
 *
 * @param claudePath - absolute path to the claude executable (auto-resolved if omitted)
 */
export async function ensureClaudeAuth(claudePath?: string): Promise<boolean> {
  if (!claudePath) {
    const resolved = resolveBinaryPath()
    if (!resolved) return false
    claudePath = resolved
  }

  // Already authenticated — skip login
  if (checkAuth(claudePath) || hasClaudeCredentialFiles()) return true
  if (process.env.ANTHROPIC_API_KEY) return true

  const AUTH_TIMEOUT_MS = 120_000

  return new Promise<boolean>((resolve) => {
    const proc = spawn(claudePath, ["login"], {
      stdio: "inherit",
    })

    const timer = setTimeout(() => {
      proc.kill("SIGTERM")
      resolve(false)
    }, AUTH_TIMEOUT_MS)

    proc.on("close", () => {
      clearTimeout(timer)

      // Verify auth after login completes
      const authed = checkAuth(claudePath) || hasClaudeCredentialFiles()
      resolve(authed)
    })

    proc.on("error", () => {
      clearTimeout(timer)
      resolve(false)
    })
  })
}
