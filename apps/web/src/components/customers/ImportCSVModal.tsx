'use client'

import { useState, useRef, useCallback } from 'react'
import { toast }   from 'sonner'
import { Upload, FileText, CheckCircle2, AlertCircle, X, Download } from 'lucide-react'

import { Button }   from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge }  from '@/components/ui/badge'

import { importCustomers }  from '@/app/actions/customers'
import type { CustomerFormData } from '@/types'

// ─── CSV Columns that map to customer fields ──────────────────────────────────

const CUSTOMER_COLUMNS: { key: keyof CustomerFormData; label: string }[] = [
  { key: 'name',          label: 'Nome *'           },
  { key: 'company_name',  label: 'Empresa'          },
  { key: 'email',         label: 'E-mail'           },
  { key: 'phone',         label: 'Telefone'         },
  { key: 'whatsapp',      label: 'WhatsApp'         },
  { key: 'document',      label: 'CPF/CNPJ'         },
  { key: 'zip_code',      label: 'CEP'              },
  { key: 'street',        label: 'Logradouro'       },
  { key: 'street_number', label: 'Número'           },
  { key: 'complement',    label: 'Complemento'      },
  { key: 'neighborhood',  label: 'Bairro'           },
  { key: 'city',          label: 'Cidade'           },
  { key: 'state',         label: 'Estado (UF)'      },
  { key: 'source',        label: 'Origem'           },
  { key: 'status',        label: 'Status'           },
  { key: 'notes',         label: 'Observações'      },
]

// ─── Parse CSV ────────────────────────────────────────────────────────────────

function parseCSV(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines   = text.trim().split('\n')
  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''))
  const rows    = lines.slice(1).map((line) => {
    const vals = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''))
    return Object.fromEntries(headers.map((h, i) => [h, vals[i] ?? '']))
  })
  return { headers, rows }
}

// ─── Component ───────────────────────────────────────────────────────────────

interface ImportCSVModalProps {
  open:     boolean
  onClose:  () => void
  onSuccess?: () => void
}

type Step = 'upload' | 'map' | 'preview' | 'done'

export function ImportCSVModal({ open, onClose, onSuccess }: ImportCSVModalProps) {
  const fileRef = useRef<HTMLInputElement>(null)

  const [step,       setStep]       = useState<Step>('upload')
  const [csvHeaders, setCsvHeaders] = useState<string[]>([])
  const [csvRows,    setCsvRows]    = useState<Record<string, string>[]>([])
  const [mapping,    setMapping]    = useState<Partial<Record<keyof CustomerFormData, string>>>({})
  const [importing,  setImporting]  = useState(false)
  const [result,     setResult]     = useState<{ imported: number; errors: number } | null>(null)

  const reset = () => {
    setStep('upload')
    setCsvHeaders([])
    setCsvRows([])
    setMapping({})
    setResult(null)
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  // ─── File upload ──────────────────────────────────────────────────────────

  const handleFile = useCallback((file: File) => {
    if (!file.name.endsWith('.csv')) {
      toast.error('Arquivo deve ser .csv')
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const { headers, rows } = parseCSV(text)
      setCsvHeaders(headers)
      setCsvRows(rows)

      // Auto-map headers with exact/similar names
      const autoMap: Partial<Record<keyof CustomerFormData, string>> = {}
      CUSTOMER_COLUMNS.forEach(({ key }) => {
        const keyStr = String(key)
        const match = headers.find((h) =>
          h.toLowerCase().includes(keyStr.toLowerCase()) ||
          keyStr.toLowerCase().includes(h.toLowerCase())
        )
        if (match) autoMap[key] = match
      })
      // Common aliases
      if (!autoMap.name)   { const m = headers.find((h) => /nome/i.test(h)); if (m) autoMap.name = m }
      if (!autoMap.email)  { const m = headers.find((h) => /email|e-mail/i.test(h)); if (m) autoMap.email = m }
      if (!autoMap.phone)  { const m = headers.find((h) => /telefone|fone|tel/i.test(h)); if (m) autoMap.phone = m }
      if (!autoMap.city)   { const m = headers.find((h) => /cidade|city/i.test(h)); if (m) autoMap.city = m }

      setMapping(autoMap)
      setStep('map')
    }
    reader.readAsText(file, 'UTF-8')
  }, [])

  // ─── Import ───────────────────────────────────────────────────────────────

  const handleImport = async () => {
    if (!mapping.name) {
      toast.error('Mapeie o campo "Nome" para continuar')
      return
    }

    setImporting(true)

    const records: CustomerFormData[] = csvRows
      .filter((row) => mapping.name && row[mapping.name!])
      .map((row) => {
        const record: Record<string, string> = {}
        CUSTOMER_COLUMNS.forEach(({ key }) => {
          const col = mapping[key]
          if (col && row[col]) {
            record[String(key)] = row[col]
          }
        })
        return {
          ...record,
          status: (record.status as any) || 'active',
          name:   record.name || '',
        } as CustomerFormData
      })

    const res = await importCustomers(records)
    setImporting(false)

    if (res.success) {
      setResult({ imported: res.imported ?? 0, errors: res.errors ?? 0 })
      setStep('done')
      onSuccess?.()
    } else {
      toast.error(res.error)
    }
  }

  // ─── Download template ────────────────────────────────────────────────────

  const downloadTemplate = () => {
    const headers = 'nome,empresa,email,telefone,whatsapp,cpf_cnpj,cep,logradouro,numero,complemento,bairro,cidade,estado,origem,status,observacoes'
    const example = 'João da Silva,Empresa X,joao@email.com,(11) 99999-9999,(11) 99999-9999,,01310-100,Av. Paulista,1000,Sala 1,Bela Vista,São Paulo,SP,site,active,'
    const blob    = new Blob([headers + '\n' + example], { type: 'text/csv;charset=utf-8;' })
    const url     = URL.createObjectURL(blob)
    const a       = document.createElement('a')
    a.href = url; a.download = 'template-clientes.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar Clientes via CSV</DialogTitle>
          <DialogDescription>
            Passo {step === 'upload' ? 1 : step === 'map' ? 2 : 3} de 3 —{' '}
            {step === 'upload' && 'Upload do arquivo'}
            {step === 'map'    && 'Mapeamento de colunas'}
            {step === 'done'   && 'Importação concluída'}
          </DialogDescription>
        </DialogHeader>

        {/* STEP 1: Upload */}
        {step === 'upload' && (
          <div className="space-y-4">
            <div
              className="border-2 border-dashed border-border rounded-lg p-10 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                const file = e.dataTransfer.files[0]
                if (file) handleFile(file)
              }}
            >
              <Upload className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
              <p className="font-medium">Arraste o arquivo CSV aqui</p>
              <p className="text-sm text-muted-foreground mt-1">ou clique para selecionar</p>
              <input
                ref={fileRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Precisa de um modelo?</span>
              <Button variant="outline" size="sm" onClick={downloadTemplate}>
                <Download className="mr-2 h-4 w-4" />
                Baixar template
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: Map columns */}
        {step === 'map' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span>{csvRows.length} linhas detectadas — mapeie as colunas do CSV</span>
            </div>

            <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
              {CUSTOMER_COLUMNS.map(({ key, label }) => (
                <div key={String(key)} className="flex items-center gap-3">
                  <span className="w-40 text-sm font-medium shrink-0">{label}</span>
                  <Select
                    value={mapping[key] ?? '__none__'}
                    onValueChange={(v) => {
                      const next = { ...mapping }
                      if (v === '__none__') delete next[key]
                      else next[key] = v
                      setMapping(next)
                    }}
                  >
                    <SelectTrigger className="flex-1 h-8 text-xs">
                      <SelectValue placeholder="Não importar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">— Não importar —</SelectItem>
                      {csvHeaders.map((h) => (
                        <SelectItem key={h} value={h}>{h}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {mapping[key] && (
                    <Badge variant="secondary" className="text-xs shrink-0">
                      {csvRows[0]?.[mapping[key]!]?.slice(0, 20) ?? ''}
                    </Badge>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-border">
              <Button variant="outline" onClick={() => setStep('upload')}>Voltar</Button>
              <Button onClick={handleImport} disabled={!mapping.name || importing}>
                {importing ? 'Importando...' : `Importar ${csvRows.length} clientes`}
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: Done */}
        {step === 'done' && result && (
          <div className="text-center py-8 space-y-4">
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
            <div>
              <p className="text-lg font-semibold">Importação concluída!</p>
              <p className="text-muted-foreground text-sm mt-1">
                <span className="text-green-600 font-medium">{result.imported} clientes importados</span>
                {result.errors > 0 && (
                  <span className="text-destructive ml-2">• {result.errors} erros</span>
                )}
              </p>
            </div>
            <Button onClick={handleClose}>Fechar</Button>
                   </div>
        )}

      </DialogContent>
    </Dialog>
  )
}
