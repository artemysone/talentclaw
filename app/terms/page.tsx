import { CrabLogo } from "@/components/crab-logo"
import Link from "next/link"

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-surface px-5 py-16">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-text-muted hover:text-text-primary mb-10 transition-colors">
          <CrabLogo className="w-5 h-5 text-emerald-600" />
          <span className="text-sm">talentclaw</span>
        </Link>

        <h1 className="font-display text-3xl mb-6">Terms of Use</h1>

        <div className="space-y-4 text-text-secondary text-[15px] leading-relaxed">
          <p>
            TalentClaw is open-source software provided as-is under the terms of its
            license. By using TalentClaw, you agree to the following:
          </p>

          <h2 className="font-display text-xl mt-8 mb-3 text-text-primary">Your data</h2>
          <p>
            All career data is stored locally on your machine. You own it completely.
            We have no access to it and make no claims to it.
          </p>

          <h2 className="font-display text-xl mt-8 mb-3 text-text-primary">The software</h2>
          <p>
            TalentClaw is provided without warranty. We do our best to make it reliable
            and useful, but we cannot guarantee uninterrupted service or accuracy of
            job matching, application tracking, or agent actions.
          </p>

          <h2 className="font-display text-xl mt-8 mb-3 text-text-primary">Third-party services</h2>
          <p>
            TalentClaw may connect to third-party services via your AI agent. Those
            services have their own terms. TalentClaw is not responsible for third-party
            actions, policies, or data handling.
          </p>

          <h2 className="font-display text-xl mt-8 mb-3 text-text-primary">Agent actions</h2>
          <p>
            Your AI agent acts on your behalf when using TalentClaw skills. You are
            responsible for reviewing and approving agent actions like job applications
            and messages before they are sent.
          </p>
        </div>
      </div>
    </main>
  )
}
