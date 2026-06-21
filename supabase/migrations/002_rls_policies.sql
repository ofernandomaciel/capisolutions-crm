-- ============================================================
-- CAPISOLUTIONS CRM — Migration 002: Row Level Security
-- ============================================================
-- Estratégia: JWT claim `company_id` isola dados por empresa.
-- Super admin (is_super_admin = true) bypassa via função helper.
-- ============================================================

-- ============================================================
-- FUNÇÕES HELPER para RLS
-- ============================================================

-- Retorna o company_id do usuário autenticado via JWT
CREATE OR REPLACE FUNCTION auth.company_id()
RETURNS UUID AS $$
  SELECT NULLIF(current_setting('request.jwt.claims', true)::jsonb ->> 'company_id', '')::UUID;
$$ LANGUAGE sql STABLE;

-- Retorna o user_id do usuário autenticado
CREATE OR REPLACE FUNCTION auth.user_id()
RETURNS UUID AS $$
  SELECT auth.uid();
$$ LANGUAGE sql STABLE;

-- Verifica se o usuário atual é super admin
CREATE OR REPLACE FUNCTION auth.is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (current_setting('request.jwt.claims', true)::jsonb ->> 'is_super_admin')::boolean,
    false
  );
$$ LANGUAGE sql STABLE;

-- Retorna o role do usuário atual
CREATE OR REPLACE FUNCTION auth.user_role()
RETURNS TEXT AS $$
  SELECT current_setting('request.jwt.claims', true)::jsonb ->> 'role';
$$ LANGUAGE sql STABLE;

-- ============================================================
-- TABELA: companies
-- ============================================================
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Super admin: acesso total
CREATE POLICY "super_admin_companies_all" ON companies
  FOR ALL TO authenticated
  USING (auth.is_super_admin())
  WITH CHECK (auth.is_super_admin());

-- Usuário autenticado: apenas sua própria empresa
CREATE POLICY "users_own_company" ON companies
  FOR SELECT TO authenticated
  USING (id = auth.company_id());

-- ============================================================
-- TABELA: users
-- ============================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Super admin: acesso total
CREATE POLICY "super_admin_users_all" ON users
  FOR ALL TO authenticated
  USING (auth.is_super_admin())
  WITH CHECK (auth.is_super_admin());

-- Admin/Manager: ver todos da empresa
CREATE POLICY "company_users_select" ON users
  FOR SELECT TO authenticated
  USING (
    company_id = auth.company_id()
    AND auth.user_role() IN ('admin', 'manager')
  );

-- Qualquer usuário: ver próprio perfil
CREATE POLICY "own_user_select" ON users
  FOR SELECT TO authenticated
  USING (id = auth.user_id());

-- Admin: criar/editar/deletar usuários da empresa
CREATE POLICY "admin_users_insert" ON users
  FOR INSERT TO authenticated
  WITH CHECK (
    company_id = auth.company_id()
    AND auth.user_role() = 'admin'
  );

CREATE POLICY "admin_users_update" ON users
  FOR UPDATE TO authenticated
  USING (
    company_id = auth.company_id()
    AND auth.user_role() = 'admin'
  )
  WITH CHECK (
    company_id = auth.company_id()
  );

-- Usuário: atualizar próprio perfil
CREATE POLICY "own_user_update" ON users
  FOR UPDATE TO authenticated
  USING (id = auth.user_id())
  WITH CHECK (id = auth.user_id());

-- ============================================================
-- TABELA: customers
-- ============================================================
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin_customers_all" ON customers
  FOR ALL TO authenticated
  USING (auth.is_super_admin())
  WITH CHECK (auth.is_super_admin());

CREATE POLICY "company_customers_select" ON customers
  FOR SELECT TO authenticated
  USING (company_id = auth.company_id());

CREATE POLICY "company_customers_insert" ON customers
  FOR INSERT TO authenticated
  WITH CHECK (
    company_id = auth.company_id()
    AND auth.user_role() IN ('admin', 'manager', 'sales')
  );

CREATE POLICY "company_customers_update" ON customers
  FOR UPDATE TO authenticated
  USING (company_id = auth.company_id())
  WITH CHECK (
    company_id = auth.company_id()
    AND auth.user_role() IN ('admin', 'manager', 'sales')
  );

CREATE POLICY "admin_customers_delete" ON customers
  FOR DELETE TO authenticated
  USING (
    company_id = auth.company_id()
    AND auth.user_role() IN ('admin', 'manager')
  );

-- ============================================================
-- TABELA: lead_stages
-- ============================================================
ALTER TABLE lead_stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin_lead_stages_all" ON lead_stages
  FOR ALL TO authenticated
  USING (auth.is_super_admin())
  WITH CHECK (auth.is_super_admin());

CREATE POLICY "company_lead_stages_select" ON lead_stages
  FOR SELECT TO authenticated
  USING (company_id = auth.company_id());

CREATE POLICY "admin_lead_stages_modify" ON lead_stages
  FOR ALL TO authenticated
  USING (
    company_id = auth.company_id()
    AND auth.user_role() IN ('admin', 'manager')
  )
  WITH CHECK (
    company_id = auth.company_id()
    AND auth.user_role() IN ('admin', 'manager')
  );

-- ============================================================
-- TABELA: leads
-- ============================================================
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin_leads_all" ON leads
  FOR ALL TO authenticated
  USING (auth.is_super_admin())
  WITH CHECK (auth.is_super_admin());

-- Admin/Manager/Finance: ver todos os leads da empresa
CREATE POLICY "admin_manager_leads_select" ON leads
  FOR SELECT TO authenticated
  USING (
    company_id = auth.company_id()
    AND auth.user_role() IN ('admin', 'manager', 'finance')
  );

-- Sales: ver apenas próprios leads
CREATE POLICY "sales_own_leads_select" ON leads
  FOR SELECT TO authenticated
  USING (
    company_id = auth.company_id()
    AND auth.user_role() = 'sales'
    AND assigned_to = auth.user_id()
  );

CREATE POLICY "company_leads_insert" ON leads
  FOR INSERT TO authenticated
  WITH CHECK (
    company_id = auth.company_id()
    AND auth.user_role() IN ('admin', 'manager', 'sales')
  );

CREATE POLICY "leads_update" ON leads
  FOR UPDATE TO authenticated
  USING (
    company_id = auth.company_id()
    AND (
      auth.user_role() IN ('admin', 'manager')
      OR (auth.user_role() = 'sales' AND assigned_to = auth.user_id())
    )
  )
  WITH CHECK (company_id = auth.company_id());

CREATE POLICY "admin_leads_delete" ON leads
  FOR DELETE TO authenticated
  USING (
    company_id = auth.company_id()
    AND auth.user_role() IN ('admin', 'manager')
  );

-- ============================================================
-- TABELA: products
-- ============================================================
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin_products_all" ON products
  FOR ALL TO authenticated
  USING (auth.is_super_admin())
  WITH CHECK (auth.is_super_admin());

CREATE POLICY "company_products_select" ON products
  FOR SELECT TO authenticated
  USING (company_id = auth.company_id());

CREATE POLICY "admin_products_modify" ON products
  FOR ALL TO authenticated
  USING (
    company_id = auth.company_id()
    AND auth.user_role() IN ('admin', 'manager')
  )
  WITH CHECK (
    company_id = auth.company_id()
    AND auth.user_role() IN ('admin', 'manager')
  );

-- ============================================================
-- TABELA: sales
-- ============================================================
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin_sales_all" ON sales
  FOR ALL TO authenticated
  USING (auth.is_super_admin())
  WITH CHECK (auth.is_super_admin());

CREATE POLICY "admin_manager_finance_sales_select" ON sales
  FOR SELECT TO authenticated
  USING (
    company_id = auth.company_id()
    AND auth.user_role() IN ('admin', 'manager', 'finance')
  );

CREATE POLICY "sales_own_sales_select" ON sales
  FOR SELECT TO authenticated
  USING (
    company_id = auth.company_id()
    AND auth.user_role() = 'sales'
    AND assigned_to = auth.user_id()
  );

CREATE POLICY "company_sales_insert" ON sales
  FOR INSERT TO authenticated
  WITH CHECK (
    company_id = auth.company_id()
    AND auth.user_role() IN ('admin', 'manager', 'sales')
  );

CREATE POLICY "sales_update" ON sales
  FOR UPDATE TO authenticated
  USING (
    company_id = auth.company_id()
    AND (
      auth.user_role() IN ('admin', 'manager')
      OR (auth.user_role() = 'sales' AND assigned_to = auth.user_id())
    )
  )
  WITH CHECK (company_id = auth.company_id());

CREATE POLICY "admin_sales_delete" ON sales
  FOR DELETE TO authenticated
  USING (
    company_id = auth.company_id()
    AND auth.user_role() = 'admin'
  );

-- ============================================================
-- TABELA: categories
-- ============================================================
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin_categories_all" ON categories
  FOR ALL TO authenticated
  USING (auth.is_super_admin())
  WITH CHECK (auth.is_super_admin());

CREATE POLICY "company_categories_select" ON categories
  FOR SELECT TO authenticated
  USING (company_id = auth.company_id());

CREATE POLICY "admin_finance_categories_modify" ON categories
  FOR ALL TO authenticated
  USING (
    company_id = auth.company_id()
    AND auth.user_role() IN ('admin', 'finance')
  )
  WITH CHECK (
    company_id = auth.company_id()
    AND auth.user_role() IN ('admin', 'finance')
  );

-- ============================================================
-- TABELA: revenues
-- ============================================================
ALTER TABLE revenues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin_revenues_all" ON revenues
  FOR ALL TO authenticated
  USING (auth.is_super_admin())
  WITH CHECK (auth.is_super_admin());

CREATE POLICY "admin_finance_revenues_all" ON revenues
  FOR ALL TO authenticated
  USING (
    company_id = auth.company_id()
    AND auth.user_role() IN ('admin', 'finance')
  )
  WITH CHECK (
    company_id = auth.company_id()
    AND auth.user_role() IN ('admin', 'finance')
  );

CREATE POLICY "manager_revenues_select" ON revenues
  FOR SELECT TO authenticated
  USING (
    company_id = auth.company_id()
    AND auth.user_role() = 'manager'
  );

-- ============================================================
-- TABELA: expenses
-- ============================================================
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin_expenses_all" ON expenses
  FOR ALL TO authenticated
  USING (auth.is_super_admin())
  WITH CHECK (auth.is_super_admin());

CREATE POLICY "admin_finance_expenses_all" ON expenses
  FOR ALL TO authenticated
  USING (
    company_id = auth.company_id()
    AND auth.user_role() IN ('admin', 'finance')
  )
  WITH CHECK (
    company_id = auth.company_id()
    AND auth.user_role() IN ('admin', 'finance')
  );

CREATE POLICY "manager_expenses_select" ON expenses
  FOR SELECT TO authenticated
  USING (
    company_id = auth.company_id()
    AND auth.user_role() = 'manager'
  );

-- ============================================================
-- TABELA: tasks
-- ============================================================
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin_tasks_all" ON tasks
  FOR ALL TO authenticated
  USING (auth.is_super_admin())
  WITH CHECK (auth.is_super_admin());

CREATE POLICY "company_tasks_select" ON tasks
  FOR SELECT TO authenticated
  USING (
    company_id = auth.company_id()
    AND (
      auth.user_role() IN ('admin', 'manager')
      OR assigned_to = auth.user_id()
      OR created_by = auth.user_id()
    )
  );

CREATE POLICY "company_tasks_insert" ON tasks
  FOR INSERT TO authenticated
  WITH CHECK (company_id = auth.company_id());

CREATE POLICY "tasks_update" ON tasks
  FOR UPDATE TO authenticated
  USING (
    company_id = auth.company_id()
    AND (
      auth.user_role() IN ('admin', 'manager')
      OR assigned_to = auth.user_id()
      OR created_by = auth.user_id()
    )
  )
  WITH CHECK (company_id = auth.company_id());

-- ============================================================
-- TABELA: files
-- ============================================================
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin_files_all" ON files
  FOR ALL TO authenticated
  USING (auth.is_super_admin())
  WITH CHECK (auth.is_super_admin());

CREATE POLICY "company_files_select" ON files
  FOR SELECT TO authenticated
  USING (company_id = auth.company_id());

CREATE POLICY "company_files_insert" ON files
  FOR INSERT TO authenticated
  WITH CHECK (company_id = auth.company_id());

CREATE POLICY "admin_files_delete" ON files
  FOR DELETE TO authenticated
  USING (
    company_id = auth.company_id()
    AND auth.user_role() IN ('admin', 'manager')
  );

-- ============================================================
-- TABELA: integrations
-- ============================================================
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin_integrations_all" ON integrations
  FOR ALL TO authenticated
  USING (auth.is_super_admin())
  WITH CHECK (auth.is_super_admin());

CREATE POLICY "admin_integrations_all" ON integrations
  FOR ALL TO authenticated
  USING (
    company_id = auth.company_id()
    AND auth.user_role() = 'admin'
  )
  WITH CHECK (
    company_id = auth.company_id()
    AND auth.user_role() = 'admin'
  );

CREATE POLICY "company_integrations_select" ON integrations
  FOR SELECT TO authenticated
  USING (company_id = auth.company_id());

-- ============================================================
-- TABELA: webhooks
-- ============================================================
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin_webhooks_all" ON webhooks
  FOR ALL TO authenticated
  USING (auth.is_super_admin())
  WITH CHECK (auth.is_super_admin());

CREATE POLICY "admin_webhooks_all" ON webhooks
  FOR ALL TO authenticated
  USING (
    company_id = auth.company_id()
    AND auth.user_role() = 'admin'
  )
  WITH CHECK (
    company_id = auth.company_id()
    AND auth.user_role() = 'admin'
  );

-- ============================================================
-- TABELA: ai_providers
-- ============================================================
ALTER TABLE ai_providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin_ai_providers_all" ON ai_providers
  FOR ALL TO authenticated
  USING (auth.is_super_admin())
  WITH CHECK (auth.is_super_admin());

CREATE POLICY "admin_ai_providers_all" ON ai_providers
  FOR ALL TO authenticated
  USING (
    company_id = auth.company_id()
    AND auth.user_role() = 'admin'
  )
  WITH CHECK (
    company_id = auth.company_id()
    AND auth.user_role() = 'admin'
  );

CREATE POLICY "company_ai_providers_select" ON ai_providers
  FOR SELECT TO authenticated
  USING (company_id = auth.company_id());

-- ============================================================
-- TABELA: audit_logs
-- ============================================================
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- audit_logs: apenas super_admin pode ver tudo
CREATE POLICY "super_admin_audit_all" ON audit_logs
  FOR ALL TO authenticated
  USING (auth.is_super_admin())
  WITH CHECK (auth.is_super_admin());

-- Admin: ver logs da própria empresa
CREATE POLICY "admin_audit_company" ON audit_logs
  FOR SELECT TO authenticated
  USING (
    company_id = auth.company_id()
    AND auth.user_role() = 'admin'
  );

-- Qualquer usuário: inserir logs (via service role na aplicação)
-- INSERT é feito sempre via service_role no backend
