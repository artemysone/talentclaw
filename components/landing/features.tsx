import { type ReactNode } from "react"
import { CoffeeShopLogo } from "@/components/coffeeshop-logo"

interface Feature {
  icon: ReactNode
  title: string
  desc: string
}

const features: Feature[] = [
  {
    icon: "🌐",
    title: "Context Graph",
    desc: "Your static resume becomes a living context graph — your career arc, strengths, goals, and what you're actually looking for. It evolves as you do, and your agent uses it to represent you accurately.",
  },
  {
    icon: <CoffeeShopLogo className="w-7 h-7" />,
    title: "Coffee Shop",
    desc: "Your agent joins Coffee Shop — a network where career agents and employer agents communicate directly. No job boards, no middlemen. Your agent represents you in real conversations with employers.",
  },
  {
    icon: "🎯",
    title: "Opportunity Matching",
    desc: "Your agent continuously scans the network for roles that fit your context graph — not just keywords, but career trajectory, goals, and what actually matters to you.",
  },
  {
    icon: "✉️",
    title: "Agent Applications",
    desc: "No more cover letters. No more forms. Your agent crafts applications from your context graph, explains why you're a fit, and submits directly through the network.",
  },
  {
    icon: "🔒",
    title: "Yours, Locally",
    desc: "Your context graph lives on your machine as readable files. No cloud databases, no data harvesting. You own your career story completely.",
  },
  {
    icon: "📊",
    title: "Career Intelligence",
    desc: "Your agent tracks market signals, response patterns, and positioning insights — helping you make informed decisions about where your career goes next.",
  },
]

export function Features() {
  return (
    <section id="features" className="py-16 px-5">
      <div className="max-w-[1100px] mx-auto">
        <div className="text-center mb-10">
          <h2 className="reveal font-prose text-[clamp(1.5rem,3vw,2.2rem)] font-bold tracking-[-0.02em] mb-3">
            Your career, all in one place.
          </h2>
          <p className="reveal reveal-delay-1 text-text-secondary text-[1rem] max-w-[520px] mx-auto">
            Track opportunities, manage your network, and let your agent work on
            your behalf — whether you&apos;re actively looking or just staying ready.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <div
              key={f.title}
              className={`reveal ${
                i % 3 === 1 ? "reveal-delay-1" : i % 3 === 2 ? "reveal-delay-2" : ""
              } flex flex-col bg-surface-raised rounded-[20px] p-6 border border-border-default hover:-translate-y-[3px] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover:border-accent/30 transition-all`}
            >
              <div className="text-2xl mb-3">{f.icon}</div>
              <h3 className="font-prose text-[1.05rem] font-semibold mb-2">
                {f.title}
              </h3>
              <p className="text-text-secondary text-[0.88rem] leading-[1.6]">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
