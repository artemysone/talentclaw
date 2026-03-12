import { describe, it, expect } from "vitest"
import {
  PipelineStageSchema,
  JobFrontmatterSchema,
  ProfileFrontmatterSchema,
  ApplicationFrontmatterSchema,
  CompensationSchema,
  ActivityEntrySchema,
} from "@/lib/types"

describe("PipelineStageSchema", () => {
  it("accepts all valid stages", () => {
    const stages = [
      "discovered",
      "saved",
      "applied",
      "interviewing",
      "offer",
      "accepted",
      "rejected",
    ]
    for (const stage of stages) {
      expect(PipelineStageSchema.parse(stage)).toBe(stage)
    }
  })

  it("rejects invalid stages", () => {
    expect(PipelineStageSchema.safeParse("invalid").success).toBe(false)
    expect(PipelineStageSchema.safeParse("").success).toBe(false)
    expect(PipelineStageSchema.safeParse(42).success).toBe(false)
  })
})

describe("CompensationSchema", () => {
  it("parses with defaults", () => {
    const result = CompensationSchema.parse({})
    expect(result.currency).toBe("USD")
  })

  it("accepts full compensation", () => {
    const result = CompensationSchema.parse({
      min: 100000,
      max: 150000,
      currency: "EUR",
    })
    expect(result.min).toBe(100000)
    expect(result.max).toBe(150000)
    expect(result.currency).toBe("EUR")
  })
})

describe("JobFrontmatterSchema", () => {
  it("parses minimal valid job", () => {
    const result = JobFrontmatterSchema.parse({
      title: "Engineer",
      company: "Acme",
    })
    expect(result.title).toBe("Engineer")
    expect(result.company).toBe("Acme")
    expect(result.status).toBe("discovered")
    expect(result.source).toBe("manual")
  })

  it("parses full job frontmatter", () => {
    const result = JobFrontmatterSchema.parse({
      title: "Senior Engineer",
      company: "Acme Corp",
      location: "San Francisco, CA",
      remote: "remote",
      compensation: { min: 150000, max: 200000 },
      url: "https://example.com/apply",
      source: "coffeeshop",
      coffeeshop_id: "abc-123",
      status: "applied",
      match_score: 85,
      tags: ["typescript", "react"],
      discovered_at: "2026-03-01",
    })
    expect(result.remote).toBe("remote")
    expect(result.match_score).toBe(85)
    expect(result.tags).toEqual(["typescript", "react"])
  })

  it("rejects missing required fields", () => {
    expect(JobFrontmatterSchema.safeParse({}).success).toBe(false)
    expect(
      JobFrontmatterSchema.safeParse({ title: "x" }).success,
    ).toBe(false)
  })

  it("rejects invalid match_score", () => {
    expect(
      JobFrontmatterSchema.safeParse({
        title: "x",
        company: "y",
        match_score: 101,
      }).success,
    ).toBe(false)
  })
})

describe("ProfileFrontmatterSchema", () => {
  it("parses empty profile (all optional)", () => {
    const result = ProfileFrontmatterSchema.parse({})
    expect(result).toEqual({})
  })

  it("parses full profile", () => {
    const result = ProfileFrontmatterSchema.parse({
      display_name: "Jane Doe",
      headline: "Senior Engineer",
      skills: ["TypeScript", "Go"],
      experience_years: 8,
      preferred_roles: ["Staff Engineer"],
      preferred_locations: ["Remote"],
      remote_preference: "remote_only",
      availability: "active",
    })
    expect(result.display_name).toBe("Jane Doe")
    expect(result.experience_years).toBe(8)
  })
})

describe("ApplicationFrontmatterSchema", () => {
  it("parses minimal application", () => {
    const result = ApplicationFrontmatterSchema.parse({
      job: "acme-sre",
    })
    expect(result.job).toBe("acme-sre")
    expect(result.status).toBe("applied")
  })

  it("rejects invalid status", () => {
    expect(
      ApplicationFrontmatterSchema.safeParse({
        job: "x",
        status: "invalid",
      }).success,
    ).toBe(false)
  })
})

describe("ActivityEntrySchema", () => {
  it("parses valid entry", () => {
    const result = ActivityEntrySchema.parse({
      ts: "2026-03-01T00:00:00Z",
      type: "search",
      summary: "Searched Coffee Shop",
    })
    expect(result.type).toBe("search")
  })

  it("rejects missing required fields", () => {
    expect(ActivityEntrySchema.safeParse({}).success).toBe(false)
    expect(
      ActivityEntrySchema.safeParse({ ts: "x", type: "y" }).success,
    ).toBe(false)
  })
})
