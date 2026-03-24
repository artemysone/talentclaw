"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Check, AlertCircle, Loader2 } from "lucide-react"
import { createJobAction } from "@/app/actions/jobs"
import { PIPELINE_STAGES } from "@/lib/types"
import { STAGE_LABELS } from "@/lib/ui-utils"

const REMOTE_OPTIONS = [
  { value: "", label: "Select..." },
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
  { value: "onsite", label: "On-site" },
]

export function JobForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [title, setTitle] = useState("")
  const [company, setCompany] = useState("")
  const [location, setLocation] = useState("")
  const [remote, setRemote] = useState("")
  const [compensationMin, setCompensationMin] = useState("")
  const [compensationMax, setCompensationMax] = useState("")
  const [url, setUrl] = useState("")
  const [tags, setTags] = useState("")
  const [status, setStatus] = useState("discovered")
  const [notes, setNotes] = useState("")

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState<string | null>(null)

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!title.trim()) newErrors.title = "Job title is required"
    if (!company.trim()) newErrors.company = "Company name is required"
    if (compensationMin && isNaN(Number(compensationMin)))
      newErrors.compensationMin = "Must be a number"
    if (compensationMax && isNaN(Number(compensationMax)))
      newErrors.compensationMax = "Must be a number"
    if (url && !url.startsWith("http://") && !url.startsWith("https://"))
      newErrors.url = "URL must start with http:// or https://"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setServerError(null)

    const parseTags = (s: string) =>
      s
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean)

    startTransition(async () => {
      const result = await createJobAction({
        title: title.trim(),
        company: company.trim(),
        location: location.trim() || undefined,
        remote: (remote as "remote" | "hybrid" | "onsite") || undefined,
        compensationMin: compensationMin ? Number(compensationMin) : undefined,
        compensationMax: compensationMax ? Number(compensationMax) : undefined,
        url: url.trim() || undefined,
        tags: parseTags(tags),
        status,
        notes: notes.trim() || undefined,
      })

      if (result.error) {
        setServerError(result.error)
      } else {
        router.push("/pipeline")
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {serverError && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm bg-danger/8 text-danger border border-danger/20">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {serverError}
        </div>
      )}

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1.5">
          Job Title <span className="text-danger">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Senior Backend Engineer"
          className="w-full px-3.5 py-2.5 rounded-xl bg-surface-raised border border-border-default text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-colors"
        />
        {errors.title && <p className="text-xs text-danger mt-1">{errors.title}</p>}
      </div>

      {/* Company */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1.5">
          Company <span className="text-danger">*</span>
        </label>
        <input
          type="text"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          placeholder="Acme Corp"
          className="w-full px-3.5 py-2.5 rounded-xl bg-surface-raised border border-border-default text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-colors"
        />
        {errors.company && <p className="text-xs text-danger mt-1">{errors.company}</p>}
      </div>

      {/* Location + Remote */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5">Location</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="San Francisco, CA"
            className="w-full px-3.5 py-2.5 rounded-xl bg-surface-raised border border-border-default text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5">Work Mode</label>
          <select
            value={remote}
            onChange={(e) => setRemote(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-surface-raised border border-border-default text-sm text-text-primary focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-colors appearance-none"
          >
            {REMOTE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Compensation */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1.5">
          Compensation Range (USD)
        </label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <input
              type="number"
              value={compensationMin}
              onChange={(e) => setCompensationMin(e.target.value)}
              placeholder="Min (e.g. 150000)"
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-raised border border-border-default text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-colors"
            />
            {errors.compensationMin && (
              <p className="text-xs text-danger mt-1">{errors.compensationMin}</p>
            )}
          </div>
          <div>
            <input
              type="number"
              value={compensationMax}
              onChange={(e) => setCompensationMax(e.target.value)}
              placeholder="Max (e.g. 200000)"
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-raised border border-border-default text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-colors"
            />
            {errors.compensationMax && (
              <p className="text-xs text-danger mt-1">{errors.compensationMax}</p>
            )}
          </div>
        </div>
      </div>

      {/* URL */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1.5">Job URL</label>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://careers.acme.com/senior-backend"
          className="w-full px-3.5 py-2.5 rounded-xl bg-surface-raised border border-border-default text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-colors"
        />
        {errors.url && <p className="text-xs text-danger mt-1">{errors.url}</p>}
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1.5">Tags</label>
        <input
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="TypeScript, React, GraphQL"
          className="w-full px-3.5 py-2.5 rounded-xl bg-surface-raised border border-border-default text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-colors"
        />
        <p className="text-xs text-text-muted mt-1">Comma-separated list of relevant skills or tags.</p>
      </div>

      {/* Status */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1.5">Pipeline Stage</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full px-3.5 py-2.5 rounded-xl bg-surface-raised border border-border-default text-sm text-text-primary focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-colors appearance-none"
        >
          {PIPELINE_STAGES.map((stage) => (
            <option key={stage} value={stage}>
              {STAGE_LABELS[stage] || stage}
            </option>
          ))}
        </select>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1.5">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Why does this role interest you? Any context to remember..."
          rows={4}
          className="w-full px-3.5 py-2.5 rounded-xl bg-surface-raised border border-border-default text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-colors resize-none"
        />
      </div>

      {/* Submit */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors disabled:opacity-50 cursor-pointer"
        >
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Check className="w-4 h-4" />
          )}
          Add Job
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-5 py-2.5 rounded-xl bg-surface-raised border border-border-default text-sm text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
