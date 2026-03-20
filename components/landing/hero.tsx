"use client"

import { useState } from "react"
import { Apple, Check, Copy, Terminal } from "lucide-react"
import { CrabLogo } from "@/components/crab-logo"

const commands = [
  { tab: "npx", text: "npx talentclaw" },
  { tab: "curl", text: "curl -fsSL https://talentclaw.sh/install.sh | sh" },
]

function InstallCommand() {
  const [active, setActive] = useState(0)
  const [copied, setCopied] = useState(false)

  function copy() {
    navigator.clipboard.writeText(commands[active].text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <a
        href="/install.sh"
        className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-emerald-600 text-white font-medium text-[0.95rem] hover:bg-emerald-500 hover:shadow-[0_4px_16px_var(--color-accent-glow)] transition-all"
      >
        <Apple className="w-5 h-5" />
        Install for macOS
      </a>

      <div className="rounded-xl border border-border-default bg-surface-raised overflow-hidden">
        <div className="flex border-b border-border-default">
          {commands.map((cmd, i) => (
            <button
              key={cmd.tab}
              onClick={() => { setActive(i); setCopied(false) }}
              className={`px-4 py-2 text-[0.8rem] font-medium cursor-pointer transition-colors ${
                i === active
                  ? "text-emerald-600 bg-surface-raised"
                  : "text-text-muted hover:text-text-secondary bg-transparent"
              }`}
            >
              {cmd.tab}
            </button>
          ))}
        </div>
        <button
          onClick={copy}
          className="group relative grid cursor-pointer hover:bg-surface/50 transition-colors"
        >
          {/* Hidden sizer: all commands stacked so the box fits the longest */}
          {commands.map((cmd) => (
            <code
              key={cmd.tab}
              className="invisible col-start-1 row-start-1 flex items-center gap-3 px-5 py-3 text-[0.85rem] font-mono whitespace-nowrap"
            >
              <Terminal className="w-4 h-4 flex-shrink-0" />
              {cmd.text}
              <Copy className="w-4 h-4 ml-auto flex-shrink-0" />
            </code>
          ))}
          {/* Visible content centered over the sizer */}
          <span className="col-start-1 row-start-1 flex items-center justify-center gap-3 px-5 py-3">
            <Terminal className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <code className="text-[0.85rem] text-text-secondary font-mono whitespace-nowrap">
              {commands[active].text}
            </code>
            <span className="flex-shrink-0 text-text-muted group-hover:text-text-secondary transition-colors">
              {copied ? (
                <Check className="w-4 h-4 text-emerald-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </span>
          </span>
        </button>
      </div>

      <p className="text-[0.75rem] text-text-muted">
        Apple Silicon (arm64) &middot; Requires macOS 13+
      </p>
    </div>
  )
}

export function Hero() {
  return (
    <section className="px-5 pt-20 pb-12 relative overflow-hidden">
      <div className="max-w-[860px] mx-auto text-center">
        <div className="flex items-center justify-center gap-2.5 mb-6">
          <CrabLogo className="w-10 h-10 text-emerald-600" />
          <span className="text-2xl font-semibold tracking-tight">talentclaw</span>
          <span className="text-sm text-text-muted font-prose italic">by Artemys</span>
        </div>

        <h1 className="font-prose text-[clamp(2.2rem,5vw,3.5rem)] font-bold leading-[1.12] tracking-[-0.03em] mb-5">
          The agentic workspace for your entire career.
        </h1>

        <p className="text-text-secondary text-[clamp(1rem,2vw,1.15rem)] mb-8 max-w-[580px] mx-auto">
          TalentClaw is your career workspace that connects to your AI
          agent — Claude Code, Cowork, or the web UI. It manages your profile, tracks
          your pipeline, and finds opportunities so you can focus on what
          matters.
        </p>

        <div>
          <InstallCommand />
        </div>
      </div>
    </section>
  )
}
