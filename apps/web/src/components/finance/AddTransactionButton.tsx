'use client'

import { useState } from 'react'
import { Plus }     from 'lucide-react'
import { Button }   from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { TransactionForm } from './TransactionForm'
import { useRouter }       from 'next/navigation'
import type { FinancialCategory } from '@/types'

interface Props {
  type:       'revenue' | 'expense'
  categories: FinancialCategory[]
}

export function AddTransactionButton({ type, categories }: Props) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const label = type === 'revenue' ? 'Receita' : 'Despesa'

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <Plus className="h-3.5 w-3.5 mr-1" />Nova {label}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nova {label}</DialogTitle>
          </DialogHeader>
          <TransactionForm
            type={type}
            categories={categories}
            onSuccess={() => { setOpen(false); router.refresh() }}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
