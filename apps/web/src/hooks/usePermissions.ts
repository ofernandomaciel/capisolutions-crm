'use client'

import { useAuthStore, selectUser, selectIsSuperAdmin } from '@/stores/authStore'
import { userHasPermission, userHasAllPermissions, userHasAnyPermission } from '@/lib/auth/permissions'
import type { Permission } from '@/types'

export function usePermissions() {
  const user        = useAuthStore(selectUser)
  const isSuperAdmin = useAuthStore(selectIsSuperAdmin)

  return {
    isSuperAdmin,
    can:    (permission: Permission) => userHasPermission(user, permission),
    canAll: (permissions: Permission[]) => userHasAllPermissions(user, permissions),
    canAny: (permissions: Permission[]) => userHasAnyPermission(user, permissions),
  }
}

// Hook simplificado para verificar uma permissão inline
export function useCan(permission: Permission): boolean {
  const user = useAuthStore(selectUser)
  return userHasPermission(user, permission)
}
