import Link from "next/link"
import { CrabLogo } from "@/components/crab-logo"
import { PIPELINE_STAGES } from "@/lib/types"
import { STAGE_LABELS } from "@/lib/ui-utils"
import type { ProfileFrontmatter } from "@/lib/types"

const stageColors: Record<string, string> = {
  discovered: "bg-slate-500/15 text-slate-600 border-slate-200",
  saved: "bg-blue-500/10 text-blue-600 border-blue-200",
  applied: "bg-accent-subtle text-accent border-accent/20",
  interviewing: "bg-violet-500/10 text-violet-600 border-violet-200",
  offer: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
  accepted: "bg-green-500/10 text-green-600 border-green-200",
  rejected: "bg-red-500/10 text-red-500 border-red-200",
}

const FUNNEL_STAGES = PIPELINE_STAGES.filter((s) => s !== "rejected")

interface ProfileCardProps {
  profile: ProfileFrontmatter
  isFirstRun: boolean
  stageCounts: Record<string, number>
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning"
  if (hour < 17) return "Good afternoon"
  return "Good evening"
}

export function ProfileCard({ profile, isFirstRun, stageCounts }: ProfileCardProps) {
  if (isFirstRun) {
    return (
      <div className="bg-surface-raised rounded-2xl border border-border-subtle p-8">
        <div className="flex items-center gap-4 mb-6">
          <CrabLogo className="w-12 h-12 text-accent" />
          <div>
            <h2 className="font-prose text-xl text-text-primary">
              Welcome to talentclaw
            </h2>
            <p className="text-sm text-text-secondary mt-0.5">
              Let&apos;s set up your career hub.
            </p>
          </div>
        </div>
        <div className="space-y-3">
          <OnboardingStep
            step={1}
            title="Build your profile"
            description="Talk to your agent — it'll ask the right questions and set everything up."
          />
          <OnboardingStep
            step={2}
            title="Connect to Coffee Shop"
            description="Your agent will register you automatically. Just start a conversation."
          />
          <OnboardingStep
            step={3}
            title="Add jobs to your pipeline"
            description="Run talentclaw search to discover jobs, or ask your agent."
          />
        </div>
      </div>
    )
  }

  const total = Object.values(stageCounts).reduce((a, b) => a + b, 0)

  return (
    <div className="bg-surface-raised rounded-2xl border border-border-subtle p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-prose text-xl text-text-primary">
            {getGreeting()}, {profile.display_name}
          </h2>
          {profile.headline && (
            <p className="text-sm text-text-secondary mt-1">{profile.headline}</p>
          )}
        </div>
        <Link
          href="/pipeline"
          className="text-xs text-accent hover:text-accent-hover transition-colors shrink-0"
        >
          View board &rarr;
        </Link>
      </div>

      {/* Pipeline funnel */}
      <div className="mt-4">
        {total === 0 ? (
          <p className="text-sm text-text-muted py-2">
            No jobs in your pipeline yet.
          </p>
        ) : (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {FUNNEL_STAGES.map((stage, i) => {
              const count = stageCounts[stage] || 0
              return (
                <div key={stage} className="flex items-center gap-1.5 shrink-0">
                  {i > 0 && (
                    <div className="text-text-muted/40 text-xs">&rarr;</div>
                  )}
                  <Link
                    href="/pipeline"
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors hover:opacity-80 ${
                      count > 0
                        ? stageColors[stage]
                        : "bg-surface-overlay text-text-muted border-border-subtle"
                    }`}
                  >
                    {STAGE_LABELS[stage]} {count}
                  </Link>
                </div>
              )
            })}
          </div>
        )}

      </div>
    </div>
  )
}

function OnboardingStep({
  step,
  title,
  description,
}: {
  step: number
  title: string
  description: string
}) {
  return (
    <div className="flex items-start gap-3.5 bg-surface-overlay rounded-xl p-4">
      <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center text-xs font-semibold text-accent shrink-0">
        {step}
      </div>
      <div>
        <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
        <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  )
}
