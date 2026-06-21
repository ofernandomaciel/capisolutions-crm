import { notFound }   from 'next/navigation'
import Link            from 'next/link'
import {
  ChevronLeft, Pencil, Mail, Phone, MessageCircle,
  MapPin, Building2, FileText, Tag, Calendar,
} from 'lucide-react'

import { Button }   from '@/components/ui/button'
import { Badge }    from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { DeleteCustomerButton } from '@/components/customers/DeleteCustomerButton'

import { getCustomerById } from '@/app/actions/customers'
import {
  CUSTOMER_STATUS_LABELS,
  CUSTOMER_STATUS_COLORS,
  CUSTOMER_SOURCE_LABELS,
  type CustomerStatus,
  type CustomerSource,
} from '@/types'

// ─── Info Row ────────────────────────────────────────────────────────────────

function InfoRow({ icon: Icon, label, value }: {
  icon: React.ElementType
  label: string
  value?: string | null
}) {
  if (!value) return null
  return (
    <div className="flex items-start gap-3 py-2.5">
      <div className="mt-0.5 h-7 w-7 rounded-md bg-muted flex items-center justify-center shrink-0">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground mt-0.5">{value}</p>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function CustomerDetailPage({ params }: PageProps) {
  const { id } = await params
  const customer = await getCustomerById(id)
  if (!customer) notFound()

  const status  = customer.status as CustomerStatus
  const source  = customer.source as CustomerSource | null

  const addressParts = [
    customer.street && `${customer.street}${customer.street_number ? ', ' + customer.street_number : ''}`,
    customer.complement,
    customer.neighborhood,
    customer.city && customer.state ? `${customer.city} / ${customer.state}` : customer.city,
    customer.zip_code,
  ].filter(Boolean)

  const createdAt = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
  }).format(new Date(customer.created_at))

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/clientes"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
            Clientes
          </Link>
          <div className="flex items-center gap-3 mt-2">
            <h1 className="text-2xl font-bold text-foreground">{customer.name}</h1>
            <Badge variant={CUSTOMER_STATUS_COLORS[status] as any}>
              {CUSTOMER_STATUS_LABELS[status]}
            </Badge>
          </div>
          {customer.company_name && (
            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5" />
              {customer.company_name}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <DeleteCustomerButton id={customer.id} name={customer.name} />
          <Button asChild>
            <Link href={`/clientes/${id}/editar`}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-5">

          {/* Contact */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contato</CardTitle>
            </CardHeader>
            <CardContent className="divide-y divide-border">
              <InfoRow icon={Mail}           label="E-mail"    value={customer.email} />
              <InfoRow icon={Phone}          label="Telefone"  value={customer.phone} />
              <InfoRow icon={MessageCircle}  label="WhatsApp"  value={customer.whatsapp} />
              {!customer.email && !customer.phone && !customer.whatsapp && (
                <p className="py-4 text-sm text-muted-foreground">Nenhum contato cadastrado.</p>
              )}
            </CardContent>
          </Card>

          {/* Address */}
          {addressParts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Endereço</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 h-7 w-7 rounded-md bg-muted flex items-center justify-center shrink-0">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div className="text-sm text-foreground space-y-0.5">
                    {addressParts.map((part, i) => (
                      <p key={i}>{part}</p>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {customer.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Observações</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground whitespace-pre-wrap">{customer.notes}</p>
              </CardContent>
            </Card>
          )}

        </div>

        {/* Right column */}
        <div className="space-y-5">

          {/* Meta */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {customer.document && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    {customer.document_type?.toUpperCase() ?? 'Documento'}
                  </p>
                  <p className="font-medium mt-0.5">{customer.document}</p>
                </div>
              )}
              {source && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Origem</p>
                  <p className="font-medium mt-0.5">
                    {CUSTOMER_SOURCE_LABELS[source] ?? source}
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Cadastrado em</p>
                <p className="font-medium mt-0.5 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  {createdAt}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          {customer.tags?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Tags
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1.5">
                  {customer.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">{tag}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

        </div>
      </div>
    </div>
  )
}
