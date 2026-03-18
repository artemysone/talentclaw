"use client"

import { useState, useCallback, useMemo } from "react"
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
} from "@dnd-kit/sortable"
import { PipelineCard } from "./pipeline-card"
import type { KanbanCardData } from "@/components/kanban/card"
import { PIPELINE_STAGES } from "@/lib/types"
import { STAGE_LABELS, STAGE_THEME } from "@/lib/ui-utils"
import { moveJobToStage } from "@/app/actions"

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface PipelineBoardProps {
  initialData: Record<string, KanbanCardData[]>
}

// ---------------------------------------------------------------------------
// Droppable stage section
// ---------------------------------------------------------------------------

interface StageSectionProps {
  stage: string
  cards: KanbanCardData[]
}

function StageSection({ stage, cards }: StageSectionProps) {
  const { setNodeRef, isOver } = useDroppable({ id: stage })
  const cardIds = useMemo(() => cards.map((c) => c.id), [cards])

  return (
    <div
      id={`stage-${stage}`}
      ref={setNodeRef}
      className={`border-l-2 rounded-2xl pl-4 pr-2 py-4 transition-colors ${
        STAGE_THEME[stage]?.border || "border-l-slate-500"
      } ${isOver ? "bg-accent/5" : ""}`}
    >
      {/* Section header */}
      <div className="flex items-center gap-2.5 mb-3">
        <div
          className={`w-2.5 h-2.5 rounded-full shrink-0 ${
            STAGE_THEME[stage]?.dot || "bg-slate-500"
          }`}
        />
        <span className="text-sm font-medium text-text-primary">
          {STAGE_LABELS[stage] || stage}
        </span>
        <span className="text-xs text-text-muted bg-surface-overlay px-2 py-0.5 rounded-full">
          {cards.length}
        </span>
      </div>

      {/* Card grid */}
      <SortableContext
        items={cardIds}
        strategy={rectSortingStrategy}
      >
        {cards.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {cards.map((card) => (
              <PipelineCard key={card.id} card={card} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-muted pl-5">No items</p>
        )}
      </SortableContext>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Stage progress bar
// ---------------------------------------------------------------------------

interface StageBarProps {
  stages: readonly string[]
  columns: Record<string, KanbanCardData[]>
}

function StageBar({ stages, columns }: StageBarProps) {
  const handleClick = (stage: string) => {
    const el = document.getElementById(`stage-${stage}`)
    el?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <div className="bg-surface-raised rounded-2xl border border-border-subtle px-5 py-4">
      <div className="flex items-center">
        {stages.map((stage, i) => {
          const count = (columns[stage] || []).length
          const hasJobs = count > 0

          return (
            <div key={stage} className="flex items-center">
              {/* Stage node */}
              <button
                type="button"
                onClick={() => handleClick(stage)}
                className={`flex items-center gap-2 px-2 py-1 rounded-lg transition-colors hover:bg-surface-overlay ${
                  hasJobs ? "opacity-100" : "opacity-45"
                }`}
              >
                <div
                  className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                    STAGE_THEME[stage]?.dot || "bg-slate-500"
                  }`}
                />
                <span
                  className={`text-xs font-medium whitespace-nowrap ${
                    hasJobs ? "text-text-primary" : "text-text-muted"
                  }`}
                >
                  {STAGE_LABELS[stage] || stage}
                </span>
                {hasJobs && (
                  <span className="text-[0.65rem] text-text-muted bg-surface-overlay px-1.5 py-0.5 rounded-full leading-none">
                    {count}
                  </span>
                )}
              </button>

              {/* Connector line */}
              {i < stages.length - 1 && (
                <div className="w-4 h-px bg-border-subtle mx-0.5 shrink-0" />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main board
// ---------------------------------------------------------------------------

export function PipelineBoard({ initialData }: PipelineBoardProps) {
  const [columns, setColumns] =
    useState<Record<string, KanbanCardData[]>>(initialData)
  const [activeCard, setActiveCard] = useState<KanbanCardData | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  )

  const findColumn = useCallback(
    (id: string): string | undefined => {
      if (id in columns) return id
      for (const [stage, cards] of Object.entries(columns)) {
        if (cards.some((c) => c.id === id)) return stage
      }
      return undefined
    },
    [columns]
  )

  // ---- Drag handlers (same logic as kanban board) ----

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const stage = findColumn(active.id as string)
    if (!stage) return
    const card = columns[stage]?.find((c) => c.id === active.id)
    if (card) setActiveCard(card)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeStage = findColumn(active.id as string)
    const overStage = findColumn(over.id as string)

    if (!activeStage || !overStage || activeStage === overStage) return

    setColumns((prev) => {
      const activeCards = [...(prev[activeStage] || [])]
      const overCards = [...(prev[overStage] || [])]
      const activeIndex = activeCards.findIndex((c) => c.id === active.id)

      if (activeIndex === -1) return prev

      const [movedCard] = activeCards.splice(activeIndex, 1)

      const overIndex = overCards.findIndex((c) => c.id === over.id)
      if (overIndex >= 0) {
        overCards.splice(overIndex, 0, movedCard)
      } else {
        overCards.push(movedCard)
      }

      return {
        ...prev,
        [activeStage]: activeCards,
        [overStage]: overCards,
      }
    })
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveCard(null)

    if (!over) return

    const activeStage = findColumn(active.id as string)
    const overStage = findColumn(over.id as string)

    if (!activeStage || !overStage) return

    if (activeStage === overStage) {
      setColumns((prev) => {
        const cards = [...(prev[activeStage] || [])]
        const oldIndex = cards.findIndex((c) => c.id === active.id)
        const newIndex = cards.findIndex((c) => c.id === over.id)
        if (oldIndex === -1 || newIndex === -1) return prev
        return {
          ...prev,
          [activeStage]: arrayMove(cards, oldIndex, newIndex),
        }
      })
    }

    // Persist stage change to filesystem
    if (activeStage !== overStage) {
      moveJobToStage(active.id as string, overStage).catch((err) =>
        console.error("Failed to persist stage change:", err)
      )
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-6">
        {/* Stage progress bar */}
        <StageBar stages={PIPELINE_STAGES} columns={columns} />

        {/* Vertical stage sections */}
        <div className="space-y-4">
          {PIPELINE_STAGES.map((stage) => (
            <StageSection
              key={stage}
              stage={stage}
              cards={columns[stage] || []}
            />
          ))}
        </div>
      </div>

      <DragOverlay>
        {activeCard ? <PipelineCard card={activeCard} /> : null}
      </DragOverlay>
    </DndContext>
  )
}
