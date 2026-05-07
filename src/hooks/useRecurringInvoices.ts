import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface RecurringInvoice {
  id: string;
  company_id: string;
  client_name: string;
  client_email: string | null;
  client_address: Record<string, string> | null;
  project_id: string | null;
  frequency: 'weekly' | 'fortnightly' | 'monthly' | 'quarterly' | 'yearly';
  next_run_date: string;
  items_template: Array<{ description: string; quantity: number; unit_price: number }>;
  tax_rate: number | null;
  notes: string | null;
  payment_terms: string | null;
  payment_due_days: number;
  is_active: boolean;
  last_generated_at: string | null;
  total_generated: number;
  created_at: string;
  updated_at: string;
}

export interface AutomationLog {
  id: string;
  company_id: string;
  automation_type: string;
  status: string;
  details: Record<string, unknown> | null;
  related_id: string | null;
  created_at: string;
}

export function useRecurringInvoices(companyId: string | undefined) {
  return useQuery({
    queryKey: ['recurring-invoices', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('recurring_invoices')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as unknown as RecurringInvoice[];
    },
    enabled: !!companyId,
  });
}

export function useAutomationLogs(companyId: string | undefined) {
  return useQuery({
    queryKey: ['automation-logs', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('automation_logs')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as unknown as AutomationLog[];
    },
    enabled: !!companyId,
  });
}

export function useCreateRecurringInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<RecurringInvoice, 'id' | 'created_at' | 'updated_at' | 'last_generated_at' | 'total_generated'>) => {
      const { data: result, error } = await supabase
        .from('recurring_invoices')
        .insert([data])
        .select()
        .single();
      if (error) throw error;
      return result as unknown as RecurringInvoice;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['recurring-invoices', data.company_id] });
      toast.success('Recurring invoice template created');
    },
    onError: (error) => toast.error('Failed to create template: ' + error.message),
  });
}

export function useUpdateRecurringInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<RecurringInvoice> & { id: string; company_id: string }) => {
      const { data: result, error } = await supabase
        .from('recurring_invoices')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return result as unknown as RecurringInvoice;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['recurring-invoices', data.company_id] });
      toast.success('Recurring invoice updated');
    },
    onError: (error) => toast.error('Failed to update: ' + error.message),
  });
}

export function useDeleteRecurringInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, companyId }: { id: string; companyId: string }) => {
      const { error } = await supabase.from('recurring_invoices').delete().eq('id', id);
      if (error) throw error;
      return { id, companyId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['recurring-invoices', data.companyId] });
      toast.success('Recurring invoice deleted');
    },
    onError: (error) => toast.error('Failed to delete: ' + error.message),
  });
}

export function useRunAutomation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ type }: { type: 'financial-automation' | 'payment-reminders'; companyId: string }) => {
      const { data, error } = await supabase.functions.invoke(type);
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['invoices', variables.companyId] });
      queryClient.invalidateQueries({ queryKey: ['recurring-invoices', variables.companyId] });
      queryClient.invalidateQueries({ queryKey: ['automation-logs', variables.companyId] });
      toast.success('Automation task completed');
    },
    onError: (error) => toast.error('Automation failed: ' + error.message),
  });
}
