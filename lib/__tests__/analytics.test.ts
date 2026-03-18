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
    expect(funnel.discovered).toBe(2)
    expect(funnel.saved).toBe(1)
    expect(funnel.applied).toBe(1)
    expect(funnel.interviewing).toBe(1)
    expect(funnel.offer).toBe(1)
    expect(funnel.accepted).toBe(0)
    expect(funnel.rejected).toBe(0)
  })

  it("handles empty array", () => {
    const funnel = calculateFunnel([])
    expect(funnel.discovered).toBe(0)
    expect(funnel.saved).toBe(0)
    expect(funnel.applied).toBe(0)
    expect(funnel.interviewing).toBe(0)
    expect(funnel.offer).toBe(0)
    expect(funnel.accepted).toBe(0)
    expect(funnel.rejected).toBe(0)
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
      remote_preference: "remote_only",
      availability: "active",
      experience: [
        { company: "Acme", title: "Engineer", start: "2020-01" },
      ],
      education: [
        { institution: "MIT", degree: "BS CS" },
      ],
    }

    expect(calculateCompleteness(profile)).toBe(100)
  })

  it("calculates missing fields correctly", () => {
    // Only display_name and headline filled => 2/9 fields
    const profile: ProfileFrontmatter = {
      display_name: "Jane",
      headline: "Engineer",
    }

    const score = calculateCompleteness(profile)
    // 2 out of 9 fields
    expect(score).toBe(Math.round((2 / 9) * 100))
  })

  it("treats empty arrays as incomplete", () => {
    const profile: ProfileFrontmatter = {
      display_name: "Jane",
      skills: [], // empty array should not count
    }

    const score = calculateCompleteness(profile)
    // Only display_name counts => 1/9
    expect(score).toBe(Math.round((1 / 9) * 100))
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

    const briefing = generateBriefing(jobs, 7)
    expect(briefing.newJobsCount).toBe(1)
    expect(briefing.upcomingActionsCount).toBe(1)
    expect(briefing.totalJobs).toBe(3)
    expect(briefing.summary).toContain("1 new job")
    expect(briefing.summary).toContain("1 upcoming action")
  })

  it("returns 'No new activity' summary when nothing is happening", () => {
    const briefing = generateBriefing([])
    expect(briefing.newJobsCount).toBe(0)
    expect(briefing.upcomingActionsCount).toBe(0)
    expect(briefing.summary).toBe("No new activity")
  })
})
