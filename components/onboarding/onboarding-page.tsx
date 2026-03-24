"use client"

import { useState, useRef, useCallback } from "react"
import { Upload, FileText, Loader2 } from "lucide-react"
import Link from "next/link"
import { CrabLogo } from "@/components/crab-logo"
import { useChatContext } from "@/components/chat/chat-provider"
import { RESUME_FILE_PROMPT, PARSE_RESUME_PROMPT } from "@/lib/agent-prompts"

const ACCEPTED_EXTENSIONS = [".pdf", ".docx", ".doc", ".txt"]
const MAX_FILE_SIZE = 10 * 1024 * 1024

type UploadState = "idle" | "dragging" | "uploading" | "done" | "error"

function DropZoneContent({ state, errorMessage }: { state: UploadState; errorMessage: string }) {
  switch (state) {
    case "uploading":
      return (
        <>
          <Loader2 className="w-8 h-8 text-accent animate-spin" />
          <span className="text-sm text-text-secondary">Uploading resume...</span>
        </>
      )
    case "done":
      return (
        <>
          <FileText className="w-8 h-8 text-accent" />
          <span className="text-sm text-accent font-medium">Resume uploaded</span>
        </>
      )
    case "error":
      return (
        <>
          <Upload className="w-8 h-8 text-danger/60" />
          <div className="text-center">
            <p className="text-sm font-medium text-danger">{errorMessage}</p>
            <p className="text-xs text-text-muted mt-1">Click to try again</p>
          </div>
        </>
      )
    default:
      return (
        <>
          <Upload className="w-8 h-8 text-text-muted" />
          <div className="text-center">
            <p className="text-sm font-medium text-text-primary">Drag & drop your resume</p>
            <p className="text-xs text-text-muted mt-1">PDF, DOCX, or TXT &middot; or click to browse</p>
          </div>
        </>
      )
  }
}

export function OnboardingPage() {
  const { sendPrefilled } = useChatContext()
  const [uploadState, setUploadState] = useState<UploadState>("idle")
  const [errorMessage, setErrorMessage] = useState("")
  const [pasteText, setPasteText] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(
    async (file: File) => {
      const dot = file.name.lastIndexOf(".")
      const ext = dot >= 0 ? file.name.slice(dot).toLowerCase() : ""
      if (!ACCEPTED_EXTENSIONS.includes(ext)) {
        setUploadState("error")
        setErrorMessage("Please upload a PDF, DOCX, or TXT file.")
        return
      }
      if (file.size > MAX_FILE_SIZE) {
        setUploadState("error")
        setErrorMessage("File is too large. Maximum size is 10 MB.")
        return
      }

      setUploadState("uploading")
      setErrorMessage("")

      try {
        const formData = new FormData()
        formData.append("file", file)

        const res = await fetch("/api/upload", { method: "POST", body: formData })
        const data = await res.json()

        if (!res.ok) {
          setUploadState("error")
          setErrorMessage(data.error || "Upload failed.")
          return
        }

        setUploadState("done")

        setTimeout(() => {
          sendPrefilled(RESUME_FILE_PROMPT(data.path, data.extractedText))
        }, 600)
      } catch {
        setUploadState("error")
        setErrorMessage("Upload failed. Please try again.")
      }
    },
    [sendPrefilled],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setUploadState("idle")
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile],
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setUploadState("dragging")
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setUploadState((s) => (s === "dragging" ? "idle" : s))
  }, [])

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) handleFile(file)
    },
    [handleFile],
  )

  const handlePasteSubmit = useCallback(() => {
    if (!pasteText.trim()) return
    sendPrefilled(PARSE_RESUME_PROMPT(pasteText.trim()))
  }, [pasteText, sendPrefilled])

  const dropZoneStyles: Record<UploadState, string> = {
    idle: "border-border-default hover:border-accent/40 hover:bg-surface-overlay cursor-pointer",
    dragging: "border-accent bg-accent-subtle scale-[1.02] cursor-pointer",
    uploading: "border-accent/50 bg-accent-subtle",
    done: "border-accent/50 bg-accent-subtle",
    error: "border-danger/30 bg-danger/5 cursor-pointer",
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 pb-[8vh]">
      <div className="w-full max-w-lg">
        <div className="text-center mb-10">
          <CrabLogo className="w-12 h-12 text-accent mx-auto mb-5" />
          <h1 className="font-display text-4xl text-text-primary mb-3">
            Welcome to talentclaw
          </h1>
          <p className="text-text-secondary text-base leading-relaxed">
            Let&apos;s build your career profile.<br />
            Drop your resume to get started.
          </p>
        </div>

        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => uploadState !== "uploading" && uploadState !== "done" && fileInputRef.current?.click()}
          className={`
            relative flex flex-col items-center justify-center gap-3
            rounded-2xl border-2 border-dashed px-6 py-12
            transition-all duration-200
            ${dropZoneStyles[uploadState]}
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.doc,.txt"
            onChange={handleInputChange}
            className="hidden"
          />

          <DropZoneContent state={uploadState} errorMessage={errorMessage} />
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-border-subtle" />
          <span className="text-xs text-text-muted uppercase tracking-wider">or paste your resume text</span>
          <div className="flex-1 h-px bg-border-subtle" />
        </div>

        {/* Paste area */}
        <textarea
          value={pasteText}
          onChange={(e) => setPasteText(e.target.value)}
          placeholder="Paste your resume text here..."
          rows={4}
          className="w-full rounded-xl border border-border-default bg-surface-raised px-4 py-3
            text-sm text-text-primary placeholder:text-text-muted
            focus:outline-none focus:border-accent/30 focus:ring-1 focus:ring-accent/20
            resize-none transition-colors"
        />

        {/* Get started button (only when text is pasted) */}
        {pasteText.trim() && (
          <button
            type="button"
            onClick={handlePasteSubmit}
            className="mt-3 w-full bg-accent hover:bg-accent-hover text-white font-medium
              rounded-xl px-6 py-3 text-sm transition-colors cursor-pointer"
          >
            Get started
          </button>
        )}

        {/* Skip link */}
        <div className="text-center mt-6">
          <Link
            href="/profile"
            className="text-sm text-text-muted hover:text-text-secondary transition-colors"
          >
            I&apos;ll set up manually instead
          </Link>
        </div>
      </div>
    </div>
  )
}
