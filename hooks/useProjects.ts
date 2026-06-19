import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Project } from '../types';
import { apiService } from '../services/apiService';

// Cache Version signature to ensure freshness across updates
// We use v126 to move past any previous build failures or corrupted cache states
const CACHE_VERSION = 'v126';

export const useProjects = () => {
  const queryClient = useQueryClient();

  const { 
    data: projects = [], 
    isLoading, 
    isFetching,
    error 
  } = useQuery({
    queryKey: ['projects', CACHE_VERSION],
    queryFn: () => apiService.getProjects(),
  });

  const createProjectMutation = useMutation({
    mutationFn: (data: Partial<Project>) => apiService.createProject(data as any),
    onMutate: async (newProject) => {
      await queryClient.cancelQueries({ queryKey: ['projects', CACHE_VERSION] });
      const previousProjects = queryClient.getQueryData<Project[]>(['projects', CACHE_VERSION]);
      const optimisticProject = { ...newProject, id: Date.now(), createdAt: new Date().toISOString() } as Project;
      queryClient.setQueryData(['projects', CACHE_VERSION], (old: Project[] = []) => [optimisticProject, ...old]);
      return { previousProjects };
    },
    onError: (err, newProject, context) => {
      if (context?.previousProjects) {
        queryClient.setQueryData(['projects', CACHE_VERSION], context.previousProjects);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', CACHE_VERSION] });
    },
  });

  const updateProjectMutation = useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Partial<Project> }) => 
      apiService.updateProject(id, updates),
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: ['projects', id, CACHE_VERSION] });
      await queryClient.cancelQueries({ queryKey: ['projects', CACHE_VERSION] });
      
      const previousProject = queryClient.getQueryData<Project>(['projects', id, CACHE_VERSION]);
      const previousProjects = queryClient.getQueryData<Project[]>(['projects', CACHE_VERSION]);

      queryClient.setQueryData(['projects', id, CACHE_VERSION], (old: any) => ({ ...old, ...updates }));
      queryClient.setQueryData(['projects', CACHE_VERSION], (old: Project[] = []) => 
        old.map(p => p.id === id ? { ...p, ...updates } : p)
      );

      return { previousProject, previousProjects };
    },
    onError: (err, variables, context) => {
      if (context?.previousProject) {
        queryClient.setQueryData(['projects', variables.id, CACHE_VERSION], context.previousProject);
      }
      if (context?.previousProjects) {
        queryClient.setQueryData(['projects', CACHE_VERSION], context.previousProjects);
      }
    },
    onSettled: (data: any) => {
      if (data?.id) {
        queryClient.invalidateQueries({ queryKey: ['projects', data.id, CACHE_VERSION] });
      }
      queryClient.invalidateQueries({ queryKey: ['projects', CACHE_VERSION] });
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: (id: number) => apiService.deleteProject(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['projects', CACHE_VERSION] });
      const previousProjects = queryClient.getQueryData<Project[]>(['projects', CACHE_VERSION]);
      queryClient.setQueryData(['projects', CACHE_VERSION], (old: Project[] = []) => 
        old.filter(p => p.id !== id)
      );
      return { previousProjects };
    },
    onError: (err, id, context) => {
      if (context?.previousProjects) {
        queryClient.setQueryData(['projects', CACHE_VERSION], context.previousProjects);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', CACHE_VERSION] });
    },
  });

  return {
    projects,
    isLoading,
    isFetching,
    error,
    createProject: createProjectMutation.mutate,
    updateProject: updateProjectMutation.mutate,
    deleteProject: deleteProjectMutation.mutate
  };
};
