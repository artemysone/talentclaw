"use server"

import {
  updateJobStatus,
  createJob,
  deleteJob,
  appendActivity,
} from "@/lib/fs-data"
import { PipelineStageSchema, JobFrontmatterSchema } from "@/lib/types"
import { revalidatePath } from "next/cache"

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
    revalidatePath("/")
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
    await updateJobStatus(slug, "saved")
    await appendActivity({
      type: "saved",
      slug,
      summary: `Saved ${slug} to pipeline`,
    })
    revalidatePath("/")
    return {}
  } catch (err) {
    return {
      error: `Failed to save job: ${err instanceof Error ? err.message : "unknown error"}`,
    }
  }
}

export async function createJobAction(
  slug: string,
  frontmatter: Record<string, unknown>,
  content: string = "",
): Promise<{ error?: string }> {
  const validated = JobFrontmatterSchema.safeParse(frontmatter)
  if (!validated.success) {
    return { error: `Invalid job data: ${validated.error.message}` }
  }

  try {
    await createJob(slug, frontmatter, content)
    await appendActivity({
      type: "job_created",
      slug,
      summary: `Created job ${slug}`,
    })
    revalidatePath("/")
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
    revalidatePath("/")
    return {}
  } catch (err) {
    return {
      error: `Failed to delete job: ${err instanceof Error ? err.message : "unknown error"}`,
    }
  }
}
