-- =====================================================
-- EXPENSES
-- =====================================================
CREATE TABLE public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  employee_id uuid,
  project_id uuid,
  expense_date date NOT NULL DEFAULT CURRENT_DATE,
  vendor text,
  category text NOT NULL DEFAULT 'other',
  description text,
  amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'GBP',
  vat_amount numeric DEFAULT 0,
  payment_method text DEFAULT 'card',
  status text NOT NULL DEFAULT 'draft',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage expenses for their companies" ON public.expenses
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM companies WHERE companies.id = expenses.company_id AND companies.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM companies WHERE companies.id = expenses.company_id AND companies.user_id = auth.uid()));
CREATE TRIGGER trg_expenses_updated_at BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_expenses_company ON public.expenses(company_id);
CREATE INDEX idx_expenses_date ON public.expenses(expense_date DESC);

-- =====================================================
-- EXPENSE RECEIPTS
-- =====================================================
CREATE TABLE public.expense_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id uuid,
  company_id uuid NOT NULL,
  file_url text NOT NULL,
  file_name text,
  ocr_status text NOT NULL DEFAULT 'pending',
  ocr_data jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.expense_receipts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage receipts for their companies" ON public.expense_receipts
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM companies WHERE companies.id = expense_receipts.company_id AND companies.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM companies WHERE companies.id = expense_receipts.company_id AND companies.user_id = auth.uid()));

-- Receipts storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('receipts', 'receipts', true)
  ON CONFLICT (id) DO NOTHING;
CREATE POLICY "Public read receipts" ON storage.objects FOR SELECT USING (bucket_id = 'receipts');
CREATE POLICY "Auth upload receipts" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'receipts');
CREATE POLICY "Auth delete own receipts" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'receipts' AND owner = auth.uid());

-- =====================================================
-- MILEAGE TRIPS
-- =====================================================
CREATE TABLE public.mileage_trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  employee_id uuid,
  trip_date date NOT NULL DEFAULT CURRENT_DATE,
  from_address text,
  to_address text,
  miles numeric NOT NULL DEFAULT 0,
  purpose text,
  vehicle_type text NOT NULL DEFAULT 'car',
  rate_per_mile numeric NOT NULL DEFAULT 0.45,
  amount numeric NOT NULL DEFAULT 0,
  gps_track jsonb,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.mileage_trips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage mileage for their companies" ON public.mileage_trips
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM companies WHERE companies.id = mileage_trips.company_id AND companies.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM companies WHERE companies.id = mileage_trips.company_id AND companies.user_id = auth.uid()));
CREATE TRIGGER trg_mileage_updated_at BEFORE UPDATE ON public.mileage_trips
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- BANK CONNECTIONS (Yapily)
-- =====================================================
CREATE TABLE public.bank_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  provider text NOT NULL DEFAULT 'yapily',
  institution_id text NOT NULL,
  institution_name text,
  consent_id text,
  consent_token text,
  consent_status text NOT NULL DEFAULT 'pending',
  expires_at timestamptz,
  last_synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.bank_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage bank connections for their companies" ON public.bank_connections
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM companies WHERE companies.id = bank_connections.company_id AND companies.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM companies WHERE companies.id = bank_connections.company_id AND companies.user_id = auth.uid()));
CREATE TRIGGER trg_bank_conn_updated_at BEFORE UPDATE ON public.bank_connections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- BANK ACCOUNTS
-- =====================================================
CREATE TABLE public.bank_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_connection_id uuid NOT NULL,
  company_id uuid NOT NULL,
  account_id text NOT NULL,
  account_name text,
  account_number text,
  sort_code text,
  currency text DEFAULT 'GBP',
  balance numeric DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage bank accounts for their companies" ON public.bank_accounts
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM companies WHERE companies.id = bank_accounts.company_id AND companies.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM companies WHERE companies.id = bank_accounts.company_id AND companies.user_id = auth.uid()));

-- =====================================================
-- BANK TRANSACTIONS
-- =====================================================
CREATE TABLE public.bank_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_account_id uuid NOT NULL,
  company_id uuid NOT NULL,
  external_id text,
  txn_date date NOT NULL,
  amount numeric NOT NULL,
  currency text DEFAULT 'GBP',
  description text,
  counterparty text,
  category text,
  status text NOT NULL DEFAULT 'unmatched',
  matched_type text,
  matched_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.bank_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage bank txns for their companies" ON public.bank_transactions
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM companies WHERE companies.id = bank_transactions.company_id AND companies.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM companies WHERE companies.id = bank_transactions.company_id AND companies.user_id = auth.uid()));
CREATE INDEX idx_bank_txn_company ON public.bank_transactions(company_id);
CREATE INDEX idx_bank_txn_status ON public.bank_transactions(status);
CREATE UNIQUE INDEX idx_bank_txn_external ON public.bank_transactions(bank_account_id, external_id) WHERE external_id IS NOT NULL;

-- =====================================================
-- INVOICE PAYMENT LINKS
-- =====================================================
CREATE TABLE public.invoice_payment_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL,
  company_id uuid NOT NULL,
  provider text NOT NULL DEFAULT 'stripe',
  external_id text,
  checkout_url text,
  status text NOT NULL DEFAULT 'open',
  amount numeric NOT NULL,
  currency text DEFAULT 'gbp',
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.invoice_payment_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage payment links for their companies" ON public.invoice_payment_links
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM companies WHERE companies.id = invoice_payment_links.company_id AND companies.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM companies WHERE companies.id = invoice_payment_links.company_id AND companies.user_id = auth.uid()));
-- Public read so customers can view their checkout (by id) without auth
CREATE POLICY "Public can read payment links by id" ON public.invoice_payment_links
  FOR SELECT TO anon USING (true);