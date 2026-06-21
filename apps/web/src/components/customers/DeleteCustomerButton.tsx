'use client'

import { useState }   from 'react'
import { useRouter }  from 'next/navigation'
import { Trash2 }     from 'lucide-react'
import { toast }      from 'sonner'
import { Button }     from '@/components/ui/button'
import { deleteCustomer } from '@/app/actions/customers'

export function DeleteCustomerButton({ id, name }: { id: string; name: string }) {
  const router  = useRouter()
  const [loading, setLoading] = useState(false)

  const handle = async () => {
    if (!confirm(`Excluir ${name}? Esta ação não pode ser desfeita.`)) return
    setLoading(true)
    const result = await deleteCustomer(id)
    setLoading(false)
    if (result.success) {
      toast.success('Cliente excluído')
      router.push('/clientes')
      router.refresh()
    } else {
      toast.error(result.error)
    }
  }

  return (
    <Button variant="outline" size="icon" onClick={handle} disabled={loading}>
      <Trash2 className="h-4 w-4 text-destructive" />
    </Button>
  )
}
