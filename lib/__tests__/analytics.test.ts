import { describe, it, expect } from "vitest"
import {
  calculateFunnel,
  calculateCompleteness,
  generateBriefing,
} from "@/lib/analytics"
import type { JobFile, ProfileFrontmatter } from "@/lib/types"

function makeJob(overrides: Partial<JobFile["frontmatter"]> = {}): JobFile {
  return {
    slug: "test-job",
    frontmatter: {
      title: "Engineer",
      company: "Acme",
      status: "discovered",
      source: "manual",
      ...overrides,
    },
    content: "",
  }
}

describe("calculateFunnel", () => {
  it("returns correct stage counts", () => {
    const jobs: JobFile[] = [
      makeJob({ status: "discovered" }),
      makeJob({ status: "discovered" }),
      makeJob({ status: "saved" }),
      makeJob({ status: "applied" }),
      makeJob({ status: "interviewing" }),
      makeJob({ status: "offer" }),
    ]

    const funnel = calculateFunnel(jobs)
    expect(funnel.stages.discovered).toBe(2)
    expect(funnel.stages.saved).toBe(1)
    expect(funnel.stages.applied).toBe(1)
    expect(funnel.stages.interviewing).toBe(1)
    expect(funnel.stages.offer).toBe(1)
    expect(funnel.stages.accepted).toBe(0)
    expect(funnel.stages.rejected).toBe(0)
  })

  it("handles empty array", () => {
    const funnel = calculateFunnel([])
    expect(funnel.stages.discovered).toBe(0)
    expect(funnel.stages.saved).toBe(0)
    expect(funnel.stages.applied).toBe(0)
    expect(funnel.stages.interviewing).toBe(0)
    expect(funnel.stages.offer).toBe(0)
    expect(funnel.stages.accepted).toBe(0)
    expect(funnel.stages.rejected).toBe(0)
  })
})

describe("calculateCompleteness", () => {
  it("returns 100 for a fully filled profile", () => {
    const profile: ProfileFrontmatter = {
      display_name: "Jane Doe",
      headline: "Senior Engineer",
      skills: ["TypeScript", "React"],
      experience_years: 8,
      preferred_roles: ["Staff Engineer"],
      preferred_locations: ["San Francisco"],
      remote_preference: "remote_only",
      salary_range: { min: 150000, max: 200000, currency: "USD" },
      availability: "active",
      experience: [
        { company: "Acme", title: "Engineer", start: "2020-01" },
      ],
      education: [
        { institution: "MIT", degree: "BS CS" },
      ],
    }

    const result = calculateCompleteness(profile)
    expect(result.percentage).toBe(100)
  })

  it("calculates missing fields correctly", () => {
    // Only display_name and headline filled => 2/10 fields
    const profile: ProfileFrontmatter = {
      display_name: "Jane",
      headline: "Engineer",
    }

    const result = calculateCompleteness(profile)
    // 2 out of 10 fields
    expect(result.percentage).toBe(Math.round((2 / 10) * 100))
  })

  it("treats empty arrays as incomplete", () => {
    const profile: ProfileFrontmatter = {
      display_name: "Jane",
      skills: [], // empty array should not count
    }

    const result = calculateCompleteness(profile)
    // Only display_name counts => 1/10
    expect(result.percentage).toBe(Math.round((1 / 10) * 100))
  })
})

describe("generateBriefing", () => {
  it("counts new jobs discovered within the time window", () => {
    const now = new Date()
    const recent = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
    const old = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) // 30 days ago

    const jobs: JobFile[] = [
      makeJob({ discovered_at: recent.toISOString() }),
      makeJob({ discovered_at: old.toISOString() }),
      makeJob({ status: "interviewing" }),
    ]

    const briefing = generateBriefing({ jobs, applications: [], threads: [], profile: {} })
    expect(briefing.newJobs).toBe(1)
  })

  it("returns zero counts when nothing is happening", () => {
    const briefing = generateBriefing({ jobs: [], applications: [], threads: [], profile: {} })
    expect(briefing.newJobs).toBe(0)
    expect(briefing.unreadMessages).toBe(0)
    expect(briefing.upcomingActions).toEqual([])
  })
})
