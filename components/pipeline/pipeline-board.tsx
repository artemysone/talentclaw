"use client"

import { useState, useCallback, useMemo, useId } from "react"
import {
  DndContext,
  DragOverlay,
  pointerWithin,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragStartEvent,
  type DragEndEvent,
  type CollisionDetection,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import Link from "next/link"
import { Plus, ChevronDown, ChevronUp } from "lucide-react"
import { PipelineCard } from "./pipeline-card"
import type { KanbanCardData } from "@/components/kanban/card"
import { SearchBar } from "@/components/query/search-bar"
import { PIPELINE_DISPLAY_STAGES } from "@/lib/types"
import type { PipelineStage } from "@/lib/types"
import { STAGE_LABELS, STAGE_HEX, pluralize } from "@/lib/ui-utils"
import { moveJobToStage } from "@/app/actions"

// ---------------------------------------------------------------------------
// Collision detection: use pointer position (not dragged rect corners) so
// wide cards can reach narrow pill columns. Falls back to closestCenter
// when the pointer is in a gap between droppables.
// ---------------------------------------------------------------------------

const pointerThenCenter: CollisionDetection = (args) => {
  const pointerHits = pointerWithin(args)
  if (pointerHits.length > 0) return pointerHits
  return closestCenter(args)
}

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
  const { setNodeRef, isOver } = useDroppable({ id: stage })
  const hex = STAGE_HEX[stage] || "#64748b"
  const fillPct = Math.min(count * 12, 90)

  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center h-full min-h-[600px] w-[44px] min-w-[44px] rounded-2xl bg-surface-raised border-2 relative overflow-hidden py-3 transition-all hover:border-border-default hover:shadow-sm cursor-pointer shrink-0 ${
        isOver ? "shadow-lg scale-105" : "border-border-subtle"
      }`}
      style={isOver ? { borderColor: hex, background: `color-mix(in srgb, ${hex} 8%, white)` } : undefined}
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
  stage: PipelineStage
  cards: KanbanCardData[]
  searchQuery?: string
  onSearchChange?: (value: string) => void
  totalCount?: number
  onCardDeleted?: (cardId: string) => void
}

const VISIBLE_LIMIT = 6

function ExpandedColumn({ stage, cards, searchQuery, onSearchChange, totalCount, onCardDeleted }: ExpandedColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: stage })
  const cardIds = useMemo(() => cards.map((c) => c.id), [cards])
  const hex = STAGE_HEX[stage] || "#64748b"
  const [expanded, setExpanded] = useState(false)
  const visibleCards = expanded ? cards : cards.slice(0, VISIBLE_LIMIT)
  const hasMore = cards.length > VISIBLE_LIMIT

  return (
    <div
      ref={setNodeRef}
      className={`min-w-0 w-[540px] shrink-0 flex flex-col px-4 rounded-2xl transition-colors ${
        isOver ? "border-2" : "border-2 border-transparent"
      }`}
      style={isOver ? { borderColor: hex, background: `color-mix(in srgb, ${hex} 5%, transparent)` } : undefined}
    >
      {/* Centered stage label */}
      <div className="flex items-center justify-center gap-2 mb-5 pt-1">
        <span className="text-[13px] font-bold uppercase tracking-wider text-text-secondary">
          {(STAGE_LABELS[stage] || stage).toUpperCase()}
        </span>
        {stage === "discovered" && (
          <Link
            href="/pipeline/new"
            className="w-6 h-6 rounded-lg bg-accent/10 text-accent hover:bg-accent hover:text-white flex items-center justify-center transition-colors"
            title="New Job"
          >
            <Plus className="w-3.5 h-3.5" />
          </Link>
        )}
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
            {visibleCards.map((card) => (
              <PipelineCard key={card.id} card={card} stage={stage} onDeleted={onCardDeleted} />
            ))}
            {hasMore && (
              <button
                type="button"
                onClick={() => setExpanded((prev) => !prev)}
                className="flex items-center justify-center gap-1.5 py-2 text-xs text-text-muted hover:text-text-secondary transition-colors cursor-pointer"
              >
                {expanded ? (
                  <>Show less <ChevronUp className="w-3.5 h-3.5" /></>
                ) : (
                  <>{cards.length - VISIBLE_LIMIT} more <ChevronDown className="w-3.5 h-3.5" /></>
                )}
              </button>
            )}
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
  const [dragOriginStage, setDragOriginStage] = useState<string | null>(null)
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

  const removeCard = useCallback((cardId: string) => {
    setColumns((prev) => {
      const next = { ...prev }
      for (const stage of Object.keys(next)) {
        next[stage] = next[stage].filter((c) => c.id !== cardId)
      }
      return next
    })
  }, [])

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const stage = findColumn(active.id as string)
    if (!stage) return
    setDragOriginStage(stage)
    const card = columns[stage]?.find((c) => c.id === active.id)
    if (card) setActiveCard(card)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    const originStage = dragOriginStage
    setActiveCard(null)
    setDragOriginStage(null)

    if (!over || !originStage) return

    const overStage = findColumn(over.id as string)
    if (!overStage) return

    if (originStage === overStage) {
      // Reorder within the same column
      setColumns((prev) => {
        const cards = [...(prev[originStage] || [])]
        const oldIndex = cards.findIndex((c) => c.id === active.id)
        const newIndex = cards.findIndex((c) => c.id === over.id)
        if (oldIndex === -1 || newIndex === -1) return prev
        return { ...prev, [originStage]: arrayMove(cards, oldIndex, newIndex) }
      })
    } else {
      // Move card to new column
      setColumns((prev) => {
        const sourceCards = (prev[originStage] || []).filter((c) => c.id !== active.id)
        const card = (prev[originStage] || []).find((c) => c.id === active.id)
        if (!card) return prev
        return {
          ...prev,
          [originStage]: sourceCards,
          [overStage]: [...(prev[overStage] || []), card],
        }
      })
      moveJobToStage(active.id as string, overStage).catch((err) =>
        console.error("Failed to persist stage change:", err)
      )
    }
  }

  return (
    <DndContext
      id={dndId}
      sensors={sensors}
      collisionDetection={pointerThenCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-7 items-stretch min-h-[600px]">
        {PIPELINE_DISPLAY_STAGES.map((stage) =>
          stage === expandedStage ? (
            <ExpandedColumn
              key={stage}
              stage={stage}
              cards={stage === "discovered" ? filteredDiscovered : (columns[stage] || [])}
              searchQuery={stage === "discovered" ? searchQuery : undefined}
              onSearchChange={stage === "discovered" ? setSearchQuery : undefined}
              totalCount={stage === "discovered" ? discovered.length : undefined}
              onCardDeleted={removeCard}
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
