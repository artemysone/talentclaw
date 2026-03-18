"use server"

import { updateJobStatus, appendActivity, invalidateWorkspaceCache } from "@/lib/fs-data"
import { PipelineStageSchema } from "@/lib/types"

export async function moveJobToStage(
  slug: string,
  newStatus: string,
): Promise<{ error?: string }> {
  const parsed = PipelineStageSchema.safeParse(newStatus)
  if (!parsed.success) {
    return { error: `Invalid pipeline stage: ${newStatus}` }
  }

  try {
    await updateJobStatus(slug, parsed.data)
    await appendActivity({
      type: "status_changed",
      slug,
      summary: `Moved ${slug} to ${parsed.data}`,
    })
    invalidateWorkspaceCache()
    return {}
  } catch (err) {
    return { error: `Failed to update job: ${err instanceof Error ? err.message : "unknown error"}` }
  }
}

export async function saveJobToPipeline(
  slug: string,
): Promise<{ error?: string }> {
  try {
    await updateJobStatus(slug, "saved")
    await appendActivity({
      type: "saved",
      slug,
      summary: `Saved ${slug} to pipeline`,
    })
    invalidateWorkspaceCache()
    return {}
  } catch (err) {
    return { error: `Failed to save job: ${err instanceof Error ? err.message : "unknown error"}` }
  }
}
