'use server'

import { revalidatePath } from 'next/cache'
import { createClient }   from '@/lib/supabase/server'
import type {
  Customer,
  CustomerFormData,
  CustomerFilters,
  PaginatedResponse,
} from '@/types'

// ─── Helpers ────────────────────────────────────────────────────────────────

async function getCompanyId(): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from('users')
    .select('company_id')
    .eq('id', user.id)
    .single()
  return (data as any)?.company_id ?? null
}

// ─── READ ────────────────────────────────────────────────────────────────────

export async function getCustomers(
  filters: CustomerFilters = {},
): Promise<PaginatedResponse<Customer>> {
  const supabase   = await createClient()
  const companyId  = await getCompanyId()
  if (!companyId) return { data: [], total: 0, page: 1, pageSize: 20, totalPages: 0 }

  const {
    search    = '',
    status    = '',
    source    = '',
    tag       = '',
    city      = '',
    state     = '',
    page      = 1,
    pageSize  = 20,
    sortBy    = 'created_at',
    sortOrder = 'desc',
  } = filters

  let query = (supabase as any)
    .from('customers')
    .select('*', { count: 'exact' })
    .eq('company_id', companyId)

  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%,company_name.ilike.%${search}%`)
  }
  if (status) query = query.eq('status', status)
  if (source) query = query.eq('source', source)
  if (tag)    query = query.contains('tags', [tag])
  if (city)   query = query.ilike('city', `%${city}%`)
  if (state)  query = query.eq('state', state)

  const from = (page - 1) * pageSize
  const to   = from + pageSize - 1

  const { data, error, count } = await query
    .order(sortBy, { ascending: sortOrder === 'asc' })
    .range(from, to)

  if (error) {
    console.error('getCustomers error:', error)
    return { data: [], total: 0, page, pageSize, totalPages: 0 }
  }

  const total      = count ?? 0
  const totalPages = Math.ceil(total / pageSize)

  return { data: (data ?? []) as Customer[], total, page, pageSize, totalPages }
}

export async function getCustomerById(id: string): Promise<Customer | null> {
  const supabase  = await createClient()
  const companyId = await getCompanyId()
  if (!companyId) return null

  const { data, error } = await (supabase as any)
    .from('customers')
    .select('*')
    .eq('id', id)
    .eq('company_id', companyId)
    .single()

  if (error) return null
  return data as Customer
}

// ─── CREATE ──────────────────────────────────────────────────────────────────

export async function createCustomer(
  formData: CustomerFormData,
): Promise<{ success: boolean; data?: Customer; error?: string }> {
  const supabase  = await createClient()
  const companyId = await getCompanyId()
  if (!companyId) return { success: false, error: 'Empresa não encontrada' }

  const { data: { user } } = await supabase.auth.getUser()

  // Limpar campos vazios
  const clean = Object.fromEntries(
    Object.entries(formData).filter(([, v]) => v !== '' && v !== undefined),
  )

  const { data, error } = await (supabase as any)
    .from('customers')
    .insert({
      ...clean,
      company_id: companyId,
      created_by: user?.id,
      tags: formData.tags ?? [],
    })
    .select()
    .single()

  if (error) {
    console.error('createCustomer error:', error)
    return { success: false, error: 'Erro ao criar cliente. Tente novamente.' }
  }

  revalidatePath('/clientes')
  return { success: true, data: data as Customer }
}

// ─── UPDATE ──────────────────────────────────────────────────────────────────

export async function updateCustomer(
  id: string,
  formData: Partial<CustomerFormData>,
): Promise<{ success: boolean; data?: Customer; error?: string }> {
  const supabase  = await createClient()
  const companyId = await getCompanyId()
  if (!companyId) return { success: false, error: 'Empresa não encontrada' }

  const clean = Object.fromEntries(
    Object.entries(formData).filter(([, v]) => v !== '' && v !== undefined),
  )

  const { data, error } = await (supabase as any)
    .from('customers')
    .update({ ...clean, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('company_id', companyId)
    .select()
    .single()

  if (error) {
    console.error('updateCustomer error:', error)
    return { success: false, error: 'Erro ao atualizar cliente.' }
  }

  revalidatePath('/clientes')
  revalidatePath(`/clientes/${id}`)
  return { success: true, data: data as Customer }
}

// ─── DELETE ──────────────────────────────────────────────────────────────────

export async function deleteCustomer(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase  = await createClient()
  const companyId = await getCompanyId()
  if (!companyId) return { success: false, error: 'Empresa não encontrada' }

  const { error } = await (supabase as any)
    .from('customers')
    .delete()
    .eq('id', id)
    .eq('company_id', companyId)

  if (error) {
    console.error('deleteCustomer error:', error)
    return { success: false, error: 'Erro ao excluir cliente.' }
  }

  revalidatePath('/clientes')
  return { success: true }
}

// ─── BULK DELETE ─────────────────────────────────────────────────────────────

export async function deleteCustomers(
  ids: string[],
): Promise<{ success: boolean; count?: number; error?: string }> {
  const supabase  = await createClient()
  const companyId = await getCompanyId()
  if (!companyId) return { success: false, error: 'Empresa não encontrada' }

  const { error, count } = await (supabase as any)
    .from('customers')
    .delete({ count: 'exact' })
    .in('id', ids)
    .eq('company_id', companyId)

  if (error) return { success: false, error: 'Erro ao excluir clientes.' }

  revalidatePath('/clientes')
  return { success: true, count: count ?? ids.length }
}

// ─── IMPORT CSV ──────────────────────────────────────────────────────────────

export async function importCustomers(
  rows: CustomerFormData[],
): Promise<{ success: boolean; imported?: number; errors?: number; error?: string }> {
  const supabase  = await createClient()
  const companyId = await getCompanyId()
  if (!companyId) return { success: false, error: 'Empresa não encontrada' }

  const { data: { user } } = await supabase.auth.getUser()

  const records = rows.map((r) => ({
    ...r,
    company_id: companyId,
    created_by: user?.id,
    tags:       r.tags ?? [],
    status:     r.status ?? 'active',
  }))

  // Inserção em lotes de 100
  let imported = 0
  let errors   = 0

  for (let i = 0; i < records.length; i += 100) {
    const batch = records.slice(i, i + 100)
    const { error, count } = await (supabase as any)
      .from('customers')
      .insert(batch, { count: 'exact' })
    if (error) errors += batch.length
    else       imported += count ?? batch.length
  }

  revalidatePath('/clientes')
  return { success: true, imported, errors }
}

// ─── GET TAGS ─────────────────────────────────────────────────────────────────

export async function getCustomerTags(): Promise<string[]> {
  const supabase  = await createClient()
  const companyId = await getCompanyId()
  if (!companyId) return []

  const { data } = await (supabase as any)
    .from('customers')
    .select('tags')
    .eq('company_id', companyId)
    .not('tags', 'eq', '{}')

  if (!data) return []

  const allTags = (data as { tags: string[] }[]).flatMap((r) => r.tags)
  return [...new Set(allTags)].sort()
}
