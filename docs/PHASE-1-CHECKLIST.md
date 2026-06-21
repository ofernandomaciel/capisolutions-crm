# CapiSolutions CRM — Checklist de Deploy: Fase 1

## Pré-requisitos

- [ ] Node.js 20+ instalado
- [ ] Docker + Docker Compose instalado
- [ ] Conta no Supabase (cloud) ou Supabase self-hosted
- [ ] VPS Ubuntu 24.04 com mínimo 2 vCPU / 4GB RAM
- [ ] Domínio configurado com DNS A apontando para o VPS

---

## 1. Configuração do Supabase

### 1.1 Criar projeto
- [ ] Acessar https://supabase.com e criar novo projeto
- [ ] Anotar: Project URL, anon key, service role key
- [ ] Configurar região: South America (São Paulo)

### 1.2 Executar migrações (ordem obrigatória)
```bash
# Via Supabase CLI
supabase link --project-ref <project-ref>
supabase db push

# Ou executar manualmente no SQL Editor do Dashboard:
# 1. supabase/migrations/001_initial_schema.sql
# 2. supabase/migrations/002_rls_policies.sql
# 3. supabase/migrations/003_functions.sql
```
- [ ] Migration 001 executada com sucesso (22 tabelas criadas)
- [ ] Migration 002 executada com sucesso (RLS ativado)
- [ ] Migration 003 executada com sucesso (funções e triggers)

### 1.3 Configurar Auth
- [ ] Habilitar Email Auth no Supabase Dashboard
- [ ] Configurar SMTP (Settings > Auth > Email)
- [ ] Configurar URL do site (Settings > Auth > URL Configuration)
  - Site URL: `https://app.seudominio.com.br`
  - Redirect URLs: `https://app.seudominio.com.br/auth/callback`
- [ ] Desabilitar "Confirm email" para testes (reabilitar em produção)

### 1.4 Configurar Storage
- [ ] Criar bucket `capisolutions-files` (privado)
- [ ] Configurar políticas de acesso ao bucket

### 1.5 Criar super admin
```sql
-- 1. Criar usuário via Supabase Auth Dashboard (Authentication > Users)
-- 2. Executar no SQL Editor:
UPDATE users
  SET is_super_admin = true,
      company_id = NULL
WHERE email = 'superadmin@capisolutions.com.br';
```
- [ ] Super admin criado e configurado

---

## 2. Configuração da Aplicação

### 2.1 Variáveis de ambiente
```bash
cp .env.example apps/web/.env.local
# Preencher todas as variáveis obrigatórias
```
- [ ] `NEXT_PUBLIC_SUPABASE_URL` configurado
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` configurado
- [ ] `SUPABASE_SERVICE_ROLE_KEY` configurado
- [ ] `NEXT_PUBLIC_APP_URL` configurado
- [ ] `ENCRYPTION_KEY` gerado (32 chars aleatórios)

### 2.2 Instalar dependências
```bash
cd apps/web
npm install
```
- [ ] Dependências instaladas sem erros

### 2.3 Testar localmente
```bash
npm run dev
# Verificar: http://localhost:3000
```
- [ ] Build compila sem erros de TypeScript
- [ ] Página de login carrega
- [ ] Página de registro carrega
- [ ] Autenticação funciona end-to-end
- [ ] Dashboard carrega após login
- [ ] Sidebar e header renderizam corretamente
- [ ] Responsividade mobile OK

---

## 3. Deploy em Produção

### 3.1 Servidor VPS
```bash
# Conectar ao VPS
ssh user@ip-do-vps

# Instalar Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Clonar o projeto
git clone https://github.com/seuusuario/capisolutions-crm.git
cd capisolutions-crm
```
- [ ] Docker instalado no VPS
- [ ] Projeto clonado

### 3.2 Certificado SSL
```bash
# Usando Certbot (Let's Encrypt)
sudo apt install certbot
sudo certbot certonly --standalone -d app.seudominio.com.br
sudo cp /etc/letsencrypt/live/app.seudominio.com.br/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/app.seudominio.com.br/privkey.pem nginx/ssl/
```
- [ ] Certificado SSL gerado e copiado para nginx/ssl/

### 3.3 Configurar nginx.conf
- [ ] Substituir `app.example.com` pelo domínio real
- [ ] Substituir `n8n.example.com` pelo subdomínio real
- [ ] Substituir `evolution.example.com` pelo subdomínio real

### 3.4 Build e Deploy
```bash
# Configurar variáveis de produção
cp .env.example .env
# Editar .env com valores de produção

# Build e start
docker compose up -d --build

# Verificar logs
docker compose logs -f web
```
- [ ] Todos os containers sobem sem erro
- [ ] Aplicação responde em https://app.seudominio.com.br
- [ ] HTTPS funcionando com certificado válido
- [ ] n8n acessível em https://n8n.seudominio.com.br
- [ ] Evolution API acessível em https://evolution.seudominio.com.br

---

## 4. Validação de Segurança

- [ ] Headers de segurança presentes (verificar com https://securityheaders.com)
- [ ] HTTPS forçado (HTTP redireciona para HTTPS)
- [ ] Rate limiting funcionando (testar com múltiplos requests)
- [ ] RLS testado: usuário A não acessa dados do usuário B
- [ ] Super admin pode acessar todas as empresas
- [ ] Audit logs sendo gerados para operações CRUD

---

## 5. Monitoramento

- [ ] Configurar alertas de uptime (UptimeRobot, Better Uptime, etc.)
- [ ] Configurar backup do banco via Supabase (já automático no cloud)
- [ ] Verificar logs do Nginx estão sendo gerados

---

## Aprovação da Fase 1

Após todos os itens marcados e validados, a **Fase 1 está completa**.

Confirme a aprovação para avançar para a **Fase 2: Dashboard**.

A Fase 2 incluirá:
- Métricas reais via RPC do Supabase
- Gráficos com Recharts
- Feed de atividade recente
- KPIs com filtros por período
- Comparativos mês a mês
