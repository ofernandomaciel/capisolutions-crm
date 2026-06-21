'use client'

import { useCallback, useTransition } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Search, X, LayoutGrid, List } from 'lucide-react'

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
  LEAD_STATUS_LABELS,
  LEAD_PRIORITY_LABELS,
  CUSTOMER_SOURCE_LABELS,
  type LeadStatus,
  type LeadPriority,
  type LeadSource,
  type LeadStage,
} from '@/types'

interface LeadFiltersProps {
  stages:      LeadStage[]
  totalCount?: number
  view?:       'kanban' | 'list'
  onViewChange?: (v: 'kanban' | 'list') => void
}

export function LeadFilters({ stages, totalCount, view = 'kanban', onViewChange }: LeadFiltersProps) {
  const router       = useRouter()
  const pathname     = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  const search   = searchParams.get('search')   ?? ''
  const status   = searchParams.get('status')   ?? ''
  const priority = searchParams.get('priority') ?? ''
  const source   = searchParams.get('source')   ?? ''
  const stage_id = searchParams.get('stage_id') ?? ''

  const activeFilters = [status, priority, source, stage_id].filter(Boolean).length

  const updateParam = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else        params.delete(key)
    params.delete('page')
    startTransition(() => router.push(`${pathname}?${params.toString()}`))
  }, [router, pathname, searchParams])

  const clearAll = () => startTransition(() => router.push(pathname))

  return (
    <div className="space-y-3">
      <div className="flex gap-2 items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            defaultValue={search}
            placeholder="Buscar lead..."
            className="pl-9"
            onChange={(e) => {
              const v = e.target.value
              const params = new URLSearchParams(searchParams.toString())
              if (v) params.set('search', v)
              else   params.delete('search')
              params.delete('page')
              const t = setTimeout(() => {
                startTransition(() => router.push(`${pathname}?${params.toString()}`))
              }, 400)
              return () => clearTimeout(t)
            }}
          />
        </div>

        {/* View toggle */}
        {onViewChange && (
          <div className="flex border border-border rounded-md overflow-hidden shrink-0">
            <button
              onClick={() => onViewChange('kanban')}
              className={`px-2.5 py-1.5 transition-colors ${view === 'kanban' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => onViewChange('list')}
              className={`px-2.5 py-1.5 transition-colors ${view === 'list' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap gap-2 items-center">

        {/* Stage */}
        <Select value={stage_id} onValueChange={(v) => updateParam('stage_id', v === '__all__' ? '' : v)}>
          <SelectTrigger className="w-[160px] h-8 text-xs">
            <SelectValue placeholder="Etapa" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todas as etapas</SelectItem>
            {stages.map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status */}
        <Select value={status} onValueChange={(v) => updateParam('status', v === '__all__' ? '' : v)}>
          <SelectTrigger className="w-[130px] h-8 text-xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todos</SelectItem>
            {(Object.keys(LEAD_STATUS_LABELS) as LeadStatus[]).map((s) => (
              <SelectItem key={s} value={s}>{LEAD_STATUS_LABELS[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Priority */}
        <Select value={priority} onValueChange={(v) => updateParam('priority', v === '__all__' ? '' : v)}>
          <SelectTrigger className="w-[130px] h-8 text-xs">
            <SelectValue placeholder="Prioridade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todas</SelectItem>
            {(Object.keys(LEAD_PRIORITY_LABELS) as LeadPriority[]).map((p) => (
              <SelectItem key={p} value={p}>{LEAD_PRIORITY_LABELS[p]}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Source */}
        <Select value={source} onValueChange={(v) => updateParam('source', v === '__all__' ? '' : v)}>
          <SelectTrigger className="w-[130px] h-8 text-xs">
            <SelectValue placeholder="Origem" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todas</SelectItem>
            {(Object.keys(CUSTOMER_SOURCE_LABELS) as LeadSource[]).map((s) => (
              <SelectItem key={s} value={s}>{CUSTOMER_SOURCE_LABELS[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {activeFilters > 0 && (
          <Button variant="ghost" size="sm" onClick={clearAll} className="h-8 text-xs gap-1">
            <X className="h-3.5 w-3.5" />
            Limpar ({activeFilters})
          </Button>
        )}

        {totalCount !== undefined && (
          <span className="ml-auto text-sm text-muted-foreground">{totalCount} leads</span>
        )}
      </div>

      {/* Active chips */}
      {(status || priority || source || stage_id) && (
        <div className="flex flex-wrap gap-1.5">
          {status && (
            <Badge variant="secondary" className="gap-1 text-xs">
              {LEAD_STATUS_LABELS[status as LeadStatus]}
              <button onClick={() => updateParam('status', '')}><X className="h-3 w-3" /></button>
            </Badge>
          )}
          {priority && (
            <Badge variant="secondary" className="gap-1 text-xs">
              {LEAD_PRIORITY_LABELS[priority as LeadPriority]}
              <button onClick={() => updateParam('priority', '')}><X className="h-3 w-3" /></button>
            </Badge>
          )}
          {source && (
            <Badge variant="secondary" className="gap-1 text-xs">
              {CUSTOMER_SOURCE_LABELS[source as LeadSource]}
              <button onClick={() => updateParam('source', '')}><X className="h-3 w-3" /></button>
            </Badge>
          )}
          {stage_id && (
            <Badge variant="secondary" className="gap-1 text-xs">
              {stages.find((s) => s.id === stage_id)?.name ?? stage_id}
              <button onClick={() => updateParam('stage_id', '')}><X className="h-3 w-3" /></button>
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}
