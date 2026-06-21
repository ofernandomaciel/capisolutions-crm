import { Suspense }    from 'react'
import Link            from 'next/link'
import { Plus, Upload } from 'lucide-react'

import { Button }             from '@/components/ui/button'
import { CustomerTable }      from '@/components/customers/CustomerTable'
import { CustomerFilters }    from '@/components/customers/CustomerFilters'
import { ImportButton }       from '@/components/customers/ImportButton'
import { Pagination }         from '@/components/customers/Pagination'
import { getCustomers, getCustomerTags } from '@/app/actions/customers'
import type { CustomerFilters as Filters } from '@/types'

// ─── Skeleton ────────────────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <div className="animate-pulse space-y-2 mt-4">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="h-12 bg-muted rounded" />
      ))}
    </div>
  )
}

// ─── Table section (async) ────────────────────────────────────────────────────

async function CustomerList({
  searchParams,
}: {
  searchParams: Record<string, string>
}) {
  const filters: Filters = {
    search:    searchParams.search    ?? '',
    status:    (searchParams.status   ?? '') as any,
    source:    (searchParams.source   ?? '') as any,
    state:     searchParams.state     ?? '',
    tag:       searchParams.tag       ?? '',
    page:      Number(searchParams.page     ?? 1),
    pageSize:  Number(searchParams.pageSize ?? 20),
    sortBy:    searchParams.sortBy    ?? 'created_at',
    sortOrder: (searchParams.sortOrder ?? 'desc') as 'asc' | 'desc',
  }

  const result = await getCustomers(filters)

  return (
    <>
      <div className="border border-border rounded-lg overflow-hidden bg-card">
        <CustomerTable customers={result.data} />
      </div>
      {result.totalPages > 1 && (
        <Pagination
          page={result.page}
          totalPages={result.totalPages}
          total={result.total}
          pageSize={result.pageSize}
        />
      )}
    </>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

interface PageProps {
  searchParams: Promise<Record<string, string>>
}

export default async function ClientesPage({ searchParams }: PageProps) {
  const params = await searchParams
  const [tags, initialResult] = await Promise.all([
    getCustomerTags(),
    getCustomers({
      search:    params.search   ?? '',
      status:    (params.status  ?? '') as any,
      source:    (params.source  ?? '') as any,
      page:      Number(params.page ?? 1),
      pageSize:  Number(params.pageSize ?? 20),
    }),
  ])

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Clientes</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Gerencie sua base de clientes
          </p>
        </div>
        <div className="flex gap-2">
          <ImportButton />
          <Button asChild>
            <Link href="/clientes/novo">
              <Plus className="mr-2 h-4 w-4" />
              Novo cliente
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Suspense>
        <CustomerFilters totalCount={initialResult.total} tags={tags} />
      </Suspense>

      {/* Table */}
      <Suspense fallback={<TableSkeleton />}>
        <CustomerList searchParams={params} />
      </Suspense>
    </div>
  )
}
