'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar }   from '@/components/layout/Sidebar'
import { Header }    from '@/components/layout/Header'
import { MobileNav } from '@/components/layout/MobileNav'
import { useAuth }   from '@/hooks/useAuth'
import { cn }        from '@/lib/utils'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router                           = useRouter()
  const { user, isLoading, isHydrated }  = useAuth()
  const [isCollapsed, setIsCollapsed]    = useState(false)
  const [isMounted,   setIsMounted]      = useState(false)

  useEffect(() => {
    setIsMounted(true)
    const saved = localStorage.getItem('sidebar-collapsed')
    if (saved === 'true') setIsCollapsed(true)
  }, [])

  const handleToggleSidebar = () => {
    const next = !isCollapsed
    setIsCollapsed(next)
    localStorage.setItem('sidebar-collapsed', String(next))
  }

  // Loading skeleton
  if (!isMounted || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center animate-pulse">
            <span className="text-white font-bold">C</span>
          </div>
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 bg-primary rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Usuário não autenticado — middleware já redireciona, mas garantia extra
  if (isHydrated && !user) {
    router.replace('/auth/login')
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar — desktop */}
      <div className="hidden md:block">
        <Sidebar isCollapsed={isCollapsed} onToggle={handleToggleSidebar} />
      </div>

      {/* Header */}
      <Header sidebarCollapsed={isCollapsed} />

      {/* Conteúdo principal — responsivo */}
      <main
        className={cn(
          'transition-all duration-300',
          'pt-16',                          // altura do header
          'pb-20 md:pb-6',                  // espaço para MobileNav no mobile
          'md:ml-[260px]',                  // margem lateral desktop
          isCollapsed && 'md:ml-[72px]',
        )}
      >
        <div className="p-4 md:p-6">
          {children}
        </div>
      </main>

      {/* Navegação mobile bottom */}
      <MobileNav />
    </div>
  )
}
