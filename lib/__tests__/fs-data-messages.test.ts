import { describe, it, expect, beforeEach, afterEach } from "vitest"
import fs from "node:fs/promises"
import path from "node:path"
import matter from "gray-matter"
import {
  createTempDataDir,
  cleanupTempDataDir,
  writeMockThread,
} from "@/lib/test-helpers"
import {
  listThreads,
  getThread,
  getUnreadCount,
  createMessage,
} from "@/lib/fs-data"

let tmpDir: string

beforeEach(async () => {
  tmpDir = await createTempDataDir()
})

afterEach(async () => {
  await cleanupTempDataDir(tmpDir)
})

describe("listThreads", () => {
  it("returns empty array when no threads exist", async () => {
    const threads = await listThreads()
    expect(threads).toEqual([])
  })

  it("lists multiple threads with frontmatter", async () => {
    await writeMockThread(tmpDir, "thread-alpha", {
      subject: "Alpha discussion",
      participants: ["alice", "bob"],
      last_active: "2026-03-10T00:00:00Z",
      unread: false,
    })
    await writeMockThread(tmpDir, "thread-beta", {
      subject: "Beta discussion",
      participants: ["carol"],
      last_active: "2026-03-12T00:00:00Z",
      unread: true,
    })

    const threads = await listThreads()
    expect(threads).toHaveLength(2)
    expect(threads[0].frontmatter.subject).toBe("Beta discussion")
    expect(threads[1].frontmatter.subject).toBe("Alpha discussion")
  })

  it("sorts by last_active descending", async () => {
    await writeMockThread(tmpDir, "old", {
      subject: "Old",
      participants: [],
      last_active: "2026-01-01T00:00:00Z",
      unread: false,
    })
    await writeMockThread(tmpDir, "new", {
      subject: "New",
      participants: [],
      last_active: "2026-03-15T00:00:00Z",
      unread: false,
    })
    await writeMockThread(tmpDir, "mid", {
      subject: "Mid",
      participants: [],
      last_active: "2026-02-01T00:00:00Z",
      unread: false,
    })

    const threads = await listThreads()
    expect(threads.map((t) => t.slug)).toEqual(["new", "mid", "old"])
  })
})

describe("getThread", () => {
  it("returns full thread with messages sorted by sent_at", async () => {
    await writeMockThread(
      tmpDir,
      "convo",
      {
        subject: "Job chat",
        participants: ["alice", "bob"],
        last_active: "2026-03-10T12:00:00Z",
        unread: true,
      },
      [
        {
          frontmatter: {
            direction: "inbound",
            from: "bob",
            to: "alice",
            sent_at: "2026-03-10T10:00:00Z",
          },
          content: "First message",
        },
        {
          frontmatter: {
            direction: "outbound",
            from: "alice",
            to: "bob",
            sent_at: "2026-03-10T12:00:00Z",
          },
          content: "Reply message",
        },
      ],
    )

    const thread = await getThread("convo")
    expect(thread).not.toBeNull()
    expect(thread!.frontmatter.subject).toBe("Job chat")
    expect(thread!.messages).toHaveLength(2)
    expect(thread!.messages[0].content).toBe("First message")
    expect(thread!.messages[1].content).toBe("Reply message")
  })

  it("returns null for missing thread", async () => {
    const thread = await getThread("nonexistent")
    expect(thread).toBeNull()
  })
})

describe("getUnreadCount", () => {
  it("returns 0 when no threads exist", async () => {
    const count = await getUnreadCount()
    expect(count).toBe(0)
  })

  it("counts correctly with mix of read and unread", async () => {
    await writeMockThread(tmpDir, "read-thread", {
      subject: "Read",
      participants: [],
      last_active: "2026-03-10T00:00:00Z",
      unread: false,
    })
    await writeMockThread(tmpDir, "unread-1", {
      subject: "Unread 1",
      participants: [],
      last_active: "2026-03-11T00:00:00Z",
      unread: true,
    })
    await writeMockThread(tmpDir, "unread-2", {
      subject: "Unread 2",
      participants: [],
      last_active: "2026-03-12T00:00:00Z",
      unread: true,
    })

    const count = await getUnreadCount()
    expect(count).toBe(2)
  })
})

describe("createMessage", () => {
  it("auto-numbers correctly (001.md, 002.md)", async () => {
    await writeMockThread(tmpDir, "thread-x", {
      subject: "Thread X",
      participants: ["alice"],
      last_active: "2026-03-01T00:00:00Z",
      unread: false,
    })

    const first = await createMessage(
      "thread-x",
      {
        direction: "outbound",
        from: "alice",
        to: "bob",
        sent_at: "2026-03-15T10:00:00Z",
      },
      "Hello!",
    )
    expect(first).toBe("001.md")

    const second = await createMessage(
      "thread-x",
      {
        direction: "inbound",
        from: "bob",
        to: "alice",
        sent_at: "2026-03-15T11:00:00Z",
      },
      "Hi back!",
    )
    expect(second).toBe("002.md")

    // Verify files exist with correct content
    const thread = await getThread("thread-x")
    expect(thread!.messages).toHaveLength(2)
    expect(thread!.messages[0].content).toBe("Hello!")
    expect(thread!.messages[1].content).toBe("Hi back!")
  })

  it("updates thread.md last_active", async () => {
    const originalDate = "2026-01-01T00:00:00Z"
    await writeMockThread(tmpDir, "thread-y", {
      subject: "Thread Y",
      participants: ["alice"],
      last_active: originalDate,
      unread: false,
    })

    await createMessage(
      "thread-y",
      {
        direction: "outbound",
        from: "alice",
        to: "bob",
        sent_at: "2026-03-15T10:00:00Z",
      },
      "New message",
    )

    // Re-read the thread to check last_active was updated
    const threads = await listThreads()
    const updated = threads.find((t) => t.slug === "thread-y")
    expect(updated).toBeDefined()
    // last_active should be newer than the original
    expect(
      new Date(updated!.frontmatter.last_active).getTime(),
    ).toBeGreaterThan(new Date(originalDate).getTime())
  })
})
