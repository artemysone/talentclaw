"use client"

import { useState } from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  Calendar,
  Building2,
  MapPin,
  Wifi,
  DollarSign,
  ExternalLink,
  Heart,
} from "lucide-react"
import type { KanbanCardData } from "@/components/kanban/card"
import { matchScoreClass, isSafeUrl } from "@/lib/ui-utils"
import { MatchTooltip } from "@/components/jobs/match-tooltip"
import { DeleteJobButton } from "@/components/jobs/delete-job-button"

interface PipelineCardProps {
  card: KanbanCardData
}

export function PipelineCard({ card }: PipelineCardProps) {
  const [favorited, setFavorited] = useState(false)

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

  const safeUrl = card.url && isSafeUrl(card.url) ? card.url : null

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-surface-raised rounded-[10px] p-[18px_20px] border border-border-subtle shadow-sm hover:border-border-default hover:shadow-md cursor-grab active:cursor-grabbing transition-colors group relative"
    >
      {/* Action buttons — bottom right, isolated from drag sensor */}
      <div
        className="absolute bottom-3 right-3.5 flex items-center gap-1"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <DeleteJobButton slug={card.id} jobTitle={card.title} />
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setFavorited((prev) => !prev)
          }}
          className={`p-1.5 rounded-lg transition-all ${
            favorited
              ? "text-rose-500"
              : "text-text-muted hover:text-rose-500 hover:scale-110"
          }`}
        >
          <Heart
            className="w-3.5 h-3.5"
            fill={favorited ? "currentColor" : "none"}
          />
        </button>
      </div>

      {/* Row 1: Title + match score */}
      <div className="flex items-center gap-2.5 mb-0.5">
        <h4 className="text-[15px] font-semibold text-text-primary group-hover:text-accent-hover transition-colors leading-snug flex-1 min-w-0">
          {card.title}
        </h4>
        {card.matchScore !== null && (
          card.matchBreakdown ? (
            <MatchTooltip breakdown={card.matchBreakdown}>
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 cursor-default ${matchScoreClass(card.matchScore)}`}
              >
                {card.matchScore}% match
              </span>
            </MatchTooltip>
          ) : (
            <span
              className={`text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 ${matchScoreClass(card.matchScore)}`}
            >
              {card.matchScore}% match
            </span>
          )
        )}
      </div>

      {/* Row 2: Company + location + remote + compensation */}
      <div className="flex items-center gap-3.5 text-[13px] text-text-secondary mb-2.5 flex-wrap">
        {card.company && (
          <span className="flex items-center gap-1.5">
            <Building2 className="w-[13px] h-[13px] text-text-muted shrink-0" />
            {card.company}
          </span>
        )}
        {card.location && (
          <span className="flex items-center gap-1.5">
            <MapPin className="w-[13px] h-[13px] text-text-muted shrink-0" />
            {card.location}
          </span>
        )}
        {card.remote === "remote" && (
          <span className="flex items-center gap-1.5 text-accent">
            <Wifi className="w-[13px] h-[13px] shrink-0" />
            Remote
          </span>
        )}
        {card.compensation && (
          <span className="flex items-center gap-1.5">
            <DollarSign className="w-[13px] h-[13px] text-text-muted shrink-0" />
            {card.compensation}
          </span>
        )}
      </div>

      {/* Row 3: Date + view posting */}
      <div className="flex items-center gap-3 text-xs text-text-muted">
        {card.appliedDate && (
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3 shrink-0" />
            {card.appliedDate}
          </span>
        )}
        {safeUrl && (
          <a
            href={safeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-accent hover:text-accent-hover transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            View posting
            <ExternalLink className="w-[11px] h-[11px]" />
          </a>
        )}
      </div>
    </div>
  )
}
