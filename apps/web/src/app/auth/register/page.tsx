'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, Mail, Lock, User, Building2, Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const registerSchema = z.object({
  firstName:   z.string().min(2, 'Mínimo 2 caracteres').max(50),
  lastName:    z.string().min(2, 'Mínimo 2 caracteres').max(50).optional(),
  companyName: z.string().min(2, 'Mínimo 2 caracteres').max(100),
  email:       z.string().email('E-mail inválido'),
  password:    z.string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Deve conter pelo menos uma letra maiúscula')
    .regex(/[0-9]/, 'Deve conter pelo menos um número'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'As senhas não coincidem',
  path:    ['confirmPassword'],
})

type RegisterFormData = z.infer<typeof registerSchema>

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export default function RegisterPage() {
  const router     = useRouter()
  const supabase   = createClient()
  const [showPass, setShowPass] = useState(false)
  const [showConf, setShowConf] = useState(false)
  const [step, setStep]         = useState<'form' | 'success'>('form')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({ resolver: zodResolver(registerSchema) })

  const onSubmit = async (data: RegisterFormData) => {
    try {
      // Tudo via metadata — o trigger handle_new_auth_user cria a empresa no servidor
      const { error: authError } = await supabase.auth.signUp({
        email:    data.email,
        password: data.password,
        options: {
          data: {
            first_name:   data.firstName,
            last_name:    data.lastName ?? '',
            company_name: data.companyName,
            company_slug: generateSlug(data.companyName) + '-' + Date.now().toString(36),
            role:         'admin',
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (authError) throw authError

      setStep('success')
    } catch (err: unknown) {
      console.error('Register error:', err)
      let friendly = 'Erro ao criar conta. Tente novamente.'
      if (err && typeof err === 'object') {
        const e = err as any
        const rawMsg = e?.message
        const msg = typeof rawMsg === 'string' ? rawMsg : (rawMsg ? JSON.stringify(rawMsg) : '')
        if (msg.includes('already registered') || msg.includes('already been registered')) {
          friendly = 'Este e-mail já está cadastrado.'
        } else if (msg.includes('redirect') || msg.includes('URL')) {
          friendly = 'URL de redirect não permitida. Configure localhost:3000 no Supabase Auth Settings.'
        } else if (msg && msg !== '{}') {
          friendly = msg
        } else if (e?.status || e?.code) {
          friendly = `Erro ${e?.status ?? e?.code}: verifique o console para detalhes.`
        }
      }
      toast.error(friendly)
    }
  }

  if (step === 'success') {
    return (
      <div className="space-y-4 text-center animate-fade-in">
        <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-foreground">Conta criada!</h2>
        <p className="text-muted-foreground text-sm max-w-sm mx-auto">
          Enviamos um e-mail de confirmação para o seu endereço. Verifique sua caixa de entrada e clique no link para ativar sua conta.
        </p>
        <Link
          href="/auth/login"
          className="inline-block mt-4 text-primary font-medium hover:underline text-sm"
        >
          Ir para o login
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground">Criar sua conta</h1>
        <p className="text-muted-foreground text-sm">
          Comece gratuitamente. Sem cartão de crédito.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Nome e sobrenome */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="firstName">Nome *</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                id="firstName"
                type="text"
                autoComplete="given-name"
                placeholder="João"
                {...register('firstName')}
                className={cn(
                  'w-full pl-9 pr-4 py-2.5 text-sm rounded-lg border bg-background',
                  'text-foreground placeholder:text-muted-foreground',
                  'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors',
                  errors.firstName ? 'border-error' : 'border-border',
                )}
              />
            </div>
            {errors.firstName && <p className="text-xs text-error">{errors.firstName.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="lastName">Sobrenome</label>
            <input
              id="lastName"
              type="text"
              autoComplete="family-name"
              placeholder="Silva"
              {...register('lastName')}
              className={cn(
                'w-full px-4 py-2.5 text-sm rounded-lg border bg-background',
                'text-foreground placeholder:text-muted-foreground',
                'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors',
                errors.lastName ? 'border-error' : 'border-border',
              )}
            />
          </div>
        </div>

        {/* Empresa */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground" htmlFor="companyName">Nome da empresa *</label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              id="companyName"
              type="text"
              autoComplete="organization"
              placeholder="Minha Empresa Ltda"
              {...register('companyName')}
              className={cn(
                'w-full pl-9 pr-4 py-2.5 text-sm rounded-lg border bg-background',
                'text-foreground placeholder:text-muted-foreground',
                'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors',
                errors.companyName ? 'border-error' : 'border-border',
              )}
            />
          </div>
          {errors.companyName && <p className="text-xs text-error">{errors.companyName.message}</p>}
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground" htmlFor="email">E-mail *</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="joao@empresa.com.br"
              {...register('email')}
              className={cn(
                'w-full pl-9 pr-4 py-2.5 text-sm rounded-lg border bg-background',
                'text-foreground placeholder:text-muted-foreground',
                'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors',
                errors.email ? 'border-error' : 'border-border',
              )}
            />
          </div>
          {errors.email && <p className="text-xs text-error">{errors.email.message}</p>}
        </div>

        {/* Senha */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground" htmlFor="password">Senha *</label>
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
                'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors',
                errors.password ? 'border-error' : 'border-border',
              )}
            />
            <button type="button" onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-error">{errors.password.message}</p>}
        </div>

        {/* Confirmar senha */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground" htmlFor="confirmPassword">Confirmar senha *</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              id="confirmPassword"
              type={showConf ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Repita a senha"
              {...register('confirmPassword')}
              className={cn(
                'w-full pl-9 pr-10 py-2.5 text-sm rounded-lg border bg-background',
                'text-foreground placeholder:text-muted-foreground',
                'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors',
                errors.confirmPassword ? 'border-error' : 'border-border',
              )}
            />
            <button type="button" onClick={() => setShowConf(!showConf)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showConf ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.confirmPassword && <p className="text-xs text-error">{errors.confirmPassword.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className={cn(
            'w-full py-2.5 px-4 rounded-lg text-sm font-medium',
            'bg-primary text-white hover:bg-primary/90 active:bg-primary/80',
            'focus:outline-none focus:ring-2 focus:ring-primary/50',
            'transition-colors duration-150 flex items-center justify-center gap-2',
            'disabled:opacity-60 disabled:cursor-not-allowed',
          )}
        >
          {isSubmitting
            ? <><Loader2 className="h-4 w-4 animate-spin" /> Criando conta...</>
            : 'Criar conta grátis'
          }
        </button>
      </form>

      <p className="text-center text-xs text-muted-foreground">
        Ao criar uma conta você concorda com nossos{' '}
        <a href="#" className="text-primary hover:underline">Termos de Uso</a>
        {' '}e{' '}
        <a href="#" className="text-primary hover:underline">Política de Privacidade</a>.
      </p>

      <p className="text-center text-sm text-muted-foreground">
        Já tem uma conta?{' '}
        <Link href="/auth/login" className="text-primary font-medium hover:underline">Entrar</Link>
      </p>
    </div>
  )
}
