import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService, api } from '../services/apiService';
import { User } from '../types';

export const useUsers = () => {
  const queryClient = useQueryClient();

  const { 
    data: users = [], 
    isLoading, 
    isFetching,
    error 
  } = useQuery({
    queryKey: ['users'],
    queryFn: () => apiService.getUsers(),
  });

  useEffect(() => {
    const channel = api
      .channel('users-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'app_users' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['users'] });
        }
      )
      .subscribe();

    return () => {
      api.removeChannel(channel);
    };
  }, [queryClient]);

  const addUserMutation = useMutation({
    mutationFn: (user: Omit<User, 'id'>) => apiService.addUser(user),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Partial<User> }) => 
      apiService.updateUser(id, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id: number) => apiService.deleteUser(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });

  return {
    users,
    isLoading,
    isSyncing: isFetching,
    error,
    addUser: addUserMutation.mutateAsync,
    updateUser: updateUserMutation.mutateAsync,
    deleteUser: deleteUserMutation.mutateAsync,
  };
};
