import { Suspense } from 'react'
import Link         from 'next/link'
import { Plus, CheckCircle2, Clock, AlertTriangle, Loader2 } from 'lucide-react'

import { Button }   from '@/components/ui/button'
import { TaskList } from '@/components/tasks/TaskList'
import { getTasks, getTasksSummary } from '@/app/actions/tasks'
import type { TaskFilters } from '@/app/actions/tasks'

interface PageProps {
  searchParams: Promise<Record<string, string | undefined>>
}

function KPICard({ label, value, icon: Icon, color }: { label: string; value: number; icon: any; color: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
      <div className={`p-2 rounded-lg ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}

async function TasksContent({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  const filters: TaskFilters = {
    search:   searchParams.search   || undefined,
    status:   searchParams.status   || undefined,
    type:     searchParams.type     || undefined,
    priority: searchParams.priority || undefined,
  }

  const [{ data: tasks }, summary] = await Promise.all([
    getTasks(filters),
    getTasksSummary(),
  ])

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <KPICard label="Pendentes"    value={summary.pending}    icon={Clock}          color="bg-yellow-100 text-yellow-600 dark:bg-yellow-950 dark:text-yellow-400" />
        <KPICard label="Em andamento" value={summary.inProgress} icon={Loader2}        color="bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400" />
        <KPICard label="Concluidas"   value={summary.completed}  icon={CheckCircle2}   color="bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400" />
        <KPICard label="Vencidas"     value={summary.overdue}    icon={AlertTriangle}  color="bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400" />
      </div>
      <TaskList tasks={tasks} />
    </>
  )
}

export default async function TarefasPage({ searchParams }: PageProps) {
  const params = await searchParams
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tarefas</h1>
          <p className="text-sm text-muted-foreground">Gerencie suas tarefas e compromissos</p>
        </div>
        <Button asChild>
          <Link href="/tarefas/nova"><Plus className="mr-2 h-4 w-4" />Nova Tarefa</Link>
        </Button>
      </div>
      <Suspense fallback={<div className="animate-pulse h-40 bg-muted rounded-xl" />}>
        <TasksContent searchParams={params} />
      </Suspense>
    </div>
  )
}
