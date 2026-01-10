import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseService, supabase } from '../services/supabaseService';

export const useSettings = (year: number) => {
  const queryClient = useQueryClient();

  const { 
    data: settings = {}, 
    isLoading, 
    isFetching,
    error 
  } = useQuery({
    queryKey: ['settings', year],
    queryFn: () => supabaseService.getSettings(year),
  });

  useEffect(() => {
    const channel = supabase
      .channel(`settings-changes-${year}`)
      .on(
        'postgres_changes',
        { 
            event: '*', 
            schema: 'public', 
            table: 'system_settings',
            filter: `year=eq.${year}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['settings', year] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, year]);

  const updateSettingsMutation = useMutation({
    mutationFn: (updates: any) => supabaseService.updateSettings(year, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['settings', year] }),
  });

  // Derived data helpers for convenience
  const companies = settings.companies || [];
  const companyOrder = settings.company_order || [];
  const votes = settings.vote_numbers || [];
  const sebuthargaNumbers = settings.sebutharga_numbers || [];
  const companyDetails = settings.company_details || {};
  const manualFinancials = settings.manual_financials || { outsource: 0, ydp: 0 };

  return {
    settings,
    companies,
    companyOrder,
    votes,
    sebuthargaNumbers,
    companyDetails,
    manualFinancials,
    isLoading,
    isSyncing: isFetching,
    error,
    updateSettings: updateSettingsMutation.mutateAsync,
  };
};
