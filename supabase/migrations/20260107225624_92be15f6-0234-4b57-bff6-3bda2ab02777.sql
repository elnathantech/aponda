-- Create enums for various statuses and types
CREATE TYPE public.employment_status AS ENUM ('active', 'on_leave', 'terminated', 'pending');
CREATE TYPE public.pay_frequency AS ENUM ('weekly', 'fortnightly', 'monthly');
CREATE TYPE public.pension_status AS ENUM ('enrolled', 'opted_out', 'eligible', 'not_eligible');
CREATE TYPE public.onboarding_step_status AS ENUM ('pending', 'in_progress', 'completed', 'skipped');

-- Companies table
CREATE TABLE public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    company_number TEXT,
    vat_number TEXT,
    registered_address JSONB,
    trading_address JSONB,
    paye_reference TEXT,
    accounts_office_reference TEXT,
    pension_provider TEXT,
    pension_employer_contribution DECIMAL(5,2) DEFAULT 3.00,
    pension_employee_contribution DECIMAL(5,2) DEFAULT 5.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Company onboarding checklist
CREATE TABLE public.company_onboarding (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    step_name TEXT NOT NULL,
    step_order INT NOT NULL,
    status onboarding_step_status NOT NULL DEFAULT 'pending',
    completed_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(company_id, step_name)
);

-- Employees table
CREATE TABLE public.employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    employee_number TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    date_of_birth DATE,
    ni_number TEXT,
    address JSONB,
    job_title TEXT,
    department TEXT,
    start_date DATE NOT NULL,
    end_date DATE,
    status employment_status NOT NULL DEFAULT 'pending',
    annual_salary DECIMAL(12,2) NOT NULL,
    pay_frequency pay_frequency NOT NULL DEFAULT 'monthly',
    tax_code TEXT DEFAULT '1257L',
    is_cumulative BOOLEAN DEFAULT true,
    student_loan_plan TEXT,
    pension_status pension_status DEFAULT 'eligible',
    pension_opt_out_date DATE,
    emergency_contact JSONB,
    bank_details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(company_id, employee_number)
);

-- Employee onboarding checklist
CREATE TABLE public.employee_onboarding (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    step_name TEXT NOT NULL,
    step_order INT NOT NULL,
    status onboarding_step_status NOT NULL DEFAULT 'pending',
    completed_at TIMESTAMPTZ,
    notes TEXT,
    document_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(employee_id, step_name)
);

-- Payroll runs
CREATE TABLE public.payroll_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    pay_period_start DATE NOT NULL,
    pay_period_end DATE NOT NULL,
    pay_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft',
    tax_year TEXT NOT NULL,
    tax_month INT NOT NULL,
    total_gross DECIMAL(12,2),
    total_net DECIMAL(12,2),
    total_tax DECIMAL(12,2),
    total_ni_employee DECIMAL(12,2),
    total_ni_employer DECIMAL(12,2),
    total_pension_employee DECIMAL(12,2),
    total_pension_employer DECIMAL(12,2),
    submitted_to_hmrc BOOLEAN DEFAULT false,
    submitted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Payslips
CREATE TABLE public.payslips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payroll_run_id UUID NOT NULL REFERENCES public.payroll_runs(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    gross_pay DECIMAL(12,2) NOT NULL,
    taxable_pay DECIMAL(12,2) NOT NULL,
    income_tax DECIMAL(12,2) NOT NULL,
    ni_employee DECIMAL(12,2) NOT NULL,
    ni_employer DECIMAL(12,2) NOT NULL,
    pension_employee DECIMAL(12,2) DEFAULT 0,
    pension_employer DECIMAL(12,2) DEFAULT 0,
    student_loan DECIMAL(12,2) DEFAULT 0,
    other_deductions DECIMAL(12,2) DEFAULT 0,
    net_pay DECIMAL(12,2) NOT NULL,
    ytd_gross DECIMAL(12,2) NOT NULL,
    ytd_tax DECIMAL(12,2) NOT NULL,
    ytd_ni DECIMAL(12,2) NOT NULL,
    ytd_pension_employee DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tax year records (P60 data)
CREATE TABLE public.tax_year_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    tax_year TEXT NOT NULL,
    total_pay DECIMAL(12,2) NOT NULL,
    total_tax DECIMAL(12,2) NOT NULL,
    total_ni DECIMAL(12,2) NOT NULL,
    total_pension DECIMAL(12,2) DEFAULT 0,
    total_student_loan DECIMAL(12,2) DEFAULT 0,
    final_tax_code TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(employee_id, tax_year)
);

-- Leave records
CREATE TABLE public.leave_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    leave_type TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days_taken DECIMAL(5,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    approved_by UUID,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Documents
CREATE TABLE public.hr_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL,
    document_name TEXT NOT NULL,
    file_url TEXT,
    generated_data JSONB,
    tax_year TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_onboarding ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_onboarding ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payslips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_year_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for companies
CREATE POLICY "Users can view their own companies"
ON public.companies FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own companies"
ON public.companies FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own companies"
ON public.companies FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own companies"
ON public.companies FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- RLS Policies for company_onboarding
CREATE POLICY "Users can manage their company onboarding"
ON public.company_onboarding FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.companies WHERE id = company_id AND user_id = auth.uid()));

-- RLS Policies for employees
CREATE POLICY "Users can manage employees in their companies"
ON public.employees FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.companies WHERE id = company_id AND user_id = auth.uid()));

-- RLS Policies for employee_onboarding
CREATE POLICY "Users can manage employee onboarding in their companies"
ON public.employee_onboarding FOR ALL TO authenticated
USING (EXISTS (
    SELECT 1 FROM public.employees e
    JOIN public.companies c ON e.company_id = c.id
    WHERE e.id = employee_id AND c.user_id = auth.uid()
));

-- RLS Policies for payroll_runs
CREATE POLICY "Users can manage payroll runs for their companies"
ON public.payroll_runs FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.companies WHERE id = company_id AND user_id = auth.uid()));

-- RLS Policies for payslips
CREATE POLICY "Users can manage payslips for their companies"
ON public.payslips FOR ALL TO authenticated
USING (EXISTS (
    SELECT 1 FROM public.payroll_runs pr
    JOIN public.companies c ON pr.company_id = c.id
    WHERE pr.id = payroll_run_id AND c.user_id = auth.uid()
));

-- RLS Policies for tax_year_records
CREATE POLICY "Users can manage tax records for their employees"
ON public.tax_year_records FOR ALL TO authenticated
USING (EXISTS (
    SELECT 1 FROM public.employees e
    JOIN public.companies c ON e.company_id = c.id
    WHERE e.id = employee_id AND c.user_id = auth.uid()
));

-- RLS Policies for leave_records
CREATE POLICY "Users can manage leave for their employees"
ON public.leave_records FOR ALL TO authenticated
USING (EXISTS (
    SELECT 1 FROM public.employees e
    JOIN public.companies c ON e.company_id = c.id
    WHERE e.id = employee_id AND c.user_id = auth.uid()
));

-- RLS Policies for hr_documents
CREATE POLICY "Users can manage documents for their companies"
ON public.hr_documents FOR ALL TO authenticated
USING (
    (company_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.companies WHERE id = company_id AND user_id = auth.uid()))
    OR
    (employee_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.employees e
        JOIN public.companies c ON e.company_id = c.id
        WHERE e.id = employee_id AND c.user_id = auth.uid()
    ))
);

-- Triggers for updated_at
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_company_onboarding_updated_at BEFORE UPDATE ON public.company_onboarding
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON public.employees
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_employee_onboarding_updated_at BEFORE UPDATE ON public.employee_onboarding
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payroll_runs_updated_at BEFORE UPDATE ON public.payroll_runs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_leave_records_updated_at BEFORE UPDATE ON public.leave_records
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();