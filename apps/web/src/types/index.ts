// Re-exports de database types
export * from './database'

// ============================================================
// Tipos de aplicação
// ============================================================

export type UserRole =
  | 'super_admin'
  | 'admin'
  | 'manager'
  | 'sales'
  | 'finance'
  | 'operator'

export type Permission =
  | 'dashboard.view'
  | 'customers.view'  | 'customers.create'  | 'customers.edit'  | 'customers.delete'  | 'customers.export'
  | 'leads.view'      | 'leads.view_own'    | 'leads.create'    | 'leads.edit'        | 'leads.delete'
  | 'sales.view'      | 'sales.view_own'    | 'sales.create'    | 'sales.edit'        | 'sales.delete'
  | 'finance.view'    | 'finance.create'    | 'finance.edit'    | 'finance.delete'
  | 'reports.view'    | 'reports.export'
  | 'users.view'      | 'users.create'      | 'users.edit'      | 'users.delete'
  | 'settings.view'   | 'settings.edit'
  | 'admin.companies' | 'admin.plans'

// Sessão do usuário autenticado (armazenada no Zustand)
export interface AuthUser {
  id:            string
  email:         string
  firstName:     string
  lastName:      string | null
  fullName:      string
  avatarUrl:     string | null
  companyId:     string | null
  roleName:      UserRole
  roleLabel:     string
  isSuperAdmin:  boolean
  permissions:   Permission[]
}

// Sessão de empresa
export interface AuthCompany {
  id:      string
  name:    string
  slug:    string
  plan:    'free' | 'starter' | 'professional' | 'enterprise'
  logoUrl: string | null
}

// Resposta de API paginada
export interface PaginatedResponse<T> {
  data:       T[]
  total:      number
  page:       number
  pageSize:   number
  totalPages: number
}

// Filtros comuns
export interface BaseFilters {
  search?:   string
  page?:     number
  pageSize?: number
  sortBy?:   string
  sortOrder?: 'asc' | 'desc'
}

// Opção de select
export interface SelectOption {
  value: string
  label: string
  color?: string
  icon?:  string
}

// Resultado de operação
export interface ActionResult<T = void> {
  data?:    T
  error?:   string
  success:  boolean
}

// Navegação sidebar
export interface NavItem {
  title:       string
  href:        string
  icon:        React.ComponentType<{ className?: string }>
  permission?: Permission
  badge?:      number | string
  children?:   NavItem[]
}

// ============================================================
// Customer types
// ============================================================

export type CustomerStatus = 'active' | 'inactive' | 'prospect' | 'blocked'
export type DocumentType   = 'cpf' | 'cnpj'
export type CustomerSource =
  | 'indicacao'
  | 'site'
  | 'whatsapp'
  | 'instagram'
  | 'facebook'
  | 'google'
  | 'email'
  | 'telefone'
  | 'evento'
  | 'outro'

export interface Customer {
  id:            string
  company_id:    string
  name:          string
  company_name:  string | null
  document:      string | null
  document_type: DocumentType | null
  email:         string | null
  phone:         string | null
  whatsapp:      string | null
  zip_code:      string | null
  street:        string | null
  street_number: string | null
  complement:    string | null
  neighborhood:  string | null
  city:          string | null
  state:         string | null
  source:        CustomerSource | null
  status:        CustomerStatus
  tags:          string[]
  notes:         string | null
  assigned_to:   string | null
  created_by:    string | null
  created_at:    string
  updated_at:    string
}

export interface CustomerFilters extends BaseFilters {
  status?:     CustomerStatus | ''
  source?:     CustomerSource | ''
  tag?:        string
  city?:       string
  state?:      string
  assignedTo?: string
}

export interface CustomerFormData {
  name:           string
  company_name?:  string
  document?:      string
  document_type?: DocumentType
  email?:         string
  phone?:         string
  whatsapp?:      string
  zip_code?:      string
  street?:        string
  street_number?: string
  complement?:    string
  neighborhood?:  string
  city?:          string
  state?:         string
  source?:        CustomerSource
  status:         CustomerStatus
  tags?:          string[]
  notes?:         string
  assigned_to?:   string
}

export const CUSTOMER_STATUS_LABELS: Record<CustomerStatus, string> = {
  active:   'Ativo',
  inactive: 'Inativo',
  prospect: 'Prospect',
  blocked:  'Bloqueado',
}

export const CUSTOMER_STATUS_COLORS: Record<CustomerStatus, string> = {
  active:   'success',
  inactive: 'secondary',
  prospect: 'warning',
  blocked:  'destructive',
}

export const CUSTOMER_SOURCE_LABELS: Record<CustomerSource, string> = {
  indicacao: 'Indicação',
  site:      'Site',
  whatsapp:  'WhatsApp',
  instagram: 'Instagram',
  facebook:  'Facebook',
  google:    'Google',
  email:     'E-mail',
  telefone:  'Telefone',
  evento:    'Evento',
  outro:     'Outro',
}

export const BR_STATES: string[] = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO',
  'MA','MT','MS','MG','PA','PB','PR','PE','PI',
  'RJ','RN','RS','RO','RR','SC','SP','SE','TO',
]

// ============================================================
// Lead types
// ============================================================

export type LeadStatus   = 'open' | 'won' | 'lost' | 'archived'
export type LeadPriority = 'low' | 'medium' | 'high' | 'urgent'
export type LeadSource   = CustomerSource  // reutiliza as mesmas origens

export interface LeadStage {
  id:         string
  company_id: string
  name:       string
  color:      string
  position:   number
  is_closed:  boolean
  is_lost:    boolean
  created_at: string
  updated_at: string
}

export interface Lead {
  id:                   string
  company_id:           string
  customer_id:          string | null
  stage_id:             string | null
  title:                string
  value:                number | null
  source:               LeadSource | null
  priority:             LeadPriority
  status:               LeadStatus
  expected_close_date:  string | null
  lost_reason:          string | null
  notes:                string | null
  tags:                 string[]
  assigned_to:          string | null
  created_by:           string | null
  converted_at:         string | null
  created_at:           string
  updated_at:           string
  // joins
  customer?:            { id: string; name: string; company_name: string | null } | null
  stage?:               LeadStage | null
  assigned_user?:       { id: string; first_name: string; last_name: string | null } | null
}

export interface LeadFilters extends BaseFilters {
  status?:    LeadStatus | ''
  priority?:  LeadPriority | ''
  source?:    LeadSource | ''
  stage_id?:  string
  assignedTo?: string
}

export interface LeadFormData {
  title:                string
  customer_id?:         string
  stage_id?:            string
  value?:               number
  source?:              LeadSource
  priority:             LeadPriority
  status:               LeadStatus
  expected_close_date?: string
  lost_reason?:         string
  notes?:               string
  tags?:                string[]
  assigned_to?:         string
}

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  open:     'Aberto',
  won:      'Ganho',
  lost:     'Perdido',
  archived: 'Arquivado',
}

export const LEAD_STATUS_COLORS: Record<LeadStatus, string> = {
  open:     'blue',
  won:      'success',
  lost:     'destructive',
  archived: 'secondary',
}

export const LEAD_PRIORITY_LABELS: Record<LeadPriority, string> = {
  low:    'Baixa',
  medium: 'Média',
  high:   'Alta',
  urgent: 'Urgente',
}

export const LEAD_PRIORITY_COLORS: Record<LeadPriority, string> = {
  low:    'secondary',
  medium: 'blue',
  high:   'warning',
  urgent: 'destructive',
}

// ============================================================
// Sales types
// ============================================================

export type SaleStatus = 'pending' | 'completed' | 'cancelled' | 'refunded'

export interface Product {
  id:          string
  company_id:  string
  name:        string
  description: string | null
  type:        'product' | 'service'
  price:       number
  unit:        string | null
  sku:         string | null
  status:      'active' | 'inactive'
  created_at:  string
  updated_at:  string
}

export interface SaleItem {
  id?:         string
  sale_id?:    string
  product_id?: string | null
  name:        string
  quantity:    number
  unit_price:  number
  discount:    number
  total:       number
  product?:    Product | null
}

export interface Sale {
  id:               string
  company_id:       string
  lead_id:          string | null
  customer_id:      string | null
  title:            string
  total_value:      number
  discount:         number
  final_value:      number
  commission_rate:  number
  commission_value: number
  status:           SaleStatus
  notes:            string | null
  sold_at:          string | null
  assigned_to:      string | null
  created_by:       string | null
  created_at:       string
  updated_at:       string
  // joins
  customer?:        { id: string; name: string; company_name: string | null } | null
  lead?:            { id: string; title: string } | null
  assigned_user?:   { id: string; first_name: string; last_name: string | null } | null
  items?:           SaleItem[]
}

export interface SaleFormData {
  title:           string
  customer_id?:    string
  lead_id?:        string
  status:          SaleStatus
  discount?:       number
  commission_rate?: number
  notes?:          string
  sold_at?:        string
  assigned_to?:    string
  items:           Omit<SaleItem, 'id' | 'sale_id'>[]
}

export const SALE_STATUS_LABELS: Record<SaleStatus, string> = {
  pending:   'Pendente',
  completed: 'Concluída',
  cancelled: 'Cancelada',
  refunded:  'Reembolsada',
}

export const SALE_STATUS_COLORS: Record<SaleStatus, string> = {
  pending:   'warning',
  completed: 'success',
  cancelled: 'secondary',
  refunded:  'destructive',
}

// ============================================================
// Finance types
// ============================================================

export type FinancialStatus    = 'pending' | 'paid' | 'overdue' | 'cancelled'
export type FinancialEntryType = 'revenue' | 'expense'

export interface FinancialCategory {
  id:         string
  company_id: string
  name:       string
  type:       'income' | 'expense'
  color:      string
  icon:       string | null
  parent_id:  string | null
  created_at: string
  updated_at: string
}

export interface Revenue {
  id:             string
  company_id:     string
  category_id:    string | null
  sale_id:        string | null
  customer_id:    string | null
  description:    string
  value:          number
  due_date:       string
  paid_date:      string | null
  status:         FinancialStatus
  payment_method: string | null
  notes:          string | null
  created_by:     string | null
  created_at:     string
  updated_at:     string
  category?:      FinancialCategory | null
  customer?:      { id: string; name: string } | null
}

export interface Expense {
  id:             string
  company_id:     string
  category_id:    string | null
  description:    string
  value:          number
  due_date:       string
  paid_date:      string | null
  status:         FinancialStatus
  payment_method: string | null
  recurrence:     'none' | 'daily' | 'weekly' | 'monthly' | 'yearly' | null
  notes:          string | null
  created_by:     string | null
  created_at:     string
  updated_at:     string
  category?:      FinancialCategory | null
}

export interface RevenueFormData {
  description:     string
  value:           number
  due_date:        string
  category_id?:    string
  customer_id?:    string
  sale_id?:        string
  payment_method?: string
  paid_date?:      string
  status:          FinancialStatus
  notes?:          string
}

export interface ExpenseFormData {
  description:     string
  value:           number
  due_date:        string
  category_id?:    string
  payment_method?: string
  paid_date?:      string
  recurrence?:     'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'
  status:          FinancialStatus
  notes?:          string
}

export const FINANCIAL_STATUS_LABELS: Record<FinancialStatus, string> = {
  pending:   'Pendente',
  paid:      'Pago',
  overdue:   'Vencido',
  cancelled: 'Cancelado',
}

export const FINANCIAL_STATUS_COLORS: Record<FinancialStatus, string> = {
  pending:   'warning',
  paid:      'success',
  overdue:   'destructive',
  cancelled: 'secondary',
}

export const PAYMENT_METHODS = [
  'Dinheiro', 'PIX', 'Cartão de Crédito', 'Cartão de Débito',
  'Boleto', 'TED/DOC', 'Cheque', 'Outro',
]

// ============================================================
// Task types
// ============================================================

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'
export type TaskType   = 'task' | 'appointment' | 'reminder' | 'call' | 'email'

export interface Task {
  id:           string
  company_id:   string
  customer_id:  string | null
  lead_id:      string | null
  title:        string
  description:  string | null
  type:         TaskType
  priority:     LeadPriority
  status:       TaskStatus
  due_date:     string | null
  completed_at: string | null
  assigned_to:  string | null
  created_by:   string | null
  created_at:   string
  updated_at:   string
  customer?:    { id: string; name: string } | null
  lead?:        { id: string; title: string } | null
  assigned_user?: { id: string; first_name: string; last_name: string | null } | null
}

export interface TaskFormData {
  title:        string
  description?: string
  type:         TaskType
  priority:     LeadPriority
  status:       TaskStatus
  due_date?:    string
  customer_id?: string
  lead_id?:     string
  assigned_to?: string
}

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  pending:     'Pendente',
  in_progress: 'Em andamento',
  completed:   'Concluída',
  cancelled:   'Cancelada',
}

export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  task:        'Tarefa',
  appointment: 'Reunião',
  reminder:    'Lembrete',
  call:        'Ligação',
  email:       'E-mail',
}

export const TASK_TYPE_ICONS: Record<TaskType, string> = {
  task:        'CheckSquare',
  appointment: 'Calendar',
  reminder:    'Bell',
  call:        'Phone',
  email:       'Mail',
}
