import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Entrar',
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-secondary-900 flex">
      {/* Painel esquerdo — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-700 via-primary-600 to-primary-500 flex-col justify-between p-12">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-lg">C</span>
          </div>
          <span className="text-white font-semibold text-xl">CapiSolutions</span>
        </div>

        {/* Quote central */}
        <div className="space-y-6">
          <h2 className="text-white text-4xl font-bold leading-tight">
            Gerencie seu negócio com inteligência
          </h2>
          <p className="text-primary-100 text-lg leading-relaxed max-w-md">
            CRM completo para pequenas e médias empresas brasileiras. Leads, vendas, financeiro e IA em uma única plataforma.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 pt-4">
            {[
              { label: 'Empresas', value: '500+' },
              { label: 'Leads gerenciados', value: '50k+' },
              { label: 'Uptime', value: '99.9%' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/10 rounded-xl p-4">
                <div className="text-white font-bold text-2xl">{stat.value}</div>
                <div className="text-primary-200 text-sm mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="text-primary-200 text-sm">
          © {new Date().getFullYear()} CapiSolutions. Todos os direitos reservados.
        </p>
      </div>

      {/* Painel direito — formulário */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md">
          {/* Logo mobile */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center">
              <span className="text-white font-bold">C</span>
            </div>
            <span className="font-semibold text-lg text-foreground">CapiSolutions CRM</span>
          </div>

          {children}
        </div>
      </div>
    </div>
  )
}
