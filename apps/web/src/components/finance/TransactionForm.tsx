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

import { createRevenue, createExpense, updateRevenue, updateExpense } from '@/app/actions/finance'
import type { Revenue, Expense, FinancialCategory, RevenueFormData, ExpenseFormData } from '@/types'
import {
  FINANCIAL_STATUS_LABELS, PAYMENT_METHODS,
  type FinancialStatus,
} from '@/types'

const schema = z.object({
  description:    z.string().min(2, 'Descricao obrigatoria'),
  value:          z.number().positive('Valor deve ser positivo'),
  due_date:       z.string().min(1, 'Data obrigatoria'),
  status:         z.enum(['pending','paid','overdue','cancelled'] as const),
  category_id:    z.string().optional(),
  payment_method: z.string().optional(),
  paid_date:      z.string().optional(),
  notes:          z.string().optional(),
  recurrence:     z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface TransactionFormProps {
  type:        'revenue' | 'expense'
  item?:       Revenue | Expense
  categories:  FinancialCategory[]
  onSuccess?:  () => void
}

export function TransactionForm({ type, item, categories, onSuccess }: TransactionFormProps) {
  const router  = useRouter()
  const [loading, setLoading] = useState(false)
  const isRevenue = type === 'revenue'

  const rev = isRevenue ? (item as Revenue | undefined) : undefined
  const exp = isRevenue ? undefined : (item as Expense | undefined)

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      description:    item?.description    ?? '',
      value:          item?.value          ?? 0,
      due_date:       item?.due_date       ?? '',
      status:         item?.status         ?? 'pending',
      category_id:    item?.category_id    ?? '',
      payment_method: item?.payment_method ?? '',
      paid_date:      item?.paid_date      ?? '',
      notes:          item?.notes          ?? '',
      recurrence:     exp?.recurrence      ?? 'none',
    },
  })

  const onSubmit = async (values: FormValues) => {
    setLoading(true)
    let result: { success: boolean; error?: string }

    if (isRevenue) {
      const payload: RevenueFormData = {
        description:    values.description,
        value:          values.value,
        due_date:       values.due_date,
        status:         values.status as FinancialStatus,
        category_id:    values.category_id  || undefined,
        payment_method: values.payment_method || undefined,
        paid_date:      values.paid_date    || undefined,
        notes:          values.notes        || undefined,
      }
      result = item
        ? await updateRevenue(item.id, payload)
        : await createRevenue(payload)
    } else {
      const payload: ExpenseFormData = {
        description:    values.description,
        value:          values.value,
        due_date:       values.due_date,
        status:         values.status as FinancialStatus,
        category_id:    values.category_id   || undefined,
        payment_method: values.payment_method || undefined,
        paid_date:      values.paid_date      || undefined,
        notes:          values.notes          || undefined,
        recurrence:     (values.recurrence as any) || 'none',
      }
      result = item
        ? await updateExpense(item.id, payload)
        : await createExpense(payload)
    }

    setLoading(false)
    if (!result.success) { toast.error(result.error ?? 'Erro ao salvar'); return }
    toast.success(item ? 'Lancamento atualizado!' : `${isRevenue ? 'Receita' : 'Despesa'} criada!`)
    if (onSuccess) onSuccess()
    else router.push('/financeiro')
  }

  const filteredCategories = categories.filter((c) => isRevenue ? c.type === 'income' : c.type === 'expense')

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="description">Descricao *</Label>
        <Input id="description" {...register('description')} placeholder="Ex: Pagamento cliente X" />
        {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="value">Valor (R$) *</Label>
          <Input id="value" type="number" min="0" step="0.01" {...register('value', { valueAsNumber: true })} />
          {errors.value && <p className="text-xs text-destructive">{errors.value.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select value={watch('status')} onValueChange={(v) => setValue('status', v as FinancialStatus)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {(Object.keys(FINANCIAL_STATUS_LABELS) as FinancialStatus[]).map((s) => (
                <SelectItem key={s} value={s}>{FINANCIAL_STATUS_LABELS[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="due_date">Vencimento *</Label>
          <Input id="due_date" type="date" {...register('due_date')} />
          {errors.due_date && <p className="text-xs text-destructive">{errors.due_date.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="paid_date">Data de pagamento</Label>
          <Input id="paid_date" type="date" {...register('paid_date')} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Categoria</Label>
          <Select value={watch('category_id') ?? ''} onValueChange={(v) => setValue('category_id', v === '__none__' ? '' : v)}>
            <SelectTrigger><SelectValue placeholder="Sem categoria" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">Sem categoria</SelectItem>
              {filteredCategories.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Forma de pagamento</Label>
          <Select value={watch('payment_method') ?? ''} onValueChange={(v) => setValue('payment_method', v === '__none__' ? '' : v)}>
            <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">Nao informado</SelectItem>
              {PAYMENT_METHODS.map((m) => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!isRevenue && (
        <div className="space-y-1.5">
          <Label>Recorrencia</Label>
          <Select value={watch('recurrence') ?? 'none'} onValueChange={(v) => setValue('recurrence', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {[['none','Sem recorrencia'],['daily','Diaria'],['weekly','Semanal'],['monthly','Mensal'],['yearly','Anual']].map(([v,l]) => (
                <SelectItem key={v} value={v}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="notes">Observacoes</Label>
        <Textarea id="notes" rows={2} {...register('notes')} />
      </div>

      <div className="flex justify-end gap-3 pt-2 border-t border-border">
        <Button type="button" variant="outline" onClick={() => onSuccess ? onSuccess() : router.back()}>Cancelar</Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {item ? 'Salvar' : (isRevenue ? 'Criar Receita' : 'Criar Despesa')}
        </Button>
      </div>
    </form>
  )
}
