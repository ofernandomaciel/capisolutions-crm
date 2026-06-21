'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, Mail, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const schema = z.object({
  email: z.string().email('E-mail inválido'),
})
type FormData = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const supabase = createClient()
  const [sent, setSent] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
      })
      if (error) throw error
      setSent(true)
    } catch (err: unknown) {
      toast.error((err as any)?.message ?? 'Erro ao enviar e-mail. Tente novamente.')
    }
  }

  if (sent) {
    return (
      <div className="space-y-4 text-center animate-fade-in">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
          <Mail className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">E-mail enviado!</h2>
        <p className="text-muted-foreground text-sm max-w-sm mx-auto">
          Verifique sua caixa de entrada e clique no link para redefinir sua senha.
          O link expira em 1 hora.
        </p>
        <Link
          href="/auth/login"
          className="inline-block mt-4 text-primary font-medium hover:underline text-sm"
        >
          Voltar para o login
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground">Esqueceu a senha?</h1>
        <p className="text-muted-foreground text-sm">
          Digite seu e-mail e enviaremos um link para redefinir sua senha.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground" htmlFor="email">
            E-mail
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="seu@email.com.br"
              {...register('email')}
              className={cn(
                'w-full pl-9 pr-4 py-2.5 text-sm rounded-lg border bg-background',
                'text-foreground placeholder:text-muted-foreground',
                'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary',
                'transition-colors',
                errors.email ? 'border-error' : 'border-border',
              )}
            />
          </div>
          {errors.email && <p className="text-xs text-error">{errors.email.message}</p>}
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
            ? <><Loader2 className="h-4 w-4 animate-spin" /> Enviando...</>
            : 'Enviar link de redefinição'
          }
        </button>
      </form>

      <Link
        href="/auth/login"
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para o login
      </Link>
    </div>
  )
}
