'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type {
  Lead,
  LeadStage,
  LeadFilters,
  LeadFormData,
} from '@/types'

const PAGE_SIZE = 50

// ─── Helpers ─────────────────────────────────────────────────────────────────

const LEAD_SELECT = `
  *,
  customer:customers(id, name, company_name),
  stage:lead_stages(id, name, color, position, is_closed, is_lost),
  assigned_user:users!leads_assigned_to_fkey(id, first_name, last_name)
`

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyLeadFilters(q: any, filters: LeadFilters = {}) {
  if (filters.search)     q = q.ilike('title', `%${filters.search}%`)
  if (filters.status)     q = q.eq('status', filters.status)
  if (filters.priority)   q = q.eq('priority', filters.priority)
  if (filters.source)     q = q.eq('source', filters.source)
  if (filters.stage_id)   q = q.eq('stage_id', filters.stage_id)
  if (filters.assignedTo) q = q.eq('assigned_to', filters.assignedTo)
  return q
}

// ─── Get Lead Stages ──────────────────────────────────────────────────────────

export async function getLeadStages(): Promise<LeadStage[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('lead_stages')
    .select('*')
    .order('position', { ascending: true })

  if (error) {
    console.error('getLeadStages error:', error)
    return []
  }
  return data ?? []
}

// ─── Get Leads (para kanban — agrupados por stage) ────────────────────────────

export async function getLeads(filters: LeadFilters = {}): Promise<{
  data: Lead[]
  total: number
}> {
  const supabase = await createClient()
  const page     = filters.page     ?? 1
  const pageSize = filters.pageSize ?? PAGE_SIZE
  const from     = (page - 1) * pageSize
  const to       = from + pageSize - 1

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let q: any = supabase.from('leads').select(LEAD_SELECT, { count: 'exact' })
  q = applyLeadFilters(q, filters)
  q = q.order('created_at', { ascending: false }).range(from, to)

  const { data, error, count } = await q

  if (error) {
    console.error('getLeads error:', error)
    return { data: [], total: 0 }
  }
  return { data: (data ?? []) as Lead[], total: count ?? 0 }
}

// ─── Get Leads for Kanban (all, grouped by stage) ─────────────────────────────

export async function getLeadsForKanban(filters: Omit<LeadFilters, 'page' | 'pageSize'> = {}): Promise<Lead[]> {
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let q: any = supabase.from('leads').select(LEAD_SELECT)
  q = applyLeadFilters(q, filters)
  q = q.eq('status', 'open').order('created_at', { ascending: false })

  const { data, error } = await q

  if (error) {
    console.error('getLeadsForKanban error:', error)
    return []
  }
  return (data ?? []) as Lead[]
}

// ─── Get Lead by ID ───────────────────────────────────────────────────────────

export async function getLeadById(id: string): Promise<Lead | null> {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('leads')
    .select(LEAD_SELECT)
    .eq('id', id)
    .single()

  if (error) return null
  return data as Lead
}

// ─── Create Lead ──────────────────────────────────────────────────────────────

export async function createLead(formData: LeadFormData): Promise<{
  success: boolean
  data?: Lead
  error?: string
}> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Não autenticado' }

  const payload = {
    ...formData,
    value:      formData.value    || null,
    tags:       formData.tags     ?? [],
    created_by: user.id,
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('leads')
    .insert(payload)
    .select()
    .single()

  if (error) return { success: false, error: error.message }

  revalidatePath('/leads')
  return { success: true, data: data as Lead }
}

// ─── Update Lead ──────────────────────────────────────────────────────────────

export async function updateLead(id: string, formData: Partial<LeadFormData>): Promise<{
  success: boolean
  data?: Lead
  error?: string
}> {
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('leads')
    .update({ ...formData, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) return { success: false, error: error.message }

  revalidatePath('/leads')
  revalidatePath(`/leads/${id}`)
  return { success: true, data: data as Lead }
}

// ─── Move Lead to Stage (drag-and-drop) ───────────────────────────────────────

export async function moveLeadStage(leadId: string, stageId: string): Promise<{
  success: boolean
  error?: string
}> {
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('leads')
    .update({ stage_id: stageId, updated_at: new Date().toISOString() })
    .eq('id', leadId)

  if (error) return { success: false, error: error.message }

  revalidatePath('/leads')
  return { success: true }
}

// ─── Mark Lead as Won / Lost ──────────────────────────────────────────────────

export async function markLeadWon(id: string): Promise<{ success: boolean; error?: string }> {
  return updateLead(id, { status: 'won' }).then((r) => ({
    success: r.success,
    error:   r.error,
  }))
}

export async function markLeadLost(
  id: string,
  reason?: string,
): Promise<{ success: boolean; error?: string }> {
  return updateLead(id, { status: 'lost', lost_reason: reason }).then((r) => ({
    success: r.success,
    error:   r.error,
  }))
}

// ─── Delete Lead ──────────────────────────────────────────────────────────────

export async function deleteLead(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.from('leads').delete().eq('id', id)
  if (error) return { success: false, error: error.message }
  revalidatePath('/leads')
  return { success: true }
}

// ─── Update Stage Positions (após reorder) ───────────────────────────────────

export async function updateStagePositions(
  updates: { id: string; position: number }[],
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any
  const promises = updates.map(({ id, position }) =>
    sb.from('lead_stages').update({ position }).eq('id', id),
  )

  const results = await Promise.all(promises)
  const failed  = results.find((r) => r.error)
  if (failed?.error) return { success: false, error: failed.error.message }

  revalidatePath('/leads')
  return { success: true }
}

// ─── Get Lead Tags ────────────────────────────────────────────────────────────

export async function getLeadTags(): Promise<string[]> {
  const supabase = await createClient()
  const { data } = await supabase.from('leads').select('tags')
  if (!data) return []
  const all = data.flatMap((r: { tags: string[] }) => r.tags ?? [])
  return [...new Set(all)].sort()
}
