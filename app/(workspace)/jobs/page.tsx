import { listJobs } from "@/lib/fs-data"
import { JobsList } from "./jobs-list"

export default async function JobsPage() {
  const jobs = await listJobs()

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
    <div className="max-w-6xl xl:max-w-[1400px] 2xl:max-w-[1600px] mx-auto px-5 py-8">
      <JobsList jobs={jobListings} />
    </div>
  )
}
