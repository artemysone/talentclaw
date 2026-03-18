"use server"

import { updateProfile as fsUpdateProfile, appendActivity } from "@/lib/fs-data"
import { ProfileFrontmatterSchema } from "@/lib/types"
import { revalidatePath } from "next/cache"

export async function updateProfile(
  updates: Record<string, unknown>,
): Promise<{ error?: string }> {
  // Validate that the updates (on their own as a partial) make sense
  const partial = ProfileFrontmatterSchema.safeParse(updates)
  if (!partial.success) {
    return { error: `Invalid profile data: ${partial.error.message}` }
  }

  try {
    await fsUpdateProfile(updates)
    await appendActivity({
      type: "profile_updated",
      summary: "Updated profile",
    })
    revalidatePath("/")
    return {}
  } catch (err) {
    return {
      error: `Failed to update profile: ${err instanceof Error ? err.message : "unknown error"}`,
    }
  }
}
