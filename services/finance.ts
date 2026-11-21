// LAD / LoC money helpers for the documents. The rules themselves live in domain/money.ts; the values are
// dated policies (Tetapan Organisasi -> Peraturan), so callers pass the policy in force on the project's date.
import { ladDailyRate } from '../domain/money';
import { DEFAULT_LAD_POLICY, type LadPolicy } from '../domain/policy';
import type { Project } from '../types';

/** LAD daily rate (RM/day, 2 dp). Without a policy it uses the values that were hard-coded before v2. */
export function calculateLADDailyRate(contractSum: number, policy: LadPolicy = DEFAULT_LAD_POLICY): number {
  return Math.round((ladDailyRate(contractSum, policy) + Number.EPSILON) * 100) / 100;
}

// Which date decides the rule lives in domain/policy so the form and the documents can never disagree.
export { ladPolicyDate, locPolicyDate } from '../domain/policy';

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

