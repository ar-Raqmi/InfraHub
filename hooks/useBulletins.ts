import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService, api } from '../services/apiService';
import { BulletinItem } from '../types';

export const useBulletins = () => {
  const queryClient = useQueryClient();

  const { 
    data: bulletins = [], 
    isLoading, 
    isFetching,
    error 
  } = useQuery({
    queryKey: ['bulletins'],
    queryFn: () => apiService.getBulletins(),
  });

  useEffect(() => {
    const channel = api
      .channel('bulletins-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bulletins' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['bulletins'] });
        }
      )
      .subscribe();

    return () => {
      api.removeChannel(channel);
    };
  }, [queryClient]);

  const addBulletinMutation = useMutation({
    mutationFn: ({ content, author }: { content: string; author: string }) => 
      apiService.addBulletin(content, author),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bulletins'] }),
  });

  const deleteBulletinMutation = useMutation({
    mutationFn: (id: string) => apiService.deleteBulletin(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bulletins'] }),
  });

  const markAsReadMutation = useMutation({
    mutationFn: ({ id, userId }: { id: string; userId: number }) => 
      apiService.markBulletinAsRead(id, userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bulletins'] }),
  });

  const toggleReactionMutation = useMutation({
    mutationFn: ({ id, userId, emoji }: { id: string; userId: number; emoji: string }) => 
      apiService.toggleReaction(id, userId, emoji),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bulletins'] }),
  });

  return {
    bulletins,
    isLoading,
    isSyncing: isFetching,
    error,
    addBulletin: addBulletinMutation.mutateAsync,
    deleteBulletin: deleteBulletinMutation.mutateAsync,
    markAsRead: markAsReadMutation.mutateAsync,
    toggleReaction: toggleReactionMutation.mutateAsync,
  };
};
