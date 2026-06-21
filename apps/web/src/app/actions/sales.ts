'use server'

import { createClient }   from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Sale, SaleFormData, SaleItem, Product, BaseFilters } from '@/types'

const SALE_SELECT = `
  *,
  customer:customers(id, name, company_name),
  lead:leads(id, title),
  assigned_user:users!sales_assigned_to_fkey(id, first_name, last_name),
  items:sale_items(*, product:products(id, name, price, unit))
`

export interface SaleFilters extends BaseFilters {
  status?:    string
  customerId?: string
}

// ─── Get Sales ────────────────────────────────────────────────────────────────

export async function getSales(filters: SaleFilters = {}): Promise<{ data: Sale[]; total: number }> {
  const supabase = await createClient()
  const page     = filters.page     ?? 1
  const pageSize = filters.pageSize ?? 50
  const from     = (page - 1) * pageSize
  const to       = from + pageSize - 1

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let q: any = (supabase as any).from('sales').select(SALE_SELECT, { count: 'exact' })
  if (filters.search)     q = q.ilike('title', `%${filters.search}%`)
  if (filters.status)     q = q.eq('status', filters.status)
  if (filters.customerId) q = q.eq('customer_id', filters.customerId)
  q = q.order('created_at', { ascending: false }).range(from, to)

  const { data, error, count } = await q
  if (error) { console.error('getSales:', error); return { data: [], total: 0 } }
  return { data: (data ?? []) as Sale[], total: count ?? 0 }
}

// ─── Get Sale by ID ───────────────────────────────────────────────────────────

export async function getSaleById(id: string): Promise<Sale | null> {
  const supabase = await createClient()
  const { data, error } = await (supabase as any)
    .from('sales').select(SALE_SELECT).eq('id', id).single()
  if (error) return null
  return data as Sale
}

// ─── Get Products ─────────────────────────────────────────────────────────────

export async function getProducts(): Promise<Product[]> {
  const supabase = await createClient()
  const { data } = await supabase.from('products').select('*').eq('status', 'active').order('name')
  return (data ?? []) as Product[]
}

// ─── Create Sale ──────────────────────────────────────────────────────────────

export async function createSale(formData: SaleFormData): Promise<{ success: boolean; data?: Sale; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Não autenticado' }

  const totalValue = formData.items.reduce((acc, i) => acc + i.total, 0)
  const discount   = formData.discount ?? 0
  const finalValue = totalValue - discount
  const commissionRate  = formData.commission_rate ?? 0
  const commissionValue = finalValue * (commissionRate / 100)

  const salePayload = {
    title:            formData.title,
    customer_id:      formData.customer_id || null,
    lead_id:          formData.lead_id     || null,
    status:           formData.status,
    total_value:      totalValue,
    discount,
    final_value:      finalValue,
    commission_rate:  commissionRate,
    commission_value: commissionValue,
    notes:            formData.notes       || null,
    sold_at:          formData.sold_at     || null,
    assigned_to:      formData.assigned_to || null,
    created_by:       user.id,
  }

  const { data: sale, error } = await (supabase as any)
    .from('sales').insert(salePayload).select().single()
  if (error) return { success: false, error: error.message }

  if (formData.items.length > 0) {
    const items = formData.items.map((item) => ({ ...item, sale_id: sale.id }))
    const { error: itemsError } = await (supabase as any).from('sale_items').insert(items)
    if (itemsError) console.error('sale_items insert error:', itemsError)
  }

  revalidatePath('/vendas')
  return { success: true, data: sale as Sale }
}

// ─── Update Sale ──────────────────────────────────────────────────────────────

export async function updateSale(id: string, formData: Partial<SaleFormData>): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (formData.title)           updates.title           = formData.title
  if (formData.status)          updates.status          = formData.status
  if (formData.customer_id)     updates.customer_id     = formData.customer_id
  if (formData.notes !== undefined) updates.notes       = formData.notes
  if (formData.sold_at)         updates.sold_at         = formData.sold_at
  if (formData.discount != null) {
    updates.discount      = formData.discount
    const totalValue      = formData.items?.reduce((acc, i) => acc + i.total, 0) ?? 0
    updates.total_value   = totalValue
    updates.final_value   = totalValue - (formData.discount ?? 0)
    const rate            = formData.commission_rate ?? 0
    updates.commission_rate  = rate
    updates.commission_value = (updates.final_value as number) * (rate / 100)
  }

  const { error } = await (supabase as any).from('sales').update(updates).eq('id', id)
  if (error) return { success: false, error: error.message }

  if (formData.items) {
    await (supabase as any).from('sale_items').delete().eq('sale_id', id)
    if (formData.items.length > 0) {
      const items = formData.items.map((item) => ({ ...item, sale_id: id }))
      await (supabase as any).from('sale_items').insert(items)
    }
  }

  revalidatePath('/vendas')
  revalidatePath(`/vendas/${id}`)
  return { success: true }
}

// ─── Delete Sale ──────────────────────────────────────────────────────────────

export async function deleteSale(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.from('sales').delete().eq('id', id)
  if (error) return { success: false, error: error.message }
  revalidatePath('/vendas')
  return { success: true }
}

// ─── Sales Summary ────────────────────────────────────────────────────────────

export async function getSalesSummary(): Promise<{
  total: number
  completed: number
  pending: number
  totalValue: number
  completedValue: number
}> {
  const supabase = await createClient()
  const { data } = await (supabase as any).from('sales').select('status, final_value')
  if (!data) return { total: 0, completed: 0, pending: 0, totalValue: 0, completedValue: 0 }

  const total          = data.length
  const completed      = data.filter((s: any) => s.status === 'completed').length
  const pending        = data.filter((s: any) => s.status === 'pending').length
  const totalValue     = data.reduce((acc: number, s: any) => acc + (s.final_value ?? 0), 0)
  const completedValue = data.filter((s: any) => s.status === 'completed').reduce((acc: number, s: any) => acc + (s.final_value ?? 0), 0)
  return { total, completed, pending, totalValue, completedValue }
}
