import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Employee {
  id: string;
  company_id: string;
  employee_number: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  date_of_birth: string | null;
  ni_number: string | null;
  address: Record<string, string> | null;
  job_title: string | null;
  department: string | null;
  start_date: string;
  end_date: string | null;
  status: 'active' | 'on_leave' | 'terminated' | 'pending';
  annual_salary: number;
  pay_frequency: 'weekly' | 'fortnightly' | 'monthly';
  tax_code: string;
  is_cumulative: boolean;
  student_loan_plan: string | null;
  pension_status: 'enrolled' | 'opted_out' | 'eligible' | 'not_eligible';
  pension_opt_out_date: string | null;
  emergency_contact: Record<string, string> | null;
  bank_details: Record<string, string> | null;
  created_at: string;
  updated_at: string;
}

export interface EmployeeOnboardingStep {
  id: string;
  employee_id: string;
  step_name: string;
  step_order: number;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  completed_at: string | null;
  notes: string | null;
  document_url: string | null;
}

const EMPLOYEE_ONBOARDING_STEPS = [
  { name: 'Personal Details', order: 1 },
  { name: 'Right to Work Check', order: 2 },
  { name: 'Starter Declaration (P46)', order: 3 },
  { name: 'Bank Details', order: 4 },
  { name: 'Emergency Contact', order: 5 },
  { name: 'Contract Signed', order: 6 },
  { name: 'Pension Enrollment', order: 7 },
  { name: 'IT/Equipment Setup', order: 8 },
];

export function useEmployees(companyId: string | undefined) {
  return useQuery({
    queryKey: ['employees', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('company_id', companyId)
        .order('last_name');
      
      if (error) throw error;
      return data as Employee[];
    },
    enabled: !!companyId,
  });
}

export function useEmployee(employeeId: string | undefined) {
  return useQuery({
    queryKey: ['employee', employeeId],
    queryFn: async () => {
      if (!employeeId) return null;
      
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('id', employeeId)
        .maybeSingle();
      
      if (error) throw error;
      return data as Employee | null;
    },
    enabled: !!employeeId,
  });
}

export function useEmployeeOnboarding(employeeId: string | undefined) {
  return useQuery({
    queryKey: ['employee-onboarding', employeeId],
    queryFn: async () => {
      if (!employeeId) return [];
      
      const { data, error } = await supabase
        .from('employee_onboarding')
        .select('*')
        .eq('employee_id', employeeId)
        .order('step_order');
      
      if (error) throw error;
      return data as EmployeeOnboardingStep[];
    },
    enabled: !!employeeId,
  });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (employeeData: Partial<Employee> & { company_id: string }) => {
      // Generate employee number if not provided
      if (!employeeData.employee_number) {
        const { count } = await supabase
          .from('employees')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', employeeData.company_id);
        
        employeeData.employee_number = `EMP${String((count || 0) + 1).padStart(4, '0')}`;
      }
      
      const { data: employee, error: employeeError } = await supabase
        .from('employees')
        .insert([{
          company_id: employeeData.company_id,
          employee_number: employeeData.employee_number!,
          first_name: employeeData.first_name || '',
          last_name: employeeData.last_name || '',
          start_date: employeeData.start_date || new Date().toISOString().split('T')[0],
          annual_salary: employeeData.annual_salary || 0,
          email: employeeData.email,
          phone: employeeData.phone,
          ni_number: employeeData.ni_number,
          job_title: employeeData.job_title,
          department: employeeData.department,
          status: employeeData.status || 'pending',
          pay_frequency: employeeData.pay_frequency || 'monthly',
          tax_code: employeeData.tax_code || '1257L',
          student_loan_plan: employeeData.student_loan_plan,
          pension_status: employeeData.pension_status || 'eligible',
        }])
        .select()
        .single();
      
      if (employeeError) throw employeeError;
      
      // Create onboarding steps
      const onboardingSteps = EMPLOYEE_ONBOARDING_STEPS.map(step => ({
        employee_id: employee.id,
        step_name: step.name,
        step_order: step.order,
        status: 'pending' as const,
      }));
      
      const { error: onboardingError } = await supabase
        .from('employee_onboarding')
        .insert(onboardingSteps);
      
      if (onboardingError) throw onboardingError;
      
      return employee as Employee;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['employees', data.company_id] });
      toast.success('Employee added successfully');
    },
    onError: (error) => {
      toast.error('Failed to add employee: ' + error.message);
    },
  });
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Employee> & { id: string }) => {
      const { data: employee, error } = await supabase
        .from('employees')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return employee as Employee;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['employees', data.company_id] });
      queryClient.invalidateQueries({ queryKey: ['employee', data.id] });
      toast.success('Employee updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update employee: ' + error.message);
    },
  });
}

export function useUpdateEmployeeOnboardingStep() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      id, 
      status, 
      notes,
      document_url 
    }: { 
      id: string; 
      status: 'pending' | 'in_progress' | 'completed' | 'skipped'; 
      notes?: string;
      document_url?: string;
    }) => {
      const updateData: Record<string, unknown> = { status };
      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }
      if (notes !== undefined) {
        updateData.notes = notes;
      }
      if (document_url !== undefined) {
        updateData.document_url = document_url;
      }
      
      const { data, error } = await supabase
        .from('employee_onboarding')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as EmployeeOnboardingStep;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['employee-onboarding', data.employee_id] });
    },
  });
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, companyId }: { id: string; companyId: string }) => {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return { id, companyId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['employees', data.companyId] });
      toast.success('Employee removed successfully');
    },
    onError: (error) => {
      toast.error('Failed to remove employee: ' + error.message);
    },
  });
}
