import Link from "next/link"
import { Cog } from "lucide-react"
import { listJobs } from "@/lib/fs-data"
import { JobsList } from "./jobs-list"

export default async function JobsPage() {
  const jobs = await listJobs()

  // Transform to the shape the client component expects
  const jobListings = jobs.map((job) => ({
    id: job.slug,
    title: job.frontmatter.title,
    company: job.frontmatter.company,
    location: job.frontmatter.location || "",
    remote: job.frontmatter.remote === "remote",
    compensationMin: job.frontmatter.compensation?.min ?? null,
    compensationMax: job.frontmatter.compensation?.max ?? null,
    skills: job.frontmatter.tags || [],
    matchScore: job.frontmatter.match_score ?? null,
    postedDate: job.frontmatter.discovered_at || "",
    source: job.frontmatter.source,
    status: job.frontmatter.status,
  }))

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-surface/95 backdrop-blur-md border-b border-border-subtle">
        <div className="max-w-[1200px] mx-auto px-5 flex items-center justify-between h-14">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="w-7 h-7 rounded-md bg-accent flex items-center justify-center">
                <Cog className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-base font-semibold tracking-tight text-text-primary">
                TalentClaw
              </span>
            </Link>
            <span className="text-text-muted">/</span>
            <span className="text-sm font-medium text-text-primary">Jobs</span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/pipeline"
              className="text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              Pipeline
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-5 py-8">
        <JobsList jobs={jobListings} />
      </main>
    </div>
  )
}
