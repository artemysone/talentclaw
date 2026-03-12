import { Cog } from "lucide-react"
import type { ProfileFrontmatter } from "@/lib/types"

interface ProfileCardProps {
  profile: ProfileFrontmatter
  isFirstRun: boolean
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning"
  if (hour < 17) return "Good afternoon"
  return "Good evening"
}

export function ProfileCard({ profile, isFirstRun }: ProfileCardProps) {
  if (isFirstRun) {
    return (
      <div className="bg-surface-raised rounded-2xl border border-border-subtle p-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
            <Cog className="w-6 h-6 text-accent" />
          </div>
          <div>
            <h2 className="font-prose text-xl text-text-primary">
              Welcome to TalentClaw
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

  const sections = [
    { label: "Name", filled: !!profile.display_name },
    { label: "Headline", filled: !!profile.headline },
    { label: "Skills", filled: (profile.skills?.length ?? 0) > 0 },
    { label: "Experience", filled: !!profile.experience_years },
    { label: "Preferences", filled: !!profile.remote_preference },
    { label: "Salary", filled: !!profile.salary_range },
  ]
  const filledCount = sections.filter((s) => s.filled).length

  return (
    <div className="bg-surface-raised rounded-2xl border border-border-subtle p-6">
      <h2 className="font-prose text-xl text-text-primary">
        {getGreeting()}, {profile.display_name}
      </h2>
      {profile.headline && (
        <p className="text-sm text-text-secondary mt-1">{profile.headline}</p>
      )}
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs text-text-muted mb-2">
          <span>Profile completeness</span>
          <span>
            {filledCount}/{sections.length}
          </span>
        </div>
        <div className="flex gap-1">
          {sections.map((s) => (
            <div
              key={s.label}
              className={`h-1.5 flex-1 rounded-full ${
                s.filled ? "bg-accent" : "bg-border-default"
              }`}
              title={s.label}
            />
          ))}
        </div>
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
