import {
  SidebarProvider,
  SidebarShell,
} from "@/components/workspace/sidebar-wrapper"
import { Sidebar } from "@/components/workspace/sidebar"
import { TopBar } from "@/components/workspace/top-bar"
import { listJobs, getProfile, getWorkspaceTree } from "@/lib/fs-data"

export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [jobs, profile, { tree, fileCount }] = await Promise.all([
    listJobs(),
    getProfile(),
    getWorkspaceTree(),
  ])

  const jobCount = jobs.length

  const activeCount = jobs.filter((j) =>
    ["applied", "interviewing", "offer"].includes(j.frontmatter.status)
  ).length

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-surface">
        <SidebarShell>
          <Sidebar
            profile={{
              display_name: profile.frontmatter.display_name,
              headline: profile.frontmatter.headline,
              availability: profile.frontmatter.availability,
            }}
            jobCount={jobCount}
            activeCount={activeCount}
            tree={tree}
            fileCount={fileCount}
          />
        </SidebarShell>
        <div className="flex-1 flex flex-col min-w-0">
          <TopBar />
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  )
}
