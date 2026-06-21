'use client'

import { useCallback, useTransition } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Search, X, SlidersHorizontal } from 'lucide-react'

import { Input }  from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge }  from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import {
  CUSTOMER_STATUS_LABELS,
  CUSTOMER_SOURCE_LABELS,
  BR_STATES,
  type CustomerStatus,
  type CustomerSource,
} from '@/types'

interface CustomerFiltersProps {
  totalCount: number
  tags?:      string[]
}

export function CustomerFilters({ totalCount, tags = [] }: CustomerFiltersProps) {
  const router     = useRouter()
  const pathname   = usePathname()
  const searchParams = useSearchParams()
  const [,startTransition] = useTransition()

  const search = searchParams.get('search') ?? ''
  const status = searchParams.get('status') ?? ''
  const source = searchParams.get('source') ?? ''
  const state  = searchParams.get('state')  ?? ''
  const tag    = searchParams.get('tag')    ?? ''

  const activeFilters = [status, source, state, tag].filter(Boolean).length

  const updateParam = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else        params.delete(key)
    params.delete('page') // reset pagination
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }, [router, pathname, searchParams])

  const clearAll = () => {
    startTransition(() => {
      router.push(pathname)
    })
  }

  return (
    <div className="space-y-3">
      {/* Search bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            defaultValue={search}
            placeholder="Buscar por nome, e-mail ou telefone..."
            className="pl-9"
            onChange={(e) => {
              const v = e.target.value
              const params = new URLSearchParams(searchParams.toString())
              if (v) params.set('search', v)
              else   params.delete('search')
              params.delete('page')
              // debounce via form submit
              const t = setTimeout(() => {
                startTransition(() => router.push(`${pathname}?${params.toString()}`))
              }, 400)
              return () => clearTimeout(t)
            }}
          />
        </div>

        <div className="text-sm text-muted-foreground flex items-center gap-1 shrink-0">
          <SlidersHorizontal className="h-4 w-4" />
          <span className="hidden sm:inline">{totalCount} clientes</span>
        </div>
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap gap-2 items-center">

        {/* Status */}
        <Select value={status} onValueChange={(v) => updateParam('status', v === '__all__' ? '' : v)}>
          <SelectTrigger className="w-[140px] h-8 text-xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todos</SelectItem>
            {(Object.keys(CUSTOMER_STATUS_LABELS) as CustomerStatus[]).map((s) => (
              <SelectItem key={s} value={s}>{CUSTOMER_STATUS_LABELS[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Source */}
        <Select value={source} onValueChange={(v) => updateParam('source', v === '__all__' ? '' : v)}>
          <SelectTrigger className="w-[140px] h-8 text-xs">
            <SelectValue placeholder="Origem" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todas</SelectItem>
            {(Object.keys(CUSTOMER_SOURCE_LABELS) as CustomerSource[]).map((s) => (
              <SelectItem key={s} value={s}>{CUSTOMER_SOURCE_LABELS[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Estado */}
        <Select value={state} onValueChange={(v) => updateParam('state', v === '__all__' ? '' : v)}>
          <SelectTrigger className="w-[100px] h-8 text-xs">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todos</SelectItem>
            {BR_STATES.map((uf: string) => (
              <SelectItem key={uf} value={uf}>{uf}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Tags */}
        {tags.length > 0 && (
          <Select value={tag} onValueChange={(v) => updateParam('tag', v === '__all__' ? '' : v)}>
            <SelectTrigger className="w-[140px] h-8 text-xs">
              <SelectValue placeholder="Tag" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todas as tags</SelectItem>
              {tags.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Clear filters */}
        {activeFilters > 0 && (
          <Button variant="ghost" size="sm" onClick={clearAll} className="h-8 text-xs gap-1">
            <X className="h-3.5 w-3.5" />
            Limpar ({activeFilters})
          </Button>
        )}
      </div>

      {/* Active filter chips */}
      {(status || source || state || tag) && (
        <div className="flex flex-wrap gap-1.5">
          {status && (
            <Badge variant="secondary" className="gap-1 text-xs">
              {CUSTOMER_STATUS_LABELS[status as CustomerStatus]}
              <button onClick={() => updateParam('status', '')}><X className="h-3 w-3" /></button>
            </Badge>
          )}
          {source && (
            <Badge variant="secondary" className="gap-1 text-xs">
              {CUSTOMER_SOURCE_LABELS[source as CustomerSource]}
              <button onClick={() => updateParam('source', '')}><X className="h-3 w-3" /></button>
            </Badge>
          )}
          {state && (
            <Badge variant="secondary" className="gap-1 text-xs">
              {state}
              <button onClick={() => updateParam('state', '')}><X className="h-3 w-3" /></button>
            </Badge>
          )}
          {tag && (
            <Badge variant="secondary" className="gap-1 text-xs">
              #{tag}
              <button onClick={() => updateParam('tag', '')}><X className="h-3 w-3" /></button>
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}
