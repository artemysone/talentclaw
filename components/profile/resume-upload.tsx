"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Upload, FileText, AlertCircle, Loader2 } from "lucide-react"
import { useChatContext } from "@/components/chat/chat-provider"
import { RESUME_FILE_PROMPT } from "@/lib/agent-prompts"
import Link from "next/link"

type UploadState = "idle" | "dragging" | "uploading" | "success" | "error"

export function ResumeUpload() {
  const { sendPrefilled } = useChatContext()
  const [state, setState] = useState<UploadState>("idle")
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [agentAvailable, setAgentAvailable] = useState<boolean | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const dragCountRef = useRef(0)

  // Check agent availability on mount
  useEffect(() => {
    let cancelled = false
    fetch("/api/agent/status")
      .then((r) => r.json())
      .then((data: { available: boolean; connected: boolean }) => {
        if (!cancelled) setAgentAvailable(data.available && data.connected)
      })
      .catch(() => {
        if (!cancelled) setAgentAvailable(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const uploadFile = useCallback(
    async (file: File) => {
      setState("uploading")
      setErrorMsg(null)

      // Client-side size check
      if (file.size > 10 * 1024 * 1024) {
        setState("error")
        setErrorMsg("File too large. Maximum size is 10 MB.")
        return
      }

      const formData = new FormData()
      formData.append("file", file)

      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        const data = await res.json()

        if (!res.ok || data.error) {
          setState("error")
          setErrorMsg(data.error || "Upload failed.")
          return
        }

        setState("success")
        // Send the extracted text (or file path fallback) to the agent for parsing
        sendPrefilled(RESUME_FILE_PROMPT(data.path, data.extractedText))
      } catch {
        setState("error")
        setErrorMsg("Upload failed. Please try again.")
      }
    },
    [sendPrefilled],
  )

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCountRef.current += 1
    setState("dragging")
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCountRef.current -= 1
    if (dragCountRef.current <= 0) {
      dragCountRef.current = 0
      setState("idle")
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      dragCountRef.current = 0

      const file = e.dataTransfer.files?.[0]
      if (file) {
        uploadFile(file)
      } else {
        setState("idle")
      }
    },
    [uploadFile],
  )

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) uploadFile(file)
    },
    [uploadFile],
  )

  // Agent unavailable: show fallback
  if (agentAvailable === false) {
    return (
      <div className="mt-4 rounded-xl border border-border-subtle bg-surface-overlay p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-text-muted shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-text-secondary">
              Connect an agent runtime to parse resumes automatically.
            </p>
            <p className="text-xs text-text-muted mt-1">
              You can still{" "}
              <Link href="/profile" className="text-accent hover:text-accent-hover transition-colors">
                edit your profile manually
              </Link>.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Still checking availability
  if (agentAvailable === null) {
    return null
  }

  return (
    <div className="mt-4">
      <div
        role="button"
        tabIndex={0}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            inputRef.current?.click()
          }
        }}
        className={`
          relative rounded-xl border-2 border-dashed p-5 text-center cursor-pointer
          transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent
          ${
            state === "dragging"
              ? "border-accent bg-accent-subtle"
              : state === "error"
                ? "border-danger/30 bg-danger/5"
                : state === "success"
                  ? "border-accent/30 bg-accent-subtle"
                  : "border-border-default hover:border-accent/40 hover:bg-accent-subtle/50"
          }
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
          onChange={handleFileSelect}
          className="hidden"
          aria-label="Upload resume file"
        />

        {state === "uploading" ? (
          <div className="flex flex-col items-center gap-2 py-1">
            <Loader2 className="w-5 h-5 text-accent animate-spin" />
            <p className="text-xs text-text-secondary">Uploading...</p>
          </div>
        ) : state === "success" ? (
          <div className="flex flex-col items-center gap-2 py-1">
            <FileText className="w-5 h-5 text-accent" />
            <p className="text-xs text-accent font-medium">
              Resume sent to agent for parsing
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-1">
            <Upload
              className={`w-5 h-5 ${
                state === "dragging" ? "text-accent" : "text-text-muted"
              }`}
            />
            <div>
              <p className="text-xs text-text-secondary">
                {state === "dragging"
                  ? "Drop your resume here"
                  : "Drag and drop your resume, or click to browse"}
              </p>
              <p className="text-[0.65rem] text-text-muted mt-1">
                PDF, DOCX, or TXT &middot; Max 10 MB
              </p>
            </div>
          </div>
        )}
      </div>

      {state === "error" && errorMsg && (
        <div className="flex items-center gap-2 mt-2 px-1">
          <AlertCircle className="w-3.5 h-3.5 text-danger shrink-0" />
          <p className="text-xs text-danger">{errorMsg}</p>
        </div>
      )}
    </div>
  )
}
