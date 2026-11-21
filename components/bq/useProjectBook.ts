// The rate book a project's BQ is priced from: its own contract's current TERBIT book, never the global Pustaka.
// A project saved before v2 (no contractId yet) and a new, unsaved project read the AKTIF contract, which is the
// contract the API binds them to. Only an install with no contracts at all falls back to the legacy library.
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useContracts } from '../../hooks/useContracts';
import { useRateBook } from '../../hooks/useRateBook';
import { indexBook } from '../../domain/rateBook/rows';
import { apiService } from '../../services/apiService';
import type { Contract, PresetGroup, Project } from '../../types';

export interface ProjectBook {
  contract: Contract | undefined;
  /** Version number of the book being read (the contract's current TERBIT version). */
  versionNo: number | null;
  groups: PresetGroup[];
  index: ReturnType<typeof indexBook>;
  isLoading: boolean;
}

export function useProjectBook(project: Partial<Project>): ProjectBook {
  const { contracts, activeContract, isLoading: contractsLoading } = useContracts();
  const contractId = project.contractId || activeContract?.id || null;
  const contract = contracts.find((c) => c.id === contractId);
  const book = useRateBook(contractId);
  const legacy = useQuery<PresetGroup[]>({
    queryKey: ['library-groups-legacy'],
    queryFn: () => apiService.getLibraryGroups(),
    enabled: !contractsLoading && !contractId,
  });
  const groups = contractId ? book.groups : legacy.data ?? [];
  const index = useMemo(() => (contractId ? book.index : indexBook(groups)), [contractId, book.index, groups]);
  return {
    contract,
    versionNo: contract?.stats?.currentVersion ?? null,
    groups,
    index,
    isLoading: contractsLoading || (contractId ? book.isLoading : legacy.isLoading),
  };
}

/** "Jadual Kadar Harga MPS/SH/302/25 (versi 3)" — the one line that names where a BQ's rates come from. */
export const rateSourceLabel = (contract: Pick<Contract, 'code'> | undefined, versionNo: number | null): string =>
  contract ? `Jadual Kadar Harga ${contract.code}${versionNo ? ` (versi ${versionNo})` : ''}` : 'Pustaka BQ';
