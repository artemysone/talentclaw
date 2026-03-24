import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { getCached, setCache, invalidateCache, invalidateAll } from "@/lib/cache"

beforeEach(() => {
  vi.useFakeTimers()
  invalidateAll()
})

afterEach(() => {
  vi.useRealTimers()
})

describe("setCache / getCached", () => {
  it("stores and retrieves a value", () => {
    setCache("key1", { data: 42 })
    expect(getCached("key1")).toEqual({ data: 42 })
  })

  it("returns null for unknown key", () => {
    expect(getCached("nonexistent")).toBeNull()
  })

  it("returns null after TTL expires", () => {
    setCache("key1", "hello", 5000) // 5s TTL
    vi.advanceTimersByTime(4999)
    expect(getCached("key1")).toBe("hello")
    vi.advanceTimersByTime(2)
    expect(getCached("key1")).toBeNull()
  })

  it("uses default 30s TTL when not specified", () => {
    setCache("key1", "data")
    vi.advanceTimersByTime(29999)
    expect(getCached("key1")).toBe("data")
    vi.advanceTimersByTime(2)
    expect(getCached("key1")).toBeNull()
  })

  it("overwrites previous value for same key", () => {
    setCache("key1", "first")
    setCache("key1", "second")
    expect(getCached("key1")).toBe("second")
  })

  it("overwrite resets TTL", () => {
    setCache("key1", "first", 5000)
    vi.advanceTimersByTime(4000) // 4s in
    setCache("key1", "second", 5000) // resets TTL
    vi.advanceTimersByTime(4000) // 8s total, 4s since reset
    expect(getCached("key1")).toBe("second")
    vi.advanceTimersByTime(1001) // 5s since reset
    expect(getCached("key1")).toBeNull()
  })
})

describe("invalidateCache", () => {
  it("removes a specific key", () => {
    setCache("a", 1)
    setCache("b", 2)
    invalidateCache("a")
    expect(getCached("a")).toBeNull()
    expect(getCached("b")).toBe(2)
  })

  it("is a no-op for missing key", () => {
    invalidateCache("nonexistent") // should not throw
  })
})

describe("invalidateAll", () => {
  it("clears all cached entries", () => {
    setCache("a", 1)
    setCache("b", 2)
    setCache("c", 3)
    invalidateAll()
    expect(getCached("a")).toBeNull()
    expect(getCached("b")).toBeNull()
    expect(getCached("c")).toBeNull()
  })
})
