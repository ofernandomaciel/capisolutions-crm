'use client'

import { useState }        from 'react'
import { useRouter }       from 'next/navigation'
import { toast }           from 'sonner'
import {
  MoreHorizontal, Pencil, Trash2, Eye,
  Phone, Mail, Building2,
} from 'lucide-react'

import { Button }   from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge }    from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import { deleteCustomer, deleteCustomers } from '@/app/actions/customers'
import {
  CUSTOMER_STATUS_LABELS,
  CUSTOMER_STATUS_COLORS,
  type Customer,
  type CustomerStatus,
} from '@/types'

// ─── Status Badge ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: CustomerStatus }) {
  const label   = CUSTOMER_STATUS_LABELS[status]
  const variant = CUSTOMER_STATUS_COLORS[status] as any
  return <Badge variant={variant}>{label}</Badge>
}

// ─── Row Actions ─────────────────────────────────────────────────────────────

function RowActions({
  customer,
  onDelete,
}: {
  customer: Customer
  onDelete: (id: string) => void
}) {
  const router   = useRouter()
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!confirm(`Excluir ${customer.name}? Esta ação não pode ser desfeita.`)) return
    setLoading(true)
    const result = await deleteCustomer(customer.id)
    setLoading(false)
    if (result.success) {
      toast.success('Cliente excluído')
      onDelete(customer.id)
    } else {
      toast.error(result.error)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8" disabled={loading}>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => router.push(`/clientes/${customer.id}`)}>
          <Eye className="mr-2 h-4 w-4" />
          Ver perfil
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push(`/clientes/${customer.id}/editar`)}>
          <Pencil className="mr-2 h-4 w-4" />
          Editar
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleDelete}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Excluir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ─── Main Table ───────────────────────────────────────────────────────────────

interface CustomerTableProps {
  customers:   Customer[]
  onRefresh?:  () => void
}

export function CustomerTable({ customers: initial, onRefresh }: CustomerTableProps) {
  const router   = useRouter()
  const [data,   setData]     = useState(initial)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [deleting, setDeleting] = useState(false)

  const allSelected   = data.length > 0 && selected.size === data.length
  const someSelected  = selected.size > 0 && !allSelected

  const toggleAll = () => {
    if (allSelected) setSelected(new Set())
    else setSelected(new Set(data.map((c) => c.id)))
  }

  const toggleOne = (id: string) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }

  const handleDelete = (id: string) => {
    setData((prev) => prev.filter((c) => c.id !== id))
    setSelected((prev) => { const n = new Set(prev); n.delete(id); return n })
  }

  const handleBulkDelete = async () => {
    if (!confirm(`Excluir ${selected.size} clientes? Esta ação não pode ser desfeita.`)) return
    setDeleting(true)
    const result = await deleteCustomers([...selected])
    setDeleting(false)
    if (result.success) {
      toast.success(`${result.count} clientes excluídos`)
      setData((prev) => prev.filter((c) => !selected.has(c.id)))
      setSelected(new Set())
      onRefresh?.()
    } else {
      toast.error(result.error)
    }
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <Building2 className="mx-auto h-10 w-10 mb-3 opacity-30" />
        <p className="font-medium">Nenhum cliente encontrado</p>
        <p className="text-sm mt-1">Tente ajustar os filtros ou cadastre um novo cliente.</p>
      </div>
    )
  }

  return (
    <div>
      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-primary/5 border-b border-border text-sm">
          <span className="text-foreground font-medium">{selected.size} selecionado(s)</span>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleBulkDelete}
            disabled={deleting}
          >
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
            Excluir selecionados
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>
            Cancelar
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="w-10 px-4 py-3">
                <Checkbox
                  checked={allSelected}
                  data-state={someSelected ? 'indeterminate' : undefined}
                  onCheckedChange={toggleAll}
                />
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Cliente</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Contato</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden lg:table-cell">Cidade</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden xl:table-cell">Tags</th>
              <th className="w-12 px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {data.map((customer) => (
              <tr
                key={customer.id}
                className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
              >
                <td className="px-4 py-3">
                  <Checkbox
                    checked={selected.has(customer.id)}
                    onCheckedChange={() => toggleOne(customer.id)}
                  />
                </td>

                {/* Nome + empresa */}
                <td className="px-4 py-3">
                  <button
                    onClick={() => router.push(`/clientes/${customer.id}`)}
                    className="text-left hover:underline"
                  >
                    <p className="font-medium text-foreground">{customer.name}</p>
                    {customer.company_name && (
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {customer.company_name}
                      </p>
                    )}
                  </button>
                </td>

                {/* Contato */}
                <td className="px-4 py-3 hidden md:table-cell">
                  <div className="space-y-0.5">
                    {customer.email && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Mail className="h-3 w-3 shrink-0" />
                        <span className="truncate max-w-[180px]">{customer.email}</span>
                      </p>
                    )}
                    {customer.phone && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3 shrink-0" />
                        {customer.phone}
                      </p>
                    )}
                  </div>
                </td>

                {/* Cidade */}
                <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">
                  {customer.city && customer.state
                    ? `${customer.city} / ${customer.state}`
                    : customer.city ?? '—'}
                </td>

                {/* Status */}
                <td className="px-4 py-3">
                  <StatusBadge status={customer.status} />
                </td>

                {/* Tags */}
                <td className="px-4 py-3 hidden xl:table-cell">
                  <div className="flex flex-wrap gap-1">
                    {(customer.tags ?? []).slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs px-1.5 py-0">
                        {tag}
                      </Badge>
                    ))}
                    {(customer.tags ?? []).length > 3 && (
                      <Badge variant="outline" className="text-xs px-1.5 py-0">
                        +{customer.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                </td>

                {/* Ações */}
                <td className="px-4 py-3">
                  <RowActions customer={customer} onDelete={handleDelete} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
