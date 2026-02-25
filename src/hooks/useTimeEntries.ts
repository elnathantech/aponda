import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface TimeEntry {
  id: string;
  employee_id: string;
  project_id: string | null;
  date: string;
  hours: number;
  description: string | null;
  billable: boolean;
  created_at: string;
  updated_at: string;
}

export function useTimeEntries(companyId: string | undefined) {
  return useQuery({
    queryKey: ['time-entries', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      // Get employees for this company, then their time entries
      const { data: employees, error: empError } = await supabase
        .from('employees')
        .select('id')
        .eq('company_id', companyId);
      if (empError) throw empError;
      if (!employees?.length) return [];
      
      const employeeIds = employees.map(e => e.id);
      const { data, error } = await supabase
        .from('time_entries')
        .select('*')
        .in('employee_id', employeeIds)
        .order('date', { ascending: false });
      if (error) throw error;
      return data as TimeEntry[];
    },
    enabled: !!companyId,
  });
}

export function useEmployeeTimeEntries(employeeId: string | undefined) {
  return useQuery({
    queryKey: ['time-entries-employee', employeeId],
    queryFn: async () => {
      if (!employeeId) return [];
      const { data, error } = await supabase
        .from('time_entries')
        .select('*')
        .eq('employee_id', employeeId)
        .order('date', { ascending: false });
      if (error) throw error;
      return data as TimeEntry[];
    },
    enabled: !!employeeId,
  });
}

export function useCreateTimeEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<TimeEntry, 'id' | 'created_at' | 'updated_at'>) => {
      const { data: entry, error } = await supabase
        .from('time_entries')
        .insert([data])
        .select()
        .single();
      if (error) throw error;
      return entry as TimeEntry;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-entries'] });
      queryClient.invalidateQueries({ queryKey: ['time-entries-employee'] });
      toast.success('Time entry added');
    },
    onError: (error) => toast.error('Failed to add time entry: ' + error.message),
  });
}

export function useDeleteTimeEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('time_entries').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-entries'] });
      queryClient.invalidateQueries({ queryKey: ['time-entries-employee'] });
      toast.success('Time entry deleted');
    },
    onError: (error) => toast.error('Failed to delete time entry: ' + error.message),
  });
}
