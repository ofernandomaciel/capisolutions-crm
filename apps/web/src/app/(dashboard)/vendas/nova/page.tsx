import Link            from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { SaleForm }    from '@/components/sales/SaleForm'
import { getProducts } from '@/app/actions/sales'

export default async function NovaVendaPage() {
  const products = await getProducts()
  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div>
        <Link href="/vendas" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" />Voltar
        </Link>
        <h1 className="text-2xl font-bold mt-2">Nova Venda</h1>
      </div>
      <div className="bg-card border border-border rounded-xl p-6">
        <SaleForm mode="create" products={products} />
      </div>
    </div>
  )
}
