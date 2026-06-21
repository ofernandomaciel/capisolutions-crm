import Link from 'next/link'
import { MessageCircle, Zap, ChevronRight } from 'lucide-react'

const INTEGRATIONS = [
  {
    href:    '/integrations/whatsapp',
    icon:    MessageCircle,
    color:   'bg-emerald-500/10 text-emerald-500',
    title:   'WhatsApp',
    desc:    'Envie mensagens via Evolution API diretamente dos cadastros de clientes e leads.',
    badge:   'Evolution API',
  },
  {
    href:    '/integrations/n8n',
    icon:    Zap,
    color:   'bg-orange-500/10 text-orange-500',
    title:   'n8n — Automacoes',
    desc:    'Crie fluxos de automacao poderosos conectando o CRM ao n8n via webhooks.',
    badge:   'Webhooks',
  },
]

export default function IntegrationsPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Integracoes</h1>
        <p className="text-sm text-muted-foreground">Conecte o CRM com ferramentas externas para automatizar seu processo de vendas.</p>
      </div>

      <div className="space-y-3">
        {INTEGRATIONS.map(({ href, icon: Icon, color, title, desc, badge }) => (
          <Link
            key={href}
            href={href}
            className="group flex items-center gap-4 bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow"
          >
            <div className={`p-3 rounded-xl flex-shrink-0 ${color}`}>
              <Icon className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-foreground">{title}</p>
                <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{badge}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">{desc}</p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  )
}
