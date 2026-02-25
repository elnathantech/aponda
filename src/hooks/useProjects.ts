import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Project {
  id: string;
  company_id: string;
  name: string;
  description: string | null;
  client_name: string | null;
  client_email: string | null;
  status: 'active' | 'completed' | 'on_hold' | 'cancelled';
  budget: number | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

export function useProjects(companyId: string | undefined) {
  return useQuery({
    queryKey: ['projects', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Project[];
    },
    enabled: !!companyId,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Project> & { company_id: string; name: string }) => {
      const { data: project, error } = await supabase
        .from('projects')
        .insert([data])
        .select()
        .single();
      if (error) throw error;
      return project as Project;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projects', data.company_id] });
      toast.success('Project created');
    },
    onError: (error) => toast.error('Failed to create project: ' + error.message),
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Project> & { id: string }) => {
      const { data: project, error } = await supabase
        .from('projects')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return project as Project;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projects', data.company_id] });
      toast.success('Project updated');
    },
    onError: (error) => toast.error('Failed to update project: ' + error.message),
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, companyId }: { id: string; companyId: string }) => {
      const { error } = await supabase.from('projects').delete().eq('id', id);
      if (error) throw error;
      return { id, companyId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projects', data.companyId] });
      toast.success('Project deleted');
    },
    onError: (error) => toast.error('Failed to delete project: ' + error.message),
  });
}
