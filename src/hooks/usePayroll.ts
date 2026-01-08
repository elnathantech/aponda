import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { calculatePayroll, getTaxMonth, getTaxYear } from '@/lib/uk-payroll-calculator';
import type { Employee } from './useEmployees';
import type { Company } from './useCompany';

export interface PayrollRun {
  id: string;
  company_id: string;
  pay_period_start: string;
  pay_period_end: string;
  pay_date: string;
  status: string;
  tax_year: string;
  tax_month: number;
  total_gross: number | null;
  total_net: number | null;
  total_tax: number | null;
  total_ni_employee: number | null;
  total_ni_employer: number | null;
  total_pension_employee: number | null;
  total_pension_employer: number | null;
  submitted_to_hmrc: boolean;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Payslip {
  id: string;
  payroll_run_id: string;
  employee_id: string;
  gross_pay: number;
  taxable_pay: number;
  income_tax: number;
  ni_employee: number;
  ni_employer: number;
  pension_employee: number;
  pension_employer: number;
  student_loan: number;
  other_deductions: number;
  net_pay: number;
  ytd_gross: number;
  ytd_tax: number;
  ytd_ni: number;
  ytd_pension_employee: number;
  created_at: string;
}

export interface TaxYearRecord {
  id: string;
  employee_id: string;
  tax_year: string;
  total_pay: number;
  total_tax: number;
  total_ni: number;
  total_pension: number;
  total_student_loan: number;
  final_tax_code: string | null;
  created_at: string;
}

export function usePayrollRuns(companyId: string | undefined) {
  return useQuery({
    queryKey: ['payroll-runs', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      
      const { data, error } = await supabase
        .from('payroll_runs')
        .select('*')
        .eq('company_id', companyId)
        .order('pay_date', { ascending: false });
      
      if (error) throw error;
      return data as PayrollRun[];
    },
    enabled: !!companyId,
  });
}

export function usePayrollRun(payrollRunId: string | undefined) {
  return useQuery({
    queryKey: ['payroll-run', payrollRunId],
    queryFn: async () => {
      if (!payrollRunId) return null;
      
      const { data, error } = await supabase
        .from('payroll_runs')
        .select('*')
        .eq('id', payrollRunId)
        .maybeSingle();
      
      if (error) throw error;
      return data as PayrollRun | null;
    },
    enabled: !!payrollRunId,
  });
}

export function usePayslips(payrollRunId: string | undefined) {
  return useQuery({
    queryKey: ['payslips', payrollRunId],
    queryFn: async () => {
      if (!payrollRunId) return [];
      
      const { data, error } = await supabase
        .from('payslips')
        .select('*')
        .eq('payroll_run_id', payrollRunId);
      
      if (error) throw error;
      return data as Payslip[];
    },
    enabled: !!payrollRunId,
  });
}

export function useEmployeePayslips(employeeId: string | undefined) {
  return useQuery({
    queryKey: ['employee-payslips', employeeId],
    queryFn: async () => {
      if (!employeeId) return [];
      
      const { data, error } = await supabase
        .from('payslips')
        .select('*, payroll_runs(*)')
        .eq('employee_id', employeeId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as (Payslip & { payroll_runs: PayrollRun })[];
    },
    enabled: !!employeeId,
  });
}

export function useTaxYearRecords(employeeId: string | undefined) {
  return useQuery({
    queryKey: ['tax-year-records', employeeId],
    queryFn: async () => {
      if (!employeeId) return [];
      
      const { data, error } = await supabase
        .from('tax_year_records')
        .select('*')
        .eq('employee_id', employeeId)
        .order('tax_year', { ascending: false });
      
      if (error) throw error;
      return data as TaxYearRecord[];
    },
    enabled: !!employeeId,
  });
}

export function useCreatePayrollRun() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      company,
      employees,
      payPeriodStart,
      payPeriodEnd,
      payDate,
    }: {
      company: Company;
      employees: Employee[];
      payPeriodStart: Date;
      payPeriodEnd: Date;
      payDate: Date;
    }) => {
      const taxYear = getTaxYear(payDate);
      const taxMonth = getTaxMonth(payDate);
      
      // Create payroll run
      const { data: payrollRun, error: runError } = await supabase
        .from('payroll_runs')
        .insert({
          company_id: company.id,
          pay_period_start: payPeriodStart.toISOString().split('T')[0],
          pay_period_end: payPeriodEnd.toISOString().split('T')[0],
          pay_date: payDate.toISOString().split('T')[0],
          tax_year: taxYear,
          tax_month: taxMonth,
          status: 'draft',
        })
        .select()
        .single();
      
      if (runError) throw runError;
      
      // Calculate payslips for each active employee
      const activeEmployees = employees.filter(e => e.status === 'active');
      const payslips: Omit<Payslip, 'id' | 'created_at'>[] = [];
      
      let totalGross = 0;
      let totalNet = 0;
      let totalTax = 0;
      let totalNIEmployee = 0;
      let totalNIEmployer = 0;
      let totalPensionEmployee = 0;
      let totalPensionEmployer = 0;
      
      for (const employee of activeEmployees) {
        // Get previous payslips for YTD calculations
        const { data: previousPayslips } = await supabase
          .from('payslips')
          .select('*')
          .eq('employee_id', employee.id)
          .order('created_at', { ascending: false })
          .limit(1);
        
        const previousYTD = previousPayslips?.[0] || {
          ytd_gross: 0,
          ytd_tax: 0,
          ytd_ni: 0,
          ytd_pension_employee: 0,
        };
        
        const calculation = calculatePayroll(
          employee.annual_salary,
          employee.pay_frequency,
          employee.tax_code,
          employee.student_loan_plan,
          company.pension_employee_contribution,
          company.pension_employer_contribution,
          employee.pension_status === 'enrolled'
        );
        
        payslips.push({
          payroll_run_id: payrollRun.id,
          employee_id: employee.id,
          gross_pay: calculation.grossPay,
          taxable_pay: calculation.taxablePay,
          income_tax: calculation.incomeTax,
          ni_employee: calculation.niEmployee,
          ni_employer: calculation.niEmployer,
          pension_employee: calculation.pensionEmployee,
          pension_employer: calculation.pensionEmployer,
          student_loan: calculation.studentLoan,
          other_deductions: 0,
          net_pay: calculation.netPay,
          ytd_gross: previousYTD.ytd_gross + calculation.grossPay,
          ytd_tax: previousYTD.ytd_tax + calculation.incomeTax,
          ytd_ni: previousYTD.ytd_ni + calculation.niEmployee,
          ytd_pension_employee: previousYTD.ytd_pension_employee + calculation.pensionEmployee,
        });
        
        totalGross += calculation.grossPay;
        totalNet += calculation.netPay;
        totalTax += calculation.incomeTax;
        totalNIEmployee += calculation.niEmployee;
        totalNIEmployer += calculation.niEmployer;
        totalPensionEmployee += calculation.pensionEmployee;
        totalPensionEmployer += calculation.pensionEmployer;
      }
      
      // Insert payslips
      if (payslips.length > 0) {
        const { error: payslipsError } = await supabase
          .from('payslips')
          .insert(payslips);
        
        if (payslipsError) throw payslipsError;
      }
      
      // Update payroll run with totals
      const { data: updatedRun, error: updateError } = await supabase
        .from('payroll_runs')
        .update({
          total_gross: totalGross,
          total_net: totalNet,
          total_tax: totalTax,
          total_ni_employee: totalNIEmployee,
          total_ni_employer: totalNIEmployer,
          total_pension_employee: totalPensionEmployee,
          total_pension_employer: totalPensionEmployer,
        })
        .eq('id', payrollRun.id)
        .select()
        .single();
      
      if (updateError) throw updateError;
      
      return updatedRun as PayrollRun;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['payroll-runs', data.company_id] });
      toast.success('Payroll run created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create payroll run: ' + error.message);
    },
  });
}

export function useUpdatePayrollRunStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      id, 
      status,
      submittedToHmrc 
    }: { 
      id: string; 
      status: string;
      submittedToHmrc?: boolean;
    }) => {
      const updateData: Record<string, unknown> = { status };
      if (submittedToHmrc !== undefined) {
        updateData.submitted_to_hmrc = submittedToHmrc;
        if (submittedToHmrc) {
          updateData.submitted_at = new Date().toISOString();
        }
      }
      
      const { data, error } = await supabase
        .from('payroll_runs')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as PayrollRun;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['payroll-runs', data.company_id] });
      queryClient.invalidateQueries({ queryKey: ['payroll-run', data.id] });
      toast.success('Payroll status updated');
    },
  });
}
