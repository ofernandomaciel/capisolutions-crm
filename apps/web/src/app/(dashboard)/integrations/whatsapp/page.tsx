'use client'

import { useState, useEffect, useTransition } from 'react'
import { MessageCircle, CheckCircle2, XCircle, Loader2, Eye, EyeOff, RefreshCw, Copy, Check } from 'lucide-react'
import { toast } from 'sonner'
import { Button }   from '@/components/ui/button'
import { Input }    from '@/components/ui/input'
import { Label }    from '@/components/ui/label'
import { Badge }    from '@/components/ui/badge'
import { getAllIntegrationConfigs, setIntegrationConfig } from '@/app/actions/integrations'

interface Config {
  evolution_url:     string
  evolution_api_key: string
  evolution_instance: string
  whatsapp_enabled:  string
}

type ConnectionStatus = 'unknown' | 'checking' | 'connected' | 'error'

export default function WhatsAppPage() {
  const [config, setConfig] = useState<Config>({
    evolution_url:      '',
    evolution_api_key:  '',
    evolution_instance: '',
    whatsapp_enabled:   'false',
  })
  const [showKey, setShowKey]   = useState(false)
  const [status, setStatus]     = useState<ConnectionStatus>('unknown')
  const [loading, setLoading]   = useState(true)
  const [saving, startSave]     = useTransition()
  const [copied, setCopied]     = useState(false)

  useEffect(() => {
    getAllIntegrationConfigs().then((cfg) => {
      setConfig((prev) => ({ ...prev, ...cfg }))
      setLoading(false)
    })
  }, [])

  const handleSave = async () => {
    startSave(async () => {
      const entries = Object.entries(config) as [string, string][]
      const results = await Promise.all(entries.map(([k, v]) => setIntegrationConfig(k, v)))
      const failed  = results.find((r) => !r.success)
      if (failed) { toast.error(failed.error ?? 'Erro ao salvar'); return }
      toast.success('Configuracoes salvas!')
    })
  }

  const testConnection = async () => {
    if (!config.evolution_url || !config.evolution_api_key) {
      toast.error('Preencha a URL e a API Key primeiro')
      return
    }
    setStatus('checking')
    try {
      const res = await fetch(`${config.evolution_url.replace(/\/$/, '')}/instance/fetchInstances`, {
        headers: { apikey: config.evolution_api_key },
      })
      if (res.ok) {
        setStatus('connected')
        toast.success('Conexao estabelecida com Evolution API!')
      } else {
        setStatus('error')
        toast.error(`Erro ${res.status}: verifique URL e API Key`)
      }
    } catch {
      setStatus('error')
      toast.error('Nao foi possivel conectar. Verifique se o servidor esta acessivel.')
    }
  }

  const copyWebhook = () => {
    const url = `${window.location.origin}/api/webhooks/whatsapp`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('URL copiada!')
  }

  const statusInfo = {
    unknown:   { icon: null,          label: 'Nao testado',  color: 'bg-muted text-muted-foreground' },
    checking:  { icon: Loader2,       label: 'Testando...',  color: 'bg-yellow-100 text-yellow-700' },
    connected: { icon: CheckCircle2,  label: 'Conectado',    color: 'bg-emerald-100 text-emerald-700' },
    error:     { icon: XCircle,       label: 'Erro',         color: 'bg-destructive/10 text-destructive' },
  }[status]

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
          <div className="p-2 rounded-lg bg-emerald-500/10">
            <MessageCircle className="h-6 w-6 text-emerald-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">WhatsApp</h1>
            <p className="text-sm text-muted-foreground">Integre via Evolution API para enviar mensagens automaticas</p>
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
            <p className="font-medium text-foreground text-sm">Ativar integracao WhatsApp</p>
            <p className="text-xs text-muted-foreground mt-0.5">Permite envio de mensagens via WhatsApp nos modulos do CRM</p>
          </div>
          <button
            type="button"
            onClick={() => setConfig((c) => ({ ...c, whatsapp_enabled: c.whatsapp_enabled === 'true' ? 'false' : 'true' }))}
            className={`relative w-11 h-6 rounded-full transition-colors ${config.whatsapp_enabled === 'true' ? 'bg-primary' : 'bg-muted'}`}
          >
            <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${config.whatsapp_enabled === 'true' ? 'translate-x-5' : ''}`} />
          </button>
        </div>
      </div>

      {/* Connection config */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <h2 className="font-semibold text-foreground text-sm">Configuracao do servidor Evolution API</h2>

        <div className="space-y-1.5">
          <Label htmlFor="evo_url">URL do servidor</Label>
          <Input
            id="evo_url"
            placeholder="https://evolution.seudominio.com.br"
            value={config.evolution_url}
            onChange={(e) => setConfig((c) => ({ ...c, evolution_url: e.target.value }))}
          />
          <p className="text-xs text-muted-foreground">URL base da sua instancia Evolution API (sem barra no final)</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="evo_key">API Key global</Label>
          <div className="relative">
            <Input
              id="evo_key"
              type={showKey ? 'text' : 'password'}
              placeholder="sua-api-key-global"
              value={config.evolution_api_key}
              onChange={(e) => setConfig((c) => ({ ...c, evolution_api_key: e.target.value }))}
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
          <p className="text-xs text-muted-foreground">Encontre em Evolution API &gt; Settings &gt; Authentication</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="evo_instance">Nome da instancia</Label>
          <Input
            id="evo_instance"
            placeholder="capisolutions"
            value={config.evolution_instance}
            onChange={(e) => setConfig((c) => ({ ...c, evolution_instance: e.target.value }))}
          />
          <p className="text-xs text-muted-foreground">Nome da instancia criada no painel Evolution API</p>
        </div>

        <div className="flex gap-3 pt-1">
          <Button type="button" variant="outline" size="sm" onClick={testConnection} disabled={status === 'checking'}>
            <RefreshCw className={`h-4 w-4 mr-2 ${status === 'checking' ? 'animate-spin' : ''}`} />
            Testar conexao
          </Button>
          <Button type="button" size="sm" onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Salvar configuracoes
          </Button>
        </div>
      </div>

      {/* Webhook URL */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-3">
        <h2 className="font-semibold text-foreground text-sm">Webhook de entrada</h2>
        <p className="text-xs text-muted-foreground">
          Configure essa URL no painel Evolution API para receber mensagens e eventos no CRM.
        </p>
        <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
          <code className="text-xs flex-1 text-muted-foreground font-mono truncate">
            {typeof window !== 'undefined' ? window.location.origin : 'https://seudominio.com'}/api/webhooks/whatsapp
          </code>
          <Button type="button" size="icon" variant="ghost" className="h-7 w-7" onClick={copyWebhook}>
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-3">
        <h2 className="font-semibold text-foreground text-sm">Como funciona</h2>
        <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
          <li>Instale e configure a <a href="https://evolution-api.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Evolution API</a> no seu servidor</li>
          <li>Crie uma instancia e conecte seu numero de WhatsApp escaneando o QR Code</li>
          <li>Insira a URL do servidor e a API Key acima e clique em <strong className="text-foreground">Salvar</strong></li>
          <li>Configure o webhook de entrada no painel Evolution API</li>
          <li>Use o botao de WhatsApp nos cadastros de clientes e leads para enviar mensagens</li>
        </ol>
      </div>
    </div>
  )
}
