import { listThreads } from "@/lib/fs-data"
import { ThreadList } from "@/components/inbox/thread-list"
import { MessageSquare } from "lucide-react"

export default async function InboxPage() {
  const threads = await listThreads()

  // Sort by last_active descending (most recent first)
  const sorted = [...threads].sort((a, b) =>
    b.frontmatter.last_active.localeCompare(a.frontmatter.last_active)
  )

  return (
    <div className="max-w-3xl mx-auto px-5 py-8">
      <div className="mb-8">
        <h1 className="font-prose text-2xl text-text-primary">Inbox</h1>
        <p className="text-sm text-text-muted mt-1">
          Messages from employers and recruiters
        </p>
      </div>

      {sorted.length > 0 ? (
        <ThreadList threads={sorted} />
      ) : (
        <div className="text-center py-24">
          <MessageSquare className="w-10 h-10 text-text-muted mx-auto mb-4" />
          <p className="text-text-secondary text-sm">
            No messages yet.
          </p>
          <p className="text-text-muted text-xs mt-1">
            When employers reach out, messages will appear here.
          </p>
        </div>
      )}
    </div>
  )
}
