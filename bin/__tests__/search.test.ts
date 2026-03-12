import { describe, it, expect } from "vitest"
import { slugify } from "../helpers.js"

describe("slugify", () => {
  it("creates a lowercase hyphenated slug", () => {
    expect(slugify("Acme Corp", "Senior Engineer")).toBe(
      "acme-corp-senior-engineer",
    )
  })

  it("removes special characters", () => {
    expect(slugify("O'Brien & Co.", "Dev (React)")).toBe(
      "o-brien-co-dev-react",
    )
  })

  it("trims leading and trailing hyphens", () => {
    expect(slugify("", "  test  ")).toBe("test")
  })

  it("collapses consecutive hyphens", () => {
    expect(slugify("foo---bar", "baz   qux")).toBe("foo-bar-baz-qux")
  })
})

describe("search result deduplication", () => {
  it("generates unique slugs for different jobs", () => {
    const slugs = new Set<string>()
    const jobs = [
      { company: "Acme", title: "SRE" },
      { company: "Acme", title: "Backend" },
      { company: "Globex", title: "SRE" },
    ]

    for (const { company, title } of jobs) {
      slugs.add(slugify(company, title))
    }

    expect(slugs.size).toBe(3)
  })

  it("detects duplicate slug for same company+title", () => {
    const slug1 = slugify("Acme Corp", "Senior Engineer")
    const slug2 = slugify("Acme Corp", "Senior Engineer")
    expect(slug1).toBe(slug2)
  })
})

describe("mapRemotePolicy logic", () => {
  function mapRemotePolicy(
    policy?: string,
  ): "remote" | "hybrid" | "onsite" | undefined {
    if (!policy) return undefined
    const p = policy.toLowerCase()
    if (p.includes("remote")) return "remote"
    if (p.includes("hybrid")) return "hybrid"
    if (p.includes("onsite") || p.includes("office")) return "onsite"
    return undefined
  }

  it("maps remote policies correctly", () => {
    expect(mapRemotePolicy("remote_only")).toBe("remote")
    expect(mapRemotePolicy("remote_ok")).toBe("remote")
    expect(mapRemotePolicy("hybrid")).toBe("hybrid")
    expect(mapRemotePolicy("onsite_required")).toBe("onsite")
    expect(mapRemotePolicy("office")).toBe("onsite")
    expect(mapRemotePolicy(undefined)).toBeUndefined()
    expect(mapRemotePolicy("unknown_value")).toBeUndefined()
  })
})
