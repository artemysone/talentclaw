import { CrabLogo } from "@/components/crab-logo"
import Link from "next/link"

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-surface px-5 py-16">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-text-muted hover:text-text-primary mb-10 transition-colors">
          <CrabLogo className="w-5 h-5 text-emerald-600" />
          <span className="text-sm">talentclaw</span>
        </Link>

        <h1 className="font-display text-3xl mb-6">Privacy</h1>

        <div className="space-y-4 text-text-secondary text-[15px] leading-relaxed">
          <p>
            TalentClaw is a <strong>local-first</strong> application. Your career data lives on your machine
            as plain files in <code className="text-xs bg-surface-overlay px-1.5 py-0.5 rounded">~/.talentclaw/</code> — we
            never collect, store, or transmit your personal information to our servers.
          </p>

          <h2 className="font-display text-xl mt-8 mb-3 text-text-primary">What stays local</h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Your career profile, skills, and preferences</li>
            <li>Job listings and pipeline data</li>
            <li>Application history and notes</li>
            <li>Company research and contacts</li>
            <li>All conversation threads</li>
          </ul>

          <h2 className="font-display text-xl mt-8 mb-3 text-text-primary">Open source</h2>
          <p>
            TalentClaw is open source. You can inspect exactly what the code does at{" "}
            <a href="https://github.com/artemysone/talentclaw" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
              github.com/artemysone/talentclaw
            </a>.
          </p>
        </div>
      </div>
    </main>
  )
}
