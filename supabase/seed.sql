-- ============================================================
-- CAPISOLUTIONS CRM — Seed: Dados de Desenvolvimento
-- ============================================================
-- Execute APENAS em ambiente de desenvolvimento/staging.
-- NUNCA execute em produção.
-- ============================================================

-- ============================================================
-- Empresa demo
-- ============================================================
INSERT INTO companies (id, name, slug, cnpj, email, phone, plan, status) VALUES
  ('00000000-0000-0000-0000-000000000001',
   'CapiSolutions Demo',
   'capisolutions-demo',
   '00.000.000/0001-00',
   'demo@capisolutions.com.br',
   '(11) 99999-0000',
   'professional',
   'active')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Nota: Os usuários de seed devem ser criados via Supabase Auth
-- e depois seus perfis serão criados pelo trigger handle_new_auth_user.
--
-- Para criar o Super Admin via SQL (apenas dev):
-- 1. Crie o usuário no Supabase Auth Dashboard ou via supabase auth admin create-user
-- 2. Execute abaixo substituindo o UUID correto:
-- ============================================================

-- UPDATE users
--   SET is_super_admin = true,
--       company_id = NULL
-- WHERE email = 'superadmin@capisolutions.com.br';

-- ============================================================
-- Customers de exemplo (empresa demo)
-- ============================================================
-- Estes serão inseridos APÓS o usuário admin da empresa demo ser criado.
-- O script abaixo pode ser executado manualmente.

/*
INSERT INTO customers (company_id, name, company_name, document, document_type, email, phone, whatsapp, city, state, status, source) VALUES
  ('00000000-0000-0000-0000-000000000001', 'João Silva',       'Silva & Filhos Ltda',  '123.456.789-00', 'cpf',  'joao@silva.com',    '(11) 91111-1111', '(11) 91111-1111', 'São Paulo',       'SP', 'active', 'manual'),
  ('00000000-0000-0000-0000-000000000001', 'Maria Oliveira',   'MO Consultoria',       '987.654.321-00', 'cpf',  'maria@mo.com',      '(21) 92222-2222', '(21) 92222-2222', 'Rio de Janeiro',  'RJ', 'active', 'indicação'),
  ('00000000-0000-0000-0000-000000000001', 'TechStart Ltda',   'TechStart',            '12.345.678/0001-90', 'cnpj', 'contato@techstart.com', '(11) 3333-3333', '(11) 93333-3333', 'São Paulo', 'SP', 'active', 'site'),
  ('00000000-0000-0000-0000-000000000001', 'Ana Ferreira',     NULL,                   '456.789.123-00', 'cpf',  'ana@email.com',     '(31) 94444-4444', '(31) 94444-4444', 'Belo Horizonte',  'MG', 'active', 'instagram'),
  ('00000000-0000-0000-0000-000000000001', 'Carlos Mendes',    'CM Serviços ME',       '789.123.456-00', 'cpf',  'carlos@cm.com',     '(41) 95555-5555', '(41) 95555-5555', 'Curitiba',        'PR', 'active', 'manual');
*/

-- ============================================================
-- Produtos de exemplo
-- ============================================================
/*
INSERT INTO products (company_id, name, description, type, price, unit) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Consultoria Hora',    'Hora de consultoria técnica',  'service', 250.00, 'hora'),
  ('00000000-0000-0000-0000-000000000001', 'Desenvolvimento Web', 'Site institucional completo',  'service', 3500.00, 'projeto'),
  ('00000000-0000-0000-0000-000000000001', 'Licença CRM Starter', 'Licença mensal plano starter', 'service', 99.90,  'mês'),
  ('00000000-0000-0000-0000-000000000001', 'Licença CRM Pro',     'Licença mensal plano pro',     'service', 199.90, 'mês');
*/
