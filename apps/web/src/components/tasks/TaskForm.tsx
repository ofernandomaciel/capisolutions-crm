'use client'

import { useState }    from 'react'
import { useRouter }   from 'next/navigation'
import { useForm }     from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z }           from 'zod'
import { toast }       from 'sonner'
import { Loader2 }     from 'lucide-react'

import { Button }   from '@/components/ui/button'
import { Input }    from '@/components/ui/input'
import { Label }    from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

import { createTask, updateTask } from '@/app/actions/tasks'
import type { Task, TaskFormData } from '@/types'
import {
  TASK_STATUS_LABELS, TASK_TYPE_LABELS, LEAD_PRIORITY_LABELS,
  type TaskStatus, type TaskType, type LeadPriority,
} from '@/types'

const schema = z.object({
  title:       z.string().min(2, 'Titulo obrigatorio'),
  type:        z.enum(['task','appointment','reminder','call','email'] as const),
  priority:    z.enum(['low','medium','high','urgent'] as const),
  status:      z.enum(['pending','in_progress','completed','cancelled'] as const),
  description: z.string().optional(),
  due_date:    z.string().optional(),
  customer_id: z.string().optional(),
  lead_id:     z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface TaskFormProps {
  mode:         'create' | 'edit'
  task?:        Task
  defaultLeadId?: string
  defaultCustomerId?: string
}

export function TaskForm({ mode, task, defaultLeadId, defaultCustomerId }: TaskFormProps) {
  const router  = useRouter()
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title:       task?.title       ?? '',
      type:        task?.type        ?? 'task',
      priority:    task?.priority    ?? 'medium',
      status:      task?.status      ?? 'pending',
      description: task?.description ?? '',
      due_date:    task?.due_date    ? task.due_date.slice(0, 16) : '',
      customer_id: task?.customer_id ?? defaultCustomerId ?? '',
      lead_id:     task?.lead_id     ?? defaultLeadId     ?? '',
    },
  })

  const onSubmit = async (values: FormValues) => {
    setLoading(true)
    const payload: TaskFormData = {
      title:       values.title,
      type:        values.type        as TaskType,
      priority:    values.priority    as LeadPriority,
      status:      values.status      as TaskStatus,
      description: values.description || undefined,
      due_date:    values.due_date    || undefined,
      customer_id: values.customer_id || undefined,
      lead_id:     values.lead_id     || undefined,
    }

    const result = mode === 'create'
      ? await createTask(payload)
      : await updateTask(task!.id, payload)

    setLoading(false)
    if (!result.success) { toast.error(result.error ?? 'Erro ao salvar'); return }
    toast.success(mode === 'create' ? 'Tarefa criada!' : 'Tarefa atualizada!')
    router.push('/tarefas')
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="title">Titulo *</Label>
        <Input id="title" {...register('title')} placeholder="Ex: Ligar para cliente" />
        {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label>Tipo</Label>
          <Select value={watch('type')} onValueChange={(v) => setValue('type', v as TaskType)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {(Object.keys(TASK_TYPE_LABELS) as TaskType[]).map((t) => (
                <SelectItem key={t} value={t}>{TASK_TYPE_LABELS[t]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Prioridade</Label>
          <Select value={watch('priority')} onValueChange={(v) => setValue('priority', v as LeadPriority)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {(Object.keys(LEAD_PRIORITY_LABELS) as LeadPriority[]).map((p) => (
                <SelectItem key={p} value={p}>{LEAD_PRIORITY_LABELS[p]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select value={watch('status')} onValueChange={(v) => setValue('status', v as TaskStatus)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {(Object.keys(TASK_STATUS_LABELS) as TaskStatus[]).map((s) => (
                <SelectItem key={s} value={s}>{TASK_STATUS_LABELS[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="due_date">Prazo</Label>
        <Input id="due_date" type="datetime-local" {...register('due_date')} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Descricao</Label>
        <Textarea id="description" rows={3} {...register('description')} placeholder="Detalhes da tarefa..." />
      </div>

      <div className="flex justify-end gap-3 pt-2 border-t border-border">
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {mode === 'create' ? 'Criar Tarefa' : 'Salvar'}
        </Button>
      </div>
    </form>
  )
}
