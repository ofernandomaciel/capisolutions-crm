'use server'

import { createClient } from '@/lib/supabase/server'

export async function getDashboardData() {
  const supabase = await createClient()
  const sb = supabase as any

  const now       = new Date()
  const y         = now.getFullYear()
  const m         = String(now.getMonth() + 1).padStart(2, '0')
  const monthStart = `${y}-${m}-01`
  const prevMonthDate = new Date(y, now.getMonth() - 1, 1)
  const py = prevMonthDate.getFullYear()
  const pm = String(prevMonthDate.getMonth() + 1).padStart(2, '0')
  const prevMonthStart = `${py}-${pm}-01`

  const [
    { count: totalCustomers },
    { count: newCustomersThisMonth },
    { count: newCustomersPrevMonth },
    { data: leadsData },
    { data: salesData },
    { data: revenuesData },
    { data: tasksData },
    { data: recentCustomers },
    { data: upcomingTasks },
    { data: stagesData },
  ] = await Promise.all([
    sb.from('customers').select('*', { count: 'exact', head: true }),
    sb.from('customers').select('*', { count: 'exact', head: true }).gte('created_at', monthStart),
    sb.from('customers').select('*', { count: 'exact', head: true }).gte('created_at', prevMonthStart).lt('created_at', monthStart),
    sb.from('leads').select('id, status, value, stage_id, created_at').eq('status', 'open'),
    sb.from('sales').select('id, status, final_value, created_at').gte('created_at', monthStart),
    sb.from('revenues').select('value, status, paid_date').gte('paid_date', monthStart).eq('status', 'paid'),
    sb.from('tasks').select('id, status, due_date').neq('status', 'completed').neq('status', 'cancelled'),
    sb.from('customers').select('id, name, email, status, created_at').order('created_at', { ascending: false }).limit(5),
    sb.from('tasks').select('id, title, type, priority, due_date, customer:customers(name), lead:leads(title)').neq('status', 'completed').neq('status', 'cancelled').order('due_date', { ascending: true }).limit(5),
    sb.from('lead_stages').select('id, name, color, position').order('position'),
  ])

  const leads    = (leadsData    ?? []) as any[]
  const sales    = (salesData    ?? []) as any[]
  const revenues = (revenuesData ?? []) as any[]
  const tasks    = (tasksData    ?? []) as any[]
  const stages   = (stagesData   ?? []) as any[]

  // KPIs
  const activeLeads        = leads.length
  const pipelineValue      = leads.reduce((a: number, l: any) => a + (l.value ?? 0), 0)
  const monthlyRevenue     = revenues.reduce((a: number, r: any) => a + (r.value ?? 0), 0)
  const monthlySales       = sales.filter((s: any) => s.status === 'completed').length
  const monthlySalesValue  = sales.filter((s: any) => s.status === 'completed').reduce((a: number, s: any) => a + (s.final_value ?? 0), 0)
  const overdueTasks       = tasks.filter((t: any) => t.due_date && new Date(t.due_date) < now).length
  const pendingTasks       = tasks.filter((t: any) => t.status === 'pending').length

  // Growth
  const custGrowth = newCustomersPrevMonth
    ? Math.round(((newCustomersThisMonth ?? 0) - newCustomersPrevMonth) / newCustomersPrevMonth * 100)
    : null

  // Leads by stage
  const leadsByStage = stages.map((s: any) => ({
    id:    s.id,
    name:  s.name,
    color: s.color,
    count: leads.filter((l: any) => l.stage_id === s.id).length,
    value: leads.filter((l: any) => l.stage_id === s.id).reduce((a: number, l: any) => a + (l.value ?? 0), 0),
  })).filter((s: any) => s.count > 0)

  return {
    kpis: {
      totalCustomers:   totalCustomers    ?? 0,
      custGrowth,
      activeLeads,
      pipelineValue,
      monthlyRevenue,
      monthlySales,
      monthlySalesValue,
      overdueTasks,
      pendingTasks,
    },
    leadsByStage,
    recentCustomers: (recentCustomers ?? []) as any[],
    upcomingTasks:   (upcomingTasks   ?? []) as any[],
  }
}
