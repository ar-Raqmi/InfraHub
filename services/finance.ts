// LAD / LoC money helpers for the documents. The rules themselves live in domain/money.ts; the values are
// dated policies (Tetapan Organisasi -> Peraturan), so callers pass the policy in force on the project's date.
import { ladDailyRate } from '../domain/money';
import { DEFAULT_LAD_POLICY, type LadPolicy } from '../domain/policy';
import type { Project } from '../types';

const today = (): string => new Date().toISOString().slice(0, 10);

/** LAD daily rate (RM/day, 2 dp). Without a policy it uses the values that were hard-coded before v2. */
export function calculateLADDailyRate(contractSum: number, policy: LadPolicy = DEFAULT_LAD_POLICY): number {
  return Math.round((ladDailyRate(contractSum, policy) + Number.EPSILON) * 100) / 100;
}

// The LAD rate is fixed by the contract (Lampiran kepada Syarat-Syarat Kontrak), so it is read on the
// contract start date; projects without one fall back to the next date the officer filled in.
export const ladPolicyDate = (p: Pick<Project, 'tarikhMulaKontrak' | 'tarikhSerahTapak' | 'tarikhTamatKontrak'>): string =>
  p.tarikhMulaKontrak || p.tarikhSerahTapak || p.tarikhTamatKontrak || today();

/** Defects liability period after practical completion: starts the next day, lasts `months`. */
export function dlpPeriod(tarikhSiap: string, months: number): { start: string; end: string } {
  if (!tarikhSiap) return { start: '', end: '' };
  const start = new Date(tarikhSiap);
  start.setDate(start.getDate() + 1);
  const startIso = start.toISOString().split('T')[0];
  const end = new Date(startIso);
  end.setMonth(end.getMonth() + months);
  return { start: startIso, end: end.toISOString().split('T')[0] };
}

// LoC is a claim-handling penalty: the rule in force when the work was completed applies.
export const locPolicyDate = (p: Pick<Project, 'tarikhSiapSebenar' | 'tarikhTuntutanBayaran'>): string =>
  p.tarikhSiapSebenar || p.tarikhTuntutanBayaran || today();
