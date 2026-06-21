import { notFound } from 'next/navigation'
import Link          from 'next/link'
import {
  ChevronLeft, Pencil, Calendar, User,
  DollarSign, Tag, AlertTriangle, CheckCircle2,
} from 'lucide-react'

import { Button }      from '@/components/ui/button'
import { Badge }       from '@/components/ui/badge'
import { getLeadById } from '@/app/actions/leads'
import {
  LEAD_STATUS_LABELS,
  LEAD_PRIORITY_LABELS,
  CUSTOMER_SOURCE_LABELS,
} from '@/types'

interface PageProps {
  params: Promise<{ id: string }>
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export default async function LeadDetailPage({ params }: PageProps) {
  const { id } = await params
  const lead   = await getLeadById(id)
  if (!lead) notFound()

  const statusColors: Record<string, string> = {
    open:     'bg-blue-100 text-blue-700 border-blue-200',
    won:      'bg-green-100 text-green-700 border-green-200',
    lost:     'bg-red-100 text-red-700 border-red-200',
    archived: 'bg-gray-100 text-gray-600 border-gray-200',
  }

  const priorityColors: Record<string, string> = {
    low:    'bg-gray-100 text-gray-600',
    medium: 'bg-blue-100 text-blue-700',
    high:   'bg-orange-100 text-orange-700',
    urgent: 'bg-red-100 text-red-700',
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back + actions */}
      <div className="flex items-center justify-between">
        <Link
          href="/leads"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          Voltar ao Pipeline
        </Link>

        <Button asChild size="sm" variant="outline">
          <Link href={`/leads/${id}/editar`}>
            <Pencil className="mr-1.5 h-3.5 w-3.5" />
            Editar
          </Link>
        </Button>
      </div>

      {/* Header card */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-foreground">{lead.title}</h1>
            {lead.customer && (
              <p className="text-muted-foreground mt-1">
                {lead.customer.company_name ?? lead.customer.name}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${statusColors[lead.status] ?? ''}`}>
              {LEAD_STATUS_LABELS[lead.status]}
            </span>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${priorityColors[lead.priority] ?? ''}`}>
              {LEAD_PRIORITY_LABELS[lead.priority]}
            </span>
          </div>
        </div>

        {/* Stage pill */}
        {lead.stage && (
          <div className="flex items-center gap-2 mt-4">
            <span
              className="inline-block w-3 h-3 rounded-full"
              style={{ backgroundColor: lead.stage.color }}
            />
            <span className="text-sm font-medium">{lead.stage.name}</span>
          </div>
        )}
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Value */}
        {lead.value != null && (
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <DollarSign className="h-4 w-4" />
              Valor
            </div>
            <p className="text-xl font-bold text-emerald-600">{formatCurrency(lead.value)}</p>
          </div>
        )}

        {/* Expected close */}
        {lead.expected_close_date && (
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Calendar className="h-4 w-4" />
              Previsão de Fechamento
            </div>
            <p className="text-sm font-medium">
              {new Date(lead.expected_close_date).toLocaleDateString('pt-BR', {
                day: '2-digit', month: 'long', year: 'numeric',
              })}
            </p>
          </div>
        )}

        {/* Assigned */}
        {lead.assigned_user && (
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <User className="h-4 w-4" />
              Responsável
            </div>
            <p className="text-sm font-medium">
              {lead.assigned_user.first_name} {lead.assigned_user.last_name ?? ''}
            </p>
          </div>
        )}

        {/* Source */}
        {lead.source && (
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Tag className="h-4 w-4" />
              Origem
            </div>
            <p className="text-sm font-medium">{CUSTOMER_SOURCE_LABELS[lead.source]}</p>
          </div>
        )}
      </div>

      {/* Lost reason */}
      {lead.status === 'lost' && lead.lost_reason && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <div className="flex items-center gap-2 text-red-600 text-sm font-medium mb-1">
            <AlertTriangle className="h-4 w-4" />
            Motivo da Perda
          </div>
          <p className="text-sm text-red-700 dark:text-red-400">{lead.lost_reason}</p>
        </div>
      )}

      {/* Won banner */}
      {lead.status === 'won' && (
        <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-500" />
          <p className="text-sm font-medium text-green-700 dark:text-green-400">
            Lead ganho{lead.converted_at ? ` em ${new Date(lead.converted_at).toLocaleDateString('pt-BR')}` : ''}!
          </p>
        </div>
      )}

      {/* Tags */}
      {lead.tags?.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-sm font-medium text-muted-foreground mb-2">Tags</p>
          <div className="flex flex-wrap gap-1.5">
            {lead.tags.map((tag) => (
              <Badge key={tag} variant="secondary">{tag}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {lead.notes && (
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-sm font-medium text-muted-foreground mb-2">Observações</p>
          <p className="text-sm whitespace-pre-wrap">{lead.notes}</p>
        </div>
      )}

      {/* Timestamps */}
      <div className="text-xs text-muted-foreground flex gap-4 pb-6">
        <span>Criado: {new Date(lead.created_at).toLocaleDateString('pt-BR')}</span>
        <span>Atualizado: {new Date(lead.updated_at).toLocaleDateString('pt-BR')}</span>
      </div>
    </div>
  )
}
