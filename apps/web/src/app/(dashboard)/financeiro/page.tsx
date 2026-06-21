import { Suspense } from 'react'
import { TrendingUp, TrendingDown, Scale, AlertTriangle, Plus } from 'lucide-react'

import { getRevenues, getExpenses, getFinancialSummary, getCategories } from '@/app/actions/finance'
import { FINANCIAL_STATUS_LABELS, type FinancialStatus } from '@/types'
import { AddTransactionButton } from '@/components/finance/AddTransactionButton'

function fmt(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

const STATUS_PILL: Record<FinancialStatus, string> = {
  pending:   'bg-yellow-100 text-yellow-700',
  paid:      'bg-green-100 text-green-700',
  overdue:   'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-600',
}

async function FinancialContent() {
  const [summary, { data: revenues }, { data: expenses }, categories] = await Promise.all([
    getFinancialSummary(),
    getRevenues({ pageSize: 10 }),
    getExpenses({ pageSize: 10 }),
    getCategories(),
  ])

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Receitas pagas',     value: summary.totalRevenues,   icon: TrendingUp,    color: 'bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400'  },
          { label: 'Despesas pagas',     value: summary.totalExpenses,   icon: TrendingDown,  color: 'bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400'          },
          { label: 'Saldo',              value: summary.balance,         icon: Scale,         color: summary.balance >= 0 ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400' : 'bg-red-100 text-red-600' },
          { label: 'A receber (vencido)',value: summary.overdueRevenues, icon: AlertTriangle, color: 'bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <div className={`p-1.5 rounded-lg ${color}`}><Icon className="h-4 w-4" /></div>
              <span className="text-xs text-muted-foreground">{label}</span>
            </div>
            <p className="text-xl font-bold">{fmt(value)}</p>
          </div>
        ))}
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Receitas */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />Receitas
            </h2>
            <AddTransactionButton type="revenue" categories={categories} />
          </div>
          <div className="divide-y divide-border">
            {revenues.length === 0 ? (
              <p className="text-center py-8 text-sm text-muted-foreground">Nenhuma receita</p>
            ) : revenues.map((r) => (
              <div key={r.id} className="flex items-center justify-between p-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{r.description}</p>
                  <p className="text-xs text-muted-foreground">{new Date(r.due_date).toLocaleDateString('pt-BR')}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_PILL[r.status]}`}>
                    {FINANCIAL_STATUS_LABELS[r.status]}
                  </span>
                  <span className="text-sm font-semibold text-green-600">{fmt(r.value)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Despesas */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="font-semibold flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-500" />Despesas
            </h2>
            <AddTransactionButton type="expense" categories={categories} />
          </div>
          <div className="divide-y divide-border">
            {expenses.length === 0 ? (
              <p className="text-center py-8 text-sm text-muted-foreground">Nenhuma despesa</p>
            ) : expenses.map((e) => (
              <div key={e.id} className="flex items-center justify-between p-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{e.description}</p>
                  <p className="text-xs text-muted-foreground">{new Date(e.due_date).toLocaleDateString('pt-BR')}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_PILL[e.status]}`}>
                    {FINANCIAL_STATUS_LABELS[e.status]}
                  </span>
                  <span className="text-sm font-semibold text-red-600">{fmt(e.value)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default async function FinanceiroPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Financeiro</h1>
        <p className="text-sm text-muted-foreground">Receitas, despesas e fluxo de caixa</p>
      </div>
      <Suspense fallback={<div className="animate-pulse h-64 bg-muted rounded-xl" />}>
        <FinancialContent />
      </Suspense>
    </div>
  )
}
