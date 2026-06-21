'use client'

import { useState, useCallback } from 'react'
import { useRouter }             from 'next/navigation'
import { toast }                 from 'sonner'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'

import { KanbanColumn } from './KanbanColumn'
import { KanbanCard }   from './KanbanCard'
import { moveLeadStage } from '@/app/actions/leads'
import type { Lead, LeadStage } from '@/types'

interface KanbanBoardProps {
  stages: LeadStage[]
  leads:  Lead[]
}

export function KanbanBoard({ stages, leads: initialLeads }: KanbanBoardProps) {
  const router = useRouter()

  // Local optimistic state
  const [leads, setLeads]           = useState<Lead[]>(initialLeads)
  const [activeId, setActiveId]     = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const activeLead = activeId ? leads.find((l) => l.id === activeId) ?? null : null

  // ─── Group leads by stage ─────────────────────────────────────────────────

  const leadsByStage = useCallback(
    (stageId: string) => leads.filter((l) => l.stage_id === stageId),
    [leads],
  )

  // ─── Drag handlers ────────────────────────────────────────────────────────

  const handleDragStart = ({ active }: DragStartEvent) => {
    setActiveId(String(active.id))
  }

  const handleDragEnd = async ({ active, over }: DragEndEvent) => {
    setActiveId(null)
    if (!over) return

    const leadId     = String(active.id)
    const overId     = String(over.id)

    // over.id can be a stage id (dropped on column) or another lead id (dropped on card)
    const targetStage =
      stages.find((s) => s.id === overId) ??
      stages.find((s) => s.id === leads.find((l) => l.id === overId)?.stage_id)

    if (!targetStage) return

    const lead = leads.find((l) => l.id === leadId)
    if (!lead || lead.stage_id === targetStage.id) return

    // Optimistic update
    setLeads((prev) =>
      prev.map((l) => l.id === leadId ? { ...l, stage_id: targetStage.id } : l),
    )

    const result = await moveLeadStage(leadId, targetStage.id)
    if (!result.success) {
      toast.error('Erro ao mover lead: ' + result.error)
      // Rollback
      setLeads((prev) =>
        prev.map((l) => l.id === leadId ? { ...l, stage_id: lead.stage_id } : l),
      )
    } else {
      router.refresh()
    }
  }

  // ─── Add lead to specific stage ──────────────────────────────────────────

  const handleAddLead = (stageId: string) => {
    router.push(`/leads/novo?stage_id=${stageId}`)
  }

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 min-h-[calc(100vh-240px)]">
        {stages.map((stage) => (
          <KanbanColumn
            key={stage.id}
            stage={stage}
            leads={leadsByStage(stage.id)}
            onAddLead={handleAddLead}
          />
        ))}

        {stages.length === 0 && (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
            Nenhum estágio configurado. Configure os estágios em Configurações.
          </div>
        )}
      </div>

      <DragOverlay>
        {activeLead && <KanbanCard lead={activeLead} overlay />}
      </DragOverlay>
    </DndContext>
  )
}
