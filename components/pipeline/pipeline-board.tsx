"use client"

import { useState, useCallback, useMemo, useId } from "react"
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
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { PipelineCard } from "./pipeline-card"
import type { KanbanCardData } from "@/components/kanban/card"
import { SearchBar } from "@/components/query/search-bar"
import { PIPELINE_DISPLAY_STAGES } from "@/lib/types"
import { STAGE_LABELS, STAGE_HEX, pluralize } from "@/lib/ui-utils"
import { moveJobToStage } from "@/app/actions"

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface PipelineBoardProps {
  initialData: Record<string, KanbanCardData[]>
}

// ---------------------------------------------------------------------------
// Collapsed pill column
// ---------------------------------------------------------------------------

interface PillProps {
  stage: string
  count: number
  onClick: () => void
}

function StagePill({ stage, count, onClick }: PillProps) {
  const hex = STAGE_HEX[stage] || "#64748b"
  const fillPct = Math.min(count * 12, 90)

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center h-full min-h-[600px] w-[44px] min-w-[44px] rounded-2xl bg-surface-raised border border-border-subtle relative overflow-hidden py-3 transition-all hover:border-border-default hover:shadow-sm cursor-pointer shrink-0"
    >
      {/* Thermometer fill from top */}
      <div
        className="absolute top-0 left-0 right-0 rounded-2xl transition-[height] duration-400"
        style={{
          height: count > 0 ? `${fillPct}%` : "0%",
          background: `color-mix(in srgb, ${hex} 18%, white)`,
          transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      />

      {/* Count badge */}
      <div
        className="w-[30px] h-[30px] rounded-full flex items-center justify-center text-[15px] font-bold text-white mb-2.5 relative z-[1] shrink-0"
        style={{ background: hex }}
      >
        {count}
      </div>

      {/* Vertical label */}
      <span
        className="[writing-mode:vertical-rl] text-[11px] font-bold uppercase tracking-wider whitespace-nowrap relative z-[1]"
        style={{ color: hex }}
      >
        {STAGE_LABELS[stage] || stage}
      </span>
    </button>
  )
}

// ---------------------------------------------------------------------------
// Expanded column (droppable)
// ---------------------------------------------------------------------------

interface ExpandedColumnProps {
  stage: string
  cards: KanbanCardData[]
  searchQuery?: string
  onSearchChange?: (value: string) => void
  totalCount?: number
}

function ExpandedColumn({ stage, cards, searchQuery, onSearchChange, totalCount }: ExpandedColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: stage })
  const cardIds = useMemo(() => cards.map((c) => c.id), [cards])

  return (
    <div
      ref={setNodeRef}
      className={`flex-1 min-w-[320px] flex flex-col px-4 ${
        isOver ? "bg-accent/[0.03] rounded-2xl" : ""
      }`}
    >
      {/* Centered stage label */}
      <div className="text-center mb-5 pt-1">
        <span className="text-[13px] font-bold uppercase tracking-wider text-text-secondary">
          {(STAGE_LABELS[stage] || stage).toUpperCase()}
        </span>
      </div>

      {onSearchChange && (
        <div className="mb-4">
          <SearchBar
            value={searchQuery ?? ""}
            onChange={onSearchChange}
            placeholder="Filter by title, company, or skill..."
          />
          {searchQuery && (
            <p className="text-xs text-text-muted mt-2 text-center">
              {cards.length} of {pluralize(totalCount ?? 0, "job")}
            </p>
          )}
        </div>
      )}

      {/* Stacked card list */}
      <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
        {cards.length > 0 ? (
          <div className="flex flex-col gap-2">
            {cards.map((card) => (
              <PipelineCard key={card.id} card={card} />
            ))}
          </div>
        ) : searchQuery ? (
          <div className="flex flex-col items-center justify-center flex-1 text-center py-10">
            <p className="text-sm text-text-secondary">No jobs match your search.</p>
            <p className="text-xs text-text-muted mt-1">Try adjusting your search query.</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center flex-1 text-center py-10">
            <p className="font-[family-name:var(--font-display)] text-lg text-text-secondary mb-1">
              Nothing here yet
            </p>
            <p className="text-[13px] text-text-muted">
              Jobs will appear as they move through your pipeline.
            </p>
          </div>
        )}
      </SortableContext>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main board
// ---------------------------------------------------------------------------

export function PipelineBoard({ initialData }: PipelineBoardProps) {
  const dndId = useId()
  const [columns, setColumns] =
    useState<Record<string, KanbanCardData[]>>(initialData)
  const [activeCard, setActiveCard] = useState<KanbanCardData | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedStage, setExpandedStage] = useState<string>(() => {
    // Default to first stage with cards, or "discovered"
    for (const stage of PIPELINE_DISPLAY_STAGES) {
      if ((initialData[stage] || []).length > 0) return stage
    }
    return "discovered"
  })

  const discovered = columns["discovered"] || []
  const filteredDiscovered = useMemo(() => {
    if (!searchQuery) return discovered
    const q = searchQuery.toLowerCase()
    return discovered.filter((card) =>
      card.title.toLowerCase().includes(q) ||
      (card.company || "").toLowerCase().includes(q) ||
      (card.tags || []).some((t) => t.toLowerCase().includes(q))
    )
  }, [discovered, searchQuery])

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

  // ---- Drag handlers ----

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
      id={dndId}
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-1.5 items-stretch min-h-[600px]">
        {PIPELINE_DISPLAY_STAGES.map((stage) =>
          stage === expandedStage ? (
            <ExpandedColumn
              key={stage}
              stage={stage}
              cards={stage === "discovered" ? filteredDiscovered : (columns[stage] || [])}
              searchQuery={stage === "discovered" ? searchQuery : undefined}
              onSearchChange={stage === "discovered" ? setSearchQuery : undefined}
              totalCount={stage === "discovered" ? discovered.length : undefined}
            />
          ) : (
            <StagePill
              key={stage}
              stage={stage}
              count={(columns[stage] || []).length}
              onClick={() => setExpandedStage(stage)}
            />
          )
        )}
      </div>

      <DragOverlay>
        {activeCard ? <PipelineCard card={activeCard} /> : null}
      </DragOverlay>
    </DndContext>
  )
}
