import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiService, type ContractInputBody } from '../services/apiService';
import type { CompanyDetail, Contract, ContractCompany, ContractStatus } from '../types';

export const contractKeys = {
  all: ['contracts'] as const,
  one: (id: string) => ['contracts', id] as const,
  companies: (id: string) => ['contracts', id, 'companies'] as const,
};

/** Every sebutharga with its stats, plus the create / edit / status / panel mutations (all logged server-side). */
export const useContracts = () => {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: contractKeys.all });

  const { data: contracts = [], isLoading, error } = useQuery<Contract[]>({
    queryKey: contractKeys.all,
    queryFn: () => apiService.getContracts(),
  });

  const createContract = useMutation({
    mutationFn: (body: ContractInputBody & { clone_from?: string }) => apiService.createContract(body),
    onSuccess: invalidate,
  });

  const updateContract = useMutation({
    mutationFn: ({ id, body }: { id: string; body: ContractInputBody }) => apiService.updateContract(id, body),
    onSuccess: invalidate,
  });

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ContractStatus }) => apiService.setContractStatus(id, status),
    onSuccess: invalidate,
  });

  const savePanel = useMutation({
    mutationFn: ({ id, companies }: { id: string; companies: { name: string; cap?: number | null; details?: CompanyDetail | null }[] }) =>
      apiService.saveContractCompanies(id, companies),
    onSuccess: invalidate,
  });

  const activeContract = contracts.find((c) => c.status === 'AKTIF' && c.kind === 'PANEL') ?? contracts.find((c) => c.status === 'AKTIF');

  return { contracts, activeContract, isLoading, error, createContract, updateContract, setStatus, savePanel };
};

export const useContract = (id: string | null | undefined) =>
  useQuery<Contract>({
    queryKey: contractKeys.one(id ?? ''),
    queryFn: () => apiService.getContract(id!),
    enabled: !!id,
  });

export const useContractCompanies = (id: string | null | undefined) =>
  useQuery<ContractCompany[]>({
    queryKey: contractKeys.companies(id ?? ''),
    queryFn: () => apiService.getContractCompanies(id!),
    enabled: !!id,
  });
