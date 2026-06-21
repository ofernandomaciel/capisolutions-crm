'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bell, Search, ChevronDown, Settings, LogOut, User, Building2 } from 'lucide-react'
import { cn, getInitials } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import { useAuth } from '@/hooks/useAuth'

// Mapa de títulos de página
const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  '/':                     { title: 'Dashboard',       subtitle: 'Visão geral do negócio' },
  '/customers':            { title: 'Clientes',         subtitle: 'Gerencie seus clientes' },
  '/leads':                { title: 'Leads',            subtitle: 'Pipeline comercial' },
  '/sales':                { title: 'Vendas',           subtitle: 'Controle de vendas' },
  '/finance':              { title: 'Financeiro',       subtitle: 'Gestão financeira' },
  '/reports':              { title: 'Relatórios',       subtitle: 'Análises e BI' },
  '/settings':             { title: 'Configurações',    subtitle: 'Preferências do sistema' },
  '/settings/users':       { title: 'Usuários',         subtitle: 'Gerenciar equipe' },
  '/ai':                   { title: 'Inteligência Artificial', subtitle: 'Configurações de IA' },
  '/integrations/whatsapp': { title: 'WhatsApp',        subtitle: 'Integração Evolution API' },
  '/integrations/n8n':     { title: 'Automações',       subtitle: 'Integração n8n' },
  '/admin/companies':      { title: 'Empresas',         subtitle: 'Gestão de contas' },
}

interface HeaderProps {
  sidebarCollapsed: boolean
}

export function Header({ sidebarCollapsed }: HeaderProps) {
  const pathname = usePathname()
  const { signOut } = useAuth()
  const user    = useAuthStore((s) => s.user)
  const company = useAuthStore((s) => s.company)

  const [showUserMenu,   setShowUserMenu]   = useState(false)
  const [showSearch,     setShowSearch]     = useState(false)
  const [notifications,  setNotifications]  = useState(3) // placeholder

  const pageInfo = PAGE_TITLES[pathname] ?? { title: 'CapiSolutions CRM', subtitle: '' }

  return (
    <header className={cn(
      'fixed top-0 right-0 z-30 h-16 bg-background border-b border-border',
      'flex items-center justify-between px-6 gap-4 transition-all duration-300',
      sidebarCollapsed ? 'left-[72px]' : 'left-[260px]',
    )}>
      {/* Page title */}
      <div className="min-w-0">
        <h1 className="text-lg font-semibold text-foreground leading-tight truncate">
          {pageInfo.title}
        </h1>
        {pageInfo.subtitle && (
          <p className="text-xs text-muted-foreground truncate hidden sm:block">
            {pageInfo.subtitle}
          </p>
        )}
      </div>

      {/* Ações */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Search toggle */}
        <button
          onClick={() => setShowSearch(!showSearch)}
          className="h-9 w-9 flex items-center justify-center rounded-lg
                     text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <Search className="h-4 w-4" />
        </button>

        {/* Notificações */}
        <button className="relative h-9 w-9 flex items-center justify-center rounded-lg
                           text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
          <Bell className="h-4 w-4" />
          {notifications > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full" />
          )}
        </button>

        {/* Separador */}
        <div className="h-6 w-px bg-border mx-1" />

        {/* Menu do usuário */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 h-9 px-2 rounded-lg hover:bg-muted transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full rounded-full object-cover" />
              ) : (
                <span className="text-white text-xs font-semibold">
                  {user ? getInitials(user.fullName) : '?'}
                </span>
              )}
            </div>
            <div className="hidden md:block text-left min-w-0">
              <p className="text-sm font-medium text-foreground leading-tight truncate max-w-[120px]">
                {user?.firstName ?? 'Usuário'}
              </p>
              <p className="text-xs text-muted-foreground leading-tight">
                {user?.roleLabel}
              </p>
            </div>
            <ChevronDown className={cn('h-3 w-3 text-muted-foreground transition-transform', showUserMenu && 'rotate-180')} />
          </button>

          {/* Dropdown */}
          {showUserMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowUserMenu(false)}
              />
              <div className="absolute right-0 top-full mt-1.5 w-56 bg-popover border border-border
                              rounded-xl shadow-card-lg z-50 overflow-hidden animate-fade-in">
                {/* Info usuário */}
                <div className="px-4 py-3 border-b border-border">
                  <p className="text-sm font-medium text-foreground">{user?.fullName}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  {company && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <Building2 className="h-3 w-3 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground truncate">{company.name}</p>
                    </div>
                  )}
                </div>

                {/* Menu items */}
                <div className="py-1">
                  <Link
                    href="/settings/profile"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground
                               hover:bg-muted transition-colors"
                  >
                    <User className="h-4 w-4 text-muted-foreground" />
                    Meu Perfil
                  </Link>
                  <Link
                    href="/settings"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground
                               hover:bg-muted transition-colors"
                  >
                    <Settings className="h-4 w-4 text-muted-foreground" />
                    Configurações
                  </Link>
                </div>

                <div className="border-t border-border py-1">
                  <button
                    onClick={() => { setShowUserMenu(false); signOut() }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-destructive
                               hover:bg-destructive/10 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Sair
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
