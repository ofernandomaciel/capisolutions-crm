# CapiSolutions CRM — Arquitetura Técnica

## Visão Geral

O CapiSolutions CRM é uma plataforma SaaS multiempresa desenvolvida para pequenas e médias empresas brasileiras. A arquitetura foi projetada para escalar de dezenas a milhares de empresas sem necessidade de refatoração estrutural.

---

## Stack Tecnológica

### Frontend
| Tecnologia | Versão | Função |
|---|---|---|
| Next.js | 15 | Framework React com App Router |
| React | 19 | UI Library |
| TypeScript | 5.x | Tipagem estática |
| Tailwind CSS | 3.x | Estilização utilitária |
| ShadCN UI | latest | Componentes acessíveis |
| TanStack Query | 5.x | Server state management |
| Zustand | 4.x | Client state management |
| React Hook Form | 7.x | Gerenciamento de formulários |
| Zod | 3.x | Validação de schemas |

### Backend
| Tecnologia | Versão | Função |
|---|---|---|
| Supabase | latest | BaaS (Auth, DB, Storage, Realtime) |
| PostgreSQL | 15 | Banco de dados relacional |
| Edge Functions | Deno | Serverless functions |
| Row Level Security | - | Isolamento de dados multiempresa |

### Infraestrutura
| Tecnologia | Função |
|---|---|
| Docker | Containerização |
| Docker Compose | Orquestração local e produção |
| Nginx | Reverse proxy, SSL termination |
| VPS Ubuntu 24.04 | Servidor de produção |

### Integrações
| Serviço | Função |
|---|---|
| n8n | Automações e workflows |
| Evolution API | WhatsApp Business |
| OpenAI | IA - GPT-4 |
| OpenRouter | Gateway multi-modelo de IA |
| Ollama | IA local (self-hosted) |

---

## Arquitetura de Dados — Multiempresa

```
┌─────────────────────────────────────────────────────┐
│                   SUPER ADMIN                       │
│           Acesso global ao sistema                  │
└──────────────────────┬──────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
   ┌────▼───┐    ┌─────▼──┐    ┌─────▼──┐
   │Empresa │    │Empresa │    │Empresa │
   │   A    │    │   B    │    │   C    │
   └────────┘    └────────┘    └────────┘
        │
   ┌────┴─────────────────┐
   │  Isolamento por RLS  │
   │  company_id em todas │
   │  as tabelas          │
   └──────────────────────┘
```

### Estratégia de Isolamento
- Toda tabela de dados possui coluna `company_id` (UUID, NOT NULL)
- Row Level Security (RLS) ativado em todas as tabelas
- Políticas RLS verificam `auth.jwt() ->> 'company_id'` 
- Usuários só acessam dados da própria empresa
- Super Admin bypassa RLS via `service_role`

---

## Estrutura de Pastas

```
capisolutions-crm/
├── apps/
│   └── web/                          # Aplicação Next.js
│       ├── src/
│       │   ├── app/                  # App Router
│       │   │   ├── (auth)/           # Grupo: páginas públicas
│       │   │   │   ├── login/
│       │   │   │   ├── register/
│       │   │   │   └── forgot-password/
│       │   │   ├── (dashboard)/      # Grupo: área logada
│       │   │   │   ├── page.tsx      # Dashboard home
│       │   │   │   ├── customers/    # Módulo clientes
│       │   │   │   ├── leads/        # Módulo leads
│       │   │   │   ├── sales/        # Módulo vendas
│       │   │   │   ├── finance/      # Módulo financeiro
│       │   │   │   ├── reports/      # Módulo relatórios
│       │   │   │   ├── settings/     # Configurações
│       │   │   │   └── admin/        # Super admin
│       │   │   ├── api/              # API Routes (Edge)
│       │   │   ├── layout.tsx
│       │   │   └── globals.css
│       │   ├── components/
│       │   │   ├── layout/           # Sidebar, Header, Nav
│       │   │   ├── ui/               # ShadCN components
│       │   │   ├── providers/        # Context providers
│       │   │   └── [module]/         # Componentes por módulo
│       │   ├── lib/
│       │   │   ├── supabase/         # Cliente Supabase
│       │   │   ├── auth/             # Permissões RBAC
│       │   │   └── utils.ts
│       │   ├── hooks/                # Custom hooks
│       │   ├── stores/               # Zustand stores
│       │   ├── types/                # TypeScript types
│       │   └── middleware.ts         # Auth middleware
│       ├── public/
│       ├── package.json
│       ├── next.config.ts
│       ├── tailwind.config.ts
│       ├── tsconfig.json
│       └── components.json
├── supabase/
│   ├── config.toml
│   ├── migrations/
│   │   ├── 001_initial_schema.sql
│   │   ├── 002_rls_policies.sql
│   │   └── 003_functions.sql
│   └── seed.sql
├── nginx/
│   └── nginx.conf
├── docs/
│   ├── ARCHITECTURE.md
│   └── PHASE-1-CHECKLIST.md
├── docker-compose.yml
└── .env.example
```

---

## Sistema de Permissões (RBAC)

```
SUPER_ADMIN
  └── Acesso total + gerenciar empresas/planos

ADMIN
  └── Gerenciar empresa + usuários + todos os módulos

MANAGER
  └── Visualizar relatórios + gerenciar equipe

SALES
  └── Próprios leads + registrar vendas

FINANCE
  └── Receitas + Despesas + Relatórios financeiros

OPERATOR
  └── Permissões customizadas por empresa
```

### Hierarquia de Acesso
| Role | Dashboard | Clientes | Leads | Vendas | Financeiro | Relatórios | Usuários | Admin |
|---|---|---|---|---|---|---|---|---|
| super_admin | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| admin | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| manager | ✅ | ✅ | ✅ | ✅ | 👁️ | ✅ | ❌ | ❌ |
| sales | ✅ | 👁️ | ✅* | ✅* | ❌ | ❌ | ❌ | ❌ |
| finance | ✅ | ❌ | ❌ | 👁️ | ✅ | ✅ | ❌ | ❌ |
| operator | custom | custom | custom | custom | custom | custom | custom | ❌ |

*Apenas próprios registros

---

## Fluxo de Autenticação

```
1. Usuário acessa /login
2. Supabase Auth valida credenciais
3. JWT gerado com claims: { user_id, company_id, role }
4. Middleware Next.js verifica JWT em cada request
5. RLS Supabase usa company_id do JWT para filtrar dados
6. Frontend usa authStore (Zustand) para estado do usuário
```

---

## Design System

### Paleta de Cores
```css
--primary:    #2563EB  /* Azul principal */
--secondary:  #0F172A  /* Azul escuro */
--success:    #22C55E  /* Verde */
--warning:    #F59E0B  /* Amarelo */
--error:      #EF4444  /* Vermelho */
--background: #F8FAFC  /* Fundo geral */
--text-main:  #0F172A  /* Texto principal */
--text-muted: #64748B  /* Texto secundário */
```

### Tipografia
- **Família**: Inter (Google Fonts)
- **Tamanhos**: 12px, 14px, 16px, 18px, 20px, 24px, 30px, 36px

---

## Segurança

- **JWT**: Tokens com expiração de 1 hora, refresh automático
- **RLS**: Isolamento de dados no nível do banco
- **Rate Limiting**: Via Nginx e Supabase
- **CSRF**: Next.js server actions com CSRF protection
- **XSS**: Sanitização via React + CSP headers
- **Auditoria**: Triggers automáticos para audit_logs

---

## Fases de Desenvolvimento

| Fase | Módulo | Status |
|---|---|---|
| 1 | Fundação (Auth, DB, Estrutura) | 🔄 Em andamento |
| 2 | Dashboard | ⏳ Pendente |
| 3 | Clientes | ⏳ Pendente |
| 4 | Leads (Kanban) | ⏳ Pendente |
| 5 | Vendas | ⏳ Pendente |
| 6 | Financeiro | ⏳ Pendente |
| 7 | Relatórios | ⏳ Pendente |
| 8 | Integrações | ⏳ Pendente |
| 9 | Inteligência Artificial | ⏳ Pendente |
| 10 | Agentes de IA | ⏳ Pendente |
