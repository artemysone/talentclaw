"use server"

import { createMessage, markThreadRead, appendActivity } from "@/lib/fs-data"
import { revalidatePath } from "next/cache"

export async function replyToMessage(
  threadSlug: string,
  from: string,
  to: string,
  content: string,
): Promise<{ error?: string; filename?: string }> {
  try {
    const filename = await createMessage(
      threadSlug,
      {
        direction: "outbound" as const,
        from,
        to,
        sent_at: new Date().toISOString(),
      },
      content,
    )
    await appendActivity({
      type: "message_sent",
      slug: threadSlug,
      summary: `Replied in thread ${threadSlug}`,
    })
    revalidatePath("/")
    return { filename }
  } catch (err) {
    return {
      error: `Failed to send message: ${err instanceof Error ? err.message : "unknown error"}`,
    }
  }
}

export async function markThreadReadAction(
  threadSlug: string,
): Promise<{ error?: string }> {
  try {
    await markThreadRead(threadSlug)
    revalidatePath("/")
    return {}
  } catch (err) {
    return {
      error: `Failed to mark thread as read: ${err instanceof Error ? err.message : "unknown error"}`,
    }
  }
}
