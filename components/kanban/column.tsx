"use client"

import { useDroppable } from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { KanbanCard, type KanbanCardData } from "./card"

const stageColors: Record<string, string> = {
  discovered: "bg-slate-500",
  saved: "bg-blue-500",
  applied: "bg-accent",
  interviewing: "bg-violet",
  offer: "bg-emerald-500",
  accepted: "bg-green-500",
  rejected: "bg-red-500",
}

const stageLabels: Record<string, string> = {
  discovered: "Discovered",
  saved: "Saved",
  applied: "Applied",
  interviewing: "Interviewing",
  offer: "Offer",
  accepted: "Accepted",
  rejected: "Rejected",
}

interface KanbanColumnProps {
  stage: string
  cards: KanbanCardData[]
}

export function KanbanColumn({ stage, cards }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: stage })

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col min-w-[280px] w-[280px] bg-surface-raised rounded-2xl border transition-colors ${
        isOver ? "border-accent/40" : "border-border-subtle"
      }`}
    >
      {/* Column header */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border-subtle">
        <div className={`w-2.5 h-2.5 rounded-full ${stageColors[stage] || "bg-slate-500"}`} />
        <span className="text-sm font-medium text-text-primary">
          {stageLabels[stage] || stage}
        </span>
        <span className="text-xs text-text-muted ml-auto bg-surface-overlay px-2 py-0.5 rounded-full">
          {cards.length}
        </span>
      </div>

      {/* Cards */}
      <div className="flex-1 p-3 space-y-2.5 overflow-y-auto max-h-[calc(100vh-220px)]">
        <SortableContext
          items={cards.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          {cards.map((card) => (
            <KanbanCard key={card.id} card={card} />
          ))}
        </SortableContext>

        {cards.length === 0 && (
          <div className="text-center py-8 text-text-muted text-sm">
            No items
          </div>
        )}
      </div>
    </div>
  )
}
