"use client"

import { useState } from "react"
import { Wrench, Check, AlertCircle, ChevronDown } from "lucide-react"
import type { ToolCallInfo } from "@/lib/agent/types"

const TOOL_LABELS: Record<string, { running: string; complete: string }> = {
  search_opportunities: { running: "Searching jobs", complete: "Searched jobs" },
  update_profile: { running: "Updating profile", complete: "Updated profile" },
  express_interest: { running: "Applying", complete: "Applied" },
  check_inbox: { running: "Checking inbox", complete: "Checked inbox" },
  respond_to_message: { running: "Sending reply", complete: "Sent reply" },
  get_identity: { running: "Verifying identity", complete: "Verified identity" },
  get_profile: { running: "Reading profile", complete: "Read profile" },
  get_my_applications: { running: "Checking applications", complete: "Checked applications" },
  discover_agents: { running: "Discovering agents", complete: "Discovered agents" },
}

function getLabel(name: string, status: ToolCallInfo["status"]): string {
  const entry = TOOL_LABELS[name]
  if (entry) return status === "complete" ? entry.complete : entry.running
  return name.replace(/_/g, " ")
}

export function ToolCallBadge({ toolCall }: { toolCall: ToolCallInfo }) {
  const [expanded, setExpanded] = useState(false)
  const label = getLabel(toolCall.name, toolCall.status)
  const hasDetails = toolCall.output || Object.keys(toolCall.input).length > 0

  return (
    <div className="mt-1.5">
      <button
        type="button"
        onClick={() => hasDetails && setExpanded(!expanded)}
        disabled={!hasDetails}
        className={`
          inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
          transition-colors
          ${toolCall.status === "running"
            ? "bg-accent-subtle text-accent animate-pulse"
            : toolCall.status === "error"
              ? "bg-danger/8 text-danger"
              : "bg-surface-overlay text-text-secondary"
          }
          ${hasDetails ? "cursor-pointer hover:opacity-80" : "cursor-default"}
        `}
        aria-label={`Tool: ${label}`}
      >
        {toolCall.status === "running" && <Wrench className="w-3 h-3" />}
        {toolCall.status === "complete" && <Check className="w-3 h-3" />}
        {toolCall.status === "error" && <AlertCircle className="w-3 h-3" />}
        <span>{label}</span>
        {hasDetails && (
          <ChevronDown
            className={`w-3 h-3 transition-transform ${expanded ? "rotate-180" : ""}`}
          />
        )}
      </button>

      {expanded && hasDetails && (
        <div className="mt-1.5 ml-1 p-2.5 rounded-lg bg-surface-overlay text-xs font-mono text-text-secondary max-h-32 overflow-y-auto">
          {Object.keys(toolCall.input).length > 0 && (
            <div className="mb-1">
              <span className="text-text-muted">input: </span>
              {JSON.stringify(toolCall.input, null, 2)}
            </div>
          )}
          {toolCall.output && (
            <div>
              <span className="text-text-muted">output: </span>
              {toolCall.output.length > 300
                ? toolCall.output.slice(0, 300) + "..."
                : toolCall.output}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
