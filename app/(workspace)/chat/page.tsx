import { getProfile } from "@/lib/fs-data"
import { ChatPage } from "@/components/chat/chat-page"

export default async function ChatRoute() {
  let displayName = ""

  try {
    const profile = await getProfile()
    displayName = profile.frontmatter.display_name ?? ""
  } catch {
    // Fall through with empty name
  }

  return <ChatPage displayName={displayName} />
}
