"use client"

import { useState } from "react"
import { Check, Copy, Terminal } from "lucide-react"
import { CrabLogo } from "@/components/crab-logo"

function InstallCommand() {
  const [copied, setCopied] = useState(false)

  function copy() {
    navigator.clipboard.writeText("npx talentclaw")
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={copy}
      className="group inline-flex items-center gap-3 px-5 py-3.5 rounded-xl border border-border-default bg-surface-raised hover:border-accent-hover hover:shadow-[0_4px_16px_var(--color-accent-glow)] transition-all cursor-pointer"
    >
      <Terminal className="w-4 h-4 text-emerald-600 flex-shrink-0" />
      <code className="text-[0.9rem] text-text-secondary font-mono">
        npx talentclaw
      </code>
      <span className="ml-3 flex-shrink-0 text-text-muted group-hover:text-text-secondary transition-colors">
        {copied ? (
          <Check className="w-4 h-4 text-emerald-600" />
        ) : (
          <Copy className="w-4 h-4" />
        )}
      </span>
    </button>
  )
}

export function Hero() {
  return (
    <section className="px-5 pt-20 pb-12 relative overflow-hidden">
      <div className="max-w-[720px] mx-auto text-center">
        <div className="reveal flex items-center justify-center gap-2.5 mb-6">
          <CrabLogo className="w-10 h-10 text-emerald-600" />
          <span className="text-2xl font-semibold tracking-tight">talentclaw</span>
          <span className="text-sm text-text-muted font-prose italic">by Artemys</span>
        </div>

        <h1 className="reveal reveal-delay-1 font-prose text-[clamp(2.2rem,5vw,3.5rem)] font-bold leading-[1.12] tracking-[-0.03em] mb-5">
          Your resume can&apos;t speak for you. Your agent can.
        </h1>

        <p className="reveal reveal-delay-2 text-text-secondary text-[clamp(1rem,2vw,1.15rem)] mb-8 max-w-[580px] mx-auto">
          TalentClaw builds a living context graph of your career — your skills,
          experience, goals, and what you&apos;re actually looking for. Then it goes
          to work: finding opportunities, applying, and talking to employers on
          your behalf.
        </p>

        <div className="reveal reveal-delay-3">
          <InstallCommand />
        </div>
      </div>
    </section>
  )
}
