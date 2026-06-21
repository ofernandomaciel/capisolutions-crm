'use client'

import { useDroppable }   from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Plus }           from 'lucide-react'

import { KanbanCard }     from './KanbanCard'
import { Button }         from '@/components/ui/button'
import { Badge }          from '@/components/ui/badge'
import type { Lead, LeadStage } from '@/types'

interface KanbanColumnProps {
  stage:       LeadStage
  leads:       Lead[]
  onAddLead?:  (stageId: string) => void
}

export function KanbanColumn({ stage, leads, onAddLead }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id })

  const totalValue = leads.reduce((acc, l) => acc + (l.value ?? 0), 0)
  const formatted  = totalValue > 0
    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(totalValue)
    : null

  return (
    <div className="flex flex-col w-72 shrink-0">
      {/* Column header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <span
            className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: stage.color }}
          />
          <span className="text-sm font-semibold text-foreground">{stage.name}</span>
          <Badge variant="secondary" className="text-xs h-5 px-1.5">{leads.length}</Badge>
        </div>
        <div className="flex items-center gap-1">
          {formatted && (
            <span className="text-xs text-muted-foreground">{formatted}</span>
          )}
          {onAddLead && (
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
              onClick={() => onAddLead(stage.id)}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Cards area */}
      <div
        ref={setNodeRef}
        className={`
          flex-1 rounded-lg min-h-[120px] space-y-2 p-2
          transition-colors
          ${isOver ? 'bg-primary/5 border-2 border-dashed border-primary/30' : 'bg-muted/40 border border-transparent'}
        `}
      >
        <SortableContext items={leads.map((l) => l.id)} strategy={verticalListSortingStrategy}>
          {leads.map((lead) => (
            <KanbanCard key={lead.id} lead={lead} />
          ))}
        </SortableContext>

        {leads.length === 0 && (
          <div className="flex items-center justify-center h-16 text-xs text-muted-foreground">
            Arraste leads aqui
          </div>
        )}
      </div>
    </div>
  )
}
