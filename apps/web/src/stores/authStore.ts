import { create } from 'zustand'
import { persist, devtools } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import type { AuthUser, AuthCompany } from '@/types'

interface AuthState {
  user:       AuthUser | null
  company:    AuthCompany | null
  isLoading:  boolean
  isHydrated: boolean
}

interface AuthActions {
  setUser:      (user: AuthUser | null) => void
  setCompany:   (company: AuthCompany | null) => void
  setLoading:   (loading: boolean) => void
  setHydrated:  (hydrated: boolean) => void
  signOut:      () => void
}

type AuthStore = AuthState & AuthActions

export const useAuthStore = create<AuthStore>()(
  devtools(
    persist(
      immer((set) => ({
        // Estado inicial
        user:       null,
        company:    null,
        isLoading:  true,
        isHydrated: false,

        // Actions
        setUser: (user) =>
          set((state) => {
            state.user = user
          }),

        setCompany: (company) =>
          set((state) => {
            state.company = company
          }),

        setLoading: (loading) =>
          set((state) => {
            state.isLoading = loading
          }),

        setHydrated: (hydrated) =>
          set((state) => {
            state.isHydrated = hydrated
          }),

        signOut: () =>
          set((state) => {
            state.user    = null
            state.company = null
          }),
      })),
      {
        name: 'capisolutions-auth',
        // Persistir apenas dados não sensíveis
        partialize: (state) => ({
          user:    state.user ? {
            id:           state.user.id,
            email:        state.user.email,
            firstName:    state.user.firstName,
            lastName:     state.user.lastName,
            fullName:     state.user.fullName,
            avatarUrl:    state.user.avatarUrl,
            companyId:    state.user.companyId,
            roleName:     state.user.roleName,
            roleLabel:    state.user.roleLabel,
            isSuperAdmin: state.user.isSuperAdmin,
            permissions:  state.user.permissions,
          } : null,
          company: state.company,
        }),
        onRehydrateStorage: () => (state) => {
          state?.setHydrated(true)
        },
      },
    ),
    { name: 'AuthStore' },
  ),
)

// Selectors para evitar re-renders desnecessários
export const selectUser        = (s: AuthStore) => s.user
export const selectCompany     = (s: AuthStore) => s.company
export const selectIsLoading   = (s: AuthStore) => s.isLoading
export const selectIsSuperAdmin = (s: AuthStore) => s.user?.isSuperAdmin ?? false
export const selectUserRole    = (s: AuthStore) => s.user?.roleName
export const selectPermissions = (s: AuthStore) => s.user?.permissions ?? []
