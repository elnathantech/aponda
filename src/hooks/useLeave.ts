import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface LeaveRecord {
  id: string;
  employee_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  days_taken: number;
  status: string;
  approved_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeaveRecordWithEmployee extends LeaveRecord {
  employee?: {
    id: string;
    first_name: string;
    last_name: string;
    employee_number: string;
  };
}

export interface LeaveBalance {
  annual_leave_entitlement: number;
  annual_leave_taken: number;
  annual_leave_remaining: number;
  sick_leave_taken: number;
  other_leave_taken: number;
}

// Fetch all leave records for a company
export function useCompanyLeaveRecords(companyId: string | undefined) {
  return useQuery({
    queryKey: ['leave-records', 'company', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      
      // First get all employees for the company
      const { data: employees, error: empError } = await supabase
        .from('employees')
        .select('id, first_name, last_name, employee_number')
        .eq('company_id', companyId);
      
      if (empError) throw empError;
      if (!employees || employees.length === 0) return [];
      
      const employeeIds = employees.map(e => e.id);
      
      // Then get leave records for those employees
      const { data, error } = await supabase
        .from('leave_records')
        .select('*')
        .in('employee_id', employeeIds)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Combine with employee data
      return (data || []).map(record => ({
        ...record,
        employee: employees.find(e => e.id === record.employee_id)
      })) as LeaveRecordWithEmployee[];
    },
    enabled: !!companyId,
  });
}

// Fetch leave records for a specific employee
export function useEmployeeLeaveRecords(employeeId: string | undefined) {
  return useQuery({
    queryKey: ['leave-records', 'employee', employeeId],
    queryFn: async () => {
      if (!employeeId) return [];
      
      const { data, error } = await supabase
        .from('leave_records')
        .select('*')
        .eq('employee_id', employeeId)
        .order('start_date', { ascending: false });
      
      if (error) throw error;
      return data as LeaveRecord[];
    },
    enabled: !!employeeId,
  });
}

// Calculate leave balance for an employee (current tax year)
export function useEmployeeLeaveBalance(employeeId: string | undefined) {
  return useQuery({
    queryKey: ['leave-balance', employeeId],
    queryFn: async () => {
      if (!employeeId) return null;
      
      // Get current tax year dates (UK tax year: 6 April - 5 April)
      const now = new Date();
      const currentYear = now.getFullYear();
      const taxYearStart = now.getMonth() >= 3 && now.getDate() >= 6 
        ? new Date(currentYear, 3, 6) 
        : new Date(currentYear - 1, 3, 6);
      const taxYearEnd = new Date(taxYearStart.getFullYear() + 1, 3, 5);
      
      const { data, error } = await supabase
        .from('leave_records')
        .select('leave_type, days_taken, status')
        .eq('employee_id', employeeId)
        .gte('start_date', taxYearStart.toISOString().split('T')[0])
        .lte('start_date', taxYearEnd.toISOString().split('T')[0])
        .eq('status', 'approved');
      
      if (error) throw error;
      
      const annualLeaveTaken = (data || [])
        .filter(r => r.leave_type === 'annual')
        .reduce((sum, r) => sum + Number(r.days_taken), 0);
      
      const sickLeaveTaken = (data || [])
        .filter(r => r.leave_type === 'sick')
        .reduce((sum, r) => sum + Number(r.days_taken), 0);
      
      const otherLeaveTaken = (data || [])
        .filter(r => !['annual', 'sick'].includes(r.leave_type))
        .reduce((sum, r) => sum + Number(r.days_taken), 0);
      
      // UK statutory minimum is 28 days (including bank holidays) - using 25 working days as default
      const annualLeaveEntitlement = 25;
      
      return {
        annual_leave_entitlement: annualLeaveEntitlement,
        annual_leave_taken: annualLeaveTaken,
        annual_leave_remaining: annualLeaveEntitlement - annualLeaveTaken,
        sick_leave_taken: sickLeaveTaken,
        other_leave_taken: otherLeaveTaken,
      } as LeaveBalance;
    },
    enabled: !!employeeId,
  });
}

// Create a new leave request
export function useCreateLeaveRequest() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: {
      employee_id: string;
      leave_type: string;
      start_date: string;
      end_date: string;
      days_taken: number;
      notes?: string;
    }) => {
      const { data: result, error } = await supabase
        .from('leave_records')
        .insert({
          employee_id: data.employee_id,
          leave_type: data.leave_type,
          start_date: data.start_date,
          end_date: data.end_date,
          days_taken: data.days_taken,
          notes: data.notes || null,
          status: 'pending',
        })
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['leave-records'] });
      queryClient.invalidateQueries({ queryKey: ['leave-balance', variables.employee_id] });
    },
  });
}

// Update leave request status (approve/reject)
export function useUpdateLeaveStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      leaveId, 
      status, 
      approvedBy 
    }: { 
      leaveId: string; 
      status: 'approved' | 'rejected'; 
      approvedBy?: string;
    }) => {
      const { data, error } = await supabase
        .from('leave_records')
        .update({
          status,
          approved_by: approvedBy || null,
        })
        .eq('id', leaveId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-records'] });
      queryClient.invalidateQueries({ queryKey: ['leave-balance'] });
    },
  });
}

// Delete a leave request
export function useDeleteLeaveRequest() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (leaveId: string) => {
      const { error } = await supabase
        .from('leave_records')
        .delete()
        .eq('id', leaveId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-records'] });
      queryClient.invalidateQueries({ queryKey: ['leave-balance'] });
    },
  });
}
