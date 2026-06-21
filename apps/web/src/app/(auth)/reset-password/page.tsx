'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, Lock, Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const schema = z.object({
  password: z.string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Deve conter pelo menos uma letra maiúscula')
    .regex(/[0-9]/, 'Deve conter pelo menos um número'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
})

type FormData = z.infer<typeof schema>

export default function ResetPasswordPage() {
  const router   = useRouter()
  const supabase = createClient()
  const [showPass, setShowPass]  = useState(false)
  const [showConf, setShowConf]  = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    try {
      const { error } = await supabase.auth.updateUser({ password: data.password })
      if (error) throw error
      toast.success('Senha redefinida com sucesso!')
      router.push('/auth/login')
    } catch (err: unknown) {
      toast.error((err as any)?.message ?? 'Erro ao redefinir senha. O link pode ter expirado.')
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground">Nova senha</h1>
        <p className="text-muted-foreground text-sm">
          Escolha uma senha forte para sua conta.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Nova senha */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground" htmlFor="password">
            Nova senha
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              id="password"
              type={showPass ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Min. 8 chars, maiúscula e número"
              {...register('password')}
              className={cn(
                'w-full pl-9 pr-10 py-2.5 text-sm rounded-lg border bg-background',
                'text-foreground placeholder:text-muted-foreground',
                'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary',
                'transition-colors',
                errors.password ? 'border-error' : 'border-border',
              )}
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-error">{errors.password.message}</p>}
        </div>

        {/* Confirmar senha */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground" htmlFor="confirmPassword">
            Confirmar senha
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              id="confirmPassword"
              type={showConf ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Repita a nova senha"
              {...register('confirmPassword')}
              className={cn(
                'w-full pl-9 pr-10 py-2.5 text-sm rounded-lg border bg-background',
                'text-foreground placeholder:text-muted-foreground',
                'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary',
                'transition-colors',
                errors.confirmPassword ? 'border-error' : 'border-border',
              )}
            />
            <button
              type="button"
              onClick={() => setShowConf(!showConf)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showConf ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-xs text-error">{errors.confirmPassword.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className={cn(
            'w-full py-2.5 px-4 rounded-lg text-sm font-medium',
            'bg-primary text-white hover:bg-primary/90 active:bg-primary/80',
            'focus:outline-none focus:ring-2 focus:ring-primary/50',
            'transition-colors duration-150',
            'flex items-center justify-center gap-2',
            'disabled:opacity-60 disabled:cursor-not-allowed',
          )}
        >
          {isSubmitting
            ? <><Loader2 className="h-4 w-4 animate-spin" /> Salvando...</>
            : 'Redefinir senha'
          }
        </button>
      </form>
    </div>
  )
}
