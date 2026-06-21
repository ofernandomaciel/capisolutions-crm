import Link            from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { TaskForm }    from '@/components/tasks/TaskForm'

export default function NovaTarefaPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <Link href="/tarefas" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" />Voltar
        </Link>
        <h1 className="text-2xl font-bold mt-2">Nova Tarefa</h1>
      </div>
      <div className="bg-card border border-border rounded-xl p-6">
        <TaskForm mode="create" />
      </div>
    </div>
  )
}
