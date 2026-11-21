// The in-form money effects of ProjectDetail (LAD, LoC, kos sebenar, pelarasan extra), fed by dated policy
// rules instead of constants. Each step mirrors the guard conditions of the old inline effect exactly, so a
// saved project recomputes to the same numbers (proved by docs/overhaul/v2/e2e/P2-money-parity.ts).
import { kosSebenar, ladAmount, locAmount, pelarasanExtra } from '../../domain/money';
import { sameMoney } from '../../domain/rateBook/rows';
import { ladPolicyAt, locPolicyAt, type LadPolicy, type LocPolicy, type PolicyRule } from '../../domain/policy';
import type { Project, PolicyRuleRecord } from '../../types';

type Form = Partial<Project>;

export const toPolicyRules = (records: PolicyRuleRecord[]): PolicyRule[] =>
  records.map((r) => ({ key: r.key, effective_from: r.effectiveFrom, value: r.value, note: r.note }));

const today = (): string => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kuala_Lumpur' });

// A project older than the first recorded rule is priced by that first rule, not left without a policy.
function clampToRules(rules: PolicyRule[], isoDate: string): string {
  const earliest = rules.reduce<string | null>((min, r) => (!min || r.effective_from < min ? r.effective_from : min), null);
  const day = (isoDate || today()).slice(0, 10);
  return earliest && day < earliest ? earliest : day;
}

/** LAD terms are fixed when the contract starts; LoC is a penalty on the completion that triggers it. */
export const ladPolicyDate = (p: Form): string => p.tarikhMulaKontrak || p.tarikhLantikan || p.tarikhBuka || today();
export const locPolicyDate = (p: Form): string => p.tarikhSiapSebenar || today();

export const ladPolicyFor = (rules: PolicyRule[], p: Form): LadPolicy => ladPolicyAt(rules, clampToRules(rules, ladPolicyDate(p)));
export const locPolicyFor = (rules: PolicyRule[], p: Form): LocPolicy => locPolicyAt(rules, clampToRules(rules, locPolicyDate(p)));

/** Patch the LAD effect would write, or null when nothing changes. */
export function ladPatch(p: Form, policy: LadPolicy): Form | null {
  if (p.tarikhTamatKontrak && p.tarikhSiapSebenar) {
    const { days, amount } = ladAmount(p as Project, policy);
    return p.ladDays !== days || p.ladAmount !== amount ? { ladDays: days, ladAmount: amount } : null;
  }
  return p.ladDays !== 0 && p.ladDays !== undefined ? { ladDays: 0, ladAmount: 0 } : null;
}

/** Patch the LoC effect would write, or null when nothing changes. */
export function locPatch(p: Form, policy: LocPolicy): Form | null {
  if (p.isLocDeductionEnabled === false) {
    return p.locDays !== 0 || p.locAmount !== 0 ? { locDays: 0, locAmount: 0 } : null;
  }
  if (p.tarikhSiapSebenar && p.tarikhTuntutanBayaran) {
    const { days, amount } = locAmount(p as Project, policy);
    return p.locDays !== days || p.locAmount !== amount ? { locDays: days, locAmount: amount } : null;
  }
  return p.locDays !== 0 && p.locDays !== undefined ? { locDays: 0, locAmount: 0 } : null;
}

/**
 * Patch the kos sebenar / pelarasan extra effect would write, or null when nothing changes.
 * Compared to the cent: the old effect compared against the UNROUNDED sum, so saved values with float noise
 * (31543.020000000004) were left alone; a strict compare against the rounded result would rewrite them.
 */
export function settlementPatch(p: Form): Form | null {
  const next = { kosSebenar: kosSebenar(p as Project), bqPelarasanExtra: pelarasanExtra(p as Project) };
  const same = sameMoney(Number(p.kosSebenar), next.kosSebenar) && sameMoney(Number(p.bqPelarasanExtra), next.bqPelarasanExtra);
  return same ? null : next;
}
