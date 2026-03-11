"use client"

import {
  Briefcase,
  Send,
  MessageSquare,
  TrendingUp,
} from "lucide-react"

interface StatsCardsProps {
  stats: {
    totalJobs: number
    appliedCount: number
    interviewingCount: number
    responseRate: number
  }
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      label: "Total Opportunities",
      value: String(stats.totalJobs),
      icon: <Briefcase className="w-5 h-5" />,
      color: "from-accent to-violet",
    },
    {
      label: "Applications Sent",
      value: String(stats.appliedCount),
      icon: <Send className="w-5 h-5" />,
      color: "from-violet to-purple-500",
    },
    {
      label: "Response Rate",
      value: stats.appliedCount > 0 ? `${stats.responseRate}%` : "--",
      icon: <MessageSquare className="w-5 h-5" />,
      color: "from-emerald-500 to-teal-500",
    },
    {
      label: "Interviewing",
      value: String(stats.interviewingCount),
      icon: <TrendingUp className="w-5 h-5" />,
      color: "from-amber-500 to-orange-500",
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((stat) => (
        <div
          key={stat.label}
          className="bg-surface-raised rounded-2xl p-5 border border-border-subtle hover:border-accent/20 transition-colors"
        >
          <div className="flex items-center justify-between mb-4">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white`}>
              {stat.icon}
            </div>
          </div>

          <div className="text-2xl font-bold text-text-primary mb-1">
            {stat.value}
          </div>
          <div className="text-sm text-text-secondary">{stat.label}</div>
        </div>
      ))}
    </div>
  )
}
