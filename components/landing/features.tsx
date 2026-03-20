import { type ReactNode } from "react"
import { CoffeeShopLogo } from "@/components/coffeeshop-logo"

// -- Custom feature icons (32x32 viewBox, match CoffeeShopLogo sizing) -------

function DashboardIcon({ className = "w-7 h-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Window frame */}
      <rect x="3" y="5" width="26" height="22" rx="3.5" stroke="#78716c" strokeWidth="1.2" fill="none" />
      {/* Sidebar */}
      <rect x="3" y="5" width="7" height="22" rx="3.5" fill="#059669" opacity="0.12" />
      <line x1="10" y1="7" x2="10" y2="25" stroke="#059669" strokeWidth="0.6" opacity="0.3" />
      {/* Active nav indicator */}
      <rect x="5" y="10" width="3" height="2" rx="1" fill="#059669" opacity="0.6" />
      {/* Top metric card */}
      <rect x="13" y="9" width="13" height="5" rx="1.5" fill="#059669" opacity="0.1" stroke="#059669" strokeWidth="0.5" strokeOpacity="0.2" />
      {/* Bar chart */}
      <rect x="14" y="20" width="2.5" height="4" rx="0.75" fill="#059669" opacity="0.5" />
      <rect x="18" y="17.5" width="2.5" height="6.5" rx="0.75" fill="#059669" opacity="0.75" />
      <rect x="22" y="19" width="2.5" height="5" rx="0.75" fill="#059669" opacity="0.35" />
    </svg>
  )
}

function GraphIcon({ className = "w-7 h-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Edges */}
      <line x1="16" y1="15" x2="7" y2="9" stroke="#a8a29e" strokeWidth="0.8" opacity="0.4" />
      <line x1="16" y1="15" x2="25" y2="8" stroke="#a8a29e" strokeWidth="0.8" opacity="0.4" />
      <line x1="16" y1="15" x2="8" y2="24" stroke="#a8a29e" strokeWidth="0.8" opacity="0.4" />
      <line x1="16" y1="15" x2="25" y2="22" stroke="#a8a29e" strokeWidth="0.8" opacity="0.4" />
      <line x1="7" y1="9" x2="25" y2="8" stroke="#a8a29e" strokeWidth="0.6" opacity="0.2" />
      <line x1="8" y1="24" x2="25" y2="22" stroke="#a8a29e" strokeWidth="0.6" opacity="0.2" />
      {/* Center node (person) */}
      <circle cx="16" cy="15" r="4" fill="#059669" />
      <circle cx="16" cy="15" r="1.8" fill="white" opacity="0.9" />
      {/* Satellite nodes (skills, companies, roles, projects) */}
      <circle cx="7" cy="9" r="2.5" fill="#f59e0b" opacity="0.85" />
      <circle cx="25" cy="8" r="2.5" fill="#3b82f6" opacity="0.85" />
      <circle cx="8" cy="24" r="2.2" fill="#ec4899" opacity="0.85" />
      <circle cx="25" cy="22" r="2.2" fill="#8b5cf6" opacity="0.85" />
      {/* Extra small node */}
      <circle cx="18" cy="26" r="1.5" fill="#06b6d4" opacity="0.7" />
      <line x1="16" y1="15" x2="18" y2="26" stroke="#a8a29e" strokeWidth="0.6" opacity="0.25" />
    </svg>
  )
}

function PipelineIcon({ className = "w-7 h-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Kanban columns */}
      <rect x="2" y="5" width="6" height="22" rx="2" fill="#64748b" opacity="0.08" />
      <rect x="9.5" y="5" width="6" height="22" rx="2" fill="#2563eb" opacity="0.08" />
      <rect x="17" y="5" width="6" height="22" rx="2" fill="#059669" opacity="0.08" />
      <rect x="24.5" y="5" width="6" height="22" rx="2" fill="#7c3aed" opacity="0.08" />
      {/* Cards in columns */}
      <rect x="3" y="7" width="4" height="5" rx="1" fill="#64748b" opacity="0.55" />
      <rect x="3" y="14" width="4" height="4" rx="1" fill="#64748b" opacity="0.3" />
      <rect x="10.5" y="7" width="4" height="5" rx="1" fill="#2563eb" opacity="0.55" />
      <rect x="10.5" y="14" width="4" height="4" rx="1" fill="#2563eb" opacity="0.3" />
      <rect x="18" y="7" width="4" height="5" rx="1" fill="#059669" opacity="0.65" />
      <rect x="25.5" y="7" width="4" height="5" rx="1" fill="#7c3aed" opacity="0.55" />
    </svg>
  )
}

function AgentIcon({ className = "w-7 h-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Terminal frame */}
      <rect x="3" y="6" width="26" height="20" rx="3.5" fill="#1c1917" />
      {/* Title bar traffic lights */}
      <circle cx="7.5" cy="10" r="1.2" fill="#fc5753" opacity="0.8" />
      <circle cx="11" cy="10" r="1.2" fill="#fdbc40" opacity="0.8" />
      <circle cx="14.5" cy="10" r="1.2" fill="#33c748" opacity="0.8" />
      {/* Chevron prompt */}
      <path d="M7 17L10 19.5L7 22" stroke="#059669" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Command text */}
      <rect x="13" y="18" width="11" height="2.5" rx="1" fill="#059669" opacity="0.4" />
      {/* Cursor */}
      <rect x="25.5" y="17.5" width="1.5" height="3.5" rx="0.5" fill="#059669" opacity="0.7" />
    </svg>
  )
}

function LocalIcon({ className = "w-7 h-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Folder back */}
      <path d="M4 11a3 3 0 0 1 3-3h5l2.5 3H25a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V11z" fill="#f0f5f2" stroke="#a8a29e" strokeWidth="1" />
      {/* Folder tab */}
      <path d="M4 11V10a2 2 0 0 1 2-2h5.2l2.3 3H4z" fill="#e8eeea" />
      {/* Shield */}
      <path d="M16 14l-5 2.2v3.8c0 2.8 2.2 4.8 5 5.5 2.8-.7 5-2.7 5-5.5v-3.8L16 14z" fill="#059669" opacity="0.12" stroke="#059669" strokeWidth="1" strokeLinejoin="round" />
      {/* Checkmark */}
      <path d="M13.5 20l2 2 3.5-3.5" stroke="#059669" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// -- Feature data ------------------------------------------------------------

interface Feature {
  icon: ReactNode
  title: string
  desc: string
  href?: string
}

const features: Feature[] = [
  // Row 1
  {
    icon: <DashboardIcon />,
    title: "Career Dashboard",
    desc: "See your profile strength, active pipeline, recent activity, and career map in one view. A real workspace for managing your search, not another job board.",
  },
  {
    icon: <GraphIcon />,
    title: "Career Context Graph",
    desc: "Your career profile lives as a connected map of your skills, experience, goals, and what you're looking for. It's stored as plain text files you can open, read, and edit yourself.",
  },
  {
    icon: <PipelineIcon />,
    title: "Pipeline & Tracking",
    desc: "A visual pipeline to manage your job search end-to-end. Drag opportunities through stages — discovered, saved, applied, interviewing, offer — and see match scores against your profile.",
  },
  // Row 2
  {
    icon: <CoffeeShopLogo className="w-7 h-7" />,
    title: "Coffee Shop",
    href: "https://coffeeshop.sh",
    desc: "An emerging talent network with 200+ companies' openings in one place. Get a Coffee Shop API key, point your agent at it, and matching opportunities land in your local workspace for review.",
  },
  {
    icon: <AgentIcon />,
    title: "Agent-Native",
    desc: "TalentClaw is a skill your AI agent runs — not another app you check. It works with Claude Code, Cowork, and the web UI. The agent searches, evaluates, and organizes. You decide.",
  },
  {
    icon: <LocalIcon />,
    title: "Yours, Locally",
    desc: "Everything lives on your machine as plain files in a folder you own. No cloud databases, no data harvesting. Read them, back them up, or move them — they're yours.",
  },
]

// -- Component ---------------------------------------------------------------

export function Features() {
  return (
    <section id="features" className="pt-8 pb-16 px-5">
      <div className="max-w-[1100px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => {
            const cardClass = "flex flex-col bg-surface-raised rounded-[20px] p-6 border border-border-default hover:-translate-y-[3px] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover:border-accent/30 transition-all"

            const content = (
              <>
                <div className="mb-3">{f.icon}</div>
                <h3 className="font-prose text-[1.05rem] font-semibold mb-2">
                  {f.title}
                </h3>
                <p className="text-text-secondary text-[0.88rem] leading-[1.6]">
                  {f.desc}
                </p>
              </>
            )

            return f.href ? (
              <a
                key={f.title}
                href={f.href}
                target="_blank"
                rel="noopener noreferrer"
                className={cardClass}
              >
                {content}
              </a>
            ) : (
              <div key={f.title} className={cardClass}>
                {content}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
