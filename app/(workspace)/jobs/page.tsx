import { listJobs, getProfile } from "@/lib/fs-data"
import { calculateMatchBreakdown } from "@/lib/match-scoring"
import { formatDate, isSafeUrl } from "@/lib/ui-utils"
import { JobsList } from "./jobs-list"

export default async function JobsPage() {
  const [jobs, profile] = await Promise.all([listJobs(), getProfile()])

  const jobListings = jobs.map((job) => {
    const breakdown = job.frontmatter.match_score != null
      ? calculateMatchBreakdown(profile.frontmatter, job.frontmatter)
      : null
    return {
      id: job.slug,
      title: job.frontmatter.title,
      company: job.frontmatter.company,
      location: job.frontmatter.location || "",
      remote: job.frontmatter.remote === "remote",
      compensationMin: job.frontmatter.compensation?.min ?? null,
      compensationMax: job.frontmatter.compensation?.max ?? null,
      skills: job.frontmatter.tags || [],
      matchScore: job.frontmatter.match_score ?? null,
      matchBreakdown: breakdown,
      postedDate: formatDate(job.frontmatter.discovered_at, { monthFormat: "long" }) ?? "",
      url: isSafeUrl(job.frontmatter.url || "") ? job.frontmatter.url! : "",
      source: job.frontmatter.source,
      status: job.frontmatter.status,
    }
  })

  return (
    <div className="w-full max-w-[1080px] mx-auto px-8 py-8">
      <JobsList jobs={jobListings} />
    </div>
  )
}
