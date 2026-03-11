"use client"

import { useState, useCallback } from "react"
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core"
import { arrayMove } from "@dnd-kit/sortable"
import { KanbanColumn } from "./column"
import { KanbanCard, type KanbanCardData } from "./card"
import { PIPELINE_STAGES } from "@/lib/types"
import { moveJobToStage } from "@/app/actions"

interface KanbanBoardProps {
  initialData: Record<string, KanbanCardData[]>
}

export function KanbanBoard({ initialData }: KanbanBoardProps) {
  const [columns, setColumns] = useState<Record<string, KanbanCardData[]>>(initialData)
  const [activeCard, setActiveCard] = useState<KanbanCardData | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  )

  const findColumn = useCallback(
    (id: string): string | undefined => {
      // Check if id is a column/stage name
      if (id in columns) return id
      // Otherwise find which column contains this card
      for (const [stage, cards] of Object.entries(columns)) {
        if (cards.some((c) => c.id === id)) return stage
      }
      return undefined
    },
    [columns]
  )

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

      // Find insertion point
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
      moveJobToStage(active.id as string, overStage)
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
      <div className="flex gap-4 overflow-x-auto pb-4 px-1">
        {PIPELINE_STAGES.map((stage) => (
          <KanbanColumn
            key={stage}
            stage={stage}
            cards={columns[stage] || []}
          />
        ))}
      </div>

      <DragOverlay>
        {activeCard ? <KanbanCard card={activeCard} /> : null}
      </DragOverlay>
    </DndContext>
  )
}
