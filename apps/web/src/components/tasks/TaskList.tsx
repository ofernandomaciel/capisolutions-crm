'use client'

import { useState, useTransition } from 'react'
import Link                        from 'next/link'
import { toast }                   from 'sonner'
import {
  CheckCircle2, Circle, Clock, Calendar, ChevronRight,
  Trash2, Phone, Mail, Bell, CalendarDays, CheckSquare,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge }  from '@/components/ui/badge'
import { completeTask, deleteTask } from '@/app/actions/tasks'
import type { Task, TaskType, TaskStatus, LeadPriority } from '@/types'
import { TASK_TYPE_LABELS, TASK_STATUS_LABELS, LEAD_PRIORITY_LABELS } from '@/types'

const TYPE_ICONS: Record<TaskType, typeof Circle> = {
  task:        CheckSquare,
  appointment: CalendarDays,
  reminder:    Bell,
  call:        Phone,
  email:       Mail,
}

const PRIORITY_COLORS: Record<LeadPriority, string> = {
  low:    'text-muted-foreground',
  medium: 'text-blue-500',
  high:   'text-orange-500',
  urgent: 'text-red-500',
}

const STATUS_BADGE: Record<TaskStatus, string> = {
  pending:     'bg-yellow-100 text-yellow-700 border-yellow-200',
  in_progress: 'bg-blue-100 text-blue-700 border-blue-200',
  completed:   'bg-green-100 text-green-700 border-green-200',
  cancelled:   'bg-gray-100 text-gray-600 border-gray-200',
}

interface TaskListProps {
  tasks: Task[]
}

export function TaskList({ tasks }: TaskListProps) {
  const [completing, setCompleting] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const handleComplete = async (id: string) => {
    setCompleting(id)
    const result = await completeTask(id)
    setCompleting(null)
    if (!result.success) toast.error(result.error)
    else toast.success('Tarefa concluida!')
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir esta tarefa?')) return
    const result = await deleteTask(id)
    if (!result.success) toast.error(result.error)
    else toast.success('Tarefa excluida!')
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <CheckCircle2 className="mx-auto h-10 w-10 mb-3 opacity-30" />
        <p>Nenhuma tarefa encontrada</p>
      </div>
    )
  }

  return (
    <div className="space-y-1.5">
      {tasks.map((task) => {
        const Icon     = TYPE_ICONS[task.type] ?? Circle
        const isDone   = task.status === 'completed'
        const isOverdue = task.due_date && new Date(task.due_date) < new Date() && !isDone

        return (
          <div
            key={task.id}
            className={`flex items-center gap-3 p-3 rounded-lg border transition-colors hover:bg-muted/40
              ${isDone ? 'opacity-60 bg-muted/20' : 'bg-card border-border'}`}
          >
            {/* Complete button */}
            <button
              onClick={() => !isDone && handleComplete(task.id)}
              disabled={isDone || completing === task.id}
              className="shrink-0 text-muted-foreground hover:text-primary transition-colors disabled:cursor-default"
            >
              {isDone
                ? <CheckCircle2 className="h-5 w-5 text-green-500" />
                : <Circle className="h-5 w-5" />}
            </button>

            {/* Icon */}
            <Icon className={`h-4 w-4 shrink-0 ${PRIORITY_COLORS[task.priority as LeadPriority]}`} />

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium truncate ${isDone ? 'line-through' : ''}`}>
                {task.title}
              </p>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                <span>{TASK_TYPE_LABELS[task.type]}</span>
                {task.due_date && (
                  <span className={`flex items-center gap-0.5 ${isOverdue ? 'text-destructive font-medium' : ''}`}>
                    <Clock className="h-3 w-3" />
                    {new Date(task.due_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
                {task.customer && <span>• {task.customer.name}</span>}
                {task.lead     && <span>• {task.lead.title}</span>}
              </div>
            </div>

            {/* Status badge */}
            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border shrink-0 ${STATUS_BADGE[task.status]}`}>
              {TASK_STATUS_LABELS[task.status]}
            </span>

            {/* Actions */}
            <div className="flex items-center gap-1 shrink-0">
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-destructive/60 hover:text-destructive"
                onClick={() => handleDelete(task.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
              <Link href={`/tarefas/${task.id}`}>
                <Button size="icon" variant="ghost" className="h-7 w-7">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        )
      })}
    </div>
  )
}
