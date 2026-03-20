import Link from "next/link"
import { CrabLogo } from "@/components/crab-logo"
import { STAGE_LABELS, STAGE_PILL_COLORS, FUNNEL_STAGES, getGreeting, formatBriefDate, pluralize } from "@/lib/ui-utils"
import type { ProfileFrontmatter, ProfileCompletenessResult } from "@/lib/types"
import type { BriefingResult, MomentumResult } from "@/lib/analytics"
import { ResumeUpload } from "@/components/profile/resume-upload"
import { ProfileOptimizeButton } from "./profile-optimize-button"
import { TrendingUp, Calendar, Bot, Lightbulb } from "lucide-react"

interface ProfileCardProps {
  profile: ProfileFrontmatter
  isFirstRun: boolean
  stageCounts: Record<string, number>
  briefing?: BriefingResult
  completeness?: ProfileCompletenessResult
  momentum?: MomentumResult
  insights?: string[]
}

export function ProfileCard({
  profile,
  isFirstRun,
  stageCounts,
  briefing,
  completeness,
  momentum,
  insights,
}: ProfileCardProps) {
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
        <ResumeUpload />
      </div>
    )
  }

  const total = Object.values(stageCounts).reduce((a, b) => a + b, 0)
  const hasUpcoming = briefing && briefing.upcomingActions.length > 0
  const showCompleteness = completeness && completeness.percentage < 100

  return (
    <div className="bg-surface-raised rounded-2xl border border-border-subtle p-6">
      {/* Top row: greeting + actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-prose text-xl text-text-primary">
            {getGreeting()}, {profile.display_name}
          </h2>
          {profile.headline && (
            <p className="text-sm text-text-secondary mt-1">{profile.headline}</p>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {momentum && momentum.score !== null && (
            <MomentumRing score={momentum.score} trend={momentum.trend} qualifier={momentum.qualifier} />
          )}
          <ProfileOptimizeButton />
        </div>
      </div>

      {/* Pipeline funnel pills */}
      <div className="mt-4">
        {total === 0 ? (
          <p className="text-sm text-text-muted py-2">
            No jobs in your pipeline yet.
          </p>
        ) : (
          <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap sm:overflow-x-auto pb-1">
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
                        ? STAGE_PILL_COLORS[stage]
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

      {/* Briefing + completeness row */}
      {(briefing || showCompleteness) && (
        <div className="mt-4 pt-4 border-t border-border-subtle">
          <div className="flex flex-wrap gap-x-8 gap-y-3">
            {/* Briefing stats */}
            {briefing && (
              <>
                <BriefingStat
                  icon={<TrendingUp className="w-3.5 h-3.5 text-accent" />}
                  value={briefing.newJobs}
                  label={`new ${pluralize(briefing.newJobs, "job")}`}
                />
                {briefing.agentActions > 0 && (
                  <BriefingStat
                    icon={<Bot className="w-3.5 h-3.5 text-violet-500" />}
                    value={briefing.agentActions}
                    label={`agent ${pluralize(briefing.agentActions, "action")}`}
                  />
                )}
              </>
            )}

            {/* Completeness */}
            {showCompleteness && (
              <div className="flex items-center gap-2">
                <div className="w-16 h-1.5 bg-surface-overlay rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent rounded-full"
                    style={{ width: `${completeness.percentage}%` }}
                  />
                </div>
                <Link
                  href="/profile"
                  className="text-xs text-text-muted hover:text-accent transition-colors"
                >
                  Profile {completeness.percentage}%
                </Link>
              </div>
            )}
          </div>

          {/* Upcoming actions (compact) */}
          {hasUpcoming && (
            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1.5">
              {briefing.upcomingActions.slice(0, 3).map((action, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <Calendar className="w-3 h-3 text-text-muted" />
                  <span className="text-xs text-text-secondary">
                    {action.title}
                  </span>
                  <span className="text-xs text-text-muted">
                    {formatBriefDate(action.date)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Agent insights */}
          {insights && insights.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border-subtle">
              <div className="flex items-center gap-1.5 mb-2">
                <Lightbulb className="w-3 h-3 text-amber-500" />
                <span className="text-[11px] text-text-muted uppercase tracking-wider">What your agent learned</span>
              </div>
              <div className="space-y-1">
                {insights.map((insight, i) => (
                  <p key={i} className="text-xs text-text-secondary leading-relaxed">{insight}</p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function BriefingStat({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode
  value: number
  label: string
}) {
  return (
    <div className="flex items-center gap-1.5">
      {icon}
      <span className={`text-sm font-semibold ${value > 0 ? "text-text-primary" : "text-text-muted"}`}>
        {value}
      </span>
      <span className="text-xs text-text-muted">{label}</span>
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

function MomentumRing({
  score,
  trend,
  qualifier,
}: {
  score: number
  trend: "up" | "flat" | "down"
  qualifier: string
}) {
  const circumference = 2 * Math.PI * 18
  const strokeDashoffset = circumference - (score / 100) * circumference

  let ringColor = "stroke-accent"
  if (score < 40) ringColor = "stroke-warning"
  else if (score < 70) ringColor = "stroke-amber-500"

  const trendArrow = trend === "up" ? "\u2191" : trend === "down" ? "\u2193" : "\u2192"
  const trendColor = trend === "up" ? "text-accent" : trend === "down" ? "text-red-500" : "text-amber-500"

  return (
    <div className="flex items-center gap-2">
      <div className="relative" role="img" aria-label={`Career momentum: ${score}, trending ${trend}`}>
        <svg width="44" height="44" viewBox="0 0 44 44" className="-rotate-90" aria-hidden="true">
          <circle cx="22" cy="22" r="18" fill="none" strokeWidth="3" className="stroke-surface-overlay" />
          <circle
            cx="22" cy="22" r="18" fill="none" strokeWidth="3" strokeLinecap="round"
            className={ringColor}
            style={{ strokeDasharray: circumference, strokeDashoffset, transition: "stroke-dashoffset 0.6s ease-out" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[11px] font-semibold text-text-primary">{score}</span>
        </div>
      </div>
      <div>
        <div className="flex items-center gap-1">
          <span className={`text-sm font-semibold ${trendColor}`}>{trendArrow}</span>
          <span className="text-[11px] text-text-muted">Momentum</span>
        </div>
        <p className="text-[11px] text-text-muted">{qualifier}</p>
      </div>
    </div>
  )
}

