'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

const loginSchema = z.object({
  email:    z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Mínimo de 6 caracteres'),
})

type LoginFormData = z.infer<typeof loginSchema>

function LoginForm() {
  const router      = useRouter()
  const searchParams = useSearchParams()
  const redirectTo  = searchParams.get('redirectTo') ?? '/'
  const { signIn }  = useAuth()

  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) })

  const onSubmit = async (data: LoginFormData) => {
    try {
      await signIn(data.email, data.password)
      router.push(redirectTo)
    } catch (err: any) {
      const message =
        err.message === 'Invalid login credentials'
          ? 'E-mail ou senha incorretos.'
          : err.message ?? 'Erro ao entrar. Tente novamente.'
      toast.error(message)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground">Bem-vindo de volta</h1>
        <p className="text-muted-foreground text-sm">
          Entre na sua conta para continuar
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* E-mail */}
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium text-foreground">
            E-mail
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="seu@email.com"
              {...register('email')}
              className={cn(
                'w-full h-10 pl-10 pr-4 rounded-lg border bg-background text-sm',
                'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary',
                'placeholder:text-muted-foreground/60 transition-colors',
                errors.email ? 'border-destructive' : 'border-input',
              )}
            />
          </div>
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>

        {/* Senha */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-medium text-foreground">
              Senha
            </label>
            <Link
              href="/auth/forgot-password"
              className="text-xs text-primary hover:underline underline-offset-2"
            >
              Esqueci a senha
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              {...register('password')}
              className={cn(
                'w-full h-10 pl-10 pr-10 rounded-lg border bg-background text-sm',
                'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary',
                'placeholder:text-muted-foreground/60 transition-colors',
                errors.password ? 'border-destructive' : 'border-input',
              )}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          )}
        </div>

        {/* Botão */}
        <button
          type="submit"
          disabled={isSubmitting}
          className={cn(
            'w-full h-10 rounded-lg bg-primary text-primary-foreground text-sm font-medium',
            'hover:bg-primary-700 transition-colors',
            'flex items-center justify-center gap-2',
            'disabled:opacity-60 disabled:cursor-not-allowed',
          )}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Entrando...
            </>
          ) : (
            'Entrar'
          )}
        </button>
      </form>

      {/* Footer */}
      <p className="text-center text-sm text-muted-foreground">
        Não tem uma conta?{' '}
        <Link
          href="/auth/register"
          className="text-primary font-medium hover:underline underline-offset-2"
        >
          Criar conta
        </Link>
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
