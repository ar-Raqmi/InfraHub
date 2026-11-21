import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { indexBook, type BookIndex } from '../domain/rateBook/rows';
import { rowStatus } from '../domain/rateBook/rowStatus';
import type { ParsedBook } from '../domain/rateBook/types';
import { apiService, type MatchDecisionBody, type VersionDetail } from '../services/apiService';
import type { BQItem, BQRowStatus, PresetGroup, RateBookVersion } from '../types';
import { contractKeys } from './useContracts';

export const rateBookKeys = {
  book: (contractId: string, version?: string | number) => ['rate-book', contractId, version ?? 'current'] as const,
  versions: (contractId: string) => ['rate-book', contractId, 'versions'] as const,
  version: (versionId: string) => ['rate-book', 'version', versionId] as const,
  diff: (from: string, to: string) => ['rate-book', 'diff', from, to] as const,
};

/**
 * A contract's rate book (default: its current TERBIT version) and a status function for BQ row indicators.
 * `statusOf(row)` is OK | KADAR_BERUBAH | PERKATAAN_BERUBAH | TIADA.
 */
export const useRateBook = (contractId: string | null | undefined, version?: string | number) => {
  const { data: groups = [], isLoading, error } = useQuery<PresetGroup[]>({
    queryKey: rateBookKeys.book(contractId ?? '', version),
    queryFn: () => apiService.getContractBook(contractId!, version),
    enabled: !!contractId,
  });
  const index: BookIndex = useMemo(() => indexBook(groups), [groups]);
  const statusOf = (row: BQItem): BQRowStatus => rowStatus(row, index);
  return { groups, index, statusOf, isLoading, error };
};

export const useRateBookVersions = (contractId: string | null | undefined) =>
  useQuery<RateBookVersion[]>({
    queryKey: rateBookKeys.versions(contractId ?? ''),
    queryFn: () => apiService.getContractVersions(contractId!),
    enabled: !!contractId,
  });

export const useRateBookDiff = (from: string | null | undefined, to: string | null | undefined) =>
  useQuery({
    queryKey: rateBookKeys.diff(from ?? '', to ?? ''),
    queryFn: () => apiService.diffRateBooks(from!, to!),
    enabled: !!from && !!to,
  });

/** One import under review: its rows, match suggestions and the decide / publish steps. */
export const useRateBookImport = (contractId: string, versionId: string | null) => {
  const queryClient = useQueryClient();
  const refreshContract = () => {
    queryClient.invalidateQueries({ queryKey: ['rate-book', contractId] });
    queryClient.invalidateQueries({ queryKey: contractKeys.all });
  };

  const detail = useQuery<VersionDetail>({
    queryKey: rateBookKeys.version(versionId ?? ''),
    queryFn: () => apiService.getRateBookVersion(versionId!),
    enabled: !!versionId,
  });

  const importBook = useMutation({
    mutationFn: (body: { fileName: string; rateColumn: string; book: ParsedBook }) => apiService.importRateBook(contractId, body),
    onSuccess: refreshContract,
  });

  const decide = useMutation({
    mutationFn: (decisions: MatchDecisionBody[]) => apiService.decideMatches(versionId!, decisions),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: rateBookKeys.version(versionId ?? '') }),
  });

  const publish = useMutation({
    mutationFn: (message: string) => apiService.publishRateBook(versionId!, message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rateBookKeys.version(versionId ?? '') });
      refreshContract();
    },
  });

  return { detail, importBook, decide, publish };
};
