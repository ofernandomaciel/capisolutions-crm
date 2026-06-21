import { createServerClient } from '@supabase/ssr'
import type { CookieOptions } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'
import type { Database } from '@/types/database'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options as any)
          )
        },
      },
    },
  )

  // Refresh da sessão (obrigatório antes de qualquer verificação)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Rotas públicas (não requerem autenticação)
  const publicRoutes = [
    '/auth/login',
    '/auth/register',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/auth/callback',
  ]

  const isPublicRoute = publicRoutes.some((r) => pathname.startsWith(r))

  // Usuário não autenticado tentando acessar rota protegida
  if (!user && !isPublicRoute) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/auth/login'
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Usuário autenticado tentando acessar páginas de auth
  if (user && isPublicRoute && !pathname.startsWith('/auth/callback')) {
    const dashboardUrl = request.nextUrl.clone()
    dashboardUrl.pathname = '/'
    return NextResponse.redirect(dashboardUrl)
  }

  return supabaseResponse
}
