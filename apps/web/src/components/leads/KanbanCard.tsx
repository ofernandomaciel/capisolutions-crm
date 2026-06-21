'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS }         from '@dnd-kit/utilities'
import Link            from 'next/link'
import {
  Calendar, User, Tag, DollarSign,
  ArrowUpCircle, AlertCircle, Circle, Zap,
} from 'lucide-react'

import { Badge }   from '@/components/ui/badge'
import type { Lead, LeadPriority } from '@/types'
import { LEAD_PRIORITY_LABELS } from '@/types'

// ─── Priority icon ────────────────────────────────────────────────────────────

const PriorityIcon = ({ priority }: { priority: LeadPriority }) => {
  const props = { className: 'h-3.5 w-3.5' }
  if (priority === 'urgent') return <Zap          {...props} className="h-3.5 w-3.5 text-red-500" />
  if (priority === 'high')   return <AlertCircle  {...props} className="h-3.5 w-3.5 text-orange-400" />
  if (priority === 'medium') return <ArrowUpCircle {...props} className="h-3.5 w-3.5 text-blue-400" />
  return                            <Circle        {...props} className="h-3.5 w-3.5 text-muted-foreground" />
}

// ─── Format currency ─────────────────────────────────────────────────────────

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

// ─── Component ───────────────────────────────────────────────────────────────

interface KanbanCardProps {
  lead:     Lead
  overlay?: boolean
}

export function KanbanCard({ lead, overlay = false }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead.id })

  const style = {
    transform:  CSS.Transform.toString(transform),
    transition,
    opacity:    isDragging ? 0.4 : 1,
  }

  const isOverdue =
    lead.expected_close_date &&
    new Date(lead.expected_close_date) < new Date() &&
    lead.status === 'open'

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        group relative bg-card border border-border rounded-lg p-3 cursor-grab active:cursor-grabbing
        hover:border-primary/40 hover:shadow-sm transition-all select-none
        ${overlay  ? 'shadow-lg rotate-1 scale-105' : ''}
        ${isDragging ? 'z-50' : ''}
      `}
    >
      {/* Title */}
      <Link
        href={`/leads/${lead.id}`}
        onClick={(e) => e.stopPropagation()}
        className="block text-sm font-medium text-foreground hover:text-primary leading-snug mb-2 line-clamp-2"
      >
        {lead.title}
      </Link>

      {/* Customer */}
      {lead.customer && (
        <p className="text-xs text-muted-foreground mb-2 truncate">
          {lead.customer.company_name ?? lead.customer.name}
        </p>
      )}

      {/* Value */}
      {lead.value != null && (
        <div className="flex items-center gap-1 text-xs font-medium text-emerald-600 mb-2">
          <DollarSign className="h-3 w-3" />
          {formatCurrency(lead.value)}
        </div>
      )}

      {/* Footer row */}
      <div className="flex items-center justify-between mt-2 gap-1">
        <div className="flex items-center gap-1.5">
          <PriorityIcon priority={lead.priority} />
          <span className="text-[11px] text-muted-foreground">
            {LEAD_PRIORITY_LABELS[lead.priority]}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Due date */}
          {lead.expected_close_date && (
            <span className={`flex items-center gap-0.5 text-[11px] ${isOverdue ? 'text-destructive' : 'text-muted-foreground'}`}>
              <Calendar className="h-3 w-3" />
              {new Date(lead.expected_close_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
            </span>
          )}

          {/* Assigned avatar */}
          {lead.assigned_user && (
            <span
              title={`${lead.assigned_user.first_name} ${lead.assigned_user.last_name ?? ''}`}
              className="flex items-center justify-center h-5 w-5 rounded-full bg-primary/15 text-primary text-[10px] font-semibold shrink-0"
            >
              {lead.assigned_user.first_name[0]}
            </span>
          )}
        </div>
      </div>

      {/* Tags */}
      {lead.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {lead.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
              {tag}
            </Badge>
          ))}
          {lead.tags.length > 3 && (
            <span className="text-[10px] text-muted-foreground">+{lead.tags.length - 3}</span>
          )}
        </div>
      )}
    </div>
  )
}
