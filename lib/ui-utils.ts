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
