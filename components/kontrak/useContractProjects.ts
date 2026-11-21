// Read-only project figures the Kontrak screens need (draf count per contract, work value per panel company).
// The "draf" count uses domain/repricing (same rule as GET /contracts stats.repriceableProjects).
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '../../services/apiService';
import type { Project } from '../../types';
import { isRepriceable } from '../../domain/repricing';

export interface ContractProjectStats {
  total: number;
  draf: number;
  /** Sum of kosProjek per panel company name. */
  valueByCompany: Map<string, number>;
}

export function useContractProjects(contractId: string | null | undefined) {
  const query = useQuery<Project[]>({ queryKey: ['kontrak', 'projects'], queryFn: () => apiService.getProjects(), staleTime: 60_000 });
  const stats = useMemo<ContractProjectStats>(() => {
    const mine = (query.data ?? []).filter(p => p.contractId === contractId);
    const valueByCompany = new Map<string, number>();
    mine.forEach(p => {
      if (p.namaSyarikat) valueByCompany.set(p.namaSyarikat, (valueByCompany.get(p.namaSyarikat) ?? 0) + (Number(p.kosProjek) || 0));
    });
    return { total: mine.length, draf: mine.filter(isRepriceable).length, valueByCompany };
  }, [query.data, contractId]);
  return { ...stats, isLoading: query.isLoading };
}
