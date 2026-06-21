'use client'

import { useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/authStore'
import { getPermissionsForRole, ROLE_LABELS } from '@/lib/auth/permissions'
import type { AuthUser, AuthCompany, UserRole } from '@/types'

export function useAuth() {
  const supabase = createClient()
  const router   = useRouter()
  const {
    user, company, isLoading, isHydrated,
    setUser, setCompany, setLoading, signOut: clearAuth,
  } = useAuthStore()

  // Carregar perfil do usuário autenticado
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const loadProfile = useCallback(async (userId: string) => {
    const { data: profile, error } = (await supabase
      .from('users')
      .select('*, roles ( name, label )')
      .eq('id', userId)
      .single()) as any

    if (error || !profile) return null

    const roleName = profile.roles?.name as UserRole ?? 'operator'

    const authUser: AuthUser = {
      id:           profile.id,
      email:        profile.email,
      firstName:    profile.first_name,
      lastName:     profile.last_name,
      fullName:     [profile.first_name, profile.last_name].filter(Boolean).join(' '),
      avatarUrl:    profile.avatar_url,
      companyId:    profile.company_id,
      roleName,
      roleLabel:    profile.roles?.label ?? ROLE_LABELS[roleName],
      isSuperAdmin: profile.is_super_admin,
      permissions:  getPermissionsForRole(roleName),
    }

    return authUser
  }, [supabase])

  // Carregar empresa
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const loadCompany = useCallback(async (companyId: string) => {
    const { data, error } = (await supabase
      .from('companies')
      .select('id, name, slug, plan, logo_url')
      .eq('id', companyId)
      .single()) as any

    if (error || !data) return null

    const authCompany: AuthCompany = {
      id:      data.id,
      name:    data.name,
      slug:    data.slug,
      plan:    data.plan,
      logoUrl: data.logo_url,
    }

    return authCompany
  }, [supabase])

  // Inicializar sessão
  useEffect(() => {
    let mounted = true

    const initSession = async () => {
      setLoading(true)

      const { data: { session } } = await supabase.auth.getSession()

      if (session?.user && mounted) {
        const profile = await loadProfile(session.user.id)
        if (profile) {
          setUser(profile)
          if (profile.companyId) {
            const comp = await loadCompany(profile.companyId)
            if (comp) setCompany(comp)
          }
        }
      }

      if (mounted) setLoading(false)
    }

    initSession()

    // Listener de mudanças de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        if (!mounted) return

        if (event === 'SIGNED_IN' && session?.user) {
          const profile = await loadProfile(session.user.id)
          if (profile) {
            setUser(profile)
            if (profile.companyId) {
              const comp = await loadCompany(profile.companyId)
              if (comp) setCompany(comp)
            }
          }
          router.refresh()
        }

        if (event === 'SIGNED_OUT') {
          clearAuth()
          router.push('/auth/login')
        }

        if (event === 'TOKEN_REFRESHED') {
          // Token renovado automaticamente
        }
      },
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase, loadProfile, loadCompany, setUser, setCompany, setLoading, clearAuth, router])

  // Sign in com email/senha
  const signIn = useCallback(async (email: string, password: string) => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
    } catch (err: unknown) {
      setLoading(false)
      throw err
    }
  }, [supabase, setLoading])

  // Sign out
  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    clearAuth()
    router.push('/auth/login')
  }, [supabase, clearAuth, router])

  // Reset de senha
  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })
    if (error) throw error
  }, [supabase])

  // Atualizar senha
  const updatePassword = useCallback(async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password })
    if (error) throw error
    toast.success('Senha atualizada com sucesso!')
  }, [supabase])

  return {
    user,
    company,
    isLoading,
    isHydrated,
    isAuthenticated: !!user,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    refreshProfile: () => user ? loadProfile(user.id).then((p) => p && setUser(p)) : Promise.resolve(),
  }
}
