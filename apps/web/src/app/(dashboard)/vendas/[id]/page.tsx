import { notFound }   from 'next/navigation'
import Link           from 'next/link'
import { ChevronLeft, Pencil, DollarSign, Calendar, User, Package } from 'lucide-react'
import { Button }     from '@/components/ui/button'
import { Badge }      from '@/components/ui/badge'
import { getSaleById } from '@/app/actions/sales'
import { SALE_STATUS_LABELS } from '@/types'
import type { SaleStatus } from '@/types'

interface PageProps { params: Promise<{ id: string }> }

function fmt(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

const STATUS_COLORS: Record<SaleStatus, string> = {
  pending:   'bg-yellow-100 text-yellow-700 border-yellow-200',
  completed: 'bg-green-100 text-green-700 border-green-200',
  cancelled: 'bg-gray-100 text-gray-600 border-gray-200',
  refunded:  'bg-red-100 text-red-700 border-red-200',
}

export default async function VendaDetailPage({ params }: PageProps) {
  const { id } = await params
  const sale   = await getSaleById(id)
  if (!sale) notFound()

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/vendas" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" />Voltar
        </Link>
        <Button asChild size="sm" variant="outline">
          <Link href={`/vendas/${id}/editar`}><Pencil className="mr-1.5 h-3.5 w-3.5" />Editar</Link>
        </Button>
      </div>

      {/* Header */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{sale.title}</h1>
            {sale.customer && <p className="text-muted-foreground mt-1">{sale.customer.name}</p>}
          </div>
          <span className={`text-sm font-medium px-3 py-1 rounded-full border ${STATUS_COLORS[sale.status]}`}>
            {SALE_STATUS_LABELS[sale.status]}
          </span>
        </div>
      </div>

      {/* Financials */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Subtotal</p>
          <p className="text-lg font-bold">{fmt(sale.total_value)}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Desconto</p>
          <p className="text-lg font-bold text-destructive">- {fmt(sale.discount)}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Total final</p>
          <p className="text-lg font-bold text-emerald-600">{fmt(sale.final_value)}</p>
        </div>
        {sale.commission_rate > 0 && (
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground mb-1">Comissao ({sale.commission_rate}%)</p>
            <p className="text-lg font-bold">{fmt(sale.commission_value)}</p>
          </div>
        )}
      </div>

      {/* Items */}
      {sale.items && sale.items.length > 0 && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 p-4 border-b border-border">
            <Package className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-semibold">Itens</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="text-left p-3 font-medium">Item</th>
                <th className="text-right p-3 font-medium">Qtd</th>
                <th className="text-right p-3 font-medium">Preco unit.</th>
                <th className="text-right p-3 font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {sale.items.map((item, i) => (
                <tr key={item.id ?? i} className="border-t border-border">
                  <td className="p-3">{item.name}</td>
                  <td className="p-3 text-right text-muted-foreground">{item.quantity}</td>
                  <td className="p-3 text-right text-muted-foreground">{fmt(item.unit_price)}</td>
                  <td className="p-3 text-right font-medium">{fmt(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Notes */}
      {sale.notes && (
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-sm font-medium text-muted-foreground mb-2">Observacoes</p>
          <p className="text-sm whitespace-pre-wrap">{sale.notes}</p>
        </div>
      )}

      <div className="text-xs text-muted-foreground flex gap-4 pb-6">
        <span>Criado: {new Date(sale.created_at).toLocaleDateString('pt-BR')}</span>
        {sale.sold_at && <span>Vendido: {new Date(sale.sold_at).toLocaleDateString('pt-BR')}</span>}
      </div>
    </div>
  )
}
