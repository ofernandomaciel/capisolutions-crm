'use client'

import { useState }  from 'react'
import { Upload }    from 'lucide-react'
import { Button }    from '@/components/ui/button'
import { ImportCSVModal } from '@/components/customers/ImportCSVModal'
import { useRouter } from 'next/navigation'

export function ImportButton() {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Upload className="mr-2 h-4 w-4" />
        Importar CSV
      </Button>
      <ImportCSVModal
        open={open}
        onClose={() => setOpen(false)}
        onSuccess={() => {
          setOpen(false)
          router.refresh()
        }}
      />
    </>
  )
}
