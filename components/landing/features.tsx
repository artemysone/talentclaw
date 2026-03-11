"use client"

import {
  Kanban,
  Search,
  GitBranch,
  Network,
  Shield,
  BarChart3,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

interface Feature {
  icon: LucideIcon
  emoji: string
  title: string
  desc: string
}

const features: Feature[] = [
  {
    icon: Kanban,
    emoji: "📋",
    title: "Career CRM",
    desc: "Track every opportunity from discovery to offer in a local-first pipeline. Drag, drop, and never lose track of where you stand.",
  },
  {
    icon: Search,
    emoji: "🔍",
    title: "Job Discovery",
    desc: "Your agent scans the network and surfaces roles that match your skills, experience, and preferences. No noise, only signal.",
  },
  {
    icon: GitBranch,
    emoji: "🎯",
    title: "Application Pipeline",
    desc: "Manage applications across stages -- from discovered to offer. See your next steps, deadlines, and match reasoning at a glance.",
  },
  {
    icon: Network,
    emoji: "📬",
    title: "Agent-to-Agent Network",
    desc: "Connected to the Coffee Shop exchange where career agents meet employer agents. Direct protocol-level communication, not job board forms.",
  },
  {
    icon: Shield,
    emoji: "🔒",
    title: "Local-First Privacy",
    desc: "Your data lives on your machine as readable markdown files. No cloud databases, no data selling. You own your career data completely.",
  },
  {
    icon: BarChart3,
    emoji: "📊",
    title: "Career Intelligence",
    desc: "Application stats, response rates, market positioning, and growth paths -- informed by your pipeline and live market data.",
  },
]

export function Features() {
  return (
    <section id="features" className="py-16 px-5">
      <div className="max-w-[1100px] mx-auto">
        <div className="text-center mb-10">
          <h2 className="reveal font-prose text-[clamp(1.5rem,3vw,2.2rem)] font-bold tracking-[-0.02em] mb-3">
            Everything you need to own your search.
          </h2>
          <p className="reveal reveal-delay-1 text-stone-600 text-[1rem] max-w-[480px] mx-auto">
            Six capabilities that work together so you can focus on decisions, not logistics.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <div
              key={f.title}
              className={`reveal ${
                i % 3 === 1 ? "reveal-delay-1" : i % 3 === 2 ? "reveal-delay-2" : ""
              } flex flex-col bg-white rounded-[20px] p-6 border border-emerald-200/60 hover:-translate-y-[3px] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover:border-emerald-300 transition-all`}
            >
              <div className="text-2xl mb-3">{f.emoji}</div>
              <h3 className="font-prose text-[1.05rem] font-semibold mb-2">
                {f.title}
              </h3>
              <p className="text-stone-600 text-[0.88rem] leading-[1.6]">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
