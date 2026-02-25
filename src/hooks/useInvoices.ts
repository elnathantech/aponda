import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Invoice {
  id: string;
  company_id: string;
  project_id: string | null;
  invoice_number: string;
  client_name: string;
  client_email: string | null;
  client_address: Record<string, string> | null;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  issue_date: string;
  due_date: string;
  subtotal: number;
  tax_rate: number | null;
  tax_amount: number;
  total: number;
  amount_paid: number;
  notes: string | null;
  payment_terms: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
  created_at: string;
}

export function useInvoices(companyId: string | undefined) {
  return useQuery({
    queryKey: ['invoices', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Invoice[];
    },
    enabled: !!companyId,
  });
}

export function useInvoiceItems(invoiceId: string | undefined) {
  return useQuery({
    queryKey: ['invoice-items', invoiceId],
    queryFn: async () => {
      if (!invoiceId) return [];
      const { data, error } = await supabase
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', invoiceId)
        .order('created_at');
      if (error) throw error;
      return data as InvoiceItem[];
    },
    enabled: !!invoiceId,
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ 
      items, 
      ...invoiceData 
    }: Partial<Invoice> & { 
      company_id: string; 
      invoice_number: string; 
      client_name: string; 
      due_date: string;
      items: Omit<InvoiceItem, 'id' | 'invoice_id' | 'created_at'>[];
    }) => {
      // Calculate totals
      const subtotal = items.reduce((sum, item) => sum + item.total, 0);
      const taxRate = invoiceData.tax_rate ?? 20;
      const taxAmount = subtotal * (taxRate / 100);
      const total = subtotal + taxAmount;

      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert([{
          ...invoiceData,
          subtotal,
          tax_amount: taxAmount,
          total,
        }])
        .select()
        .single();
      if (invoiceError) throw invoiceError;

      if (items.length > 0) {
        const itemsWithInvoice = items.map(item => ({
          ...item,
          invoice_id: invoice.id,
        }));
        const { error: itemsError } = await supabase
          .from('invoice_items')
          .insert(itemsWithInvoice);
        if (itemsError) throw itemsError;
      }

      return invoice as Invoice;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['invoices', data.company_id] });
      toast.success('Invoice created');
    },
    onError: (error) => toast.error('Failed to create invoice: ' + error.message),
  });
}

export function useUpdateInvoiceStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, amount_paid }: { id: string; status: Invoice['status']; amount_paid?: number }) => {
      const updateData: Record<string, unknown> = { status };
      if (status === 'paid') {
        updateData.paid_at = new Date().toISOString();
      }
      if (amount_paid !== undefined) {
        updateData.amount_paid = amount_paid;
      }
      const { data, error } = await supabase
        .from('invoices')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Invoice;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['invoices', data.company_id] });
      toast.success(`Invoice marked as ${data.status}`);
    },
    onError: (error) => toast.error('Failed to update invoice: ' + error.message),
  });
}

export function useDeleteInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, companyId }: { id: string; companyId: string }) => {
      const { error } = await supabase.from('invoices').delete().eq('id', id);
      if (error) throw error;
      return { id, companyId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['invoices', data.companyId] });
      toast.success('Invoice deleted');
    },
    onError: (error) => toast.error('Failed to delete invoice: ' + error.message),
  });
}
