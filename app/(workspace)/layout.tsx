import {
  SidebarProvider,
  SidebarShell,
} from "@/components/workspace/sidebar-wrapper"
import { Sidebar } from "@/components/workspace/sidebar"
import { TopBar } from "@/components/workspace/top-bar"
import { ChatShell } from "@/components/chat/chat-shell"
import { ChatPanel } from "@/components/chat/chat-panel"
import { listJobs, getWorkspaceTree, getProfile } from "@/lib/fs-data"

export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let jobs: Awaited<ReturnType<typeof listJobs>> = []
  let tree: Awaited<ReturnType<typeof getWorkspaceTree>>["tree"] = []
  let displayName = ""

  try {
    const [jobsResult, treeResult, profile] = await Promise.all([
      listJobs(),
      getWorkspaceTree(),
      getProfile(),
    ])
    jobs = jobsResult
    tree = treeResult.tree
    displayName = profile.frontmatter.display_name ?? ""
  } catch {
    // Fall through with safe defaults so layout still renders
  }

  const jobCount = jobs.length

  const activeCount = jobs.filter((j) =>
    ["applied", "interviewing", "offer"].includes(j.frontmatter.status)
  ).length

  return (
    <SidebarProvider>
      <ChatShell displayName={displayName}>
        <div className="flex h-screen overflow-hidden bg-surface">
          <SidebarShell>
            <Sidebar
              jobCount={jobCount}
              activeCount={activeCount}
              tree={tree}
            />
          </SidebarShell>
          <div className="flex-1 flex flex-col min-w-0">
            <TopBar />
            <main className="flex-1 flex flex-col min-h-0 overflow-y-auto">{children}</main>
          </div>
          <ChatPanel displayName={displayName} />
        </div>
      </ChatShell>
    </SidebarProvider>
  )
}
