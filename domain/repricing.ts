// Which projects must be re-priced when their sebutharga closes. One definition for the Kontrak close sheet, the
// project banner, the dashboard list and the API stats, so the counts can never disagree.
import { ProjectStatus } from '../types';
import type { ContractStatus } from '../types';

/** Not yet appointed: the BQ can still move to another sebutharga's rates. */
export const REPRICEABLE_STATUSES: readonly string[] = [ProjectStatus.FASA_DRAF, ProjectStatus.MENUNGGU_LANTIKAN];

export interface RepricingInput {
  status?: string | null;
  noInden?: string | null;
}

/** The project could still be re-priced: not appointed yet and no inden (which locks the contract). */
export const isRepriceable = (p: RepricingInput): boolean =>
  REPRICEABLE_STATUSES.includes(p.status ?? '') && !(p.noInden ?? '').trim();

/** The project sits on a closed sebutharga and should move to the active one ("Perlu harga semula"). */
export const needsRepricing = (p: RepricingInput, contractStatus: ContractStatus | null | undefined): boolean =>
  contractStatus === 'DITUTUP' && isRepriceable(p);
