// Which projects must be re-priced. One definition for the Kontrak close sheet, the project banner, the dashboard
// worklist, the projects list and the API stats, so their counts can never disagree.
import { ProjectStatus } from '../types';
import type { ContractStatus } from '../types';

/** Not yet appointed: the BQ can still move to another sebutharga's rates. */
export const REPRICEABLE_STATUSES: readonly string[] = [ProjectStatus.FASA_DRAF, ProjectStatus.MENUNGGU_LANTIKAN];

export interface RepricingInput {
  status?: string | null;
  noInden?: string | null;
  contractId?: string | null;
}

/** The project could still be re-priced: not appointed yet and no inden (which locks the contract). */
export const isRepriceable = (p: RepricingInput): boolean =>
  REPRICEABLE_STATUSES.includes(p.status ?? '') && !(p.noInden ?? '').trim();

/**
 * Why a re-priceable project cannot stay on its sebutharga ("Perlu harga semula"), or null when it can.
 * `statusOf` returns the bound contract's status, or undefined when no such contract exists.
 */
export function repriceReason(p: RepricingInput, statusOf: (contractId: string) => ContractStatus | undefined): string | null {
  if (!isRepriceable(p)) return null;
  if (!p.contractId) return 'Tiada sebutharga';
  const status = statusOf(p.contractId);
  if (!status) return 'Sebutharga tidak dijumpai';
  if (status === 'DITUTUP') return 'Sebutharga sudah ditutup';
  if (status === 'DRAF') return 'Sebutharga masih draf';
  return null;
}

/** The project page banner: its contract was closed while it was still re-priceable. */
export const needsRepricing = (p: RepricingInput, contractStatus: ContractStatus | null | undefined): boolean =>
  contractStatus === 'DITUTUP' && isRepriceable(p);
