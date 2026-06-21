import { Suspense }   from 'react'
import Link            from 'next/link'
import { Plus }        from 'lucide-react'

import { Button }         from '@/components/ui/button'
import { KanbanBoard }    from '@/components/leads/KanbanBoard'
import { LeadFilters }    from '@/components/leads/LeadFilters'
import { getLeadStages, getLeadsForKanban } from '@/app/actions/leads'
import type { LeadFilters as Filters } from '@/types'

interface PageProps {
  searchParams: Promise<Record<string, string | undefined>>
}

async function LeadsContent({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  const filters: Omit<Filters, 'page' | 'pageSize'> = {
    search:     searchParams.search     || undefined,
    status:     (searchParams.status    || '') as Filters['status'],
    priority:   (searchParams.priority  || '') as Filters['priority'],
    source:     (searchParams.source    || '') as Filters['source'],
    stage_id:   searchParams.stage_id   || undefined,
    assignedTo: searchParams.assignedTo || undefined,
  }

  const [stages, leads] = await Promise.all([
    getLeadStages(),
    getLeadsForKanban(filters),
  ])

  return (
    <>
      <LeadFilters stages={stages} totalCount={leads.length} />
      <div className="mt-4">
        <KanbanBoard stages={stages} leads={leads} />
      </div>
    </>
  )
}

export default async function LeadsPage({ searchParams }: PageProps) {
  const params = await searchParams

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pipeline de Leads</h1>
          <p className="text-sm text-muted-foreground">Gerencie seus leads no funil de vendas</p>
        </div>
        <Button asChild>
          <Link href="/leads/novo">
            <Plus className="mr-2 h-4 w-4" />
            Novo Lead
          </Link>
        </Button>
      </div>

      <Suspense fallback={
        <div className="flex gap-4 overflow-x-auto pb-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="w-72 shrink-0 bg-muted/40 rounded-lg h-64 animate-pulse" />
          ))}
        </div>
      }>
        <LeadsContent searchParams={params} />
      </Suspense>
    </div>
  )
}
