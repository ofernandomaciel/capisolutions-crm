import { Suspense }  from 'react'
import Link          from 'next/link'
import {
  Users, TrendingUp, DollarSign, ShoppingCart,
  CheckSquare, AlertCircle, Plus, ArrowRight,
  Clock, ChevronRight, Target,
} from 'lucide-react'

import { getDashboardData }  from '@/app/actions/dashboard'
import { Button }             from '@/components/ui/button'

// ─── Formatters ──────────────────────────────────────────────────────────────

const fmtCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact', maximumFractionDigits: 1 }).format(v)

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })

const fmtRelative = (d: string) => {
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 86400000)
  if (diff === 0) return 'Hoje'
  if (diff === 1) return 'Ontem'
  return `${diff}d atras`
}

// ─── KPI Card ────────────────────────────────────────────────────────────────

interface KpiCardProps {
  icon:    React.ElementType
  label:   string
  value:   string
  sub?:    string
  accent?: string
  href?:   string
}

function KpiCard({ icon: Icon, label, value, sub, accent = 'text-primary', href }: KpiCardProps) {
  const inner = (
    <div className="group relative bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-lg bg-primary/10 ${accent}`}>
          <Icon className="h-5 w-5" />
        </div>
        {href && (
          <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1 opacity-75">{sub}</p>}
    </div>
  )
  return href ? <Link href={href}>{inner}</Link> : inner
}

// ─── Stage Funnel ────────────────────────────────────────────────────────────

function StageFunnel({ stages }: { stages: { name: string; color: string; count: number; value: number }[] }) {
  if (!stages.length) {
    return <p className="text-sm text-muted-foreground py-4 text-center">Nenhum lead ativo no pipeline</p>
  }
  const maxCount = Math.max(...stages.map((s) => s.count), 1)
  return (
    <div className="space-y-2">
      {stages.map((s) => (
        <div key={s.name} className="flex items-center gap-3">
          <div className="w-24 text-xs text-muted-foreground truncate text-right">{s.name}</div>
          <div className="flex-1 h-7 bg-muted rounded-md overflow-hidden relative">
            <div
              className="h-full rounded-md transition-all"
              style={{ width: `${(s.count / maxCount) * 100}%`, backgroundColor: s.color || '#6366f1' }}
            />
            <span className="absolute inset-0 flex items-center px-2 text-xs font-medium text-white mix-blend-difference">
              {s.count} lead{s.count !== 1 ? 's' : ''} · {fmtCurrency(s.value)}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Task Priority Dot ────────────────────────────────────────────────────────

const PRIORITY_COLORS: Record<string, string> = {
  urgent: 'bg-red-500',
  high:   'bg-orange-500',
  medium: 'bg-yellow-500',
  low:    'bg-blue-400',
}

const TYPE_ICONS: Record<string, string> = {
  call:        'Ligacao',
  email:       'Email',
  appointment: 'Reuniao',
  reminder:    'Lembrete',
  task:        'Tarefa',
}

// ─── Dashboard Page ───────────────────────────────────────────────────────────

async function DashboardContent() {
  const { kpis, leadsByStage, recentCustomers, upcomingTasks } = await getDashboardData()

  const now = new Date()

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            {now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/tarefas/nova"><Plus className="h-4 w-4 mr-1" />Tarefa</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/leads/novo"><Plus className="h-4 w-4 mr-1" />Lead</Link>
          </Button>
        </div>
      </div>

      {/* ── KPI grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={Users}
          label="Clientes"
          value={kpis.totalCustomers.toLocaleString('pt-BR')}
          sub={kpis.custGrowth !== null
            ? (kpis.custGrowth >= 0 ? `+${kpis.custGrowth}% vs mes anterior` : `${kpis.custGrowth}% vs mes anterior`)
            : undefined}
          href="/clientes"
        />
        <KpiCard
          icon={TrendingUp}
          label="Leads ativos"
          value={kpis.activeLeads.toLocaleString('pt-BR')}
          sub={`Pipeline: ${fmtCurrency(kpis.pipelineValue)}`}
          accent="text-indigo-500"
          href="/leads"
        />
        <KpiCard
          icon={DollarSign}
          label="Receita do mes"
          value={fmtCurrency(kpis.monthlyRevenue)}
          sub="Pagamentos recebidos"
          accent="text-emerald-500"
          href="/financeiro"
        />
        <KpiCard
          icon={ShoppingCart}
          label="Vendas do mes"
          value={kpis.monthlySales.toLocaleString('pt-BR')}
          sub={`Total: ${fmtCurrency(kpis.monthlySalesValue)}`}
          accent="text-violet-500"
          href="/vendas"
        />
      </div>

      {/* ── Alert strip ── */}
      {(kpis.overdueTasks > 0) && (
        <div className="flex items-center gap-3 bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3 text-sm">
          <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
          <span className="text-destructive font-medium">
            {kpis.overdueTasks} tarefa{kpis.overdueTasks !== 1 ? 's' : ''} em atraso
          </span>
          <Link href="/tarefas" className="ml-auto text-destructive underline text-xs">Ver tarefas</Link>
        </div>
      )}

      {/* ── Main content grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Pipeline por estagio */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <h2 className="font-semibold text-foreground text-sm">Pipeline por estagio</h2>
            </div>
            <Link href="/leads" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
              Ver kanban <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <StageFunnel stages={leadsByStage} />
        </div>

        {/* Tarefas proximas */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-primary" />
              <h2 className="font-semibold text-foreground text-sm">Proximas tarefas</h2>
            </div>
            <Link href="/tarefas" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
              Ver todas <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          {upcomingTasks.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-sm">
              <CheckSquare className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p>Nenhuma tarefa pendente</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingTasks.map((task: any) => {
                const isOverdue = task.due_date && new Date(task.due_date) < now
                return (
                  <Link
                    key={task.id}
                    href="/tarefas"
                    className="flex items-start gap-2.5 p-2.5 rounded-lg hover:bg-muted/50 transition-colors group"
                  >
                    <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${PRIORITY_COLORS[task.priority] ?? 'bg-muted-foreground'}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{task.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground">
                          {TYPE_ICONS[task.type] ?? task.type}
                        </span>
                        {task.customer && (
                          <span className="text-xs text-muted-foreground truncate">· {task.customer.name}</span>
                        )}
                      </div>
                    </div>
                    {task.due_date && (
                      <span className={`text-xs flex-shrink-0 flex items-center gap-1 ${isOverdue ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                        <Clock className="h-3 w-3" />
                        {fmtDate(task.due_date)}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          )}
          <div className="mt-3 pt-3 border-t border-border">
            <Button asChild variant="ghost" size="sm" className="w-full text-xs">
              <Link href="/tarefas/nova"><Plus className="h-3.5 w-3.5 mr-1" />Nova tarefa</Link>
            </Button>
          </div>
        </div>

        {/* Clientes recentes */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <h2 className="font-semibold text-foreground text-sm">Clientes recentes</h2>
            </div>
            <Link href="/clientes" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
              Ver todos <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          {recentCustomers.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Nenhum cliente cadastrado</p>
          ) : (
            <div className="divide-y divide-border">
              {recentCustomers.map((c: any) => (
                <Link
                  key={c.id}
                  href={`/clientes/${c.id}`}
                  className="flex items-center gap-3 py-2.5 hover:bg-muted/50 px-2 -mx-2 rounded-lg transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-semibold text-primary">
                      {c.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
                    {c.email && <p className="text-xs text-muted-foreground truncate">{c.email}</p>}
                  </div>
                  <span className="text-xs text-muted-foreground flex-shrink-0">{fmtRelative(c.created_at)}</span>
                </Link>
              ))}
            </div>
          )}
          <div className="mt-3 pt-3 border-t border-border">
            <Button asChild variant="ghost" size="sm" className="w-full text-xs">
              <Link href="/clientes/novo"><Plus className="h-3.5 w-3.5 mr-1" />Novo cliente</Link>
            </Button>
          </div>
        </div>

        {/* Tasks summary cards */}
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="font-semibold text-foreground text-sm mb-4 flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-primary" />Resumo de tarefas
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Pendentes</span>
                <span className="font-semibold text-foreground">{kpis.pendingTasks}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Em atraso</span>
                <span className={`font-semibold ${kpis.overdueTasks > 0 ? 'text-destructive' : 'text-foreground'}`}>
                  {kpis.overdueTasks}
                </span>
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="font-semibold text-foreground text-sm mb-3">Acoes rapidas</h2>
            <div className="space-y-2">
              {[
                { href: '/clientes/novo', icon: Users,        label: 'Novo cliente'   },
                { href: '/leads/novo',    icon: TrendingUp,   label: 'Novo lead'      },
                { href: '/vendas/nova',   icon: ShoppingCart, label: 'Nova venda'     },
                { href: '/tarefas/nova',  icon: CheckSquare,  label: 'Nova tarefa'    },
              ].map(({ href, icon: Icon, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  )
}
