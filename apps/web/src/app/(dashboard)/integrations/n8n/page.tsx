'use client'

import { useState, useEffect, useTransition } from 'react'
import { Zap, CheckCircle2, XCircle, Loader2, Eye, EyeOff, RefreshCw, Copy, Check, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { Button }   from '@/components/ui/button'
import { Input }    from '@/components/ui/input'
import { Label }    from '@/components/ui/label'
import { getAllIntegrationConfigs, setIntegrationConfig } from '@/app/actions/integrations'

interface Config {
  n8n_url:        string
  n8n_api_key:    string
  n8n_enabled:    string
  n8n_webhook_secret: string
}

type ConnectionStatus = 'unknown' | 'checking' | 'connected' | 'error'

const WEBHOOK_EVENTS = [
  { key: 'lead.created',    label: 'Lead criado',          desc: 'Disparado quando um novo lead e adicionado ao pipeline' },
  { key: 'lead.stage',      label: 'Lead movido de estagio', desc: 'Disparado quando um lead e arrastado para outro estagio' },
  { key: 'lead.won',        label: 'Lead ganho',           desc: 'Disparado quando um lead e marcado como ganho' },
  { key: 'lead.lost',       label: 'Lead perdido',         desc: 'Disparado quando um lead e marcado como perdido' },
  { key: 'sale.completed',  label: 'Venda concluida',      desc: 'Disparado quando uma venda muda para status concluida' },
  { key: 'task.due',        label: 'Tarefa vencendo',      desc: 'Disparado 1h antes do prazo de uma tarefa' },
  { key: 'customer.created', label: 'Novo cliente',        desc: 'Disparado quando um cliente e cadastrado' },
]

export default function N8nPage() {
  const [config, setConfig] = useState<Config>({
    n8n_url:             '',
    n8n_api_key:         '',
    n8n_enabled:         'false',
    n8n_webhook_secret:  '',
  })
  const [showKey, setShowKey]   = useState(false)
  const [status, setStatus]     = useState<ConnectionStatus>('unknown')
  const [loading, setLoading]   = useState(true)
  const [saving, startSave]     = useTransition()
  const [copied, setCopied]     = useState<string | null>(null)

  useEffect(() => {
    getAllIntegrationConfigs().then((cfg) => {
      setConfig((prev) => ({ ...prev, ...cfg }))
      setLoading(false)
    })
  }, [])

  const handleSave = () => {
    startSave(async () => {
      const entries = Object.entries(config) as [string, string][]
      const results = await Promise.all(entries.map(([k, v]) => setIntegrationConfig(k, v)))
      const failed  = results.find((r) => !r.success)
      if (failed) { toast.error(failed.error ?? 'Erro ao salvar'); return }
      toast.success('Configuracoes salvas!')
    })
  }

  const testConnection = async () => {
    if (!config.n8n_url || !config.n8n_api_key) {
      toast.error('Preencha a URL e a API Key primeiro')
      return
    }
    setStatus('checking')
    try {
      const res = await fetch(`${config.n8n_url.replace(/\/$/, '')}/api/v1/workflows`, {
        headers: { 'X-N8N-API-KEY': config.n8n_api_key },
      })
      if (res.ok) {
        setStatus('connected')
        toast.success('Conectado ao n8n!')
      } else {
        setStatus('error')
        toast.error(`Erro ${res.status}: verifique URL e API Key`)
      }
    } catch {
      setStatus('error')
      toast.error('Nao foi possivel conectar. Verifique se o servidor esta acessivel.')
    }
  }

  const copyUrl = (key: string, url: string) => {
    navigator.clipboard.writeText(url)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
    toast.success('URL copiada!')
  }

  const statusInfo = {
    unknown:   { icon: null,          label: 'Nao testado',  color: 'bg-muted text-muted-foreground' },
    checking:  { icon: Loader2,       label: 'Testando...',  color: 'bg-yellow-100 text-yellow-700' },
    connected: { icon: CheckCircle2,  label: 'Conectado',    color: 'bg-emerald-100 text-emerald-700' },
    error:     { icon: XCircle,       label: 'Erro',         color: 'bg-destructive/10 text-destructive' },
  }[status]

  const baseWebhookUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/webhooks/n8n` : 'https://seudominio.com/api/webhooks/n8n'

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-orange-500/10">
            <Zap className="h-6 w-6 text-orange-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">n8n — Automacoes</h1>
            <p className="text-sm text-muted-foreground">Conecte o CRM ao n8n para criar fluxos de automacao</p>
          </div>
          <div className={`ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
            {statusInfo.icon && <statusInfo.icon className={`h-3.5 w-3.5 ${status === 'checking' ? 'animate-spin' : ''}`} />}
            {statusInfo.label}
          </div>
        </div>
      </div>

      {/* Enable toggle */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-foreground text-sm">Ativar integracao n8n</p>
            <p className="text-xs text-muted-foreground mt-0.5">Permite disparo de webhooks para fluxos de automacao no n8n</p>
          </div>
          <button
            type="button"
            onClick={() => setConfig((c) => ({ ...c, n8n_enabled: c.n8n_enabled === 'true' ? 'false' : 'true' }))}
            className={`relative w-11 h-6 rounded-full transition-colors ${config.n8n_enabled === 'true' ? 'bg-orange-500' : 'bg-muted'}`}
          >
            <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${config.n8n_enabled === 'true' ? 'translate-x-5' : ''}`} />
          </button>
        </div>
      </div>

      {/* Connection config */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <h2 className="font-semibold text-foreground text-sm">Conexao com n8n</h2>

        <div className="space-y-1.5">
          <Label htmlFor="n8n_url">URL do servidor n8n</Label>
          <Input
            id="n8n_url"
            placeholder="https://n8n.seudominio.com.br"
            value={config.n8n_url}
            onChange={(e) => setConfig((c) => ({ ...c, n8n_url: e.target.value }))}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="n8n_key">API Key do n8n</Label>
          <div className="relative">
            <Input
              id="n8n_key"
              type={showKey ? 'text' : 'password'}
              placeholder="n8n_api_..."
              value={config.n8n_api_key}
              onChange={(e) => setConfig((c) => ({ ...c, n8n_api_key: e.target.value }))}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <p className="text-xs text-muted-foreground">Gere em n8n &gt; Settings &gt; API &gt; Create an API key</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="n8n_secret">Webhook secret (opcional)</Label>
          <Input
            id="n8n_secret"
            placeholder="segredo-para-validar-webhooks"
            value={config.n8n_webhook_secret}
            onChange={(e) => setConfig((c) => ({ ...c, n8n_webhook_secret: e.target.value }))}
          />
          <p className="text-xs text-muted-foreground">Usado para assinar os payloads enviados ao n8n (header X-Webhook-Secret)</p>
        </div>

        <div className="flex gap-3 pt-1">
          <Button type="button" variant="outline" size="sm" onClick={testConnection} disabled={status === 'checking'}>
            <RefreshCw className={`h-4 w-4 mr-2 ${status === 'checking' ? 'animate-spin' : ''}`} />
            Testar conexao
          </Button>
          <Button type="button" size="sm" onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Salvar
          </Button>
          {config.n8n_url && (
            <Button asChild type="button" variant="ghost" size="sm">
              <a href={config.n8n_url} target="_blank" rel="noopener noreferrer">
                Abrir n8n <ExternalLink className="h-3.5 w-3.5 ml-1" />
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* Webhook events */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-3">
        <h2 className="font-semibold text-foreground text-sm">Eventos e URLs de webhook</h2>
        <p className="text-xs text-muted-foreground">
          Use essas URLs como <strong>Webhook Trigger</strong> nos seus fluxos n8n para receber eventos do CRM.
        </p>
        <div className="space-y-2">
          {WEBHOOK_EVENTS.map((ev) => {
            const url = `${baseWebhookUrl}/${ev.key}`
            return (
              <div key={ev.key} className="border border-border rounded-lg p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">{ev.label}</span>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => copyUrl(ev.key, url)}
                  >
                    {copied === ev.key ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">{ev.desc}</p>
                <code className="text-xs font-mono text-muted-foreground/80 block truncate">{url}</code>
              </div>
            )
          })}
        </div>
      </div>

      {/* Getting started */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-3">
        <h2 className="font-semibold text-foreground text-sm">Como comecar</h2>
        <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
          <li>Instale o <a href="https://n8n.io" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">n8n</a> (self-hosted ou cloud)</li>
          <li>Crie um novo Workflow e adicione um no <strong className="text-foreground">Webhook</strong> como trigger</li>
          <li>Cole uma das URLs de evento acima como URL do webhook no n8n</li>
          <li>Configure as acoes seguintes (enviar email, criar card Trello, notificar Slack, etc.)</li>
          <li>Ative o workflow no n8n e salve as configuracoes aqui</li>
        </ol>
      </div>
    </div>
  )
}
