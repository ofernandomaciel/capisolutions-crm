import { Suspense } from 'react'
import {
  Users, TrendingUp, DollarSign, CheckCircle2,
  Target, BarChart3, PieChart, Activity,
} from 'lucide-react'

import { getSalesSummary }      from '@/app/actions/sales'
import { getFinancialSummary }  from '@/app/actions/finance'
import { getTasksSummary }      from '@/app/actions/tasks'
import { getLeads, getLeadStages } from '@/app/actions/leads'

function fmt(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

function KPI({ label, value, sub, icon: Icon, color }: {
  label: string; value: string | number; sub?: string;
  icon: any; color: string
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className={`p-2 rounded-lg ${color}`}><Icon className="h-4 w-4" /></div>
        <span className="text-xs text-muted-foreground font-medium">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  )
}

// Simple bar chart using CSS only
function SimpleBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground truncate max-w-[160px]">{label}</span>
        <span className="font-medium shrink-0 ml-2">{value}</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

async function ReportsContent() {
  const [sales, finance, tasks, { data: leads }, stages] = await Promise.all([
    getSalesSummary(),
    getFinancialSummary(),
    getTasksSummary(),
    getLeads({ pageSize: 200 }),
    getLeadStages(),
  ])

  // Leads by stage
  const leadsByStage = stages.map((s) => ({
    name:  s.name,
    count: leads.filter((l) => l.stage_id === s.id && l.status === 'open').length,
    color: s.color,
  })).filter((s) => s.count > 0)

  const maxLeads = Math.max(...leadsByStage.map((s) => s.count), 1)

  // Conversion rate
  const totalLeads  = leads.length
  const wonLeads    = leads.filter((l) => l.status === 'won').length
  const convRate    = totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0

  // Pipeline value (open leads)
  const pipelineValue = leads
    .filter((l) => l.status === 'open')
    .reduce((acc, l) => acc + (l.value ?? 0), 0)

  return (
    <div className="space-y-6">
      {/* Top KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KPI label="Receita (paga)"     value={fmt(finance.totalRevenues)}    icon={DollarSign}   color="bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400"   />
        <KPI label="Vendas concluidas"  value={sales.completed}               icon={CheckCircle2} color="bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400"      sub={fmt(sales.completedValue)} />
        <KPI label="Pipeline (leads)"   value={fmt(pipelineValue)}            icon={Target}       color="bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400" />
        <KPI label="Taxa de conversao"  value={`${convRate}%`}               icon={TrendingUp}   color="bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400" sub={`${wonLeads} de ${totalLeads} leads`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Funil por etapa */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-semibold">Leads por Etapa</h2>
          </div>
          {leadsByStage.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhum lead aberto</p>
          ) : (
            <div className="space-y-3">
              {leadsByStage.map((s) => (
                <SimpleBar key={s.name} label={s.name} value={s.count} max={maxLeads} color="bg-primary" />
              ))}
            </div>
          )}
        </div>

        {/* Financeiro resumo */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-semibold">Resumo Financeiro</h2>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Receitas pagas',      value: finance.totalRevenues,   bar: 'bg-green-500'  },
              { label: 'Despesas pagas',       value: finance.totalExpenses,   bar: 'bg-red-500'    },
              { label: 'A receber (pendente)', value: finance.pendingRevenues, bar: 'bg-blue-400'   },
              { label: 'A pagar (pendente)',   value: finance.pendingExpenses, bar: 'bg-orange-400' },
              { label: 'Receitas vencidas',    value: finance.overdueRevenues, bar: 'bg-red-300'    },
            ].map(({ label, value, bar }) => (
              <div key={label} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium">{fmt(value)}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${bar}`}
                    style={{ width: `${Math.min(100, finance.totalRevenues > 0 ? (value / (finance.totalRevenues + finance.totalExpenses)) * 100 : 0)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-border flex justify-between items-center">
            <span className="text-sm font-medium">Saldo</span>
            <span className={`text-lg font-bold ${finance.balance >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>
              {fmt(finance.balance)}
            </span>
          </div>
        </div>

        {/* Tarefas */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-semibold">Tarefas</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Pendentes',    value: tasks.pending,    color: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-950/30' },
              { label: 'Em andamento', value: tasks.inProgress, color: 'text-blue-600',   bg: 'bg-blue-50 dark:bg-blue-950/30'     },
              { label: 'Concluidas',   value: tasks.completed,  color: 'text-green-600',  bg: 'bg-green-50 dark:bg-green-950/30'   },
              { label: 'Vencidas',     value: tasks.overdue,    color: 'text-red-600',    bg: 'bg-red-50 dark:bg-red-950/30'       },
            ].map(({ label, value, color, bg }) => (
              <div key={label} className={`${bg} rounded-lg p-3`}>
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Vendas */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-semibold">Vendas</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Total',      value: sales.total,                bg: 'bg-blue-50 dark:bg-blue-950/30',    color: 'text-blue-600'   },
              { label: 'Concluidas', value: sales.completed,            bg: 'bg-green-50 dark:bg-green-950/30',  color: 'text-green-600'  },
              { label: 'Pendentes',  value: sales.pending,              bg: 'bg-yellow-50 dark:bg-yellow-950/30', color: 'text-yellow-600' },
              { label: 'Receita',    value: fmt(sales.completedValue),  bg: 'bg-emerald-50 dark:bg-emerald-950/30', color: 'text-emerald-600' },
            ].map(({ label, value, bg, color }) => (
              <div key={label} className={`${bg} rounded-lg p-3`}>
                <p className={`text-xl font-bold ${color}`}>{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default async function RelatoriosPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Relatorios</h1>
        <p className="text-sm text-muted-foreground">Visao geral do desempenho do negocio</p>
      </div>
      <Suspense fallback={<div className="animate-pulse h-96 bg-muted rounded-xl" />}>
        <ReportsContent />
      </Suspense>
    </div>
  )
}
