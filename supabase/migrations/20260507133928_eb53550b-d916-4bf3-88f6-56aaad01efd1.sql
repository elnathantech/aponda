
-- Create recurring invoices table
CREATE TABLE public.recurring_invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_address JSONB,
  project_id UUID,
  frequency TEXT NOT NULL DEFAULT 'monthly' CHECK (frequency IN ('weekly', 'fortnightly', 'monthly', 'quarterly', 'yearly')),
  next_run_date DATE NOT NULL,
  items_template JSONB NOT NULL DEFAULT '[]'::jsonb,
  tax_rate NUMERIC DEFAULT 20,
  notes TEXT,
  payment_terms TEXT DEFAULT 'Net 30',
  payment_due_days INTEGER NOT NULL DEFAULT 30,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_generated_at TIMESTAMP WITH TIME ZONE,
  total_generated INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.recurring_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their recurring invoices"
ON public.recurring_invoices
FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM companies WHERE companies.id = recurring_invoices.company_id AND companies.user_id = auth.uid()
));

-- Create automation logs table
CREATE TABLE public.automation_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  automation_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'success',
  details JSONB,
  related_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.automation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their automation logs"
ON public.automation_logs
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM companies WHERE companies.id = automation_logs.company_id AND companies.user_id = auth.uid()
));

-- Triggers for updated_at
CREATE TRIGGER update_recurring_invoices_updated_at
BEFORE UPDATE ON public.recurring_invoices
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
