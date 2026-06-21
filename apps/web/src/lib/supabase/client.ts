import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

// Cliente Supabase para uso no navegador (Client Components)
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

// Instância singleton para uso fora de hooks (ex: stores Zustand)
let _client: ReturnType<typeof createClient> | null = null

export function getSupabaseClient() {
  if (!_client) {
    _client = createClient()
  }
  return _client
}
