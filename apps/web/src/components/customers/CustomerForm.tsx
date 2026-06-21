'use client'

import { useState, useCallback } from 'react'
import { useRouter }              from 'next/navigation'
import { useForm }                from 'react-hook-form'
import { zodResolver }            from '@hookform/resolvers/zod'
import { z }                      from 'zod'
import { toast }                  from 'sonner'
import { Loader2, Search }        from 'lucide-react'

import { Button }   from '@/components/ui/button'
import { Input }    from '@/components/ui/input'
import { Label }    from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge }    from '@/components/ui/badge'
import { TagsInput } from '@/components/customers/TagsInput'

import { createCustomer, updateCustomer } from '@/app/actions/customers'
import {
  formatCPF, formatCNPJ, formatPhone, formatCEP,
  validateCPF, validateCNPJ, lookupCEP, lookupCNPJ,
} from '@/lib/validators/documents'
import {
  CUSTOMER_SOURCE_LABELS,
  BR_STATES,
  type Customer,
  type CustomerFormData,
  type CustomerSource,
} from '@/types'

// ─── Schema ──────────────────────────────────────────────────────────────────

const schema = z.object({
  name:          z.string().min(2, 'Nome obrigatório (mín. 2 caracteres)'),
  company_name:  z.string().optional(),
  document_type: z.enum(['cpf', 'cnpj']).optional(),
  document:      z.string().optional(),
  email:         z.string().email('E-mail inválido').optional().or(z.literal('')),
  phone:         z.string().optional(),
  whatsapp:      z.string().optional(),
  zip_code:      z.string().optional(),
  street:        z.string().optional(),
  street_number: z.string().optional(),
  complement:    z.string().optional(),
  neighborhood:  z.string().optional(),
  city:          z.string().optional(),
  state:         z.string().optional(),
  source:        z.string().optional(),
  status:        z.enum(['active', 'inactive', 'prospect', 'blocked']),
  tags:          z.array(z.string()).optional(),
  notes:         z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.document && data.document_type) {
    const digits = data.document.replace(/\D/g, '')
    if (data.document_type === 'cpf' && !validateCPF(digits)) {
      ctx.addIssue({ code: 'custom', path: ['document'], message: 'CPF inválido' })
    }
    if (data.document_type === 'cnpj' && !validateCNPJ(digits)) {
      ctx.addIssue({ code: 'custom', path: ['document'], message: 'CNPJ inválido' })
    }
  }
})

type FormValues = z.infer<typeof schema>

// ─── Props ───────────────────────────────────────────────────────────────────

interface CustomerFormProps {
  customer?: Customer
  mode:      'create' | 'edit'
}

// ─── Component ───────────────────────────────────────────────────────────────

export function CustomerForm({ customer, mode }: CustomerFormProps) {
  const router = useRouter()

  const [loadingCEP,   setLoadingCEP]   = useState(false)
  const [loadingCNPJ,  setLoadingCNPJ]  = useState(false)
  const [submitting,   setSubmitting]   = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name:          customer?.name          ?? '',
      company_name:  customer?.company_name  ?? '',
      document_type: customer?.document_type ?? undefined,
      document:      customer?.document      ?? '',
      email:         customer?.email         ?? '',
      phone:         customer?.phone         ?? '',
      whatsapp:      customer?.whatsapp      ?? '',
      zip_code:      customer?.zip_code      ?? '',
      street:        customer?.street        ?? '',
      street_number: customer?.street_number ?? '',
      complement:    customer?.complement    ?? '',
      neighborhood:  customer?.neighborhood  ?? '',
      city:          customer?.city          ?? '',
      state:         customer?.state         ?? '',
      source:        customer?.source        ?? undefined,
      status:        customer?.status        ?? 'active',
      tags:          customer?.tags          ?? [],
      notes:         customer?.notes         ?? '',
    },
  })

  const docType = watch('document_type')

  // ─── CEP lookup ────────────────────────────────────────────────────────

  const handleCEPBlur = useCallback(async (cep: string) => {
    const digits = cep.replace(/\D/g, '')
    if (digits.length !== 8) return
    setLoadingCEP(true)
    const data = await lookupCEP(digits)
    setLoadingCEP(false)
    if (data) {
      setValue('street',       data.street,       { shouldValidate: true })
      setValue('neighborhood', data.neighborhood, { shouldValidate: true })
      setValue('city',         data.city,         { shouldValidate: true })
      setValue('state',        data.state,        { shouldValidate: true })
      toast.success('Endereço preenchido automaticamente')
    } else {
      toast.error('CEP não encontrado')
    }
  }, [setValue])

  // ─── CNPJ lookup ───────────────────────────────────────────────────────

  const handleCNPJBlur = useCallback(async (cnpj: string) => {
    if (docType !== 'cnpj') return
    const digits = cnpj.replace(/\D/g, '')
    if (digits.length !== 14) return
    setLoadingCNPJ(true)
    const data = await lookupCNPJ(digits)
    setLoadingCNPJ(false)
    if (data) {
      if (data.razao_social) setValue('company_name',  data.razao_social,  { shouldValidate: true })
      if (data.email)        setValue('email',          data.email,         { shouldValidate: true })
      if (data.telefone)     setValue('phone',          formatPhone(data.telefone), { shouldValidate: true })
      if (data.zip_code)     setValue('zip_code',       formatCEP(data.zip_code),   { shouldValidate: true })
      if (data.street)       setValue('street',         data.street,        { shouldValidate: true })
      if (data.street_number) setValue('street_number', data.street_number, { shouldValidate: true })
      if (data.complement)   setValue('complement',     data.complement,    { shouldValidate: true })
      if (data.neighborhood) setValue('neighborhood',   data.neighborhood,  { shouldValidate: true })
      if (data.city)         setValue('city',           data.city,          { shouldValidate: true })
      if (data.state)        setValue('state',          data.state,         { shouldValidate: true })
      toast.success('Dados da empresa preenchidos via CNPJ')
    }
  }, [docType, setValue])

  // ─── Submit ────────────────────────────────────────────────────────────

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true)
    try {
      const payload = {
        ...values,
        source: values.source as CustomerSource | undefined,
      } as CustomerFormData

      const result = mode === 'create'
        ? await createCustomer(payload)
        : await updateCustomer(customer!.id, payload)

      if (result.success) {
        toast.success(mode === 'create' ? 'Cliente criado com sucesso!' : 'Cliente atualizado!')
        router.push(result.data ? `/clientes/${result.data.id}` : '/clientes')
        router.refresh()
      } else {
        toast.error(result.error ?? 'Erro ao salvar cliente')
      }
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

      {/* Dados pessoais */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dados do Cliente</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Nome */}
          <div className="md:col-span-2 space-y-1.5">
            <Label htmlFor="name">Nome completo <span className="text-destructive">*</span></Label>
            <Input id="name" {...register('name')} placeholder="João da Silva" />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          {/* Empresa */}
          <div className="space-y-1.5">
            <Label htmlFor="company_name">Empresa / Razão social</Label>
            <div className="relative">
              <Input id="company_name" {...register('company_name')} placeholder="Nome da empresa" />
              {loadingCNPJ && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <Label>Status <span className="text-destructive">*</span></Label>
            <Select
              defaultValue={customer?.status ?? 'active'}
              onValueChange={(v) => setValue('status', v as FormValues['status'])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="prospect">Prospect</SelectItem>
                <SelectItem value="inactive">Inativo</SelectItem>
                <SelectItem value="blocked">Bloqueado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tipo de documento */}
          <div className="space-y-1.5">
            <Label>Tipo de documento</Label>
            <Select
              defaultValue={customer?.document_type ?? ''}
              onValueChange={(v) => {
                setValue('document_type', v as FormValues['document_type'])
                setValue('document', '')
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecionar..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cpf">CPF (Pessoa Física)</SelectItem>
                <SelectItem value="cnpj">CNPJ (Pessoa Jurídica)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Documento */}
          <div className="space-y-1.5">
            <Label htmlFor="document">
              {docType === 'cnpj' ? 'CNPJ' : 'CPF'}
              {docType === 'cnpj' && (
                <span className="ml-2 text-xs text-muted-foreground">(auto-preenche empresa)</span>
              )}
            </Label>
            <div className="relative">
              <Input
                id="document"
                {...register('document')}
                placeholder={docType === 'cnpj' ? '00.000.000/0001-00' : '000.000.000-00'}
                onChange={(e) => {
                  const raw  = e.target.value.replace(/\D/g, '')
                  const fmt  = docType === 'cnpj' ? formatCNPJ(raw) : formatCPF(raw)
                  setValue('document', fmt)
                }}
                onBlur={(e) => handleCNPJBlur(e.target.value)}
              />
              {loadingCNPJ && (
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
            {errors.document && <p className="text-xs text-destructive">{errors.document.message}</p>}
          </div>

        </CardContent>
      </Card>

      {/* Contato */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Contato</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">

          <div className="space-y-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" {...register('email')} placeholder="joao@email.com" />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone">Telefone</Label>
            <Input
              id="phone"
              {...register('phone')}
              placeholder="(11) 99999-9999"
              onChange={(e) => setValue('phone', formatPhone(e.target.value))}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="whatsapp">WhatsApp</Label>
            <Input
              id="whatsapp"
              {...register('whatsapp')}
              placeholder="(11) 99999-9999"
              onChange={(e) => setValue('whatsapp', formatPhone(e.target.value))}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Origem</Label>
            <Select
              defaultValue={customer?.source ?? ''}
              onValueChange={(v) => setValue('source', v as CustomerSource)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Como chegou até nós?" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CUSTOMER_SOURCE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{String(label)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

        </CardContent>
      </Card>

      {/* Endereço */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Endereço</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-6 gap-4">

          <div className="md:col-span-2 space-y-1.5">
            <Label htmlFor="zip_code">CEP</Label>
            <div className="relative">
              <Input
                id="zip_code"
                {...register('zip_code')}
                placeholder="00000-000"
                maxLength={9}
                onChange={(e) => setValue('zip_code', formatCEP(e.target.value))}
                onBlur={(e) => handleCEPBlur(e.target.value)}
              />
              {loadingCEP && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
          </div>

          <div className="md:col-span-3 space-y-1.5">
            <Label htmlFor="street">Logradouro</Label>
            <Input id="street" {...register('street')} placeholder="Rua, Avenida..." />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="street_number">Número</Label>
            <Input id="street_number" {...register('street_number')} placeholder="123" />
          </div>

          <div className="md:col-span-2 space-y-1.5">
            <Label htmlFor="complement">Complemento</Label>
            <Input id="complement" {...register('complement')} placeholder="Apto, sala..." />
          </div>

          <div className="md:col-span-2 space-y-1.5">
            <Label htmlFor="neighborhood">Bairro</Label>
            <Input id="neighborhood" {...register('neighborhood')} />
          </div>

          <div className="md:col-span-1 space-y-1.5">
            <Label htmlFor="city">Cidade</Label>
            <Input id="city" {...register('city')} />
          </div>

          <div className="space-y-1.5">
            <Label>Estado</Label>
            <Select
              defaultValue={customer?.state ?? ''}
              onValueChange={(v) => setValue('state', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="UF" />
              </SelectTrigger>
              <SelectContent>
                {BR_STATES.map((uf: string) => (
                  <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

        </CardContent>
      </Card>

      {/* Tags e notas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tags e Observações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">

          <div className="space-y-1.5">
            <Label>Tags</Label>
            <TagsInput
              value={watch('tags') ?? []}
              onChange={(tags) => setValue('tags', tags)}
            />
            <p className="text-xs text-muted-foreground">
              Pressione Enter ou vírgula para adicionar uma tag
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Informações adicionais sobre o cliente..."
              rows={4}
            />
          </div>

        </CardContent>
      </Card>

      {/* Ações */}
      <div className="flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={submitting}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {mode === 'create' ? 'Criar cliente' : 'Salvar alterações'}
        </Button>
      </div>

      </form>
  )
}
</form>
  )
}
