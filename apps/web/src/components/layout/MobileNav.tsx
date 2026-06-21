'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, LayoutDashboard, Users, TrendingUp, ShoppingCart, DollarSign, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePermissions } from '@/hooks/usePermissions'

const MOBILE_NAV = [
  { href: '/',          icon: LayoutDashboard, label: 'Dashboard',  permission: 'dashboard.view' as const },
  { href: '/customers', icon: Users,           label: 'Clientes',   permission: 'customers.view' as const },
  { href: '/leads',     icon: TrendingUp,      label: 'Leads',      permission: 'leads.view' as const },
  { href: '/sales',     icon: ShoppingCart,    label: 'Vendas',     permission: 'sales.view' as const },
  { href: '/finance',   icon: DollarSign,      label: 'Financeiro', permission: 'finance.view' as const },
]

export function MobileNav() {
  const pathname = usePathname()
  const { can }  = usePermissions()

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-background border-t border-border md:hidden">
      <div className="flex items-center justify-around px-2 py-2">
        {MOBILE_NAV.filter((item) => can(item.permission)).map((item) => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg min-w-0',
                'transition-colors',
                active
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium truncate">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
