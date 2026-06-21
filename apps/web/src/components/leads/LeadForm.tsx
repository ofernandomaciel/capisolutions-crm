'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm }   from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

import { Button }   from '@/components/ui/button'
import { Input }    from '@/components/ui/input'
import { Label }    from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { TagsInput } from '@/components/customers/TagsInput'
import { createLead, updateLead } from '@/app/actions/leads'

import type { Lead, LeadStage, LeadFormData } from '@/types'
import {
  LEAD_STATUS_LABELS,
  LEAD_PRIORITY_LABELS,
  CUSTOMER_SOURCE_LABELS,
  type LeadStatus,
  type LeadPriority,
  type LeadSource,
} from '@/types'

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  title:               z.string().min(2, 'Título obrigatório'),
  stage_id:            z.string().optional(),
  value:               z.preprocess(
    (v) => (v === '' || v === undefined ? undefined : Number(v)),
    z.number().positive().optional(),
  ),
  source:              z.string().optional(),
  priority:            z.enum(['low', 'medium', 'high', 'urgent'] as const),
  status:              z.enum(['open', 'won', 'lost', 'archived'] as const),
  expected_close_date: z.string().optional(),
  lost_reason:         z.string().optional(),
  notes:               z.string().optional(),
  tags:                z.array(z.string()).optional(),
})

type FormValues = z.infer<typeof schema>

// ─── Component ───────────────────────────────────────────────────────────────

interface LeadFormProps {
  mode:        'create' | 'edit'
  lead?:       Lead
  stages:      LeadStage[]
  defaultStageId?: string
}

export function LeadForm({ mode, lead, stages, defaultStageId }: LeadFormProps) {
  const router    = useRouter()
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title:               lead?.title               ?? '',
      stage_id:            lead?.stage_id            ?? defaultStageId ?? '',
      value:               lead?.value               ?? undefined,
      source:              lead?.source              ?? undefined,
      priority:            lead?.priority            ?? 'medium',
      status:              lead?.status              ?? 'open',
      expected_close_date: lead?.expected_close_date ?? '',
      lost_reason:         lead?.lost_reason         ?? '',
      notes:               lead?.notes               ?? '',
      tags:                lead?.tags                ?? [],
    },
  })

  const status = watch('status')
  const tags   = watch('tags') ?? []

  const onSubmit = async (values: FormValues) => {
    setLoading(true)
    const payload: LeadFormData = {
      ...values,
      source:   values.source   as LeadSource   | undefined,
      priority: values.priority as LeadPriority,
      status:   values.status   as LeadStatus,
      tags:     values.tags     ?? [],
    }

    const result = mode === 'create'
      ? await createLead(payload)
      : await updateLead(lead!.id, payload)

    setLoading(false)

    if (!result.success) {
      toast.error(result.error ?? 'Erro ao salvar lead')
      return
    }

    toast.success(mode === 'create' ? 'Lead criado!' : 'Lead atualizado!')
    if (mode === 'create' && result.data) {
      router.push(`/leads/${result.data.id}`)
    } else {
      router.push(`/leads/${lead!.id}`)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

      {/* Title */}
      <div className="space-y-1.5">
        <Label htmlFor="title">Título do Lead *</Label>
        <Input id="title" placeholder="Ex: Proposta de software para Empresa X" {...register('title')} />
        {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Stage */}
        <div className="space-y-1.5">
          <Label>Etapa do Funil</Label>
          <Select
            value={watch('stage_id') ?? ''}
            onValueChange={(v) => setValue('stage_id', v === '__none__' ? undefined : v)}
          >
            <SelectTrigger><SelectValue placeholder="Selecione a etapa" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">— Sem etapa —</SelectItem>
              {stages.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Value */}
        <div className="space-y-1.5">
          <Label htmlFor="value">Valor (R$)</Label>
          <Input
            id="value"
            type="number"
            step="0.01"
            min="0"
            placeholder="0,00"
            {...register('value')}
          />
          {errors.value && <p className="text-xs text-destructive">{errors.value.message}</p>}
        </div>

        {/* Priority */}
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

        {/* Status */}
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select value={watch('status')} onValueChange={(v) => setValue('status', v as LeadStatus)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {(Object.keys(LEAD_STATUS_LABELS) as LeadStatus[]).map((s) => (
                <SelectItem key={s} value={s}>{LEAD_STATUS_LABELS[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Source */}
        <div className="space-y-1.5">
          <Label>Origem</Label>
          <Select
            value={watch('source') ?? ''}
            onValueChange={(v) => setValue('source', v === '__none__' ? undefined : v as LeadSource)}
          >
            <SelectTrigger><SelectValue placeholder="Selecione a origem" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">— Não informado —</SelectItem>
              {(Object.keys(CUSTOMER_SOURCE_LABELS) as LeadSource[]).map((s) => (
                <SelectItem key={s} value={s}>{CUSTOMER_SOURCE_LABELS[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Expected close date */}
        <div className="space-y-1.5">
          <Label htmlFor="expected_close_date">Previsão de Fechamento</Label>
          <Input id="expected_close_date" type="date" {...register('expected_close_date')} />
        </div>
      </div>

      {/* Lost reason — only show if status is lost */}
      {status === 'lost' && (
        <div className="space-y-1.5">
          <Label htmlFor="lost_reason">Motivo da Perda</Label>
          <Input id="lost_reason" placeholder="Ex: Preço, prazo, concorrente..." {...register('lost_reason')} />
        </div>
      )}

      {/* Tags */}
      <div className="space-y-1.5">
        <Label>Tags</Label>
        <TagsInput
          value={tags}
          onChange={(v) => setValue('tags', v)}
          placeholder="Adicione tags e pressione Enter"
        />
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <Label htmlFor="notes">Observações</Label>
        <Textarea
          id="notes"
          rows={4}
          placeholder="Notas internas sobre este lead..."
          {...register('notes')}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {mode === 'create' ? 'Criar Lead' : 'Salvar Alterações'}
        </Button>
      </div>
    </form>
  )
}
