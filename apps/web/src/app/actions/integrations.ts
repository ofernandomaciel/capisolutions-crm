'use server'

import { createClient } from '@/lib/supabase/server'

export interface IntegrationConfig {
  id?:         string
  company_id?: string
  key:         string
  value:       string
  created_at?: string
  updated_at?: string
}

export async function getIntegrationConfig(key: string): Promise<string | null> {
  const supabase = await createClient()
  const sb = supabase as any
  const { data } = await sb
    .from('integration_configs')
    .select('value')
    .eq('key', key)
    .maybeSingle()
  return data?.value ?? null
}

export async function setIntegrationConfig(key: string, value: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const sb = supabase as any
  const { error } = await sb
    .from('integration_configs')
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key,company_id' })
  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function getAllIntegrationConfigs(): Promise<Record<string, string>> {
  const supabase = await createClient()
  const sb = supabase as any
  const { data } = await sb.from('integration_configs').select('key,value')
  if (!data) return {}
  return Object.fromEntries((data as any[]).map((r: any) => [r.key, r.value]))
}
