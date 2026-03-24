import { describe, it, expect } from "vitest"
import { slugify } from "@/lib/slugify"

describe("slugify", () => {
  it("combines company and title into kebab-case", () => {
    expect(slugify("Acme Corp", "Senior Engineer")).toBe("acme-corp-senior-engineer")
  })

  it("lowercases all characters", () => {
    expect(slugify("GOOGLE", "SRE")).toBe("google-sre")
  })

  it("replaces non-alphanumeric characters with hyphens", () => {
    expect(slugify("Acme & Co.", "Full-Stack Dev!")).toBe("acme-co-full-stack-dev")
  })

  it("collapses consecutive non-alphanumeric into single hyphen", () => {
    expect(slugify("Company   Name", "Title   Here")).toBe("company-name-title-here")
  })

  it("strips leading and trailing hyphens", () => {
    expect(slugify("  Acme  ", "  Engineer  ")).toBe("acme-engineer")
  })

  it("handles unicode characters", () => {
    expect(slugify("Café", "Développeur")).toBe("caf-d-veloppeur")
  })

  it("handles empty company", () => {
    expect(slugify("", "Engineer")).toBe("engineer")
  })

  it("handles empty title", () => {
    expect(slugify("Acme", "")).toBe("acme")
  })

  it("handles both empty", () => {
    expect(slugify("", "")).toBe("")
  })

  it("handles numeric inputs", () => {
    expect(slugify("Company123", "Role456")).toBe("company123-role456")
  })

  it("handles special characters like @#$%", () => {
    expect(slugify("@startup", "#1 role")).toBe("startup-1-role")
  })
})
