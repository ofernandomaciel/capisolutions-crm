-- ============================================================
-- CAPISOLUTIONS CRM — Migration 001: Schema Inicial
-- ============================================================
-- Todas as tabelas incluem:
--   - id UUID PRIMARY KEY DEFAULT gen_random_uuid()
--   - company_id UUID (isolamento multiempresa via RLS)
--   - created_at / updated_at com trigger automático
-- ============================================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- FUNÇÃO: updated_at automático
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- TABELA: companies
-- ============================================================
CREATE TABLE IF NOT EXISTS companies (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(255) NOT NULL,
  slug          VARCHAR(100) UNIQUE NOT NULL,
  cnpj          VARCHAR(18),
  email         VARCHAR(255),
  phone         VARCHAR(20),
  website       VARCHAR(255),
  logo_url      TEXT,
  plan          VARCHAR(50) NOT NULL DEFAULT 'free'
                  CHECK (plan IN ('free', 'starter', 'professional', 'enterprise')),
  status        VARCHAR(20) NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active', 'suspended', 'cancelled')),
  settings      JSONB NOT NULL DEFAULT '{}',
  trial_ends_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- TABELA: roles
-- ============================================================
CREATE TABLE IF NOT EXISTS roles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(50) UNIQUE NOT NULL,
  label       VARCHAR(100) NOT NULL,
  description TEXT,
  is_system   BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Roles padrão do sistema
INSERT INTO roles (name, label, description, is_system) VALUES
  ('super_admin', 'Super Administrador', 'Controle total do sistema e todas as empresas', true),
  ('admin',       'Administrador',       'Controle total da empresa',                      true),
  ('manager',     'Gerente',             'Gerencia equipes e visualiza relatórios',         true),
  ('sales',       'Vendedor',            'Gerencia próprios leads e registra vendas',       true),
  ('finance',     'Financeiro',          'Acesso ao módulo financeiro',                     true),
  ('operator',    'Operacional',         'Permissões customizadas',                         true)
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- TABELA: permissions
-- ============================================================
CREATE TABLE IF NOT EXISTS permissions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(100) UNIQUE NOT NULL,
  module      VARCHAR(50) NOT NULL,
  action      VARCHAR(50) NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Permissões por módulo
INSERT INTO permissions (name, module, action, description) VALUES
  -- Dashboard
  ('dashboard.view',         'dashboard',  'view',   'Visualizar dashboard'),
  -- Clientes
  ('customers.view',         'customers',  'view',   'Visualizar clientes'),
  ('customers.create',       'customers',  'create', 'Criar clientes'),
  ('customers.edit',         'customers',  'edit',   'Editar clientes'),
  ('customers.delete',       'customers',  'delete', 'Excluir clientes'),
  ('customers.export',       'customers',  'export', 'Exportar clientes'),
  -- Leads
  ('leads.view',             'leads',      'view',   'Visualizar leads'),
  ('leads.view_own',         'leads',      'view',   'Visualizar próprios leads'),
  ('leads.create',           'leads',      'create', 'Criar leads'),
  ('leads.edit',             'leads',      'edit',   'Editar leads'),
  ('leads.delete',           'leads',      'delete', 'Excluir leads'),
  -- Vendas
  ('sales.view',             'sales',      'view',   'Visualizar vendas'),
  ('sales.view_own',         'sales',      'view',   'Visualizar próprias vendas'),
  ('sales.create',           'sales',      'create', 'Registrar vendas'),
  ('sales.edit',             'sales',      'edit',   'Editar vendas'),
  ('sales.delete',           'sales',      'delete', 'Excluir vendas'),
  -- Financeiro
  ('finance.view',           'finance',    'view',   'Visualizar financeiro'),
  ('finance.create',         'finance',    'create', 'Criar lançamentos'),
  ('finance.edit',           'finance',    'edit',   'Editar lançamentos'),
  ('finance.delete',         'finance',    'delete', 'Excluir lançamentos'),
  -- Relatórios
  ('reports.view',           'reports',    'view',   'Visualizar relatórios'),
  ('reports.export',         'reports',    'export', 'Exportar relatórios'),
  -- Usuários
  ('users.view',             'users',      'view',   'Visualizar usuários'),
  ('users.create',           'users',      'create', 'Criar usuários'),
  ('users.edit',             'users',      'edit',   'Editar usuários'),
  ('users.delete',           'users',      'delete', 'Excluir usuários'),
  -- Configurações
  ('settings.view',          'settings',   'view',   'Visualizar configurações'),
  ('settings.edit',          'settings',   'edit',   'Editar configurações'),
  -- Admin (Super)
  ('admin.companies',        'admin',      'manage', 'Gerenciar empresas'),
  ('admin.plans',            'admin',      'manage', 'Gerenciar planos')
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- TABELA: role_permissions
-- ============================================================
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id       UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- Vincular permissões aos roles
DO $$
DECLARE
  r_super_admin UUID;
  r_admin       UUID;
  r_manager     UUID;
  r_sales       UUID;
  r_finance     UUID;
BEGIN
  SELECT id INTO r_super_admin FROM roles WHERE name = 'super_admin';
  SELECT id INTO r_admin       FROM roles WHERE name = 'admin';
  SELECT id INTO r_manager     FROM roles WHERE name = 'manager';
  SELECT id INTO r_sales       FROM roles WHERE name = 'sales';
  SELECT id INTO r_finance     FROM roles WHERE name = 'finance';

  -- super_admin: todas as permissões
  INSERT INTO role_permissions (role_id, permission_id)
    SELECT r_super_admin, id FROM permissions
    ON CONFLICT DO NOTHING;

  -- admin: tudo exceto admin.companies e admin.plans
  INSERT INTO role_permissions (role_id, permission_id)
    SELECT r_admin, id FROM permissions
    WHERE name NOT IN ('admin.companies', 'admin.plans')
    ON CONFLICT DO NOTHING;

  -- manager: view geral + relatórios + settings view
  INSERT INTO role_permissions (role_id, permission_id)
    SELECT r_manager, id FROM permissions
    WHERE name IN (
      'dashboard.view',
      'customers.view', 'customers.create', 'customers.edit',
      'leads.view', 'leads.create', 'leads.edit',
      'sales.view',
      'finance.view',
      'reports.view', 'reports.export',
      'settings.view',
      'users.view'
    )
    ON CONFLICT DO NOTHING;

  -- sales: próprios leads e vendas
  INSERT INTO role_permissions (role_id, permission_id)
    SELECT r_sales, id FROM permissions
    WHERE name IN (
      'dashboard.view',
      'customers.view',
      'leads.view_own', 'leads.create', 'leads.edit',
      'sales.view_own', 'sales.create'
    )
    ON CONFLICT DO NOTHING;

  -- finance: módulo financeiro + relatórios financeiros
  INSERT INTO role_permissions (role_id, permission_id)
    SELECT r_finance, id FROM permissions
    WHERE name IN (
      'dashboard.view',
      'sales.view',
      'finance.view', 'finance.create', 'finance.edit', 'finance.delete',
      'reports.view', 'reports.export'
    )
    ON CONFLICT DO NOTHING;
END $$;

-- ============================================================
-- TABELA: users (profiles — extensão do auth.users do Supabase)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id    UUID REFERENCES companies(id) ON DELETE CASCADE,
  role_id       UUID REFERENCES roles(id),
  first_name    VARCHAR(100) NOT NULL,
  last_name     VARCHAR(100),
  email         VARCHAR(255) NOT NULL,
  phone         VARCHAR(20),
  avatar_url    TEXT,
  status        VARCHAR(20) NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active', 'inactive', 'invited')),
  is_super_admin BOOLEAN NOT NULL DEFAULT false,
  last_login_at  TIMESTAMPTZ,
  settings      JSONB NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_company_id ON users(company_id);
CREATE INDEX idx_users_email      ON users(email);

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- TABELA: customers
-- ============================================================
CREATE TABLE IF NOT EXISTS customers (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name          VARCHAR(255) NOT NULL,
  company_name  VARCHAR(255),
  document      VARCHAR(20),  -- CPF ou CNPJ
  document_type VARCHAR(10) CHECK (document_type IN ('cpf', 'cnpj')),
  email         VARCHAR(255),
  phone         VARCHAR(20),
  whatsapp      VARCHAR(20),
  -- Endereço
  zip_code      VARCHAR(10),
  street        VARCHAR(255),
  street_number VARCHAR(20),
  complement    VARCHAR(100),
  neighborhood  VARCHAR(100),
  city          VARCHAR(100),
  state         CHAR(2),
  -- Metadados
  source        VARCHAR(50),   -- origem do cliente
  status        VARCHAR(20) NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active', 'inactive', 'blocked')),
  tags          TEXT[] DEFAULT '{}',
  notes         TEXT,
  assigned_to   UUID REFERENCES users(id),
  created_by    UUID REFERENCES users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_customers_company_id ON customers(company_id);
CREATE INDEX idx_customers_email      ON customers(email);
CREATE INDEX idx_customers_document   ON customers(document);

CREATE TRIGGER trg_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- TABELA: lead_stages
-- ============================================================
CREATE TABLE IF NOT EXISTS lead_stages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name        VARCHAR(100) NOT NULL,
  color       VARCHAR(7) DEFAULT '#6366F1',
  position    SMALLINT NOT NULL DEFAULT 0,
  is_closed   BOOLEAN NOT NULL DEFAULT false,
  is_lost     BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_lead_stages_company_id ON lead_stages(company_id);

CREATE TRIGGER trg_lead_stages_updated_at
  BEFORE UPDATE ON lead_stages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- TABELA: leads
-- ============================================================
CREATE TABLE IF NOT EXISTS leads (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  customer_id   UUID REFERENCES customers(id),
  stage_id      UUID REFERENCES lead_stages(id),
  title         VARCHAR(255) NOT NULL,
  value         NUMERIC(15,2),
  source        VARCHAR(50),
  priority      VARCHAR(10) DEFAULT 'medium'
                  CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status        VARCHAR(20) NOT NULL DEFAULT 'open'
                  CHECK (status IN ('open', 'won', 'lost', 'archived')),
  expected_close_date DATE,
  lost_reason   TEXT,
  notes         TEXT,
  tags          TEXT[] DEFAULT '{}',
  assigned_to   UUID REFERENCES users(id),
  created_by    UUID REFERENCES users(id),
  converted_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_leads_company_id  ON leads(company_id);
CREATE INDEX idx_leads_stage_id    ON leads(stage_id);
CREATE INDEX idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX idx_leads_status      ON leads(status);

CREATE TRIGGER trg_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- TABELA: products / services
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name          VARCHAR(255) NOT NULL,
  description   TEXT,
  type          VARCHAR(20) NOT NULL DEFAULT 'product'
                  CHECK (type IN ('product', 'service')),
  price         NUMERIC(15,2) NOT NULL DEFAULT 0,
  unit          VARCHAR(30),
  sku           VARCHAR(100),
  status        VARCHAR(20) NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active', 'inactive')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_company_id ON products(company_id);

CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- TABELA: sales
-- ============================================================
CREATE TABLE IF NOT EXISTS sales (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  lead_id         UUID REFERENCES leads(id),
  customer_id     UUID REFERENCES customers(id),
  title           VARCHAR(255) NOT NULL,
  total_value     NUMERIC(15,2) NOT NULL DEFAULT 0,
  discount        NUMERIC(15,2) NOT NULL DEFAULT 0,
  final_value     NUMERIC(15,2) NOT NULL DEFAULT 0,
  commission_rate NUMERIC(5,2) DEFAULT 0,    -- percentual
  commission_value NUMERIC(15,2) DEFAULT 0,
  status          VARCHAR(20) NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'completed', 'cancelled', 'refunded')),
  notes           TEXT,
  sold_at         TIMESTAMPTZ,
  assigned_to     UUID REFERENCES users(id),
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sales_company_id   ON sales(company_id);
CREATE INDEX idx_sales_customer_id  ON sales(customer_id);
CREATE INDEX idx_sales_assigned_to  ON sales(assigned_to);
CREATE INDEX idx_sales_status       ON sales(status);

CREATE TRIGGER trg_sales_updated_at
  BEFORE UPDATE ON sales
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- TABELA: sale_items
-- ============================================================
CREATE TABLE IF NOT EXISTS sale_items (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id    UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  name       VARCHAR(255) NOT NULL,
  quantity   NUMERIC(10,3) NOT NULL DEFAULT 1,
  unit_price NUMERIC(15,2) NOT NULL DEFAULT 0,
  discount   NUMERIC(15,2) NOT NULL DEFAULT 0,
  total      NUMERIC(15,2) NOT NULL DEFAULT 0
);

-- ============================================================
-- TABELA: categories (financeiro)
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name       VARCHAR(100) NOT NULL,
  type       VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
  color      VARCHAR(7) DEFAULT '#6366F1',
  icon       VARCHAR(50),
  parent_id  UUID REFERENCES categories(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_categories_company_id ON categories(company_id);

CREATE TRIGGER trg_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- TABELA: revenues (contas a receber / receitas)
-- ============================================================
CREATE TABLE IF NOT EXISTS revenues (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  category_id   UUID REFERENCES categories(id),
  sale_id       UUID REFERENCES sales(id),
  customer_id   UUID REFERENCES customers(id),
  description   VARCHAR(255) NOT NULL,
  value         NUMERIC(15,2) NOT NULL,
  due_date      DATE NOT NULL,
  paid_date     DATE,
  status        VARCHAR(20) NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  payment_method VARCHAR(50),
  notes         TEXT,
  created_by    UUID REFERENCES users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_revenues_company_id  ON revenues(company_id);
CREATE INDEX idx_revenues_due_date    ON revenues(due_date);
CREATE INDEX idx_revenues_status      ON revenues(status);

CREATE TRIGGER trg_revenues_updated_at
  BEFORE UPDATE ON revenues
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- TABELA: expenses (contas a pagar / despesas)
-- ============================================================
CREATE TABLE IF NOT EXISTS expenses (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id     UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  category_id    UUID REFERENCES categories(id),
  description    VARCHAR(255) NOT NULL,
  value          NUMERIC(15,2) NOT NULL,
  due_date       DATE NOT NULL,
  paid_date      DATE,
  status         VARCHAR(20) NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  payment_method VARCHAR(50),
  recurrence     VARCHAR(20) CHECK (recurrence IN ('none', 'daily', 'weekly', 'monthly', 'yearly')),
  notes          TEXT,
  created_by     UUID REFERENCES users(id),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_expenses_company_id ON expenses(company_id);
CREATE INDEX idx_expenses_due_date   ON expenses(due_date);
CREATE INDEX idx_expenses_status     ON expenses(status);

CREATE TRIGGER trg_expenses_updated_at
  BEFORE UPDATE ON expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- TABELA: tasks / appointments
-- ============================================================
CREATE TABLE IF NOT EXISTS tasks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  customer_id   UUID REFERENCES customers(id),
  lead_id       UUID REFERENCES leads(id),
  title         VARCHAR(255) NOT NULL,
  description   TEXT,
  type          VARCHAR(20) NOT NULL DEFAULT 'task'
                  CHECK (type IN ('task', 'appointment', 'reminder', 'call', 'email')),
  priority      VARCHAR(10) DEFAULT 'medium'
                  CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status        VARCHAR(20) NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  due_date      TIMESTAMPTZ,
  completed_at  TIMESTAMPTZ,
  assigned_to   UUID REFERENCES users(id),
  created_by    UUID REFERENCES users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tasks_company_id   ON tasks(company_id);
CREATE INDEX idx_tasks_assigned_to  ON tasks(assigned_to);
CREATE INDEX idx_tasks_due_date     ON tasks(due_date);

CREATE TRIGGER trg_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- TABELA: files
-- ============================================================
CREATE TABLE IF NOT EXISTS files (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  customer_id   UUID REFERENCES customers(id),
  lead_id       UUID REFERENCES leads(id),
  sale_id       UUID REFERENCES sales(id),
  name          VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  mime_type     VARCHAR(100),
  size_bytes    BIGINT,
  storage_path  TEXT NOT NULL,
  public_url    TEXT,
  uploaded_by   UUID REFERENCES users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_files_company_id   ON files(company_id);
CREATE INDEX idx_files_customer_id  ON files(customer_id);

-- ============================================================
-- TABELA: integrations
-- ============================================================
CREATE TABLE IF NOT EXISTS integrations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  type          VARCHAR(50) NOT NULL,  -- 'n8n', 'evolution', 'openai', 'openrouter', 'ollama'
  name          VARCHAR(100) NOT NULL,
  config        JSONB NOT NULL DEFAULT '{}',
  is_active     BOOLEAN NOT NULL DEFAULT true,
  last_sync_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_integrations_company_id ON integrations(company_id);

CREATE TRIGGER trg_integrations_updated_at
  BEFORE UPDATE ON integrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- TABELA: webhooks
-- ============================================================
CREATE TABLE IF NOT EXISTS webhooks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name          VARCHAR(100) NOT NULL,
  url           TEXT NOT NULL,
  secret_token  VARCHAR(255),
  events        TEXT[] NOT NULL DEFAULT '{}',
  is_active     BOOLEAN NOT NULL DEFAULT true,
  last_triggered_at TIMESTAMPTZ,
  failure_count SMALLINT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_webhooks_company_id ON webhooks(company_id);

CREATE TRIGGER trg_webhooks_updated_at
  BEFORE UPDATE ON webhooks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- TABELA: ai_providers
-- ============================================================
CREATE TABLE IF NOT EXISTS ai_providers (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name          VARCHAR(100) NOT NULL,
  type          VARCHAR(30) NOT NULL CHECK (type IN ('openai', 'openrouter', 'ollama')),
  api_key       TEXT,            -- criptografado na aplicação
  base_url      TEXT,
  model         VARCHAR(100),
  config        JSONB NOT NULL DEFAULT '{}',
  is_active     BOOLEAN NOT NULL DEFAULT true,
  is_default    BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_providers_company_id ON ai_providers(company_id);

CREATE TRIGGER trg_ai_providers_updated_at
  BEFORE UPDATE ON ai_providers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- TABELA: audit_logs
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID REFERENCES companies(id) ON DELETE SET NULL,
  user_id       UUID REFERENCES users(id) ON DELETE SET NULL,
  action        VARCHAR(50) NOT NULL,   -- 'login', 'logout', 'create', 'update', 'delete', 'export'
  resource      VARCHAR(50),             -- 'customer', 'lead', 'sale', etc.
  resource_id   UUID,
  old_data      JSONB,
  new_data      JSONB,
  ip_address    INET,
  user_agent    TEXT,
  metadata      JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_company_id   ON audit_logs(company_id);
CREATE INDEX idx_audit_logs_user_id      ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at   ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_action       ON audit_logs(action);

-- Particionamento por mês para performance em produção
-- (Implementar após validação do volume de dados)

-- ============================================================
-- TABELA: webhook_logs
-- ============================================================
CREATE TABLE IF NOT EXISTS webhook_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id    UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
  company_id    UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  event         VARCHAR(100) NOT NULL,
  payload       JSONB NOT NULL,
  response_code SMALLINT,
  response_body TEXT,
  success       BOOLEAN NOT NULL DEFAULT false,
  duration_ms   INTEGER,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_webhook_logs_webhook_id  ON webhook_logs(webhook_id);
CREATE INDEX idx_webhook_logs_created_at  ON webhook_logs(created_at DESC);

-- ============================================================
-- TABELA: custom_fields (para fases futuras)
-- ============================================================
CREATE TABLE IF NOT EXISTS custom_fields (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  resource    VARCHAR(50) NOT NULL,  -- 'customer', 'lead', 'sale'
  name        VARCHAR(100) NOT NULL,
  label       VARCHAR(100) NOT NULL,
  type        VARCHAR(30) NOT NULL
                CHECK (type IN ('text', 'number', 'date', 'boolean', 'select', 'multiselect')),
  options     JSONB DEFAULT '[]',
  is_required BOOLEAN NOT NULL DEFAULT false,
  position    SMALLINT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_custom_fields_company_id ON custom_fields(company_id);
