import { useQuery } from '@tanstack/react-query';
import { apiService } from '../services/apiService';
import type { ChangeLogEntry } from '../types';

/** The git-like history: who changed what, when, with the diff. Filter by entity (contract, rate_book, project...). */
export const useChangeLog = (filter: { entity?: ChangeLogEntry['entity']; entityId?: string | null; limit?: number } = {}) =>
  useQuery<ChangeLogEntry[]>({
    queryKey: ['changelog', filter.entity ?? 'all', filter.entityId ?? 'all', filter.limit ?? 50],
    queryFn: () => apiService.getChangeLog({ entity: filter.entity, entityId: filter.entityId ?? undefined, limit: filter.limit }),
  });
