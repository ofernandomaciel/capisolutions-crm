'use client'

import { useState }    from 'react'
import { useRouter }   from 'next/navigation'
import { useForm }     from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z }           from 'zod'
import { toast }       from 'sonner'
import { Loader2, Plus, Trash2 } from 'lucide-react'

import { Button }   from '@/components/ui/button'
import { Input }    from '@/components/ui/input'
import { Label }    from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

import { createSale, updateSale } from '@/app/actions/sales'
import type { Sale, SaleItem, Product, SaleFormData } from '@/types'
import { SALE_STATUS_LABELS, type SaleStatus } from '@/types'

const itemSchema = z.object({
  name:       z.string().min(1),
  quantity:   z.number().min(0.001),
  unit_price: z.number().min(0),
  discount:   z.number().min(0).default(0),
  total:      z.number(),
  product_id: z.string().optional().nullable(),
})

const schema = z.object({
  title:           z.string().min(2, 'Titulo obrigatorio'),
  status:          z.enum(['pending','completed','cancelled','refunded'] as const),
  discount:        z.number().min(0).default(0),
  commission_rate: z.number().min(0).max(100).default(0),
  notes:           z.string().optional(),
  sold_at:         z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface SaleFormProps {
  mode:      'create' | 'edit'
  sale?:     Sale
  products:  Product[]
}

export function SaleForm({ mode, sale, products }: SaleFormProps) {
  const router  = useRouter()
  const [loading, setLoading] = useState(false)

  const defaultItems: SaleItem[] = sale?.items ?? [{ name: '', quantity: 1, unit_price: 0, discount: 0, total: 0 }]
  const [items, setItems] = useState<SaleItem[]>(defaultItems)

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title:           sale?.title           ?? '',
      status:          sale?.status          ?? 'pending',
      discount:        sale?.discount        ?? 0,
      commission_rate: sale?.commission_rate ?? 0,
      notes:           sale?.notes           ?? '',
      sold_at:         sale?.sold_at         ? sale.sold_at.slice(0, 10) : '',
    },
  })

  const discount        = watch('discount')        ?? 0
  const commissionRate  = watch('commission_rate') ?? 0
  const subTotal        = items.reduce((a, i) => a + i.total, 0)
  const finalValue      = subTotal - discount
  const commissionValue = finalValue * (commissionRate / 100)

  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

  // ─── Item helpers ─────────────────────────────────────────────────────────

  const updateItem = (idx: number, field: keyof SaleItem, value: string | number | null) => {
    setItems((prev) => {
      const next = [...prev]
      const item = { ...next[idx], [field]: value }
      item.total = (item.quantity ?? 0) * (item.unit_price ?? 0) - (item.discount ?? 0)
      next[idx]  = item
      return next
    })
  }

  const addItem = () =>
    setItems((prev) => [...prev, { name: '', quantity: 1, unit_price: 0, discount: 0, total: 0 }])

  const removeItem = (idx: number) =>
    setItems((prev) => prev.filter((_, i) => i !== idx))

  const selectProduct = (idx: number, productId: string) => {
    const product = products.find((p) => p.id === productId)
    if (!product) return
    setItems((prev) => {
      const next  = [...prev]
      const qty   = next[idx].quantity ?? 1
      next[idx]   = { ...next[idx], product_id: productId, name: product.name, unit_price: product.price, total: qty * product.price }
      return next
    })
  }

  // ─── Submit ───────────────────────────────────────────────────────────────

  const onSubmit = async (values: FormValues) => {
    if (items.length === 0) { toast.error('Adicione pelo menos um item'); return }
    if (items.some((i) => !i.name)) { toast.error('Todos os itens precisam de nome'); return }

    setLoading(true)
    const payload: SaleFormData = {
      ...values,
      status: values.status as SaleStatus,
      items:  items.map(({ id: _id, sale_id: _sid, product, ...rest }) => rest),
    }

    const result = mode === 'create'
      ? await createSale(payload)
      : await updateSale(sale!.id, payload)

    setLoading(false)
    if (!result.success) { toast.error(result.error ?? 'Erro ao salvar'); return }
    toast.success(mode === 'create' ? 'Venda criada!' : 'Venda atualizada!')
    const created = result as { success: boolean; data?: { id: string }; error?: string }
    if (mode === 'create' && created.data?.id) {
      router.push(`/vendas/${created.data.id}`)
    } else {
      router.push(`/vendas/${sale!.id}`)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Titulo + Status */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2 space-y-1.5">
          <Label htmlFor="title">Titulo da Venda *</Label>
          <Input id="title" {...register('title')} placeholder="Ex: Contrato anual - Empresa X" />
          {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select value={watch('status')} onValueChange={(v) => setValue('status', v as SaleStatus)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {(Object.keys(SALE_STATUS_LABELS) as SaleStatus[]).map((s) => (
                <SelectItem key={s} value={s}>{SALE_STATUS_LABELS[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Items */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Itens da Venda</Label>
          <Button type="button" variant="outline" size="sm" onClick={addItem}>
            <Plus className="h-3.5 w-3.5 mr-1" />Adicionar item
          </Button>
        </div>

        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-2 font-medium">Produto/Servico</th>
                <th className="text-right p-2 font-medium w-20">Qtd</th>
                <th className="text-right p-2 font-medium w-28">Preco unit.</th>
                <th className="text-right p-2 font-medium w-24">Desconto</th>
                <th className="text-right p-2 font-medium w-28">Total</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx} className="border-t border-border">
                  <td className="p-1.5 space-y-1">
                    {products.length > 0 && (
                      <Select
                        value={item.product_id ?? '__custom__'}
                        onValueChange={(v) => v !== '__custom__' ? selectProduct(idx, v) : null}
                      >
                        <SelectTrigger className="h-7 text-xs mb-1">
                          <SelectValue placeholder="Selecionar produto" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__custom__">-- Personalizado --</SelectItem>
                          {products.map((p) => (
                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <Input
                      value={item.name}
                      onChange={(e) => updateItem(idx, 'name', e.target.value)}
                      placeholder="Descricao do item"
                      className="h-7 text-xs"
                    />
                  </td>
                  <td className="p-1.5">
                    <Input
                      type="number"
                      min="0.001"
                      step="0.001"
                      value={item.quantity}
                      onChange={(e) => updateItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                      className="h-7 text-xs text-right w-full"
                    />
                  </td>
                  <td className="p-1.5">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unit_price}
                      onChange={(e) => updateItem(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                      className="h-7 text-xs text-right w-full"
                    />
                  </td>
                  <td className="p-1.5">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.discount}
                      onChange={(e) => updateItem(idx, 'discount', parseFloat(e.target.value) || 0)}
                      className="h-7 text-xs text-right w-full"
                    />
                  </td>
                  <td className="p-1.5 text-right text-sm font-medium">{fmt(item.total)}</td>
                  <td className="p-1.5">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-destructive/60 hover:text-destructive"
                      onClick={() => removeItem(idx)}
                      disabled={items.length === 1}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Totals + extra fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="discount">Desconto geral (R$)</Label>
              <Input id="discount" type="number" min="0" step="0.01" {...register('discount', { valueAsNumber: true })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="commission_rate">Comissao (%)</Label>
              <Input id="commission_rate" type="number" min="0" max="100" step="0.1" {...register('commission_rate', { valueAsNumber: true })} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sold_at">Data da Venda</Label>
            <Input id="sold_at" type="date" {...register('sold_at')} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes">Observacoes</Label>
            <Textarea id="notes" rows={3} {...register('notes')} />
          </div>
        </div>

        {/* Summary box */}
        <div className="bg-muted/40 rounded-xl p-4 space-y-2 text-sm self-start">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{fmt(subTotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Desconto</span>
            <span className="text-destructive">- {fmt(discount)}</span>
          </div>
          <div className="flex justify-between font-bold text-base border-t border-border pt-2">
            <span>Total</span>
            <span className="text-emerald-600">{fmt(finalValue)}</span>
          </div>
          {commissionRate > 0 && (
            <div className="flex justify-between text-muted-foreground border-t border-border pt-2">
              <span>Comissao ({commissionRate}%)</span>
              <span>{fmt(commissionValue)}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2 border-t border-border">
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {mode === 'create' ? 'Criar Venda' : 'Salvar Alteracoes'}
        </Button>
      </div>
    </form>
  )
}
