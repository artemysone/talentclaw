"use client"

import { useState, useEffect } from "react"
import { Apple, Check, Copy, Terminal, ArrowRight } from "lucide-react"

function isMacOS() {
  if (typeof navigator === "undefined") return false
  return /Mac/i.test(navigator.platform || navigator.userAgent)
}

function NpxBlock() {
  const [copied, setCopied] = useState(false)

  function copy() {
    navigator.clipboard.writeText("npx talentclaw")
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={copy}
      className="group flex items-center gap-3 px-4 py-2.5 rounded-lg bg-surface-overlay/60 border border-border-subtle hover:border-border-default transition-colors cursor-pointer"
    >
      <Terminal className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
      <code className="text-[0.82rem] text-text-secondary font-mono">
        npx talentclaw
      </code>
      <span className="text-text-muted group-hover:text-text-secondary transition-colors shrink-0">
        {copied ? (
          <Check className="w-3.5 h-3.5 text-emerald-600" />
        ) : (
          <Copy className="w-3.5 h-3.5" />
        )}
      </span>
    </button>
  )
}

export function DownloadSection() {
  const [mac, setMac] = useState(true)

  useEffect(() => {
    setMac(isMacOS())
  }, [])

  return (
    <section className="px-5 pt-8 pb-16">
      <div className="max-w-[680px] mx-auto">
        <div className="rounded-[20px] border border-border-default bg-surface-raised p-8 md:p-10 text-center">
          <h2 className="font-prose text-[clamp(1.6rem,3vw,2rem)] font-bold leading-[1.2] mb-3">
            Get TalentClaw
          </h2>
          <p className="text-text-secondary text-[0.95rem] mb-8 max-w-[420px] mx-auto">
            Double-click and go. No terminal required.
          </p>

          {mac ? (
            <div className="flex flex-col items-center gap-5">
              <a
                href="https://github.com/artemyshq/talentclaw/releases/latest"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2.5 px-6 py-3 rounded-lg bg-accent text-white font-medium text-[0.95rem] hover:bg-accent-hover transition-colors"
              >
                <Apple className="w-5 h-5" />
                Download for Mac
                <span className="ml-1 px-2 py-0.5 rounded-full text-[0.6rem] font-semibold uppercase tracking-wider bg-white/20">
                  New
                </span>
              </a>
              <p className="text-[0.72rem] text-text-muted">
                macOS 12+ &middot; Apple Silicon
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <p className="text-text-secondary text-[0.88rem]">
                Available for macOS
              </p>
              <a
                href="https://github.com/artemyshq/talentclaw/releases/latest"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-accent hover:text-accent-hover font-medium text-[0.9rem] transition-colors"
              >
                View on GitHub
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-border-subtle">
            <p className="text-[0.78rem] text-text-muted mb-3">Or install via npm</p>
            <div className="flex justify-center">
              <NpxBlock />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
