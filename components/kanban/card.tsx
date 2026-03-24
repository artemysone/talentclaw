"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Calendar, Building2, ChevronRight } from "lucide-react"
import type { MatchBreakdown } from "@/lib/match-scoring"
import { MatchTooltip } from "@/components/jobs/match-tooltip"

export interface KanbanCardData {
  id: string
  title: string
  company: string | null
  appliedDate: string | null
  nextAction: string | null
  matchScore: number | null
  matchBreakdown?: MatchBreakdown | null
  location?: string | null
  remote?: string | null
  compensation?: string | null
  url?: string | null
  tags?: string[]
}

interface KanbanCardProps {
  card: KanbanCardData
}

function MatchBadge({ score }: { score: number }) {
  return (
    <div className={`text-[0.7rem] font-medium px-1.5 py-0.5 rounded cursor-default ${
      score >= 90
        ? "bg-emerald-500/10 text-emerald-400"
        : score >= 75
          ? "bg-accent-subtle text-accent"
          : "bg-amber-500/10 text-amber-400"
    }`}>
      {score}% fit
    </div>
  )
}

export function KanbanCard({ card }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-surface-raised rounded-xl p-4 border border-border-subtle hover:border-accent/30 cursor-grab active:cursor-grabbing transition-colors group"
    >
      <h4 className="text-sm font-semibold text-text-primary mb-1 group-hover:text-accent-hover transition-colors">
        {card.title}
      </h4>

      {card.company && (
        <div className="flex items-center gap-1.5 text-text-secondary text-xs mb-3">
          <Building2 className="w-3 h-3" />
          {card.company}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {card.appliedDate && (
            <div className="flex items-center gap-1 text-text-muted text-[0.7rem]">
              <Calendar className="w-3 h-3" />
              {card.appliedDate}
            </div>
          )}
          {card.matchScore !== null && (
            card.matchBreakdown ? (
              <MatchTooltip breakdown={card.matchBreakdown}>
                <MatchBadge score={card.matchScore} />
              </MatchTooltip>
            ) : (
              <MatchBadge score={card.matchScore} />
            )
          )}
        </div>
      </div>

      {card.nextAction && (
        <div className="mt-3 pt-3 border-t border-border-subtle flex items-center gap-1.5 text-text-muted text-[0.7rem]">
          <ChevronRight className="w-3 h-3 text-accent" />
          {card.nextAction}
        </div>
      )}
    </div>
  )
}
