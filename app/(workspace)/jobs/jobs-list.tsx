"use client"

import { useState } from "react"
import {
  Search,
  MapPin,
  DollarSign,
  Wifi,
  Building2,
  Bookmark,
} from "lucide-react"
import { SearchBar } from "@/components/query/search-bar"
import { saveJobToPipeline } from "@/app/actions"
import { formatCompensation } from "@/lib/ui-utils"

interface JobListing {
  id: string
  title: string
  company: string
  location: string
  remote: boolean
  compensationMin: number | null
  compensationMax: number | null
  skills: string[]
  matchScore: number | null
  postedDate: string
  source: string
  status: string
}

interface JobsListProps {
  jobs: JobListing[]
}

export function JobsList({ jobs }: JobsListProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [savedJobs, setSavedJobs] = useState<Set<string>>(
    () => new Set(jobs.filter((j) => j.status !== "discovered").map((j) => j.id))
  )

  const filteredJobs = jobs.filter((job) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      job.title.toLowerCase().includes(q) ||
      job.company.toLowerCase().includes(q) ||
      job.skills.some((s) => s.toLowerCase().includes(q))
    )
  })

  const toggleSave = async (id: string) => {
    const isCurrentlySaved = savedJobs.has(id)
    setSavedJobs((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
    if (!isCurrentlySaved) {
      await saveJobToPipeline(id)
    }
  }

  return (
    <>
      {/* Search */}
      <div className="mb-8">
        <SearchBar value={searchQuery} onChange={setSearchQuery} />
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-text-muted">
          {filteredJobs.length} {filteredJobs.length === 1 ? "job" : "jobs"} found
        </p>
        <p className="text-xs text-text-muted">
          Source: Local workspace
        </p>
      </div>

      {/* Job listings */}
      <div className="space-y-3">
        {filteredJobs.map((job) => (
          <div
            key={job.id}
            className="bg-surface-raised rounded-xl p-5 border border-border-subtle hover:border-accent/30 transition-colors group"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-base font-semibold text-text-primary group-hover:text-accent-hover transition-colors">
                    {job.title}
                  </h3>
                  {job.matchScore !== null && (
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      job.matchScore >= 90
                        ? "bg-emerald-500/10 text-emerald-400"
                        : job.matchScore >= 80
                          ? "bg-accent-subtle text-accent"
                          : "bg-amber-500/10 text-amber-400"
                    }`}>
                      {job.matchScore}% match
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4 text-sm text-text-secondary mb-3">
                  <span className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5" />
                    {job.company}
                  </span>
                  {job.location && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" />
                      {job.location}
                    </span>
                  )}
                  {job.remote && (
                    <span className="flex items-center gap-1.5 text-accent">
                      <Wifi className="w-3.5 h-3.5" />
                      Remote
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5" />
                    {formatCompensation({ min: job.compensationMin, max: job.compensationMax }) || "Not listed"}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {job.skills.map((skill) => (
                    <span
                      key={skill}
                      className="text-xs px-2 py-1 rounded-md bg-surface-overlay text-text-secondary border border-border-subtle"
                    >
                      {skill}
                    </span>
                  ))}
                  {job.postedDate && (
                    <span className="text-xs text-text-muted ml-2">{job.postedDate}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => toggleSave(job.id)}
                  className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                    savedJobs.has(job.id)
                      ? "border-accent/40 bg-accent-subtle text-accent"
                      : "border-border-default bg-surface-overlay text-text-muted hover:text-accent hover:border-accent/30"
                  }`}
                  title="Save to pipeline"
                >
                  <Bookmark className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {jobs.length === 0 && (
        <div className="text-center py-16">
          <Search className="w-10 h-10 text-text-muted mx-auto mb-4" />
          <p className="text-text-secondary text-sm">No jobs yet.</p>
          <p className="text-text-muted text-xs mt-1">
            Run <code className="text-accent bg-accent/5 px-1.5 py-0.5 rounded text-[0.7rem]">talentclaw search</code> or ask your agent to find opportunities.
          </p>
        </div>
      )}

      {jobs.length > 0 && filteredJobs.length === 0 && (
        <div className="text-center py-16">
          <Search className="w-10 h-10 text-text-muted mx-auto mb-4" />
          <p className="text-text-secondary text-sm">No jobs match your search.</p>
          <p className="text-text-muted text-xs mt-1">Try adjusting your filters or search query.</p>
        </div>
      )}
    </>
  )
}
