import type { PipelineStage } from "./types"

// Shared date formatting for file viewer headers
export function formatDate(
  d: unknown,
  options?: { includeTime?: boolean }
): string | null {
  if (typeof d !== "string") return null
  try {
    const opts: Intl.DateTimeFormatOptions = {
      month: "short",
      day: "numeric",
      year: "numeric",
    }
    if (options?.includeTime) {
      opts.hour = "numeric"
      opts.minute = "2-digit"
    }
    return new Date(d).toLocaleDateString("en-US", opts)
  } catch {
    return String(d)
  }
}

// Status badge colors shared across file viewer headers
export const STATUS_COLORS: Record<PipelineStage, { bg: string; text: string }> = {
  discovered: { bg: "bg-slate-100", text: "text-slate-700" },
  saved: { bg: "bg-blue-100", text: "text-blue-700" },
  applied: { bg: "bg-emerald-100", text: "text-emerald-700" },
  interviewing: { bg: "bg-violet-100", text: "text-violet-700" },
  offer: { bg: "bg-emerald-100", text: "text-emerald-700" },
  accepted: { bg: "bg-green-100", text: "text-green-700" },
  rejected: { bg: "bg-red-100", text: "text-red-700" },
}

// XSS prevention: only allow http/https URLs
export function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === "http:" || parsed.protocol === "https:"
  } catch {
    return false
  }
}

// Relative time formatting (e.g. "5m ago", "3h ago", "Yesterday", "7d ago")
export function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return "Yesterday"
  return `${days}d ago`
}

// Compensation range formatting (e.g. "$120k – $180k", "$100k+", "Up to $150k")
export function formatCompensation(
  comp: { min?: number | null; max?: number | null }
): string | null {
  const min = typeof comp.min === "number" ? comp.min : null
  const max = typeof comp.max === "number" ? comp.max : null
  if (min === null && max === null) return null
  const fmt = (n: number) => {
    if (n >= 1000) return `$${Math.round(n / 1000)}k`
    return `$${n}`
  }
  if (min !== null && max !== null) return `${fmt(min)} – ${fmt(max)}`
  if (min !== null) return `${fmt(min)}+`
  if (max !== null) return `Up to ${fmt(max)}`
  return null
}

// Human-readable pipeline stage labels
export const STAGE_LABELS: Record<string, string> = {
  discovered: "Discovered",
  saved: "Saved",
  applied: "Applied",
  interviewing: "Interviewing",
  offer: "Offer",
  accepted: "Accepted",
  rejected: "Rejected",
}
