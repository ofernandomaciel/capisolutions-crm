import { notFound }   from 'next/navigation'
import Link           from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { SaleForm }    from '@/components/sales/SaleForm'
import { getSaleById, getProducts } from '@/app/actions/sales'

interface PageProps { params: Promise<{ id: string }> }

export default async function EditarVendaPage({ params }: PageProps) {
  const { id } = await params
  const [sale, products] = await Promise.all([getSaleById(id), getProducts()])
  if (!sale) notFound()

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div>
        <Link href={`/vendas/${id}`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" />Voltar
        </Link>
        <h1 className="text-2xl font-bold mt-2">Editar Venda</h1>
      </div>
      <div className="bg-card border border-border rounded-xl p-6">
        <SaleForm mode="edit" sale={sale} products={products} />
      </div>
    </div>
  )
}
