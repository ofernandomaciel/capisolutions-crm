import { notFound } from 'next/navigation'
import Link          from 'next/link'
import { ChevronLeft } from 'lucide-react'

import { CustomerForm }    from '@/components/customers/CustomerForm'
import { getCustomerById } from '@/app/actions/customers'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditarClientePage({ params }: PageProps) {
  const { id } = await params
  const customer = await getCustomerById(id)
  if (!customer) notFound()

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div>
        <Link
          href={`/clientes/${id}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          Voltar para {customer.name}
        </Link>
        <h1 className="text-2xl font-bold text-foreground mt-2">Editar Cliente</h1>
        <p className="text-sm text-muted-foreground">Atualize os dados de {customer.name}</p>
      </div>

      <CustomerForm mode="edit" customer={customer} />
    </div>
  )
}
