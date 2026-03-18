"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Calendar, Building2, GripVertical } from "lucide-react"
import type { KanbanCardData } from "@/components/kanban/card"
import { matchScoreClass } from "@/lib/ui-utils"

interface PipelineCardProps {
  card: KanbanCardData
}

export function PipelineCard({ card }: PipelineCardProps) {
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
      className="bg-surface-overlay rounded-xl p-3.5 border-l-2 border border-border-subtle border-l-border-subtle hover:border-accent/30 hover:border-l-accent/50 cursor-grab active:cursor-grabbing transition-colors group relative"
    >
      {/* Drag handle hint */}
      <div className="absolute top-2.5 right-2.5 text-text-muted opacity-0 group-hover:opacity-60 transition-opacity">
        <GripVertical className="w-3.5 h-3.5" />
      </div>

      <h4 className="text-sm font-semibold text-text-primary mb-1 pr-5 group-hover:text-accent-hover transition-colors leading-snug">
        {card.title}
      </h4>

      {card.company && (
        <div className="flex items-center gap-1.5 text-text-secondary text-xs mb-2.5">
          <Building2 className="w-3 h-3 shrink-0" />
          {card.company}
        </div>
      )}

      <div className="flex items-center gap-3">
        {card.appliedDate && (
          <div className="flex items-center gap-1 text-text-muted text-[0.7rem]">
            <Calendar className="w-3 h-3 shrink-0" />
            {card.appliedDate}
          </div>
        )}
        {card.matchScore !== null && (
          <div className={`text-[0.7rem] font-medium px-1.5 py-0.5 rounded ${matchScoreClass(card.matchScore)}`}>
            {card.matchScore}% fit
          </div>
        )}
      </div>
    </div>
  )
}
