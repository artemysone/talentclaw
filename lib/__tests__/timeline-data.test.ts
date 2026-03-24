import { describe, it, expect } from "vitest"
import { buildTimelineData } from "@/lib/timeline-data"
import type { ProfileFrontmatter } from "@/lib/types"

describe("buildTimelineData", () => {
  it("returns empty array for empty profile", () => {
    const result = buildTimelineData({})
    expect(result).toEqual([])
  })

  it("returns empty array when no education or experience", () => {
    const result = buildTimelineData({ display_name: "Jane", education: [], experience: [] })
    expect(result).toEqual([])
  })

  it("builds education branches with correct duration estimates", () => {
    const profile: ProfileFrontmatter = {
      education: [
        { institution: "MIT", degree: "BS Computer Science", year: "2018" },
        { institution: "Stanford", degree: "MS Computer Science", year: "2020" },
      ],
    }

    const branches = buildTimelineData(profile)
    expect(branches).toHaveLength(2)

    // BS = 4 year duration
    const bs = branches.find((b) => b.name === "MIT")!
    expect(bs.type).toBe("education")
    expect(bs.startYear).toBe(2014)
    expect(bs.endYear).toBe(2018)

    // MS = 2 year duration
    const ms = branches.find((b) => b.name === "Stanford")!
    expect(ms.startYear).toBe(2018)
    expect(ms.endYear).toBe(2020)
  })

  it("estimates PhD duration as 5 years", () => {
    const profile: ProfileFrontmatter = {
      education: [{ institution: "CMU", degree: "PhD Machine Learning", year: "2025" }],
    }
    const branches = buildTimelineData(profile)
    expect(branches[0].startYear).toBe(2020)
    expect(branches[0].endYear).toBe(2025)
  })

  it("estimates bootcamp duration as 1 year", () => {
    const profile: ProfileFrontmatter = {
      education: [{ institution: "Hack Reactor", degree: "Bootcamp", year: "2022" }],
    }
    const branches = buildTimelineData(profile)
    expect(branches[0].startYear).toBe(2021)
    expect(branches[0].endYear).toBe(2022)
  })

  it("estimates MBA duration as 2 years", () => {
    const profile: ProfileFrontmatter = {
      education: [{ institution: "Wharton", degree: "MBA", year: "2024" }],
    }
    const branches = buildTimelineData(profile)
    expect(branches[0].startYear).toBe(2022)
  })

  it("builds experience branches with start/end years", () => {
    const profile: ProfileFrontmatter = {
      experience: [
        { company: "Google", title: "SWE", start: "2018", end: "2021" },
        { company: "Meta", title: "Senior SWE", start: "2021", end: "2024" },
      ],
    }

    const branches = buildTimelineData(profile)
    expect(branches).toHaveLength(2)

    const google = branches.find((b) => b.name === "Google")!
    expect(google.type).toBe("company")
    expect(google.startYear).toBe(2018)
    expect(google.endYear).toBe(2021)
  })

  it("uses current year for open-ended experience", () => {
    const currentYear = new Date().getFullYear()
    const profile: ProfileFrontmatter = {
      experience: [{ company: "Startup", title: "CTO", start: "2023" }],
    }

    const branches = buildTimelineData(profile)
    expect(branches[0].endYear).toBe(currentYear)
  })

  it("skips entries with invalid year data", () => {
    const profile: ProfileFrontmatter = {
      education: [
        { institution: "Valid", degree: "BS CS", year: "2020" },
        { institution: "Invalid", degree: "BS CS", year: "not-a-year" },
      ],
      experience: [
        { company: "Valid Co", title: "SWE", start: "2020" },
        { company: "Invalid Co", title: "SWE", start: "" },
      ],
    }

    const branches = buildTimelineData(profile)
    expect(branches).toHaveLength(2)
    expect(branches.map((b) => b.name)).toContain("Valid")
    expect(branches.map((b) => b.name)).toContain("Valid Co")
  })

  it("sorts branches chronologically by start year", () => {
    const profile: ProfileFrontmatter = {
      experience: [
        { company: "Later", title: "SWE", start: "2022", end: "2024" },
        { company: "Earlier", title: "SWE", start: "2018", end: "2020" },
      ],
    }

    const branches = buildTimelineData(profile)
    expect(branches[0].name).toBe("Earlier")
    expect(branches[1].name).toBe("Later")
  })

  it("alternates side assignment (-1, 1)", () => {
    const profile: ProfileFrontmatter = {
      experience: [
        { company: "A", title: "SWE", start: "2018", end: "2019" },
        { company: "B", title: "SWE", start: "2019", end: "2020" },
        { company: "C", title: "SWE", start: "2020", end: "2021" },
      ],
    }

    const branches = buildTimelineData(profile)
    expect(branches[0].side).toBe(-1)
    expect(branches[1].side).toBe(1)
    expect(branches[2].side).toBe(-1)
  })

  it("assigns colors cyclically for company branches", () => {
    const profile: ProfileFrontmatter = {
      experience: [
        { company: "A", title: "SWE", start: "2018", end: "2019" },
        { company: "B", title: "SWE", start: "2019", end: "2020" },
      ],
    }

    const branches = buildTimelineData(profile)
    // Companies should get different colors from the palette
    expect(branches[0].color).not.toBe(branches[1].color)
  })

  it("education branches use cyan color", () => {
    const profile: ProfileFrontmatter = {
      education: [{ institution: "MIT", degree: "BS CS", year: "2020" }],
    }

    const branches = buildTimelineData(profile)
    expect(branches[0].color).toBe("#06b6d4")
  })

  it("includes skills and projects from experience", () => {
    const profile: ProfileFrontmatter = {
      experience: [
        {
          company: "Acme",
          title: "SWE",
          start: "2020",
          end: "2022",
          skills: ["TypeScript", "React"],
          projects: ["Dashboard v2"],
        },
      ],
    }

    const branches = buildTimelineData(profile)
    expect(branches[0].skills).toEqual(["TypeScript", "React"])
    expect(branches[0].projects).toEqual(["Dashboard v2"])
  })
})
