'use server'

import { createClient }   from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Task, TaskFormData, BaseFilters } from '@/types'

const TASK_SELECT = `
  *,
  customer:customers(id, name),
  lead:leads(id, title),
  assigned_user:users!tasks_assigned_to_fkey(id, first_name, last_name)
`

export interface TaskFilters extends BaseFilters {
  status?:   string
  type?:     string
  priority?: string
  overdue?:  boolean
}

export async function getTasks(filters: TaskFilters = {}): Promise<{ data: Task[]; total: number }> {
  const supabase = await createClient()
  const page     = filters.page     ?? 1
  const pageSize = filters.pageSize ?? 50
  const from     = (page - 1) * pageSize
  const to       = from + pageSize - 1

  let q: any = (supabase as any).from('tasks').select(TASK_SELECT, { count: 'exact' })
  if (filters.search)   q = q.ilike('title', `%${filters.search}%`)
  if (filters.status)   q = q.eq('status', filters.status)
  if (filters.type)     q = q.eq('type', filters.type)
  if (filters.priority) q = q.eq('priority', filters.priority)
  if (filters.overdue)  q = q.lt('due_date', new Date().toISOString()).neq('status', 'completed').neq('status', 'cancelled')
  q = q.order('due_date', { ascending: true, nullsFirst: false }).range(from, to)

  const { data, error, count } = await q
  if (error) { console.error('getTasks:', error); return { data: [], total: 0 } }
  return { data: (data ?? []) as Task[], total: count ?? 0 }
}

export async function getTaskById(id: string): Promise<Task | null> {
  const supabase = await createClient()
  const { data, error } = await (supabase as any).from('tasks').select(TASK_SELECT).eq('id', id).single()
  if (error) return null
  return data as Task
}

export async function createTask(formData: TaskFormData): Promise<{ success: boolean; data?: Task; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Não autenticado' }

  const { data, error } = await (supabase as any)
    .from('tasks')
    .insert({ ...formData, created_by: user.id })
    .select()
    .single()

  if (error) return { success: false, error: error.message }
  revalidatePath('/tarefas')
  return { success: true, data: data as Task }
}

export async function updateTask(id: string, formData: Partial<TaskFormData>): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { error } = await (supabase as any)
    .from('tasks').update({ ...formData, updated_at: new Date().toISOString() }).eq('id', id)
  if (error) return { success: false, error: error.message }
  revalidatePath('/tarefas')
  return { success: true }
}

export async function completeTask(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { error } = await (supabase as any).from('tasks').update({
    status:       'completed',
    completed_at: new Date().toISOString(),
    updated_at:   new Date().toISOString(),
  }).eq('id', id)
  if (error) return { success: false, error: error.message }
  revalidatePath('/tarefas')
  return { success: true }
}

export async function deleteTask(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.from('tasks').delete().eq('id', id)
  if (error) return { success: false, error: error.message }
  revalidatePath('/tarefas')
  return { success: true }
}

export async function getTasksSummary(): Promise<{
  pending: number; inProgress: number; completed: number; overdue: number
}> {
  const supabase = await createClient()
  const { data } = await (supabase as any).from('tasks').select('status, due_date')
  if (!data) return { pending: 0, inProgress: 0, completed: 0, overdue: 0 }
  const now = new Date().toISOString()
  return {
    pending:    data.filter((t: any) => t.status === 'pending').length,
    inProgress: data.filter((t: any) => t.status === 'in_progress').length,
    completed:  data.filter((t: any) => t.status === 'completed').length,
    overdue:    data.filter((t: any) => t.due_date && t.due_date < now && !['completed','cancelled'].includes(t.status)).length,
  }
}
