import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import {
  createTempDataDir,
  cleanupTempDataDir,
  writeMockProfile,
} from "@/lib/test-helpers"
import { getProfile } from "@/lib/fs-data"

// Mock next/cache since it's not available outside Next.js
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

import { updateProfile } from "@/app/actions/profile"

let tmpDir: string

beforeEach(async () => {
  tmpDir = await createTempDataDir()
})

afterEach(async () => {
  await cleanupTempDataDir(tmpDir)
})

describe("updateProfile (server action)", () => {
  it("valid partial data merges with existing profile", async () => {
    await writeMockProfile(tmpDir, {
      display_name: "Alice",
      headline: "Engineer",
    })

    const result = await updateProfile({
      skills: ["TypeScript", "Go"],
    })
    expect(result.error).toBeUndefined()

    const profile = await getProfile()
    expect(profile.frontmatter.display_name).toBe("Alice")
    expect(profile.frontmatter.headline).toBe("Engineer")
    expect(profile.frontmatter.skills).toEqual(["TypeScript", "Go"])
  })

  it("full update works", async () => {
    const result = await updateProfile({
      display_name: "Bob",
      headline: "Senior Designer",
      skills: ["Figma", "CSS"],
      experience_years: 5,
      availability: "active",
    })
    expect(result.error).toBeUndefined()

    const profile = await getProfile()
    expect(profile.frontmatter.display_name).toBe("Bob")
    expect(profile.frontmatter.headline).toBe("Senior Designer")
    expect(profile.frontmatter.experience_years).toBe(5)
  })

  it("invalid data returns error", async () => {
    const result = await updateProfile({
      availability: "invalid_value", // not one of the valid enum values
    })
    expect(result.error).toBeDefined()
    expect(result.error).toContain("Validation failed")
  })

  it("creates profile if it does not exist", async () => {
    // No profile.md written yet
    const result = await updateProfile({
      display_name: "NewUser",
    })
    expect(result.error).toBeUndefined()

    const profile = await getProfile()
    expect(profile.frontmatter.display_name).toBe("NewUser")
  })
})
