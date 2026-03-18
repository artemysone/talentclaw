import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import {
  createTempDataDir,
  cleanupTempDataDir,
  writeMockThread,
} from "@/lib/test-helpers"
import { getThread, listThreads } from "@/lib/fs-data"

// Mock next/cache since it's not available outside Next.js
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

import { replyToMessage, markThreadRead } from "@/app/actions/messages"

let tmpDir: string

beforeEach(async () => {
  tmpDir = await createTempDataDir()
})

afterEach(async () => {
  await cleanupTempDataDir(tmpDir)
})

describe("replyToMessage", () => {
  it("creates a message file in the thread", async () => {
    await writeMockThread(tmpDir, "thread-1", {
      subject: "Hello",
      participant: "bob",
      last_active: "2026-03-01T00:00:00Z",
      unread: false,
    }, [])

    const result = await replyToMessage("thread-1", "Thanks for reaching out!")
    expect(result.error).toBeUndefined()

    const thread = await getThread("thread-1")
    expect(thread!.messages).toHaveLength(1)
    expect(thread!.messages[0].content).toBe("Thanks for reaching out!")
    expect(thread!.messages[0].frontmatter.direction).toBe("outbound")
  })

  it("updates thread last_active after reply", async () => {
    const originalDate = "2026-01-01T00:00:00Z"
    await writeMockThread(tmpDir, "thread-2", {
      subject: "Follow-up",
      participant: "alice",
      last_active: originalDate,
      unread: false,
    }, [])

    await replyToMessage("thread-2", "Ping!")

    const threads = await listThreads()
    const updated = threads.find((t) => t.slug === "thread-2")
    expect(updated).toBeDefined()
    expect(
      new Date(updated!.frontmatter.last_active).getTime(),
    ).toBeGreaterThan(new Date(originalDate).getTime())
  })
})

describe("markThreadRead", () => {
  it("sets unread to false", async () => {
    await writeMockThread(tmpDir, "unread-thread", {
      subject: "New message",
      participant: "alice",
      last_active: "2026-03-15T00:00:00Z",
      unread: true,
    }, [])

    const result = await markThreadRead("unread-thread")
    expect(result.error).toBeUndefined()

    const threads = await listThreads()
    const thread = threads.find((t) => t.slug === "unread-thread")
    expect(thread!.frontmatter.unread).toBe(false)
  })

  it("returns error for non-existent thread", async () => {
    const result = await markThreadRead("no-such-thread")
    expect(result.error).toBeDefined()
    expect(result.error).toContain("Failed to mark thread as read")
  })
})
