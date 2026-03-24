"use client"

import { useMemo, useCallback } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, MessageCircle, KanbanSquare, User, X, SquarePen } from "lucide-react"
import { useSidebar } from "./sidebar-wrapper"
import { useChatContext } from "@/components/chat/chat-provider"
import { CrabLogo } from "@/components/crab-logo"
import { getDayLabel } from "@/lib/ui-utils"
import type { ConversationSummary } from "@/lib/agent/use-chat"

interface SidebarNavProps {
  jobCount: number
}

function groupByDay(items: ConversationSummary[]): { label: string; items: ConversationSummary[] }[] {
  const groups: Map<string, ConversationSummary[]> = new Map()
  for (const item of items) {
    const label = getDayLabel(item.frontmatter.created_at)
    const existing = groups.get(label)
    if (existing) existing.push(item)
    else groups.set(label, [item])
  }
  return Array.from(groups.entries()).map(([label, items]) => ({ label, items }))
}

function SidebarConversations() {
  const { conversations, conversationSlug, loadConversation, clearMessages } = useChatContext()
  const { setOpen } = useSidebar()
  const pathname = usePathname()

  const grouped = useMemo(() => groupByDay(conversations), [conversations])

  const handleSelect = useCallback((slug: string) => {
    loadConversation(slug)
    setOpen(false)
  }, [loadConversation, setOpen])

  const handleNewChat = useCallback(() => {
    clearMessages()
    setOpen(false)
  }, [clearMessages, setOpen])

  return (
    <div className="flex flex-col min-h-0">
      {/* Section header with new chat button */}
      <div className="flex items-center justify-between px-3 pt-3 pb-1">
        <span className="text-[10px] font-medium uppercase tracking-wider text-text-muted">
          Conversations
        </span>
        <button
          type="button"
          onClick={handleNewChat}
          title="New chat"
          className="p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-overlay transition-colors cursor-pointer"
        >
          <SquarePen className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto px-1.5 pb-3">
        {grouped.length > 0 ? (
          grouped.map((group) => (
            <div key={group.label}>
              <div className="px-2 pt-2 pb-1 text-[10px] uppercase tracking-wider text-text-muted/60">
                {group.label}
              </div>
              {group.items.map((c) => {
                const isActive = pathname === "/chat" && c.slug === conversationSlug
                return (
                  <button
                    key={c.slug}
                    type="button"
                    onClick={() => handleSelect(c.slug)}
                    className={`w-full text-left rounded-lg text-[13px] transition-colors px-2.5 py-1.5 cursor-pointer truncate block ${
                      isActive
                        ? "bg-accent-subtle text-accent font-medium"
                        : "text-text-secondary hover:text-text-primary hover:bg-surface-overlay"
                    }`}
                  >
                    {c.frontmatter.title}
                  </button>
                )
              })}
            </div>
          ))
        ) : (
          <div className="px-2.5 py-3 text-[12px] text-text-muted">
            No conversations yet
          </div>
        )}
      </div>
    </div>
  )
}

export function SidebarNav({
  jobCount,
}: SidebarNavProps) {
  const pathname = usePathname()
  const { setOpen } = useSidebar()

  const navItems = [
    {
      href: "/dashboard",
      label: "Career Hub",
      icon: <Home className="w-4 h-4" />,
      count: 0,
    },
    {
      href: "/chat",
      label: "Chat",
      icon: <MessageCircle className="w-4 h-4" />,
      count: 0,
    },
    {
      href: "/pipeline",
      label: "Pipeline",
      icon: <KanbanSquare className="w-4 h-4" />,
      count: jobCount,
    },
    {
      href: "/profile",
      label: "Profile",
      icon: <User className="w-4 h-4" />,
      count: 0,
    },
  ]

  const handleNav = () => setOpen(false)

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Logo + branding */}
      <div className="flex items-center gap-2 px-3 pt-3 pb-1 shrink-0">
        <CrabLogo className="w-5 h-5 text-accent" />
        <span className="text-[13px] font-semibold tracking-tight text-text-primary">
          talentclaw
        </span>
        {/* Mobile close */}
        <button
          onClick={() => setOpen(false)}
          className="md:hidden ml-auto p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-overlay transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Views section label */}
      <div className="text-[10px] font-medium uppercase tracking-wider text-text-muted px-3 pt-3 pb-1 shrink-0">
        Views
      </div>

      {/* Main nav */}
      <nav className="px-1.5 pb-2 shrink-0">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={handleNav}
              className={`flex items-center gap-2.5 rounded-lg text-[13px] transition-colors px-2.5 py-1.5 ${
                isActive
                  ? "bg-accent-subtle text-accent font-medium border-l-2 border-accent -ml-[2px]"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface-overlay"
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
              {item.count > 0 && (
                <span className="ml-auto text-[11px] text-text-muted bg-surface-overlay px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                  {item.count}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      <SidebarConversations />
    </div>
  )
}
