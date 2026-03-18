import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import {
  formatDate,
  formatCompensation,
  formatRelativeTime,
  isSafeUrl,
} from "@/lib/ui-utils"
import { matchScoreClass } from "@/lib/match-scoring"

describe("formatDate", () => {
  it("formats an ISO date string correctly", () => {
    const result = formatDate("2026-03-15T12:00:00Z")
    expect(result).not.toBeNull()
    // Should contain "Mar" and "2026" in some locale format
    // Day might be 15 or 14 depending on timezone, so just check month + year
    expect(result).toContain("Mar")
    expect(result).toContain("2026")
  })

  it("returns null for non-string input", () => {
    expect(formatDate(42)).toBeNull()
    expect(formatDate(null)).toBeNull()
    expect(formatDate(undefined)).toBeNull()
  })

  it("includes time when option is set", () => {
    const result = formatDate("2026-03-15T14:30:00Z", { includeTime: true })
    expect(result).not.toBeNull()
    // Should have time component
    expect(result!.length).toBeGreaterThan(12)
  })
})

describe("formatCompensation", () => {
  it("formats min and max range", () => {
    const result = formatCompensation({ min: 120000, max: 180000 })
    expect(result).toBe("$120k \u2013 $180k")
  })

  it("formats min only with plus sign", () => {
    const result = formatCompensation({ min: 100000 })
    expect(result).toBe("$100k+")
  })

  it("formats max only with 'Up to' prefix", () => {
    const result = formatCompensation({ max: 150000 })
    expect(result).toBe("Up to $150k")
  })

  it("returns null when both are missing", () => {
    expect(formatCompensation({})).toBeNull()
    expect(formatCompensation({ min: null, max: null })).toBeNull()
  })
})

describe("formatRelativeTime", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("shows minutes ago for recent times", () => {
    const now = new Date("2026-03-15T12:00:00Z")
    vi.setSystemTime(now)

    const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000).toISOString()
    expect(formatRelativeTime(fiveMinAgo)).toBe("5m ago")
  })

  it("shows hours ago", () => {
    const now = new Date("2026-03-15T12:00:00Z")
    vi.setSystemTime(now)

    const threeHoursAgo = new Date(
      now.getTime() - 3 * 60 * 60 * 1000,
    ).toISOString()
    expect(formatRelativeTime(threeHoursAgo)).toBe("3h ago")
  })

  it("shows 'Yesterday' for 1 day ago", () => {
    const now = new Date("2026-03-15T12:00:00Z")
    vi.setSystemTime(now)

    const yesterday = new Date(
      now.getTime() - 25 * 60 * 60 * 1000,
    ).toISOString()
    expect(formatRelativeTime(yesterday)).toBe("Yesterday")
  })

  it("shows days ago for older dates", () => {
    const now = new Date("2026-03-15T12:00:00Z")
    vi.setSystemTime(now)

    const sevenDaysAgo = new Date(
      now.getTime() - 7 * 24 * 60 * 60 * 1000,
    ).toISOString()
    expect(formatRelativeTime(sevenDaysAgo)).toBe("7d ago")
  })
})

describe("matchScoreClass", () => {
  it("returns green class for excellent scores (90-100)", () => {
    expect(matchScoreClass(90)).toBe("text-green-600")
    expect(matchScoreClass(100)).toBe("text-green-600")
    expect(matchScoreClass(95)).toBe("text-green-600")
  })

  it("returns blue class for good scores (70-89)", () => {
    expect(matchScoreClass(70)).toBe("text-blue-600")
    expect(matchScoreClass(89)).toBe("text-blue-600")
  })

  it("returns yellow class for fair scores (50-69)", () => {
    expect(matchScoreClass(50)).toBe("text-yellow-600")
    expect(matchScoreClass(69)).toBe("text-yellow-600")
  })

  it("returns red class for poor scores (0-49)", () => {
    expect(matchScoreClass(0)).toBe("text-red-600")
    expect(matchScoreClass(49)).toBe("text-red-600")
  })
})

describe("isSafeUrl", () => {
  it("accepts http URLs", () => {
    expect(isSafeUrl("http://example.com")).toBe(true)
  })

  it("accepts https URLs", () => {
    expect(isSafeUrl("https://example.com/apply")).toBe(true)
  })

  it("rejects javascript: protocol", () => {
    expect(isSafeUrl("javascript:alert(1)")).toBe(false)
  })

  it("rejects data: protocol", () => {
    expect(isSafeUrl("data:text/html,<h1>hi</h1>")).toBe(false)
  })

  it("rejects malformed URLs", () => {
    expect(isSafeUrl("not-a-url")).toBe(false)
  })
})
