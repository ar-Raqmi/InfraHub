// Money rules, extracted unchanged from ProjectDetail.tsx (LAD, LoC, capped kos sebenar effects),
// ProjectsList.tsx (getHargaAkhir) and services/finance.ts. Rounding quirks are kept on purpose:
// stored values in D1 were produced by exactly these expressions.
import { ProjectStatus, type BQGroup, type Project } from '../types';
import type { LadPolicy, LocPolicy } from './policy';

const MS_PER_DAY = 1000 * 3600 * 24;

export interface DayAmount {
  days: number;
  amount: number;
}

const dayDiff = (fromIso: string, toIso: string): number =>
  Math.ceil((new Date(toIso).getTime() - new Date(fromIso).getTime()) / MS_PER_DAY);

export function ladDailyRate(contractSum: number, policy: LadPolicy): number {
  const sum = contractSum || 0;
  if (sum < policy.smallProjectThreshold) return policy.smallProjectDailyRate;
  return Math.round(((sum * (policy.annualRatePct / 100)) / 365 + Number.EPSILON) * 100) / 100;
}

type LadInput = Pick<Project, 'tarikhTamatKontrak' | 'tarikhSiapSebenar' | 'kosProjek'>;

export function ladAmount(p: LadInput, policy: LadPolicy): DayAmount {
  if (!p.tarikhTamatKontrak || !p.tarikhSiapSebenar) return { days: 0, amount: 0 };
  const diff = dayDiff(p.tarikhTamatKontrak, p.tarikhSiapSebenar);
  const days = diff > 0 ? diff : 0;
  const daily = ladDailyRate(p.kosProjek || 0, policy);
  return { days, amount: parseFloat((daily * days).toFixed(2)) };
}

type LocInput = Pick<Project, 'tarikhSiapSebenar' | 'tarikhTuntutanBayaran' | 'isLocDeductionEnabled'>;

export function locAmount(p: LocInput, policy: LocPolicy): DayAmount {
  if (p.isLocDeductionEnabled === false || !p.tarikhSiapSebenar || !p.tarikhTuntutanBayaran) return { days: 0, amount: 0 };
  const days = Math.max(0, dayDiff(p.tarikhSiapSebenar, p.tarikhTuntutanBayaran) - policy.graceDays);
  return { days, amount: days * policy.dailyRate };
}

export const sumBqAmounts = (groups: BQGroup[] | undefined): number | undefined =>
  groups?.reduce((acc, g) => acc + g.items.reduce((s, item) => s + (Number(item.amount) || 0), 0), 0);

type SettlementInput = Pick<Project, 'bqDataPelarasan' | 'kosProjek' | 'ladAmount' | 'locAmount' | 'wangTahanan'>;

// With no pelarasan at all the contract price stands in for the adjusted sum (ProjectDetail behaviour).
function adjustedSum(p: SettlementInput): number {
  const sum = sumBqAmounts(p.bqDataPelarasan) || 0;
  const hasPelarasan = !!p.bqDataPelarasan && p.bqDataPelarasan.length > 0;
  return sum === 0 && !hasPelarasan ? Number(p.kosProjek) || 0 : sum;
}

export function kosSebenar(p: SettlementInput): number {
  const contractPrice = Number(p.kosProjek) || 0;
  const capped = Math.min(adjustedSum(p), contractPrice);
  const total = capped - (Number(p.ladAmount) || 0) - (Number(p.locAmount) || 0) - (Number(p.wangTahanan) || 0);
  return Math.max(0, parseFloat(total.toFixed(2)));
}

export function pelarasanExtra(p: SettlementInput): number {
  const extra = Math.max(0, adjustedSum(p) - (Number(p.kosProjek) || 0));
  return parseFloat(extra.toFixed(2));
}

type HargaInput = Pick<Project, 'status' | 'kosProjek' | 'kosSebenar' | 'bqDataPelarasan' | 'ladAmount' | 'wangTahanan'>;

// ProjectsList.getHargaAkhir: the fallback ignores LoC, exactly as today.
export function hargaAkhir(p: HargaInput): number {
  const isPostPelarasan = [ProjectStatus.TUNTUTAN_BAYARAN, ProjectStatus.SIAP].includes(p.status);
  if (!isPostPelarasan) return p.kosProjek ?? 0;
  if (p.kosSebenar !== undefined && p.kosSebenar !== null) return p.kosSebenar;
  const pelarasanSum = p.bqDataPelarasan?.reduce(
    (acc, g) => acc + g.items.reduce((s, item) => s + (item.amount || 0), 0), 0) || (p.kosProjek ?? 0);
  return Math.max(0, pelarasanSum - (p.ladAmount || 0) - (p.wangTahanan || 0));
}
