import Link                from 'next/link'
import { ChevronLeft }     from 'lucide-react'
import { CustomerForm }    from '@/components/customers/CustomerForm'

export default function NovoClientePage() {
  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Breadcrumb */}
      <div>
        <Link
          href="/clientes"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Voltar para Clientes
        </Link>
        <h1 className="text-2xl font-bold text-foreground mt-2">Novo Cliente</h1>
        <p className="text-sm text-muted-foreground">
          Preencha os dados do cliente. Campos marcados com * são obrigatórios.
        </p>
      </div>

      <CustomerForm mode="create" />
    </div>
  )
}
