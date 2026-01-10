import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseService, supabase } from '../services/supabaseService';
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
    queryFn: () => supabaseService.getBulletins(),
  });

  useEffect(() => {
    const channel = supabase
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
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const addBulletinMutation = useMutation({
    mutationFn: ({ content, author }: { content: string; author: string }) => 
      supabaseService.addBulletin(content, author),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bulletins'] }),
  });

  const deleteBulletinMutation = useMutation({
    mutationFn: (id: string) => supabaseService.deleteBulletin(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bulletins'] }),
  });

  return {
    bulletins,
    isLoading,
    isSyncing: isFetching,
    error,
    addBulletin: addBulletinMutation.mutateAsync,
    deleteBulletin: deleteBulletinMutation.mutateAsync,
  };
};
