"use client"

import { useEffect, useState } from "react"
import { Check, Copy } from "lucide-react"
import { CrabLogo } from "@/components/crab-logo"

const messages = [
  {
    from: "agent",
    text: "Good morning! I found 3 new roles that match your profile.",
    time: "9:02 AM",
  },
  {
    from: "agent",
    text: "**Staff Engineer** at Figma - Remote, $200-260k, 95% fit.\n**Senior Frontend** at Linear - SF, $180-220k, 87% fit.\n**Product Engineer** at Vercel - Remote, $160-200k, 82% fit.",
    time: "9:02 AM",
  },
  {
    from: "user",
    text: "The Figma one looks great. Apply for me?",
    time: "9:14 AM",
  },
  {
    from: "agent",
    text: "On it. I'll tailor your resume to highlight your design systems work and submit through the network.",
    time: "9:14 AM",
  },
  {
    from: "agent",
    text: "Applied to Figma - Staff Engineer. Your application is in their pipeline. I'll notify you when there's movement.",
    time: "9:15 AM",
  },
]

function AgentPreview() {
  const [visibleCount, setVisibleCount] = useState(0)

  useEffect(() => {
    const timers: NodeJS.Timeout[] = []
    messages.forEach((_, i) => {
      timers.push(setTimeout(() => setVisibleCount(i + 1), 800 + i * 1000))
    })
    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <div className="w-full max-w-[480px]">
      <div className="bg-white rounded-2xl overflow-hidden border border-emerald-200/60 glow-accent">
        {/* Header */}
        <div className="flex items-center px-4 py-3 bg-surface-alt border-b border-black/5">
          <CrabLogo className="w-8 h-8 text-emerald-600" />
        </div>

        {/* Messages */}
        <div className="p-4 space-y-2.5">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"} ${
                i < visibleCount ? "" : "invisible"
              }`}
              style={i < visibleCount ? { animation: "chat-appear 0.35s cubic-bezier(0.16, 1, 0.3, 1)" } : undefined}
            >
              <div
                className={`max-w-[85%] px-3 py-2 rounded-xl text-[0.82rem] leading-[1.55] ${
                  msg.from === "user"
                    ? "bg-emerald-50 text-stone-800 rounded-br-sm border border-emerald-200/60"
                    : "bg-surface-alt text-stone-800 rounded-bl-sm border border-black/5"
                }`}
              >
                <span
                  dangerouslySetInnerHTML={{
                    __html: msg.text
                      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-emerald-700">$1</strong>')
                      .replace(/\n/g, "<br />"),
                  }}
                />
                <span className="text-[0.6rem] text-stone-400 ml-2 float-right mt-1">
                  {msg.time}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const installMethods = [
  { label: "npx", command: "npx talentclaw" },
  { label: "bunx", command: "bunx talentclaw" },
  { label: "npm", command: "npm install -g talentclaw" },
  { label: "curl", command: "curl -fsSL https://talentclaw.dev/install | sh" },
]

function InstallCommand() {
  const [activeTab, setActiveTab] = useState(0)
  const [copied, setCopied] = useState(false)

  function copy() {
    navigator.clipboard.writeText(installMethods[activeTab].command)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="w-full">
      <div className="rounded-xl border border-black/10 bg-white overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-black/5 px-1 pt-1 gap-0.5">
          {installMethods.map((method, i) => (
            <button
              key={method.label}
              onClick={() => { setActiveTab(i); setCopied(false) }}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                i === activeTab
                  ? "text-stone-800 bg-surface-alt"
                  : "text-stone-400 hover:text-stone-600"
              }`}
            >
              {method.label}
            </button>
          ))}
        </div>

        {/* Command */}
        <div className="flex items-center justify-between gap-3 px-4 py-3.5">
          <code className="text-[0.85rem] text-stone-700 font-mono truncate">
            {installMethods[activeTab].command}
          </code>
          <button
            onClick={copy}
            className="flex-shrink-0 p-1.5 rounded-md text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
            aria-label="Copy to clipboard"
          >
            {copied ? (
              <Check className="w-4 h-4 text-emerald-600" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export function Hero() {
  return (
    <section className="px-5 pt-20 pb-16 relative overflow-hidden">
      <div className="max-w-[1152px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
        {/* Left - copy */}
        <div className="flex flex-col items-start text-left">
          <h1 className="reveal reveal-delay-1 font-prose text-[clamp(2.2rem,5vw,3.5rem)] font-bold leading-[1.12] tracking-[-0.03em] max-w-[540px] mb-5">
            Your AI-powered career hub.
          </h1>

          <p className="reveal reveal-delay-2 text-stone-600 text-[clamp(1rem,2vw,1.15rem)] max-w-[460px] mb-8">
            TalentClaw is a local-first career hub powered by AI agents.
            Track opportunities, manage your pipeline, and let your agent handle
            applications — all from your machine.
            Powered by OpenClaw, ZeroClaw & more.
          </p>

          <div className="reveal reveal-delay-3 self-stretch">
            <InstallCommand />
          </div>
        </div>

        {/* Right - agent preview */}
        <div className="reveal reveal-delay-2 flex justify-center lg:justify-end">
          <AgentPreview />
        </div>
      </div>
    </section>
  )
}
