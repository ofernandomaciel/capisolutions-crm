'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PaginationProps {
  page:       number
  totalPages: number
  total:      number
  pageSize:   number
}

export function Pagination({ page, totalPages, total, pageSize }: PaginationProps) {
  const router     = useRouter()
  const pathname   = usePathname()
  const searchParams = useSearchParams()

  const go = (p: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', String(p))
    router.push(`${pathname}?${params.toString()}`)
  }

  const from = (page - 1) * pageSize + 1
  const to   = Math.min(page * pageSize, total)

  return (
    <div className="flex items-center justify-between text-sm text-muted-foreground">
      <span>Mostrando {from}–{to} de {total} clientes</span>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => go(page - 1)}
          disabled={page <= 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="px-3">
          {page} / {totalPages}
        </span>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => go(page + 1)}
          disabled={page >= totalPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
