-- ============================================================
-- CAPISOLUTIONS CRM — Migration 003: Funções e Triggers
-- ============================================================

-- ============================================================
-- FUNÇÃO: Criar empresa + stages padrão
-- ============================================================
CREATE OR REPLACE FUNCTION create_company_defaults(p_company_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Criar stages de lead padrão
  INSERT INTO lead_stages (company_id, name, color, position, is_closed, is_lost) VALUES
    (p_company_id, 'Novo Lead',       '#6366F1', 0, false, false),
    (p_company_id, 'Contato Inicial', '#3B82F6', 1, false, false),
    (p_company_id, 'Qualificação',    '#8B5CF6', 2, false, false),
    (p_company_id, 'Proposta',        '#F59E0B', 3, false, false),
    (p_company_id, 'Negociação',      '#EF4444', 4, false, false),
    (p_company_id, 'Fechado',         '#22C55E', 5, true,  false),
    (p_company_id, 'Perdido',         '#6B7280', 6, true,  true);

  -- Criar categorias financeiras padrão
  INSERT INTO categories (company_id, name, type, color) VALUES
    -- Receitas
    (p_company_id, 'Vendas de Produtos',  'income',  '#22C55E'),
    (p_company_id, 'Prestação de Serviços','income', '#3B82F6'),
    (p_company_id, 'Comissões Recebidas', 'income',  '#8B5CF6'),
    (p_company_id, 'Outras Receitas',     'income',  '#6366F1'),
    -- Despesas
    (p_company_id, 'Folha de Pagamento',  'expense', '#EF4444'),
    (p_company_id, 'Aluguel',             'expense', '#F59E0B'),
    (p_company_id, 'Marketing',           'expense', '#EC4899'),
    (p_company_id, 'Tecnologia/Software', 'expense', '#14B8A6'),
    (p_company_id, 'Operacional',         'expense', '#F97316'),
    (p_company_id, 'Outras Despesas',     'expense', '#6B7280');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- FUNÇÃO: Hook pós-criação de empresa (via trigger ou chamada manual)
-- ============================================================
CREATE OR REPLACE FUNCTION on_company_created()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM create_company_defaults(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_company_created
  AFTER INSERT ON companies
  FOR EACH ROW EXECUTE FUNCTION on_company_created();

-- ============================================================
-- FUNÇÃO: Criar perfil de usuário após signup Supabase Auth
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_auth_user()
RETURNS TRIGGER AS $$
DECLARE
  v_company_id UUID;
  v_role_id    UUID;
  v_first_name TEXT;
  v_last_name  TEXT;
BEGIN
  -- Extrair dados do metadata do Supabase Auth
  v_company_id := (NEW.raw_user_meta_data ->> 'company_id')::UUID;
  v_first_name := COALESCE(NEW.raw_user_meta_data ->> 'first_name', split_part(NEW.email, '@', 1));
  v_last_name  := NEW.raw_user_meta_data ->> 'last_name';

  -- Buscar role padrão (admin para o primeiro usuário da empresa, sales para demais)
  SELECT id INTO v_role_id FROM roles WHERE name = COALESCE(
    NEW.raw_user_meta_data ->> 'role',
    'admin'
  );

  -- Criar perfil
  INSERT INTO users (id, company_id, role_id, first_name, last_name, email, status)
  VALUES (
    NEW.id,
    v_company_id,
    v_role_id,
    v_first_name,
    v_last_name,
    NEW.email,
    'active'
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_auth_user();

-- ============================================================
-- FUNÇÃO: Audit log automático para tabelas principais
-- ============================================================
CREATE OR REPLACE FUNCTION audit_log_changes()
RETURNS TRIGGER AS $$
DECLARE
  v_company_id UUID;
  v_action     TEXT;
  v_old_data   JSONB;
  v_new_data   JSONB;
BEGIN
  -- Determinar ação
  IF TG_OP = 'INSERT' THEN
    v_action   := 'create';
    v_new_data := to_jsonb(NEW);
    v_company_id := (to_jsonb(NEW) ->> 'company_id')::UUID;
  ELSIF TG_OP = 'UPDATE' THEN
    v_action   := 'update';
    v_old_data := to_jsonb(OLD);
    v_new_data := to_jsonb(NEW);
    v_company_id := (to_jsonb(NEW) ->> 'company_id')::UUID;
  ELSIF TG_OP = 'DELETE' THEN
    v_action   := 'delete';
    v_old_data := to_jsonb(OLD);
    v_company_id := (to_jsonb(OLD) ->> 'company_id')::UUID;
  END IF;

  -- Remover campos sensíveis do log
  v_new_data := v_new_data - 'api_key';
  v_old_data := v_old_data - 'api_key';

  INSERT INTO audit_logs (
    company_id, user_id, action, resource, resource_id,
    old_data, new_data
  ) VALUES (
    v_company_id,
    auth.uid(),
    v_action,
    TG_TABLE_NAME,
    CASE
      WHEN TG_OP = 'DELETE' THEN (to_jsonb(OLD) ->> 'id')::UUID
      ELSE (to_jsonb(NEW) ->> 'id')::UUID
    END,
    v_old_data,
    v_new_data
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar audit em tabelas principais
CREATE TRIGGER audit_customers
  AFTER INSERT OR UPDATE OR DELETE ON customers
  FOR EACH ROW EXECUTE FUNCTION audit_log_changes();

CREATE TRIGGER audit_leads
  AFTER INSERT OR UPDATE OR DELETE ON leads
  FOR EACH ROW EXECUTE FUNCTION audit_log_changes();

CREATE TRIGGER audit_sales
  AFTER INSERT OR UPDATE OR DELETE ON sales
  FOR EACH ROW EXECUTE FUNCTION audit_log_changes();

CREATE TRIGGER audit_revenues
  AFTER INSERT OR UPDATE OR DELETE ON revenues
  FOR EACH ROW EXECUTE FUNCTION audit_log_changes();

CREATE TRIGGER audit_expenses
  AFTER INSERT OR UPDATE OR DELETE ON expenses
  FOR EACH ROW EXECUTE FUNCTION audit_log_changes();

-- ============================================================
-- FUNÇÃO: Calcular métricas do dashboard (RPC)
-- ============================================================
CREATE OR REPLACE FUNCTION get_dashboard_metrics(
  p_company_id UUID,
  p_start_date DATE DEFAULT date_trunc('month', CURRENT_DATE)::DATE,
  p_end_date   DATE DEFAULT CURRENT_DATE
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'leads_count',      COALESCE((SELECT COUNT(*) FROM leads WHERE company_id = p_company_id AND created_at::DATE BETWEEN p_start_date AND p_end_date), 0),
    'leads_open',       COALESCE((SELECT COUNT(*) FROM leads WHERE company_id = p_company_id AND status = 'open'), 0),
    'leads_won',        COALESCE((SELECT COUNT(*) FROM leads WHERE company_id = p_company_id AND status = 'won'  AND created_at::DATE BETWEEN p_start_date AND p_end_date), 0),
    'sales_count',      COALESCE((SELECT COUNT(*) FROM sales WHERE company_id = p_company_id AND status = 'completed' AND created_at::DATE BETWEEN p_start_date AND p_end_date), 0),
    'revenue_total',    COALESCE((SELECT SUM(final_value) FROM sales WHERE company_id = p_company_id AND status = 'completed' AND created_at::DATE BETWEEN p_start_date AND p_end_date), 0),
    'ticket_average',   COALESCE((SELECT AVG(final_value) FROM sales WHERE company_id = p_company_id AND status = 'completed' AND created_at::DATE BETWEEN p_start_date AND p_end_date), 0),
    'customers_count',  COALESCE((SELECT COUNT(*) FROM customers WHERE company_id = p_company_id AND status = 'active'), 0),
    'new_customers',    COALESCE((SELECT COUNT(*) FROM customers WHERE company_id = p_company_id AND created_at::DATE BETWEEN p_start_date AND p_end_date), 0),
    'conversion_rate',  COALESCE(
      CASE
        WHEN (SELECT COUNT(*) FROM leads WHERE company_id = p_company_id AND created_at::DATE BETWEEN p_start_date AND p_end_date) > 0
        THEN ROUND(
          (SELECT COUNT(*) FROM leads WHERE company_id = p_company_id AND status = 'won' AND created_at::DATE BETWEEN p_start_date AND p_end_date)::NUMERIC
          /
          (SELECT COUNT(*) FROM leads WHERE company_id = p_company_id AND created_at::DATE BETWEEN p_start_date AND p_end_date)::NUMERIC
          * 100, 2
        )
        ELSE 0
      END, 0
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- FUNÇÃO: Verificar JWT claims (helper para configuração)
-- ============================================================
CREATE OR REPLACE FUNCTION get_my_claims()
RETURNS JSONB AS $$
  SELECT current_setting('request.jwt.claims', true)::JSONB;
$$ LANGUAGE sql STABLE;

-- ============================================================
-- GRANT de execução para usuários autenticados
-- ============================================================
GRANT EXECUTE ON FUNCTION get_dashboard_metrics(UUID, DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_my_claims() TO authenticated;
GRANT EXECUTE ON FUNCTION auth.company_id() TO authenticated;
GRANT EXECUTE ON FUNCTION auth.user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION auth.is_super_admin() TO authenticated;
