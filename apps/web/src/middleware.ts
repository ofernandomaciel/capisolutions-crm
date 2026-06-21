import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Processar todas as rotas exceto:
     * - _next/static (arquivos estáticos)
     * - _next/image  (otimização de imagens)
     * - favicon.ico, robots.txt, sitemap.xml
     * - arquivos com extensão (ex: .png, .svg)
     */
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
