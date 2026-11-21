import React from 'react';
import { useQueries } from '@tanstack/react-query';
import { AlertTriangle } from 'lucide-react';
import { ContractCompany, formatCurrency } from '../../types';
import { apiService } from '../../services/apiService';
import { contractKeys } from '../../hooks/useContracts';
import { ContractChip } from '../ui';
import type { CapLine } from './reportScope';

/** Per-company cap overrides (`contract_companies.cap`) for the given contracts, keyed contract -> company. */
export function useCapOverrides(contractIds: string[]): Map<string, Map<string, number | null>> {
  const results = useQueries({
    queries: contractIds.map(id => ({
      queryKey: contractKeys.companies(id),
      queryFn: () => apiService.getContractCompanies(id),
    })),
  });
  const map = new Map<string, Map<string, number | null>>();
  results.forEach((r, i) => {
    const rows = (r.data ?? []) as ContractCompany[];
    map.set(contractIds[i], new Map(rows.map(c => [c.name, c.cap])));
  });
  return map;
}

/** Usage of each contract's company cap. Over the cap is a warning only; nothing is blocked. */
const CapUsage: React.FC<{ lines: CapLine[] }> = ({ lines }) => {
  if (lines.length === 0) return null;
  return (
    <ul className="flex flex-col gap-2" data-testid="cap-usage">
      {lines.map(l => {
        const pct = Math.min(100, (l.used / l.cap) * 100);
        return (
          <li key={l.contract.id} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 min-w-0">
            <ContractChip code={l.contract.code} status={l.contract.status} />
            <span className="w-24 h-1.5 rounded-full bg-paper-deep overflow-hidden shrink-0" aria-hidden>
              <span className={`block h-full rounded-full ${l.over ? 'bg-amber' : 'bg-kontrak'}`} style={{ width: `${pct}%` }} />
            </span>
            <span className={`text-[13px] ih-num ${l.over ? 'font-bold text-amber' : 'text-muted'}`}>
              {l.over && <AlertTriangle className="w-3.5 h-3.5 inline -mt-0.5 mr-1" aria-hidden />}
              {formatCurrency(l.used)} / {formatCurrency(l.cap)} had syarikat{l.over ? ' · melebihi had' : ''}
            </span>
          </li>
        );
      })}
    </ul>
  );
};

export default CapUsage;
