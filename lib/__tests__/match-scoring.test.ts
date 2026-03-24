import { describe, it, expect } from "vitest"
import { calculateMatchBreakdown } from "@/lib/match-scoring"
import type { ProfileFrontmatter, JobFrontmatter } from "@/lib/types"

function makeProfile(overrides: Partial<ProfileFrontmatter> = {}): ProfileFrontmatter {
  return {
    display_name: "Jane Doe",
    headline: "Senior Engineer",
    skills: ["TypeScript", "React", "Node.js"],
    experience_years: 8,
    preferred_locations: ["San Francisco"],
    remote_preference: "remote_ok",
    salary_range: { min: 150000, max: 200000, currency: "USD" },
    ...overrides,
  }
}

function makeJobFm(overrides: Partial<JobFrontmatter> = {}): JobFrontmatter {
  return {
    title: "Senior Engineer",
    company: "Acme Corp",
    status: "discovered",
    source: "manual",
    tags: ["typescript", "react", "node.js"],
    location: "San Francisco",
    remote: "remote",
    compensation: { min: 140000, max: 210000, currency: "USD" },
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Overall score
// ---------------------------------------------------------------------------

describe("calculateMatchBreakdown — overall", () => {
  it("uses stored match_score when available", () => {
    const result = calculateMatchBreakdown(makeProfile(), makeJobFm({ match_score: 42 }))
    expect(result.overall).toBe(42)
  })

  it("computes weighted score when match_score is absent", () => {
    const result = calculateMatchBreakdown(makeProfile(), makeJobFm({ match_score: undefined }))
    // With a well-matched profile this should be high
    expect(result.overall).toBeGreaterThanOrEqual(80)
    expect(result.overall).toBeLessThanOrEqual(100)
  })

  it("returns all five dimensions", () => {
    const result = calculateMatchBreakdown(makeProfile(), makeJobFm())
    expect(result.dimensions.skills).toBeDefined()
    expect(result.dimensions.experience).toBeDefined()
    expect(result.dimensions.salary).toBeDefined()
    expect(result.dimensions.location).toBeDefined()
    expect(result.dimensions.remote).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Skills dimension
// ---------------------------------------------------------------------------

describe("calculateMatchBreakdown — skills", () => {
  it("scores 100 when all job skills are matched", () => {
    const profile = makeProfile({ skills: ["TypeScript", "React", "Node.js"] })
    const job = makeJobFm({ tags: ["typescript", "react", "node.js"] })
    const { dimensions } = calculateMatchBreakdown(profile, job)
    expect(dimensions.skills.score).toBe(100)
    expect(dimensions.skills.breakdown.missing).toHaveLength(0)
  })

  it("scores proportionally for partial matches", () => {
    const profile = makeProfile({ skills: ["TypeScript"] })
    const job = makeJobFm({ tags: ["typescript", "react", "node.js"] })
    const { dimensions } = calculateMatchBreakdown(profile, job)
    expect(dimensions.skills.score).toBe(Math.round((1 / 3) * 100))
    expect(dimensions.skills.breakdown.matched).toHaveLength(1)
    expect(dimensions.skills.breakdown.missing).toHaveLength(2)
  })

  it("scores 0 when no skills match", () => {
    const profile = makeProfile({ skills: ["Go", "Rust"] })
    const job = makeJobFm({ tags: ["typescript", "react"] })
    const { dimensions } = calculateMatchBreakdown(profile, job)
    expect(dimensions.skills.score).toBe(0)
    expect(dimensions.skills.breakdown.extra).toEqual(["Go", "Rust"])
  })

  it("scores 100 when job lists no skills", () => {
    const profile = makeProfile({ skills: ["TypeScript"] })
    const job = makeJobFm({ tags: [] })
    const { dimensions } = calculateMatchBreakdown(profile, job)
    expect(dimensions.skills.score).toBe(100)
    expect(dimensions.skills.detail).toContain("No specific skills")
  })

  it("scores 100 when job has no tags field", () => {
    const profile = makeProfile({ skills: ["TypeScript"] })
    const job = makeJobFm()
    // Remove tags entirely
    delete (job as Record<string, unknown>).tags
    const { dimensions } = calculateMatchBreakdown(profile, job)
    expect(dimensions.skills.score).toBe(100)
  })

  it("matching is case-insensitive", () => {
    const profile = makeProfile({ skills: ["TYPESCRIPT", "React"] })
    const job = makeJobFm({ tags: ["typescript", "react"] })
    const { dimensions } = calculateMatchBreakdown(profile, job)
    expect(dimensions.skills.score).toBe(100)
  })

  it("preserves original casing in breakdown arrays", () => {
    const profile = makeProfile({ skills: ["TypeScript"] })
    const job = makeJobFm({ tags: ["typescript", "React"] })
    const { dimensions } = calculateMatchBreakdown(profile, job)
    // matched should use original job tag casing
    expect(dimensions.skills.breakdown.matched).toContain("typescript")
    // missing should use original job tag casing
    expect(dimensions.skills.breakdown.missing).toContain("React")
  })

  it("handles empty profile skills", () => {
    const profile = makeProfile({ skills: [] })
    const job = makeJobFm({ tags: ["typescript"] })
    const { dimensions } = calculateMatchBreakdown(profile, job)
    expect(dimensions.skills.score).toBe(0)
    expect(dimensions.skills.breakdown.missing).toEqual(["typescript"])
  })
})

// ---------------------------------------------------------------------------
// Experience dimension
// ---------------------------------------------------------------------------

describe("calculateMatchBreakdown — experience", () => {
  it("scores 100 when experience meets senior requirement", () => {
    const profile = makeProfile({ experience_years: 8 })
    const job = makeJobFm({ title: "Senior Engineer" }) // requires ~5
    const { dimensions } = calculateMatchBreakdown(profile, job)
    expect(dimensions.experience.score).toBe(100)
    expect(dimensions.experience.yourYears).toBe(8)
    expect(dimensions.experience.requiredYears).toBe(5)
  })

  it("penalizes experience gap for staff roles", () => {
    const profile = makeProfile({ experience_years: 4 })
    const job = makeJobFm({ title: "Staff Engineer" }) // requires ~8
    const { dimensions } = calculateMatchBreakdown(profile, job)
    // gap of 4 => 100 - (4 * 20) = 20
    expect(dimensions.experience.score).toBe(20)
    expect(dimensions.experience.requiredYears).toBe(8)
  })

  it("detects junior title keywords", () => {
    const profile = makeProfile({ experience_years: 2 })
    const job = makeJobFm({ title: "Junior Developer" })
    const { dimensions } = calculateMatchBreakdown(profile, job)
    expect(dimensions.experience.requiredYears).toBe(1)
    expect(dimensions.experience.score).toBe(100)
  })

  it("detects lead title keyword", () => {
    const profile = makeProfile({ experience_years: 6 })
    const job = makeJobFm({ title: "Engineering Lead" })
    const { dimensions } = calculateMatchBreakdown(profile, job)
    expect(dimensions.experience.requiredYears).toBe(6)
    expect(dimensions.experience.score).toBe(100)
  })

  it("detects entry-level title keyword", () => {
    const profile = makeProfile({ experience_years: 0 })
    const job = makeJobFm({ title: "Entry Level Analyst" })
    const { dimensions } = calculateMatchBreakdown(profile, job)
    expect(dimensions.experience.requiredYears).toBe(0)
    expect(dimensions.experience.score).toBe(100)
  })

  it("returns neutral 75 when experience is unknown", () => {
    const profile = makeProfile({ experience_years: undefined })
    const job = makeJobFm({ title: "Engineer" }) // no seniority keyword
    const { dimensions } = calculateMatchBreakdown(profile, job)
    expect(dimensions.experience.score).toBe(75)
    expect(dimensions.experience.yourYears).toBeNull()
  })

  it("returns neutral 75 when title has no seniority keyword", () => {
    const profile = makeProfile({ experience_years: 5 })
    const job = makeJobFm({ title: "Software Engineer" })
    const { dimensions } = calculateMatchBreakdown(profile, job)
    expect(dimensions.experience.score).toBe(75)
    expect(dimensions.experience.requiredYears).toBeNull()
  })

  it("clamps score to 0 for very large gaps", () => {
    const profile = makeProfile({ experience_years: 0 })
    const job = makeJobFm({ title: "Staff Engineer" }) // requires 8
    const { dimensions } = calculateMatchBreakdown(profile, job)
    expect(dimensions.experience.score).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// Salary dimension
// ---------------------------------------------------------------------------

describe("calculateMatchBreakdown — salary", () => {
  it("scores 100 when your range is fully contained in offered", () => {
    const profile = makeProfile({ salary_range: { min: 150000, max: 180000, currency: "USD" } })
    const job = makeJobFm({ compensation: { min: 140000, max: 200000, currency: "USD" } })
    const { dimensions } = calculateMatchBreakdown(profile, job)
    expect(dimensions.salary.score).toBe(100)
    expect(dimensions.salary.detail).toContain("Fully within")
  })

  it("scores 70 for partial overlap", () => {
    const profile = makeProfile({ salary_range: { min: 180000, max: 220000, currency: "USD" } })
    const job = makeJobFm({ compensation: { min: 140000, max: 200000, currency: "USD" } })
    const { dimensions } = calculateMatchBreakdown(profile, job)
    expect(dimensions.salary.score).toBe(70)
    expect(dimensions.salary.detail).toContain("Partial overlap")
  })

  it("scores 20 when offered is below your range", () => {
    const profile = makeProfile({ salary_range: { min: 250000, max: 300000, currency: "USD" } })
    const job = makeJobFm({ compensation: { min: 100000, max: 150000, currency: "USD" } })
    const { dimensions } = calculateMatchBreakdown(profile, job)
    expect(dimensions.salary.score).toBe(20)
    expect(dimensions.salary.detail).toContain("below your range")
  })

  it("scores 20 when offered is above your range", () => {
    const profile = makeProfile({ salary_range: { min: 50000, max: 80000, currency: "USD" } })
    const job = makeJobFm({ compensation: { min: 100000, max: 150000, currency: "USD" } })
    const { dimensions } = calculateMatchBreakdown(profile, job)
    expect(dimensions.salary.score).toBe(20)
    expect(dimensions.salary.detail).toContain("above your range")
  })

  it("returns neutral 75 when compensation is not listed", () => {
    const profile = makeProfile()
    const job = makeJobFm({ compensation: undefined })
    const { dimensions } = calculateMatchBreakdown(profile, job)
    expect(dimensions.salary.score).toBe(75)
    expect(dimensions.salary.detail).toContain("not listed")
  })

  it("returns neutral 75 when profile salary range is not set", () => {
    const profile = makeProfile({ salary_range: undefined })
    const job = makeJobFm()
    const { dimensions } = calculateMatchBreakdown(profile, job)
    expect(dimensions.salary.score).toBe(75)
    expect(dimensions.salary.detail).toContain("not set")
  })
})

// ---------------------------------------------------------------------------
// Location dimension
// ---------------------------------------------------------------------------

describe("calculateMatchBreakdown — location", () => {
  it("scores 100 for exact location match", () => {
    const profile = makeProfile({ preferred_locations: ["San Francisco"] })
    const job = makeJobFm({ location: "San Francisco" })
    const { dimensions } = calculateMatchBreakdown(profile, job)
    expect(dimensions.location.score).toBe(100)
  })

  it("scores 100 for substring match", () => {
    const profile = makeProfile({ preferred_locations: ["San Francisco"] })
    const job = makeJobFm({ location: "San Francisco, CA" })
    const { dimensions } = calculateMatchBreakdown(profile, job)
    expect(dimensions.location.score).toBe(100)
  })

  it("scores 40 when location doesn't match", () => {
    const profile = makeProfile({ preferred_locations: ["New York"] })
    const job = makeJobFm({ location: "San Francisco" })
    const { dimensions } = calculateMatchBreakdown(profile, job)
    expect(dimensions.location.score).toBe(40)
  })

  it("returns neutral 75 when job location is not specified", () => {
    const profile = makeProfile({ preferred_locations: ["NYC"] })
    const job = makeJobFm({ location: undefined })
    const { dimensions } = calculateMatchBreakdown(profile, job)
    expect(dimensions.location.score).toBe(75)
    expect(dimensions.location.detail).toContain("not specified")
  })

  it("returns neutral 75 when no location preference set", () => {
    const profile = makeProfile({ preferred_locations: [] })
    const job = makeJobFm({ location: "Austin" })
    const { dimensions } = calculateMatchBreakdown(profile, job)
    expect(dimensions.location.score).toBe(75)
    expect(dimensions.location.detail).toContain("No location preference")
  })

  it("matching is case-insensitive", () => {
    const profile = makeProfile({ preferred_locations: ["san francisco"] })
    const job = makeJobFm({ location: "SAN FRANCISCO" })
    const { dimensions } = calculateMatchBreakdown(profile, job)
    expect(dimensions.location.score).toBe(100)
  })
})

// ---------------------------------------------------------------------------
// Remote dimension
// ---------------------------------------------------------------------------

describe("calculateMatchBreakdown — remote", () => {
  it("scores 100 for remote_only + remote job", () => {
    const profile = makeProfile({ remote_preference: "remote_only" })
    const job = makeJobFm({ remote: "remote" })
    const { dimensions } = calculateMatchBreakdown(profile, job)
    expect(dimensions.remote.score).toBe(100)
  })

  it("scores 30 for remote_only + onsite job", () => {
    const profile = makeProfile({ remote_preference: "remote_only" })
    const job = makeJobFm({ remote: "onsite" })
    const { dimensions } = calculateMatchBreakdown(profile, job)
    expect(dimensions.remote.score).toBe(30)
  })

  it("scores 100 for remote_ok + hybrid job", () => {
    const profile = makeProfile({ remote_preference: "remote_ok" })
    const job = makeJobFm({ remote: "hybrid" })
    const { dimensions } = calculateMatchBreakdown(profile, job)
    expect(dimensions.remote.score).toBe(100)
  })

  it("scores 100 for hybrid pref + remote job", () => {
    const profile = makeProfile({ remote_preference: "hybrid" })
    const job = makeJobFm({ remote: "remote" })
    const { dimensions } = calculateMatchBreakdown(profile, job)
    expect(dimensions.remote.score).toBe(100)
  })

  it("scores 100 for onsite pref + hybrid job", () => {
    const profile = makeProfile({ remote_preference: "onsite" })
    const job = makeJobFm({ remote: "hybrid" })
    const { dimensions } = calculateMatchBreakdown(profile, job)
    expect(dimensions.remote.score).toBe(100)
  })

  it("scores 30 for onsite pref + remote job", () => {
    const profile = makeProfile({ remote_preference: "onsite" })
    const job = makeJobFm({ remote: "remote" })
    const { dimensions } = calculateMatchBreakdown(profile, job)
    expect(dimensions.remote.score).toBe(30)
  })

  it("flexible preference matches everything", () => {
    const profile = makeProfile({ remote_preference: "flexible" })
    for (const remote of ["remote", "hybrid", "onsite"] as const) {
      const job = makeJobFm({ remote })
      const { dimensions } = calculateMatchBreakdown(profile, job)
      expect(dimensions.remote.score).toBe(100)
    }
  })

  it("returns neutral 75 when job remote policy is not listed", () => {
    const profile = makeProfile({ remote_preference: "remote_only" })
    const job = makeJobFm({ remote: undefined })
    const { dimensions } = calculateMatchBreakdown(profile, job)
    expect(dimensions.remote.score).toBe(75)
    expect(dimensions.remote.detail).toContain("not listed")
  })

  it("returns neutral 75 when no remote preference set", () => {
    const profile = makeProfile({ remote_preference: undefined })
    const job = makeJobFm({ remote: "remote" })
    const { dimensions } = calculateMatchBreakdown(profile, job)
    expect(dimensions.remote.score).toBe(75)
    expect(dimensions.remote.detail).toContain("No remote preference")
  })
})
