import Link from "next/link"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import type { CompletenessResult } from "@/lib/analytics"

interface CompletenessMeterProps {
  completeness: CompletenessResult
}

export function CompletenessMeter({ completeness }: CompletenessMeterProps) {
  const { percentage, missingFields } = completeness
  const isComplete = percentage === 100
  const circumference = 2 * Math.PI * 40
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  // Color based on percentage
  let ringColor = "stroke-accent"
  let bgAccent = "text-accent"
  if (percentage < 40) {
    ringColor = "stroke-warning"
    bgAccent = "text-warning"
  } else if (percentage < 70) {
    ringColor = "stroke-amber-500"
    bgAccent = "text-amber-500"
  }

  return (
    <div className="bg-surface-raised rounded-2xl border border-border-subtle p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-prose text-lg text-text-primary">Profile</h3>
        <Link
          href="/profile"
          className="text-xs text-accent hover:text-accent-hover transition-colors"
        >
          Edit profile &rarr;
        </Link>
      </div>

      <div className="flex items-center gap-5">
        {/* Circular progress */}
        <div className="relative shrink-0">
          <svg width="96" height="96" viewBox="0 0 96 96" className="-rotate-90">
            {/* Background ring */}
            <circle
              cx="48"
              cy="48"
              r="40"
              fill="none"
              strokeWidth="6"
              className="stroke-surface-overlay"
            />
            {/* Progress ring */}
            <circle
              cx="48"
              cy="48"
              r="40"
              fill="none"
              strokeWidth="6"
              strokeLinecap="round"
              className={ringColor}
              style={{
                strokeDasharray: circumference,
                strokeDashoffset,
                transition: "stroke-dashoffset 0.6s ease-out",
              }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-xl font-semibold ${bgAccent}`}>
              {percentage}%
            </span>
          </div>
        </div>

        {/* Status and missing fields */}
        <div className="flex-1 min-w-0">
          {isComplete ? (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
              <p className="text-sm font-medium text-accent">
                Profile complete
              </p>
            </div>
          ) : (
            <div>
              <p className="text-sm font-medium text-text-primary mb-2">
                {missingFields.length} field{missingFields.length !== 1 ? "s" : ""} remaining
              </p>
              <div className="space-y-1.5">
                {missingFields.slice(0, 3).map((item) => (
                  <div
                    key={item.field}
                    className="flex items-start gap-1.5"
                  >
                    <AlertCircle className="w-3.5 h-3.5 text-text-muted shrink-0 mt-0.5" />
                    <p className="text-xs text-text-secondary leading-snug">
                      <span className="font-medium">{item.field}</span>{" "}
                      &mdash; {item.suggestion}
                    </p>
                  </div>
                ))}
                {missingFields.length > 3 && (
                  <p className="text-[11px] text-text-muted pl-5">
                    +{missingFields.length - 3} more
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
