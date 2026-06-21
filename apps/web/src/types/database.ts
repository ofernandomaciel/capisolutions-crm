// ============================================================
// Types gerados a partir do schema do banco de dados
// Execute: supabase gen types typescript --local > src/types/database.ts
// para regenerar após migrações
// ============================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      companies: {
        Row: {
          id:            string
          name:          string
          slug:          string
          cnpj:          string | null
          email:         string | null
          phone:         string | null
          website:       string | null
          logo_url:      string | null
          plan:          'free' | 'starter' | 'professional' | 'enterprise'
          status:        'active' | 'suspended' | 'cancelled'
          settings:      Json
          trial_ends_at: string | null
          created_at:    string
          updated_at:    string
        }
        Insert: Omit<Database['public']['Tables']['companies']['Row'], 'id' | 'created_at' | 'updated_at'>
          & { id?: string; created_at?: string; updated_at?: string }
        Update: Partial<Database['public']['Tables']['companies']['Insert']>
      }

      users: {
        Row: {
          id:             string
          company_id:     string | null
          role_id:        string | null
          first_name:     string
          last_name:      string | null
          email:          string
          phone:          string | null
          avatar_url:     string | null
          status:         'active' | 'inactive' | 'invited'
          is_super_admin: boolean
          last_login_at:  string | null
          settings:       Json
          created_at:     string
          updated_at:     string
        }
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'created_at' | 'updated_at'>
          & { created_at?: string; updated_at?: string }
        Update: Partial<Database['public']['Tables']['users']['Insert']>
      }

      roles: {
        Row: {
          id:          string
          name:        string
          label:       string
          description: string | null
          is_system:   boolean
          created_at:  string
        }
        Insert: Omit<Database['public']['Tables']['roles']['Row'], 'id' | 'created_at'>
          & { id?: string; created_at?: string }
        Update: Partial<Database['public']['Tables']['roles']['Insert']>
      }

      permissions: {
        Row: {
          id:          string
          name:        string
          module:      string
          action:      string
          description: string | null
          created_at:  string
        }
        Insert: Omit<Database['public']['Tables']['permissions']['Row'], 'id' | 'created_at'>
          & { id?: string; created_at?: string }
        Update: Partial<Database['public']['Tables']['permissions']['Insert']>
      }

      customers: {
        Row: {
          id:            string
          company_id:    string
          name:          string
          company_name:  string | null
          document:      string | null
          document_type: 'cpf' | 'cnpj' | null
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
          source:        string | null
          status:        'active' | 'inactive' | 'blocked'
          tags:          string[]
          notes:         string | null
          assigned_to:   string | null
          created_by:    string | null
          created_at:    string
          updated_at:    string
        }
        Insert: Omit<Database['public']['Tables']['customers']['Row'], 'id' | 'created_at' | 'updated_at'>
          & { id?: string; created_at?: string; updated_at?: string }
        Update: Partial<Database['public']['Tables']['customers']['Insert']>
      }

      lead_stages: {
        Row: {
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
        Insert: Omit<Database['public']['Tables']['lead_stages']['Row'], 'id' | 'created_at' | 'updated_at'>
          & { id?: string; created_at?: string; updated_at?: string }
        Update: Partial<Database['public']['Tables']['lead_stages']['Insert']>
      }

      leads: {
        Row: {
          id:                  string
          company_id:          string
          customer_id:         string | null
          stage_id:            string | null
          title:               string
          value:               number | null
          source:              string | null
          priority:            'low' | 'medium' | 'high' | 'urgent'
          status:              'open' | 'won' | 'lost' | 'archived'
          expected_close_date: string | null
          lost_reason:         string | null
          notes:               string | null
          tags:                string[]
          assigned_to:         string | null
          created_by:          string | null
          converted_at:        string | null
          created_at:          string
          updated_at:          string
        }
        Insert: Omit<Database['public']['Tables']['leads']['Row'], 'id' | 'created_at' | 'updated_at'>
          & { id?: string; created_at?: string; updated_at?: string }
        Update: Partial<Database['public']['Tables']['leads']['Insert']>
      }

      sales: {
        Row: {
          id:               string
          company_id:       string
          lead_id:          string | null
          customer_id:      string | null
          title:            string
          total_value:      number
          discount:         number
          final_value:      number
          commission_rate:  number | null
          commission_value: number | null
          status:           'pending' | 'completed' | 'cancelled' | 'refunded'
          notes:            string | null
          sold_at:          string | null
          assigned_to:      string | null
          created_by:       string | null
          created_at:       string
          updated_at:       string
        }
        Insert: Omit<Database['public']['Tables']['sales']['Row'], 'id' | 'created_at' | 'updated_at'>
          & { id?: string; created_at?: string; updated_at?: string }
        Update: Partial<Database['public']['Tables']['sales']['Insert']>
      }

      revenues: {
        Row: {
          id:             string
          company_id:     string
          category_id:    string | null
          sale_id:        string | null
          customer_id:    string | null
          description:    string
          value:          number
          due_date:       string
          paid_date:      string | null
          status:         'pending' | 'paid' | 'overdue' | 'cancelled'
          payment_method: string | null
          notes:          string | null
          created_by:     string | null
          created_at:     string
          updated_at:     string
        }
        Insert: Omit<Database['public']['Tables']['revenues']['Row'], 'id' | 'created_at' | 'updated_at'>
          & { id?: string; created_at?: string; updated_at?: string }
        Update: Partial<Database['public']['Tables']['revenues']['Insert']>
      }

      expenses: {
        Row: {
          id:             string
          company_id:     string
          category_id:    string | null
          description:    string
          value:          number
          due_date:       string
          paid_date:      string | null
          status:         'pending' | 'paid' | 'overdue' | 'cancelled'
          payment_method: string | null
          recurrence:     'none' | 'daily' | 'weekly' | 'monthly' | 'yearly' | null
          notes:          string | null
          created_by:     string | null
          created_at:     string
          updated_at:     string
        }
        Insert: Omit<Database['public']['Tables']['expenses']['Row'], 'id' | 'created_at' | 'updated_at'>
          & { id?: string; created_at?: string; updated_at?: string }
        Update: Partial<Database['public']['Tables']['expenses']['Insert']>
      }

      audit_logs: {
        Row: {
          id:          string
          company_id:  string | null
          user_id:     string | null
          action:      string
          resource:    string | null
          resource_id: string | null
          old_data:    Json | null
          new_data:    Json | null
          ip_address:  string | null
          user_agent:  string | null
          metadata:    Json | null
          created_at:  string
        }
        Insert: Omit<Database['public']['Tables']['audit_logs']['Row'], 'id' | 'created_at'>
          & { id?: string; created_at?: string }
        Update: never  // audit logs são imutáveis
      }
    }

    Functions: {
      get_dashboard_metrics: {
        Args: {
          p_company_id: string
          p_start_date?: string
          p_end_date?:   string
        }
        Returns: Json
      }
      get_my_claims: {
        Args: Record<string, never>
        Returns: Json
      }
    }

    Enums: {
      company_plan:     'free' | 'starter' | 'professional' | 'enterprise'
      company_status:   'active' | 'suspended' | 'cancelled'
      user_status:      'active' | 'inactive' | 'invited'
      user_role:        'super_admin' | 'admin' | 'manager' | 'sales' | 'finance' | 'operator'
      lead_status:      'open' | 'won' | 'lost' | 'archived'
      lead_priority:    'low' | 'medium' | 'high' | 'urgent'
      sale_status:      'pending' | 'completed' | 'cancelled' | 'refunded'
      finance_status:   'pending' | 'paid' | 'overdue' | 'cancelled'
    }
  }
}

// Helpers de tipo
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type InsertTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

export type UpdateTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']

// Tipos exportados
export type Company     = Tables<'companies'>
export type User        = Tables<'users'>
export type Role        = Tables<'roles'>
export type Customer    = Tables<'customers'>
export type Lead        = Tables<'leads'>
export type LeadStage   = Tables<'lead_stages'>
export type Sale        = Tables<'sales'>
export type Revenue     = Tables<'revenues'>
export type Expense     = Tables<'expenses'>
export type AuditLog    = Tables<'audit_logs'>
