import Link              from 'next/link'
import { ChevronLeft }   from 'lucide-react'

import { LeadForm }      from '@/components/leads/LeadForm'
import { getLeadStages } from '@/app/actions/leads'

interface PageProps {
  searchParams: Promise<{ stage_id?: string }>
}

export default async function NovoLeadPage({ searchParams }: PageProps) {
  const { stage_id } = await searchParams
  const stages = await getLeadStages()

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div>
        <Link
          href="/leads"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          Voltar ao Pipeline
        </Link>
        <h1 className="text-2xl font-bold text-foreground mt-2">Novo Lead</h1>
        <p className="text-sm text-muted-foreground">Preencha os dados do novo lead</p>
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <LeadForm mode="create" stages={stages} defaultStageId={stage_id} />
      </div>
    </div>
  )
}
