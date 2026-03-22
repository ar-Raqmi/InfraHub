import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService, api } from '../services/apiService';

export const useSettings = (year: number) => {
  const queryClient = useQueryClient();

  const { 
    data: settings = {}, 
    isLoading, 
    isFetching,
    error 
  } = useQuery<any>({
    queryKey: ['settings', year],
    queryFn: () => apiService.getSettings(year),
  });

  useEffect(() => {
    const channel = api
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
      api.removeChannel(channel);
    };
  }, [queryClient, year]);

  const updateSettingsMutation = useMutation({
    mutationFn: (updates: any) => apiService.updateSettings(year, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['settings', year] }),
  });

  // Derived data helpers for convenience
    const companies: string[] = settings.companies || [];
    const companyOrder: string[] = settings.company_order || [];
    const votes: any[] = settings.vote_numbers || [];
    const sebuthargaNumbers: string[] = settings.sebutharga_numbers || [];
    const companyDetails: any = settings.company_details || {};
    const manualFinancials: any = settings.manual_financials || { outsource: 0, ydp: 0 };

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
