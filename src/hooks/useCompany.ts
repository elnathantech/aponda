import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface Company {
  id: string;
  user_id: string;
  name: string;
  company_number: string | null;
  vat_number: string | null;
  registered_address: Record<string, string> | null;
  trading_address: Record<string, string> | null;
  paye_reference: string | null;
  accounts_office_reference: string | null;
  pension_provider: string | null;
  pension_employer_contribution: number;
  pension_employee_contribution: number;
  created_at: string;
  updated_at: string;
}

export interface OnboardingStep {
  id: string;
  company_id: string;
  step_name: string;
  step_order: number;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  completed_at: string | null;
  notes: string | null;
}

const ONBOARDING_STEPS = [
  { name: 'Company Details', order: 1 },
  { name: 'PAYE Registration', order: 2 },
  { name: 'Pension Provider Setup', order: 3 },
  { name: 'Bank Account Details', order: 4 },
  { name: 'Add First Employee', order: 5 },
  { name: 'Configure Pay Schedule', order: 6 },
  { name: 'Review & Confirm', order: 7 },
];

export function useCompanies() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['companies', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Company[];
    },
    enabled: !!user,
  });
}

export function useCompany(companyId: string | undefined) {
  return useQuery({
    queryKey: ['company', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .maybeSingle();
      
      if (error) throw error;
      return data as Company | null;
    },
    enabled: !!companyId,
  });
}

export function useCompanyOnboarding(companyId: string | undefined) {
  return useQuery({
    queryKey: ['company-onboarding', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      
      const { data, error } = await supabase
        .from('company_onboarding')
        .select('*')
        .eq('company_id', companyId)
        .order('step_order');
      
      if (error) throw error;
      return data as OnboardingStep[];
    },
    enabled: !!companyId,
  });
}

export function useCreateCompany() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (companyData: Partial<Company>) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .insert([{
          name: companyData.name || 'New Company',
          user_id: user.id,
          company_number: companyData.company_number || null,
          paye_reference: companyData.paye_reference || null,
          pension_provider: companyData.pension_provider || null,
        }])
        .select()
        .single();
      
      if (companyError) throw companyError;
      
      // Create onboarding steps
      const onboardingSteps = ONBOARDING_STEPS.map(step => ({
        company_id: company.id,
        step_name: step.name,
        step_order: step.order,
        status: 'pending' as const,
      }));
      
      const { error: onboardingError } = await supabase
        .from('company_onboarding')
        .insert(onboardingSteps);
      
      if (onboardingError) throw onboardingError;
      
      return company as Company;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast.success('Company created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create company: ' + error.message);
    },
  });
}

export function useUpdateCompany() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Company> & { id: string }) => {
      const { data: company, error } = await supabase
        .from('companies')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return company as Company;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['company', data.id] });
      toast.success('Company updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update company: ' + error.message);
    },
  });
}

export function useUpdateOnboardingStep() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      id, 
      status, 
      notes 
    }: { 
      id: string; 
      status: 'pending' | 'in_progress' | 'completed' | 'skipped'; 
      notes?: string;
    }) => {
      const updateData: Record<string, unknown> = { status };
      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }
      if (notes !== undefined) {
        updateData.notes = notes;
      }
      
      const { data, error } = await supabase
        .from('company_onboarding')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as OnboardingStep;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['company-onboarding', data.company_id] });
    },
  });
}
