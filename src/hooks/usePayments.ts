import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type PaymentType = 'employee' | 'contractor';
export type PaymentStatus = 'scheduled' | 'pending' | 'paid' | 'reconciled' | 'failed';

export interface UnifiedPayment {
  id: string;
  type: PaymentType;
  workerId: string;
  workerName: string;
  workerRole: string | null;
  amountGross: number;
  amountNet: number;
  payDate: string;
  status: PaymentStatus;
  reference: string;
  sourceType: 'payroll' | 'expense';
  sourceId: string;
  projectId: string | null;
  projectName: string | null;
  invoiceId: string | null;
  invoiceNumber: string | null;
  bankTxnId: string | null;
  bankTxnDate: string | null;
}

function mapPayrollStatus(runStatus: string, matched: boolean): PaymentStatus {
  if (matched) return 'reconciled';
  if (runStatus === 'paid' || runStatus === 'completed') return 'paid';
  if (runStatus === 'approved') return 'pending';
  return 'scheduled';
}

function mapExpenseStatus(exStatus: string, matched: boolean): PaymentStatus {
  if (matched) return 'reconciled';
  if (exStatus === 'paid') return 'paid';
  if (exStatus === 'approved') return 'pending';
  if (exStatus === 'rejected') return 'failed';
  return 'scheduled';
}

export function usePayments(companyId: string | undefined) {
  return useQuery({
    queryKey: ['unified-payments', companyId],
    queryFn: async (): Promise<UnifiedPayment[]> => {
      if (!companyId) return [];

      const [runsRes, employeesRes, expensesRes, projectsRes, invoicesRes, bankRes] =
        await Promise.all([
          supabase
            .from('payroll_runs')
            .select('id, pay_date, status')
            .eq('company_id', companyId),
          supabase
            .from('employees')
            .select('id, first_name, last_name, job_title, worker_type')
            .eq('company_id', companyId),
          supabase
            .from('expenses')
            .select(
              'id, employee_id, amount, expense_date, status, category, description, project_id',
            )
            .eq('company_id', companyId),
          supabase.from('projects').select('id, name').eq('company_id', companyId),
          supabase.from('invoices').select('id, invoice_number, project_id').eq('company_id', companyId),
          supabase
            .from('bank_transactions')
            .select('id, txn_date, matched_type, matched_id, status')
            .eq('company_id', companyId),
        ]);

      const employees = employeesRes.data || [];
      const projects = projectsRes.data || [];
      const invoices = invoicesRes.data || [];
      const bank = bankRes.data || [];
      const runs = runsRes.data || [];

      const empById = new Map(employees.map((e) => [e.id, e]));
      const projectById = new Map(projects.map((p) => [p.id, p]));
      const invoiceByProject = new Map<string, { id: string; invoice_number: string }>();
      for (const inv of invoices) {
        if (inv.project_id && !invoiceByProject.has(inv.project_id)) {
          invoiceByProject.set(inv.project_id, { id: inv.id, invoice_number: inv.invoice_number });
        }
      }

      const bankByMatch = new Map<string, { id: string; txn_date: string }>();
      for (const b of bank) {
        if (b.matched_id) bankByMatch.set(`${b.matched_type}:${b.matched_id}`, { id: b.id, txn_date: b.txn_date });
      }

      const results: UnifiedPayment[] = [];

      // Payslips -> employee payments
      const runIds = runs.map((r) => r.id);
      if (runIds.length > 0) {
        const { data: payslips } = await supabase
          .from('payslips')
          .select('id, payroll_run_id, employee_id, gross_pay, net_pay')
          .in('payroll_run_id', runIds);

        const runById = new Map(runs.map((r) => [r.id, r]));
        for (const ps of payslips || []) {
          const emp = empById.get(ps.employee_id);
          const run = runById.get(ps.payroll_run_id);
          if (!emp || !run) continue;
          const matched = bankByMatch.get(`payslip:${ps.id}`) || bankByMatch.get(`payroll_run:${run.id}`);
          results.push({
            id: `ps-${ps.id}`,
            type: 'employee',
            workerId: emp.id,
            workerName: `${emp.first_name} ${emp.last_name}`,
            workerRole: emp.job_title,
            amountGross: Number(ps.gross_pay),
            amountNet: Number(ps.net_pay),
            payDate: run.pay_date,
            status: mapPayrollStatus(run.status, !!matched),
            reference: `Payroll ${run.pay_date}`,
            sourceType: 'payroll',
            sourceId: run.id,
            projectId: null,
            projectName: null,
            invoiceId: null,
            invoiceNumber: null,
            bankTxnId: matched?.id || null,
            bankTxnDate: matched?.txn_date || null,
          });
        }
      }

      // Expenses -> contractor payouts (only for contractor-type employees, or category=subcontractor)
      for (const ex of expensesRes.data || []) {
        if (!ex.employee_id) continue;
        const emp = empById.get(ex.employee_id);
        if (!emp) continue;
        const isContractorPayout =
          emp.worker_type === 'contractor' && (ex.category === 'subcontractor' || ex.category === 'labour');
        if (!isContractorPayout) continue;
        const proj = ex.project_id ? projectById.get(ex.project_id) : null;
        const inv = ex.project_id ? invoiceByProject.get(ex.project_id) : null;
        const matched = bankByMatch.get(`expense:${ex.id}`);
        results.push({
          id: `ex-${ex.id}`,
          type: 'contractor',
          workerId: emp.id,
          workerName: `${emp.first_name} ${emp.last_name}`,
          workerRole: emp.job_title,
          amountGross: Number(ex.amount),
          amountNet: Number(ex.amount),
          payDate: ex.expense_date,
          status: mapExpenseStatus(ex.status, !!matched),
          reference: ex.description || 'Contractor payout',
          sourceType: 'expense',
          sourceId: ex.id,
          projectId: ex.project_id,
          projectName: proj?.name || null,
          invoiceId: inv?.id || null,
          invoiceNumber: inv?.invoice_number || null,
          bankTxnId: matched?.id || null,
          bankTxnDate: matched?.txn_date || null,
        });
      }

      results.sort((a, b) => (a.payDate < b.payDate ? 1 : -1));
      return results;
    },
    enabled: !!companyId,
  });
}
