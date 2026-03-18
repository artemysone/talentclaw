import {
  SidebarProvider,
  SidebarShell,
} from "@/components/workspace/sidebar-wrapper"
import { Sidebar } from "@/components/workspace/sidebar"
import { TopBar } from "@/components/workspace/top-bar"
import { ChatShell } from "@/components/chat/chat-shell"
import { listJobs, getWorkspaceTree, getCoffeeShopStatus } from "@/lib/fs-data"
import type { CoffeeShopStatus } from "@/lib/fs-data"

export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let jobs: Awaited<ReturnType<typeof listJobs>> = []
  let tree: Awaited<ReturnType<typeof getWorkspaceTree>>["tree"] = []
  let coffeeShopStatus: CoffeeShopStatus = { connected: false }

  try {
    ;[jobs, { tree }, coffeeShopStatus] = await Promise.all([
      listJobs(),
      getWorkspaceTree(),
      getCoffeeShopStatus(),
    ])
  } catch {
    // Fall through with safe defaults so layout still renders
  }

  const jobCount = jobs.length

  const activeCount = jobs.filter((j) =>
    ["applied", "interviewing", "offer"].includes(j.frontmatter.status)
  ).length

  return (
    <SidebarProvider>
      <ChatShell>
        <div className="flex h-screen overflow-hidden bg-surface">
          <SidebarShell>
            <Sidebar
              jobCount={jobCount}
              activeCount={activeCount}
              tree={tree}
              coffeeShopStatus={coffeeShopStatus}
            />
          </SidebarShell>
          <div className="flex-1 flex flex-col min-w-0">
            <TopBar />
            <main className="flex-1 flex flex-col min-h-0 overflow-y-auto">{children}</main>
          </div>
        </div>
      </ChatShell>
    </SidebarProvider>
  )
}
