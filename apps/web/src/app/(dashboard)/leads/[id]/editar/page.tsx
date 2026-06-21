import { notFound }   from 'next/navigation'
import Link            from 'next/link'
import { ChevronLeft } from 'lucide-react'

import { LeadForm }                    from '@/components/leads/LeadForm'
import { getLeadById, getLeadStages }  from '@/app/actions/leads'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditarLeadPage({ params }: PageProps) {
  const { id } = await params
  const [lead, stages] = await Promise.all([
    getLeadById(id),
    getLeadStages(),
  ])
  if (!lead) notFound()

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div>
        <Link
          href={`/leads/${id}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          Voltar para {lead.title}
        </Link>
        <h1 className="text-2xl font-bold text-foreground mt-2">Editar Lead</h1>
        <p className="text-sm text-muted-foreground">Atualize os dados de {lead.title}</p>
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <LeadForm mode="edit" lead={lead} stages={stages} />
      </div>
    </div>
  )
}
