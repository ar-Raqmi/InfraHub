import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseService, supabase } from '../services/supabaseService';
import { Project } from '../types';

export const useProjects = () => {
  const queryClient = useQueryClient();

  // 1. The Main Query (Fetch & Cache)
  const { 
    data: projects = [], 
    isLoading, 
    isFetching, // True when fetching in background (even if we have data)
    error 
  } = useQuery({
    queryKey: ['projects'],
    queryFn: () => supabaseService.getProjects(),
  });

  // 2. Realtime Subscription
  useEffect(() => {
    console.log('🔌 Subscribing to Project updates...');
    
    const channel = supabase
      .channel('projects-all-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'projects' },
        (payload) => {
          console.log('⚡ Realtime change detected:', payload);
          // Invalidate cache -> triggers a background refetch
          queryClient.invalidateQueries({ queryKey: ['projects'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // 3. Mutations (Create, Update, Delete)
  // We use "Pessimistic Updates" here for safety (wait for server response)
  
  const createProjectMutation = useMutation({
    mutationFn: (newProject: Omit<Project, 'id'>) => supabaseService.createProject(newProject),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  const updateProjectMutation = useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Partial<Project> }) => 
      supabaseService.updateProject(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: (id: number) => supabaseService.deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  return {
    projects,
    isLoading, // True ONLY if we have NO data in cache
    isSyncing: isFetching, // True if we are checking for updates in background
    error,
    createProject: createProjectMutation.mutateAsync,
    updateProject: updateProjectMutation.mutateAsync,
    deleteProject: deleteProjectMutation.mutateAsync,
    isSaving: createProjectMutation.isPending || updateProjectMutation.isPending || deleteProjectMutation.isPending
  };
};
