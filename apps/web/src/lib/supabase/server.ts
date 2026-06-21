import { createServerClient } from '@supabase/ssr'
import type { CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

/**
 * Cliente Supabase para Server Components e Route Handlers.
 * Usa a sessão do usuário via cookies (anon key + RLS).
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options as any)
            )
          } catch {
            // Ignorar em Server Components read-only
          }
        },
      },
    },
  )
}

/**
 * Cliente Supabase com service_role (bypass RLS).
 * Usar apenas em operações administrativas server-side.
 * Requer SUPABASE_SERVICE_ROLE_KEY no .env.local
 */
export function createAdminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY não configurado. Necessário apenas para operações admin.')
  }
  // Importação dinâmica para evitar tree-shaking issues
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createClient: _createClient } = require('@supabase/supabase-js') as typeof import('@supabase/supabase-js')
  return _createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}
