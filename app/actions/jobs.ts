"use server"

import { revalidatePath } from "next/cache"
import {
  updateJobStatus,
  createJob,
  deleteJob,
  appendActivity,
} from "@/lib/fs-data"
import { PipelineStageSchema, JobFrontmatterSchema } from "@/lib/types"

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
    revalidatePath("/pipeline")
    return {}
  } catch (err) {
    return {
      error: `Failed to update job: ${err instanceof Error ? err.message : "unknown error"}`,
    }
  }
}

export async function saveJobToPipeline(
  slug: string,
): Promise<{ error?: string }> {
  try {
    await updateJobStatus(slug, "discovered")
    await appendActivity({
      type: "saved",
      slug,
      summary: `Saved ${slug} to pipeline`,
    })
    revalidatePath("/pipeline")
    return {}
  } catch (err) {
    return {
      error: `Failed to save job: ${err instanceof Error ? err.message : "unknown error"}`,
    }
  }
}

export async function createJobAction(
  formData: Record<string, unknown>,
): Promise<{ error?: string }> {
  const parsed = JobFrontmatterSchema.safeParse(formData)
  if (!parsed.success) {
    return { error: `Validation failed: ${parsed.error.message}` }
  }

  const slug =
    `${parsed.data.company}-${parsed.data.title}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")

  try {
    await createJob(slug, parsed.data)
    await appendActivity({
      type: "job_created",
      slug,
      summary: `Added ${parsed.data.title} at ${parsed.data.company}`,
    })
    revalidatePath("/pipeline")
    return {}
  } catch (err) {
    return {
      error: `Failed to create job: ${err instanceof Error ? err.message : "unknown error"}`,
    }
  }
}

export async function deleteJobAction(
  slug: string,
): Promise<{ error?: string }> {
  try {
    await deleteJob(slug)
    await appendActivity({
      type: "job_deleted",
      slug,
      summary: `Deleted job ${slug}`,
    })
    revalidatePath("/pipeline")
    return {}
  } catch (err) {
    return {
      error: `Failed to delete job: ${err instanceof Error ? err.message : "unknown error"}`,
    }
  }
}
