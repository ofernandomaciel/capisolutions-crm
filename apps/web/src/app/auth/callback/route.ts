import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import type { CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code        = requestUrl.searchParams.get('code')
  const next        = requestUrl.searchParams.get('next') ?? '/'
  const type        = requestUrl.searchParams.get('type') // 'recovery' | 'signup' | etc.

  if (code) {
    const cookieStore = await cookies()

    const supabase = createServerClient<Database>(
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
              // Ignorar em Server Components
            }
          },
        },
      },
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Redirecionamento após troca do code por sessão
      if (type === 'recovery') {
        // Recuperação de senha: vai para página de reset
        return NextResponse.redirect(new URL('/auth/reset-password', requestUrl.origin))
      }

      // Confirmação de e-mail normal: vai para o dashboard
      return NextResponse.redirect(new URL(next, requestUrl.origin))
    }
  }

  // Em caso de erro, redireciona para login com parâmetro de erro
  const loginUrl = new URL('/auth/login', requestUrl.origin)
  loginUrl.searchParams.set('error', 'auth_callback_error')
  return NextResponse.redirect(loginUrl)
}
