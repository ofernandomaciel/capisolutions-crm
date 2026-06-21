'use server'

import { createClient }   from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type {
  Revenue, Expense, FinancialCategory,
  RevenueFormData, ExpenseFormData, BaseFilters,
} from '@/types'

// ─── Categories ───────────────────────────────────────────────────────────────

export async function getCategories(type?: 'income' | 'expense'): Promise<FinancialCategory[]> {
  const supabase = await createClient()
  let q: any = (supabase as any).from('categories').select('*').order('name')
  if (type) q = q.eq('type', type)
  const { data } = await q
  return (data ?? []) as FinancialCategory[]
}

// ─── Revenues ─────────────────────────────────────────────────────────────────

export async function getRevenues(filters: BaseFilters & { status?: string } = {}): Promise<{ data: Revenue[]; total: number }> {
  const supabase = await createClient()
  const page = filters.page ?? 1
  const pageSize = filters.pageSize ?? 50
  const from = (page - 1) * pageSize
  const to   = from + pageSize - 1

  let q: any = (supabase as any)
    .from('revenues')
    .select('*, category:categories(id, name, color), customer:customers(id, name)', { count: 'exact' })

  if (filters.search) q = q.ilike('description', `%${filters.search}%`)
  if (filters.status) q = q.eq('status', filters.status)
  q = q.order('due_date', { ascending: false }).range(from, to)

  const { data, error, count } = await q
  if (error) { console.error('getRevenues:', error); return { data: [], total: 0 } }
  return { data: (data ?? []) as Revenue[], total: count ?? 0 }
}

export async function createRevenue(formData: RevenueFormData): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Não autenticado' }

  const { error } = await (supabase as any).from('revenues').insert({ ...formData, created_by: user.id })
  if (error) return { success: false, error: error.message }
  revalidatePath('/financeiro')
  return { success: true }
}

export async function updateRevenue(id: string, formData: Partial<RevenueFormData>): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { error } = await (supabase as any)
    .from('revenues').update({ ...formData, updated_at: new Date().toISOString() }).eq('id', id)
  if (error) return { success: false, error: error.message }
  revalidatePath('/financeiro')
  return { success: true }
}

export async function deleteRevenue(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.from('revenues').delete().eq('id', id)
  if (error) return { success: false, error: error.message }
  revalidatePath('/financeiro')
  return { success: true }
}

// ─── Expenses ─────────────────────────────────────────────────────────────────

export async function getExpenses(filters: BaseFilters & { status?: string } = {}): Promise<{ data: Expense[]; total: number }> {
  const supabase = await createClient()
  const page = filters.page ?? 1
  const pageSize = filters.pageSize ?? 50
  const from = (page - 1) * pageSize
  const to   = from + pageSize - 1

  let q: any = (supabase as any)
    .from('expenses')
    .select('*, category:categories(id, name, color)', { count: 'exact' })

  if (filters.search) q = q.ilike('description', `%${filters.search}%`)
  if (filters.status) q = q.eq('status', filters.status)
  q = q.order('due_date', { ascending: false }).range(from, to)

  const { data, error, count } = await q
  if (error) { console.error('getExpenses:', error); return { data: [], total: 0 } }
  return { data: (data ?? []) as Expense[], total: count ?? 0 }
}

export async function createExpense(formData: ExpenseFormData): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Não autenticado' }

  const { error } = await (supabase as any).from('expenses').insert({ ...formData, created_by: user.id })
  if (error) return { success: false, error: error.message }
  revalidatePath('/financeiro')
  return { success: true }
}

export async function updateExpense(id: string, formData: Partial<ExpenseFormData>): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { error } = await (supabase as any)
    .from('expenses').update({ ...formData, updated_at: new Date().toISOString() }).eq('id', id)
  if (error) return { success: false, error: error.message }
  revalidatePath('/financeiro')
  return { success: true }
}

export async function deleteExpense(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.from('expenses').delete().eq('id', id)
  if (error) return { success: false, error: error.message }
  revalidatePath('/financeiro')
  return { success: true }
}

// ─── Financial Summary ────────────────────────────────────────────────────────

export async function getFinancialSummary(): Promise<{
  totalRevenues: number
  totalExpenses: number
  balance: number
  pendingRevenues: number
  pendingExpenses: number
  overdueRevenues: number
  overdueExpenses: number
}> {
  const supabase = await createClient()
  const [revResult, expResult] = await Promise.all([
    (supabase as any).from('revenues').select('value, status'),
    (supabase as any).from('expenses').select('value, status'),
  ])

  const revs = (revResult.data ?? []) as { value: number; status: string }[]
  const exps = (expResult.data ?? []) as { value: number; status: string }[]

  const sum = (arr: { value: number; status: string }[], status?: string) =>
    arr.filter((r) => !status || r.status === status).reduce((acc, r) => acc + (r.value ?? 0), 0)

  const totalRevenues    = sum(revs, 'paid')
  const totalExpenses    = sum(exps, 'paid')
  const pendingRevenues  = sum(revs, 'pending')
  const pendingExpenses  = sum(exps, 'pending')
  const overdueRevenues  = sum(revs, 'overdue')
  const overdueExpenses  = sum(exps, 'overdue')

  return {
    totalRevenues,
    totalExpenses,
    balance: totalRevenues - totalExpenses,
    pendingRevenues,
    pendingExpenses,
    overdueRevenues,
    overdueExpenses,
  }
}
