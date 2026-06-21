import { Suspense }  from 'react'
import Link          from 'next/link'
import { Plus, TrendingUp, CheckCircle2, Clock, DollarSign } from 'lucide-react'

import { Button }            from '@/components/ui/button'
import { getSales, getSalesSummary } from '@/app/actions/sales'
import { SALE_STATUS_LABELS, SALE_STATUS_COLORS } from '@/types'
import type { Sale, SaleStatus } from '@/types'

interface PageProps { searchParams: Promise<Record<string, string | undefined>> }

function fmt(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

const STATUS_PILL: Record<SaleStatus, string> = {
  pending:   'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-600',
  refunded:  'bg-red-100 text-red-700',
}

async function SalesContent({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  const [{ data: sales }, summary] = await Promise.all([
    getSales({ search: searchParams.search, status: searchParams.status }),
    getSalesSummary(),
  ])

  return (
    <>
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total',        value: summary.total,          sub: fmt(summary.totalValue),     icon: TrendingUp,   color: 'bg-blue-100 text-blue-600' },
          { label: 'Concluidas',   value: summary.completed,      sub: fmt(summary.completedValue), icon: CheckCircle2, color: 'bg-green-100 text-green-600' },
          { label: 'Pendentes',    value: summary.pending,        sub: '',                          icon: Clock,        color: 'bg-yellow-100 text-yellow-600' },
          { label: 'Receita',      value: fmt(summary.completedValue), sub: 'em vendas concluidas', icon: DollarSign,   color: 'bg-emerald-100 text-emerald-600', isText: true },
        ].map(({ label, value, sub, icon: Icon, color, isText }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <div className={`p-1.5 rounded-lg ${color}`}><Icon className="h-4 w-4" /></div>
              <span className="text-xs text-muted-foreground">{label}</span>
            </div>
            <p className="text-xl font-bold">{isText ? value : value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="text-left p-3 font-medium">Venda</th>
              <th className="text-left p-3 font-medium hidden sm:table-cell">Cliente</th>
              <th className="text-right p-3 font-medium">Valor</th>
              <th className="text-center p-3 font-medium hidden md:table-cell">Status</th>
              <th className="text-right p-3 font-medium hidden lg:table-cell">Data</th>
              <th className="w-12" />
            </tr>
          </thead>
          <tbody>
            {sales.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-12 text-muted-foreground">Nenhuma venda encontrada</td></tr>
            ) : sales.map((sale: Sale) => (
              <tr key={sale.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                <td className="p-3">
                  <Link href={`/vendas/${sale.id}`} className="font-medium hover:text-primary">{sale.title}</Link>
                </td>
                <td className="p-3 text-muted-foreground hidden sm:table-cell">
                  {sale.customer?.name ?? '—'}
                </td>
                <td className="p-3 text-right font-semibold text-emerald-600">{fmt(sale.final_value)}</td>
                <td className="p-3 text-center hidden md:table-cell">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_PILL[sale.status]}`}>
                    {SALE_STATUS_LABELS[sale.status]}
                  </span>
                </td>
                <td className="p-3 text-right text-muted-foreground text-xs hidden lg:table-cell">
                  {sale.sold_at ? new Date(sale.sold_at).toLocaleDateString('pt-BR') : '—'}
                </td>
                <td className="p-3 text-right">
                  <Link href={`/vendas/${sale.id}`}>
                    <Button size="sm" variant="ghost" className="text-xs">Ver</Button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

export default async function VendasPage({ searchParams }: PageProps) {
  const params = await searchParams
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Vendas</h1>
          <p className="text-sm text-muted-foreground">Historico e gestao de vendas</p>
        </div>
        <Button asChild>
          <Link href="/vendas/nova"><Plus className="mr-2 h-4 w-4" />Nova Venda</Link>
        </Button>
      </div>
      <Suspense fallback={<div className="animate-pulse h-64 bg-muted rounded-xl" />}>
        <SalesContent searchParams={params} />
      </Suspense>
    </div>
  )
}
