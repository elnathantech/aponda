export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      companies: {
        Row: {
          accounts_office_reference: string | null
          brand_avatar: string | null
          brand_color: string | null
          company_number: string | null
          created_at: string
          id: string
          logo_url: string | null
          name: string
          paye_reference: string | null
          pension_employee_contribution: number | null
          pension_employer_contribution: number | null
          pension_provider: string | null
          registered_address: Json | null
          trading_address: Json | null
          updated_at: string
          user_id: string
          vat_number: string | null
        }
        Insert: {
          accounts_office_reference?: string | null
          brand_avatar?: string | null
          brand_color?: string | null
          company_number?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          paye_reference?: string | null
          pension_employee_contribution?: number | null
          pension_employer_contribution?: number | null
          pension_provider?: string | null
          registered_address?: Json | null
          trading_address?: Json | null
          updated_at?: string
          user_id: string
          vat_number?: string | null
        }
        Update: {
          accounts_office_reference?: string | null
          brand_avatar?: string | null
          brand_color?: string | null
          company_number?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          paye_reference?: string | null
          pension_employee_contribution?: number | null
          pension_employer_contribution?: number | null
          pension_provider?: string | null
          registered_address?: Json | null
          trading_address?: Json | null
          updated_at?: string
          user_id?: string
          vat_number?: string | null
        }
        Relationships: []
      }
      company_onboarding: {
        Row: {
          company_id: string
          completed_at: string | null
          created_at: string
          id: string
          notes: string | null
          status: Database["public"]["Enums"]["onboarding_step_status"]
          step_name: string
          step_order: number
          updated_at: string
        }
        Insert: {
          company_id: string
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["onboarding_step_status"]
          step_name: string
          step_order: number
          updated_at?: string
        }
        Update: {
          company_id?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["onboarding_step_status"]
          step_name?: string
          step_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_onboarding_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_submissions: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          subject: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          subject?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          subject?: string | null
        }
        Relationships: []
      }
      employee_onboarding: {
        Row: {
          completed_at: string | null
          created_at: string
          document_url: string | null
          employee_id: string
          id: string
          notes: string | null
          status: Database["public"]["Enums"]["onboarding_step_status"]
          step_name: string
          step_order: number
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          document_url?: string | null
          employee_id: string
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["onboarding_step_status"]
          step_name: string
          step_order: number
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          document_url?: string | null
          employee_id?: string
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["onboarding_step_status"]
          step_name?: string
          step_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_onboarding_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          address: Json | null
          annual_salary: number
          bank_details: Json | null
          company_id: string
          created_at: string
          date_of_birth: string | null
          department: string | null
          email: string | null
          emergency_contact: Json | null
          employee_number: string
          end_date: string | null
          first_name: string
          id: string
          is_cumulative: boolean | null
          job_title: string | null
          last_name: string
          ni_number: string | null
          pay_frequency: Database["public"]["Enums"]["pay_frequency"]
          pension_opt_out_date: string | null
          pension_status: Database["public"]["Enums"]["pension_status"] | null
          phone: string | null
          start_date: string
          status: Database["public"]["Enums"]["employment_status"]
          student_loan_plan: string | null
          tax_code: string | null
          updated_at: string
        }
        Insert: {
          address?: Json | null
          annual_salary: number
          bank_details?: Json | null
          company_id: string
          created_at?: string
          date_of_birth?: string | null
          department?: string | null
          email?: string | null
          emergency_contact?: Json | null
          employee_number: string
          end_date?: string | null
          first_name: string
          id?: string
          is_cumulative?: boolean | null
          job_title?: string | null
          last_name: string
          ni_number?: string | null
          pay_frequency?: Database["public"]["Enums"]["pay_frequency"]
          pension_opt_out_date?: string | null
          pension_status?: Database["public"]["Enums"]["pension_status"] | null
          phone?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["employment_status"]
          student_loan_plan?: string | null
          tax_code?: string | null
          updated_at?: string
        }
        Update: {
          address?: Json | null
          annual_salary?: number
          bank_details?: Json | null
          company_id?: string
          created_at?: string
          date_of_birth?: string | null
          department?: string | null
          email?: string | null
          emergency_contact?: Json | null
          employee_number?: string
          end_date?: string | null
          first_name?: string
          id?: string
          is_cumulative?: boolean | null
          job_title?: string | null
          last_name?: string
          ni_number?: string | null
          pay_frequency?: Database["public"]["Enums"]["pay_frequency"]
          pension_opt_out_date?: string | null
          pension_status?: Database["public"]["Enums"]["pension_status"] | null
          phone?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["employment_status"]
          student_loan_plan?: string | null
          tax_code?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employees_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_documents: {
        Row: {
          company_id: string | null
          created_at: string
          document_name: string
          document_type: string
          employee_id: string | null
          file_url: string | null
          generated_data: Json | null
          id: string
          tax_year: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          document_name: string
          document_type: string
          employee_id?: string | null
          file_url?: string | null
          generated_data?: Json | null
          id?: string
          tax_year?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string
          document_name?: string
          document_type?: string
          employee_id?: string | null
          file_url?: string | null
          generated_data?: Json | null
          id?: string
          tax_year?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hr_documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_documents_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          created_at: string
          description: string
          id: string
          invoice_id: string
          quantity: number
          total: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          invoice_id: string
          quantity?: number
          total?: number
          unit_price?: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          invoice_id?: string
          quantity?: number
          total?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_paid: number
          client_address: Json | null
          client_email: string | null
          client_name: string
          company_id: string
          created_at: string
          due_date: string
          id: string
          invoice_number: string
          issue_date: string
          notes: string | null
          paid_at: string | null
          payment_terms: string | null
          project_id: string | null
          status: string
          subtotal: number
          tax_amount: number
          tax_rate: number | null
          total: number
          updated_at: string
        }
        Insert: {
          amount_paid?: number
          client_address?: Json | null
          client_email?: string | null
          client_name: string
          company_id: string
          created_at?: string
          due_date: string
          id?: string
          invoice_number: string
          issue_date?: string
          notes?: string | null
          paid_at?: string | null
          payment_terms?: string | null
          project_id?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number
          tax_rate?: number | null
          total?: number
          updated_at?: string
        }
        Update: {
          amount_paid?: number
          client_address?: Json | null
          client_email?: string | null
          client_name?: string
          company_id?: string
          created_at?: string
          due_date?: string
          id?: string
          invoice_number?: string
          issue_date?: string
          notes?: string | null
          paid_at?: string | null
          payment_terms?: string | null
          project_id?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number
          tax_rate?: number | null
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_records: {
        Row: {
          approved_by: string | null
          created_at: string
          days_taken: number
          employee_id: string
          end_date: string
          id: string
          leave_type: string
          notes: string | null
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          approved_by?: string | null
          created_at?: string
          days_taken: number
          employee_id: string
          end_date: string
          id?: string
          leave_type: string
          notes?: string | null
          start_date: string
          status?: string
          updated_at?: string
        }
        Update: {
          approved_by?: string | null
          created_at?: string
          days_taken?: number
          employee_id?: string
          end_date?: string
          id?: string
          leave_type?: string
          notes?: string | null
          start_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leave_records_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_runs: {
        Row: {
          company_id: string
          created_at: string
          id: string
          pay_date: string
          pay_period_end: string
          pay_period_start: string
          status: string
          submitted_at: string | null
          submitted_to_hmrc: boolean | null
          tax_month: number
          tax_year: string
          total_gross: number | null
          total_net: number | null
          total_ni_employee: number | null
          total_ni_employer: number | null
          total_pension_employee: number | null
          total_pension_employer: number | null
          total_tax: number | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          pay_date: string
          pay_period_end: string
          pay_period_start: string
          status?: string
          submitted_at?: string | null
          submitted_to_hmrc?: boolean | null
          tax_month: number
          tax_year: string
          total_gross?: number | null
          total_net?: number | null
          total_ni_employee?: number | null
          total_ni_employer?: number | null
          total_pension_employee?: number | null
          total_pension_employer?: number | null
          total_tax?: number | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          pay_date?: string
          pay_period_end?: string
          pay_period_start?: string
          status?: string
          submitted_at?: string | null
          submitted_to_hmrc?: boolean | null
          tax_month?: number
          tax_year?: string
          total_gross?: number | null
          total_net?: number | null
          total_ni_employee?: number | null
          total_ni_employer?: number | null
          total_pension_employee?: number | null
          total_pension_employer?: number | null
          total_tax?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payroll_runs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      payslips: {
        Row: {
          created_at: string
          employee_id: string
          gross_pay: number
          id: string
          income_tax: number
          net_pay: number
          ni_employee: number
          ni_employer: number
          other_deductions: number | null
          payroll_run_id: string
          pension_employee: number | null
          pension_employer: number | null
          student_loan: number | null
          taxable_pay: number
          ytd_gross: number
          ytd_ni: number
          ytd_pension_employee: number | null
          ytd_tax: number
        }
        Insert: {
          created_at?: string
          employee_id: string
          gross_pay: number
          id?: string
          income_tax: number
          net_pay: number
          ni_employee: number
          ni_employer: number
          other_deductions?: number | null
          payroll_run_id: string
          pension_employee?: number | null
          pension_employer?: number | null
          student_loan?: number | null
          taxable_pay: number
          ytd_gross: number
          ytd_ni: number
          ytd_pension_employee?: number | null
          ytd_tax: number
        }
        Update: {
          created_at?: string
          employee_id?: string
          gross_pay?: number
          id?: string
          income_tax?: number
          net_pay?: number
          ni_employee?: number
          ni_employer?: number
          other_deductions?: number | null
          payroll_run_id?: string
          pension_employee?: number | null
          pension_employer?: number | null
          student_loan?: number | null
          taxable_pay?: number
          ytd_gross?: number
          ytd_ni?: number
          ytd_pension_employee?: number | null
          ytd_tax?: number
        }
        Relationships: [
          {
            foreignKeyName: "payslips_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payslips_payroll_run_id_fkey"
            columns: ["payroll_run_id"]
            isOneToOne: false
            referencedRelation: "payroll_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          budget: number | null
          client_email: string | null
          client_name: string | null
          company_id: string
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          name: string
          start_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          budget?: number | null
          client_email?: string | null
          client_name?: string | null
          company_id: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          name: string
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          budget?: number | null
          client_email?: string | null
          client_name?: string | null
          company_id?: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_year_records: {
        Row: {
          created_at: string
          employee_id: string
          final_tax_code: string | null
          id: string
          tax_year: string
          total_ni: number
          total_pay: number
          total_pension: number | null
          total_student_loan: number | null
          total_tax: number
        }
        Insert: {
          created_at?: string
          employee_id: string
          final_tax_code?: string | null
          id?: string
          tax_year: string
          total_ni: number
          total_pay: number
          total_pension?: number | null
          total_student_loan?: number | null
          total_tax: number
        }
        Update: {
          created_at?: string
          employee_id?: string
          final_tax_code?: string | null
          id?: string
          tax_year?: string
          total_ni?: number
          total_pay?: number
          total_pension?: number | null
          total_student_loan?: number | null
          total_tax?: number
        }
        Relationships: [
          {
            foreignKeyName: "tax_year_records_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      time_entries: {
        Row: {
          billable: boolean
          created_at: string
          date: string
          description: string | null
          employee_id: string
          hours: number
          id: string
          project_id: string | null
          updated_at: string
        }
        Insert: {
          billable?: boolean
          created_at?: string
          date?: string
          description?: string | null
          employee_id: string
          hours?: number
          id?: string
          project_id?: string | null
          updated_at?: string
        }
        Update: {
          billable?: boolean
          created_at?: string
          date?: string
          description?: string | null
          employee_id?: string
          hours?: number
          id?: string
          project_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_entries_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      employment_status: "active" | "on_leave" | "terminated" | "pending"
      onboarding_step_status:
        | "pending"
        | "in_progress"
        | "completed"
        | "skipped"
      pay_frequency: "weekly" | "fortnightly" | "monthly"
      pension_status: "enrolled" | "opted_out" | "eligible" | "not_eligible"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      employment_status: ["active", "on_leave", "terminated", "pending"],
      onboarding_step_status: [
        "pending",
        "in_progress",
        "completed",
        "skipped",
      ],
      pay_frequency: ["weekly", "fortnightly", "monthly"],
      pension_status: ["enrolled", "opted_out", "eligible", "not_eligible"],
    },
  },
} as const
