import {
  SidebarProvider,
  SidebarShell,
} from "@/components/workspace/sidebar-wrapper"
import { Sidebar } from "@/components/workspace/sidebar"
import { TitleBar } from "@/components/workspace/title-bar"
import { TopBar } from "@/components/workspace/top-bar"
import { ChatProvider } from "@/components/chat/chat-provider"
import { DataRefreshProvider } from "@/components/data-refresh-provider"
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
      <ChatProvider displayName={displayName}>
        <DataRefreshProvider>
        <div className="flex flex-col h-screen overflow-hidden bg-surface">
          {/* Window title bar — full width, houses traffic lights */}
          <TitleBar />

          {/* Sidebar + content below the title bar */}
          <div className="flex flex-1 min-h-0">
            <SidebarShell>
              <Sidebar
                jobCount={jobCount}
                activeCount={activeCount}
                tree={tree}
              />
            </SidebarShell>
            <div className="flex-1 flex flex-col min-w-0">
              <TopBar />
              <main className="flex-1 flex flex-col min-h-0 overflow-y-auto overflow-x-hidden">{children}</main>
            </div>
          </div>
        </div>
      </DataRefreshProvider>
      </ChatProvider>
    </SidebarProvider>
  )
}
