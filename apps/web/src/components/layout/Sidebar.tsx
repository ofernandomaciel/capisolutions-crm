'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, TrendingUp, ShoppingCart,
  DollarSign, BarChart3, Settings, ChevronLeft, ChevronRight,
  MessageCircle, Bot, Zap, Shield, Building2, LogOut,
  CheckSquare,
} from 'lucide-react'
import { cn, getInitials } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import { usePermissions } from '@/hooks/usePermissions'
import { useAuth } from '@/hooks/useAuth'
import type { NavItem } from '@/types'

const NAV_ITEMS: NavItem[] = [
  { title: 'Dashboard',  href: '/',          icon: LayoutDashboard, permission: 'dashboard.view' },
  { title: 'Clientes',   href: '/clientes',  icon: Users,           permission: 'customers.view' },
  { title: 'Leads',      href: '/leads',     icon: TrendingUp,      permission: 'leads.view' },
  { title: 'Vendas',     href: '/vendas',    icon: ShoppingCart,    permission: 'sales.view' },
  { title: 'Tarefas',    href: '/tarefas',   icon: CheckSquare,     permission: 'leads.view' },
  { title: 'Financeiro', href: '/financeiro',icon: DollarSign,      permission: 'finance.view' },
  { title: 'Relatorios', href: '/relatorios',icon: BarChart3,       permission: 'reports.view' },
]

const SECONDARY_NAV_ITEMS: NavItem[] = [
  { title: 'WhatsApp',      href: '/integrations/whatsapp', icon: MessageCircle, permission: 'settings.view' },
  { title: 'IA',            href: '/ai',                    icon: Bot,           permission: 'settings.view' },
  { title: 'Automacoes',    href: '/integrations/n8n',      icon: Zap,           permission: 'settings.view' },
]

const ADMIN_NAV_ITEMS: NavItem[] = [
  { title: 'Usuarios',     href: '/settings/users',   icon: Shield,    permission: 'users.view' },
  { title: 'Configuracoes',href: '/settings',          icon: Settings,  permission: 'settings.view' },
  { title: 'Empresas',     href: '/admin/companies',  icon: Building2, permission: 'admin.companies' },
]

interface SidebarProps {
  isCollapsed: boolean
  onToggle:    () => void
}

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const pathname    = usePathname()
  const { can }     = usePermissions()
  const { signOut } = useAuth()
  const user        = useAuthStore((s) => s.user)
  const company     = useAuthStore((s) => s.company)

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  const renderNavItem = (item: NavItem) => {
    if (item.permission && !can(item.permission)) return null
    const active = isActive(item.href)
    return (
      <Link
        key={item.href}
        href={item.href}
        title={isCollapsed ? item.title : undefined}
        className={cn(
          'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium',
          'transition-colors duration-150 group relative',
          active
            ? 'bg-primary text-white'
            : 'text-slate-400 hover:text-white hover:bg-white/10',
        )}
      >
        <item.icon className={cn('h-5 w-5 flex-shrink-0', active ? 'text-white' : '')} />
        {!isCollapsed && <span className="truncate">{item.title}</span>}
        {!isCollapsed && item.badge && (
          <span className="ml-auto bg-primary-500 text-white text-xs rounded-full px-1.5 py-0.5">
            {item.badge}
          </span>
        )}
        {isCollapsed && (
          <div className="absolute left-full ml-2 px-2 py-1 bg-secondary-800 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
            {item.title}
          </div>
        )}
      </Link>
    )
  }

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-40 flex flex-col',
        'bg-secondary-900 border-r border-white/5',
        'transition-all duration-300 ease-in-out',
        isCollapsed ? 'w-[72px]' : 'w-[260px]',
      )}
    >
      {/* Header */}
      <div className={cn(
        'flex items-center border-b border-white/5 h-16 px-4 flex-shrink-0',
        isCollapsed ? 'justify-center' : 'justify-between',
      )}>
        {!isCollapsed && (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <div className="min-w-0">
              <p className="text-white font-semibold text-sm truncate">CapiSolutions</p>
              {company && <p className="text-slate-500 text-xs truncate">{company.name}</p>}
            </div>
          </div>
        )}
        {isCollapsed && (
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">C</span>
          </div>
        )}
        <button
          onClick={onToggle}
          className={cn(
            'flex-shrink-0 p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-colors',
            isCollapsed && 'hidden',
          )}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>

      {isCollapsed && (
        <button
          onClick={onToggle}
          className="absolute -right-3 top-[74px] w-6 h-6 bg-secondary-800 border border-white/10 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-colors shadow-lg"
        >
          <ChevronRight className="h-3 w-3" />
        </button>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-4 space-y-1">
        {NAV_ITEMS.map(renderNavItem)}

        {!isCollapsed && (
          <div className="pt-4 pb-2">
            <p className="px-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Integracoes
            </p>
          </div>
        )}
        {isCollapsed && <div className="my-2 border-t border-white/5" />}
        {SECONDARY_NAV_ITEMS.map(renderNavItem)}

        {!isCollapsed && (
          <div className="pt-4 pb-2">
            <p className="px-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Administracao
            </p>
          </div>
        )}
        {isCollapsed && <div className="my-2 border-t border-white/5" />}
        {ADMIN_NAV_ITEMS.map(renderNavItem)}
      </nav>

      {/* Footer */}
      <div className={cn(
        'flex-shrink-0 border-t border-white/5 p-3',
        isCollapsed ? 'flex justify-center' : '',
      )}>
        <div className={cn(
          'flex items-center gap-3 rounded-lg p-2',
          !isCollapsed && 'hover:bg-white/5 cursor-pointer transition-colors',
        )}>
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full rounded-full object-cover" />
            ) : (
              <span className="text-white text-xs font-semibold">
                {user ? getInitials(user.fullName) : '?'}
              </span>
            )}
          </div>
          {!isCollapsed && (
            <>
              <div className="min-w-0 flex-1">
                <p className="text-white text-sm font-medium truncate">{user?.fullName}</p>
                <p className="text-slate-500 text-xs truncate">{user?.roleLabel}</p>
              </div>
              <button
                onClick={signOut}
                className="p-1.5 text-slate-500 hover:text-white hover:bg-white/10 rounded-md transition-colors flex-shrink-0"
                title="Sair"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </aside>
  )
}
