"use server"

import { updateJobStatus, appendActivity } from "@/lib/fs-data"
import { PipelineStageSchema } from "@/lib/types"

export async function moveJobToStage(slug: string, newStatus: string) {
  PipelineStageSchema.parse(newStatus)
  await updateJobStatus(slug, newStatus)
  await appendActivity({
    type: "status_changed",
    slug,
    summary: `Moved ${slug} to ${newStatus}`,
  })
}

export async function saveJobToPipeline(slug: string) {
  await updateJobStatus(slug, "saved")
  await appendActivity({
    type: "saved",
    slug,
    summary: `Saved ${slug} to pipeline`,
  })
}
