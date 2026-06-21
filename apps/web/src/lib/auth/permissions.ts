import type { Permission, UserRole, AuthUser } from '@/types'

// Mapa de permissões por role (espelha o banco de dados)
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  super_admin: [
    'dashboard.view',
    'customers.view', 'customers.create', 'customers.edit', 'customers.delete', 'customers.export',
    'leads.view', 'leads.view_own', 'leads.create', 'leads.edit', 'leads.delete',
    'sales.view', 'sales.view_own', 'sales.create', 'sales.edit', 'sales.delete',
    'finance.view', 'finance.create', 'finance.edit', 'finance.delete',
    'reports.view', 'reports.export',
    'users.view', 'users.create', 'users.edit', 'users.delete',
    'settings.view', 'settings.edit',
    'admin.companies', 'admin.plans',
  ],
  admin: [
    'dashboard.view',
    'customers.view', 'customers.create', 'customers.edit', 'customers.delete', 'customers.export',
    'leads.view', 'leads.view_own', 'leads.create', 'leads.edit', 'leads.delete',
    'sales.view', 'sales.view_own', 'sales.create', 'sales.edit', 'sales.delete',
    'finance.view', 'finance.create', 'finance.edit', 'finance.delete',
    'reports.view', 'reports.export',
    'users.view', 'users.create', 'users.edit', 'users.delete',
    'settings.view', 'settings.edit',
  ],
  manager: [
    'dashboard.view',
    'customers.view', 'customers.create', 'customers.edit',
    'leads.view', 'leads.create', 'leads.edit',
    'sales.view',
    'finance.view',
    'reports.view', 'reports.export',
    'settings.view',
    'users.view',
  ],
  sales: [
    'dashboard.view',
    'customers.view',
    'leads.view_own', 'leads.create', 'leads.edit',
    'sales.view_own', 'sales.create',
  ],
  finance: [
    'dashboard.view',
    'sales.view',
    'finance.view', 'finance.create', 'finance.edit', 'finance.delete',
    'reports.view', 'reports.export',
  ],
  operator: [
    'dashboard.view',
    // Permissões customizadas carregadas do banco
  ],
}

// Verifica se um role tem uma permissão
export function roleHasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false
}

// Verifica se um usuário tem uma permissão
export function userHasPermission(user: AuthUser | null, permission: Permission): boolean {
  if (!user) return false
  if (user.isSuperAdmin) return true
  return user.permissions.includes(permission)
}

// Verifica múltiplas permissões (todas obrigatórias)
export function userHasAllPermissions(user: AuthUser | null, permissions: Permission[]): boolean {
  if (!user) return false
  if (user.isSuperAdmin) return true
  return permissions.every((p) => user.permissions.includes(p))
}

// Verifica múltiplas permissões (pelo menos uma)
export function userHasAnyPermission(user: AuthUser | null, permissions: Permission[]): boolean {
  if (!user) return false
  if (user.isSuperAdmin) return true
  return permissions.some((p) => user.permissions.includes(p))
}

// Retorna permissões padrão de um role
export function getPermissionsForRole(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] ?? []
}

// Labels dos roles
export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'Super Administrador',
  admin:       'Administrador',
  manager:     'Gerente',
  sales:       'Vendedor',
  finance:     'Financeiro',
  operator:    'Operacional',
}

// Cores dos roles (para badges)
export const ROLE_COLORS: Record<UserRole, string> = {
  super_admin: 'bg-purple-100 text-purple-800',
  admin:       'bg-blue-100 text-blue-800',
  manager:     'bg-indigo-100 text-indigo-800',
  sales:       'bg-green-100 text-green-800',
  finance:     'bg-yellow-100 text-yellow-800',
  operator:    'bg-gray-100 text-gray-800',
}
