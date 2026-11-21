import { Contract, Project, VoteDefinition, formatDate } from '../../types';

/**
 * The explicit "skop laporan" (report scope): which sebutharga(s) and which period. Every total on the
 * Projek page (vote summary, company totals, PDF exports) is computed from this one object and labelled
 * with it, so a balance can never silently change because of an on-screen search or status filter.
 */
export type PeriodFilter =
  | { kind: 'YEAR' }
  | { kind: 'ALL' }
  | { kind: 'RANGE'; from: string | null; to: string | null; preset?: RangePresetId };

export interface ReportScope {
  /** Empty = every sebutharga. */
  contractIds: string[];
  period: PeriodFilter;
}

export const DEFAULT_SCOPE: ReportScope = { contractIds: [], period: { kind: 'YEAR' } };

export const NO_CONTRACT = '__tiada__';

export type RangePresetId = 'H1' | 'H2' | 'MONTH' | 'LAST90';

export const RANGE_PRESETS: { id: RangePresetId; label: string }[] = [
  { id: 'H1', label: 'Jan – Jun' },
  { id: 'H2', label: 'Jul – Dis' },
  { id: 'MONTH', label: 'Bulan ini' },
  { id: 'LAST90', label: '90 hari lepas' },
];

const iso = (d: Date) => d.toISOString().slice(0, 10);

/** Preset ranges are anchored on the selected financial year, except the rolling ones. */
export function presetRange(id: RangePresetId, year: number, today: string): { from: string; to: string } {
  if (id === 'H1') return { from: `${year}-01-01`, to: `${year}-06-30` };
  if (id === 'H2') return { from: `${year}-07-01`, to: `${year}-12-31` };
  const t = new Date(`${today}T00:00:00Z`);
  if (id === 'MONTH') {
    const end = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth() + 1, 0));
    return { from: `${today.slice(0, 7)}-01`, to: iso(end) };
  }
  return { from: iso(new Date(t.getTime() - 90 * 86400000)), to: today };
}

const openedOn = (p: Project) => (p.tarikhBuka || '').slice(0, 10);

export function inPeriod(p: Project, period: PeriodFilter, year: number): boolean {
  if (period.kind === 'ALL') return true;
  const d = openedOn(p);
  if (period.kind === 'YEAR') return !!d && Number(d.slice(0, 4)) === year;
  if (!d) return !period.from && !period.to;
  return (!period.from || d >= period.from) && (!period.to || d <= period.to);
}

export const inContracts = (p: Project, ids: string[]) =>
  ids.length === 0 || ids.includes(p.contractId || NO_CONTRACT);

export const inScope = (p: Project, scope: ReportScope, year: number) =>
  inContracts(p, scope.contractIds) && inPeriod(p, scope.period, year);

export function periodLabel(period: PeriodFilter, year: number): string {
  if (period.kind === 'YEAR') return `Tahun ${year}`;
  if (period.kind === 'ALL') return 'Semua tahun';
  if (!period.from && !period.to) return 'Julat tarikh (belum dipilih)';
  return `Tarikh buka ${period.from ? formatDate(period.from) : '…'} – ${period.to ? formatDate(period.to) : '…'}`;
}

export function contractsLabel(ids: string[], contractsById: Map<string, Contract>): string {
  if (ids.length === 0) return 'Semua sebutharga';
  const codes = ids.map(id => (id === NO_CONTRACT ? 'Tiada sebutharga' : contractsById.get(id)?.code ?? id));
  return `Sebutharga ${codes.join(', ')}`;
}

/** One line that says exactly which filter produced a number. */
export const scopeLabel = (scope: ReportScope, year: number, contractsById: Map<string, Contract>) =>
  `${contractsLabel(scope.contractIds, contractsById)} · ${periodLabel(scope.period, year)}`;

/**
 * Votes carry a yearly allocation, so a balance only makes sense when the scope sits inside one
 * financial year. Returns that year, or null when the scope spans years (allocation then not shown).
 */
export function allocationYear(period: PeriodFilter, year: number): number | null {
  if (period.kind === 'YEAR') return year;
  if (period.kind === 'ALL') return null;
  const y1 = period.from?.slice(0, 4);
  const y2 = period.to?.slice(0, 4);
  return y1 && y2 && y1 === y2 ? Number(y1) : null;
}

export type CostMode = 'contract' | 'actual' | 'both';

export interface VoteLine {
  allocated: number | null;
  used: number;
  projectCount: number;
}

/** Per-vote usage of the scoped projects; allocation only when the scope has one financial year. */
export function voteSummary(
  projects: Project[], votes: VoteDefinition[] | null, mode: CostMode, hargaAkhir: (p: Project) => number,
): Record<string, VoteLine> {
  const out: Record<string, VoteLine> = {};
  for (const v of votes ?? []) out[v.code] = { allocated: v.allocation, used: 0, projectCount: 0 };
  for (const p of projects) {
    if (!p.noVote) continue;
    out[p.noVote] ??= { allocated: votes ? 0 : null, used: 0, projectCount: 0 };
    out[p.noVote].used += mode === 'contract' ? p.kosProjek || 0 : hargaAkhir(p);
    out[p.noVote].projectCount += 1;
  }
  return out;
}

export interface VoteTotals { allocated: number | null; used: number; balance: number | null; projectCount: number }

export function voteTotals(summary: Record<string, VoteLine>): VoteTotals {
  const lines = Object.values(summary);
  const used = lines.reduce((a, l) => a + l.used, 0);
  const hasAlloc = lines.length > 0 && lines.every(l => l.allocated !== null);
  const allocated = hasAlloc ? lines.reduce((a, l) => a + (l.allocated ?? 0), 0) : null;
  return { allocated, used, balance: allocated === null ? null : allocated - used, projectCount: lines.reduce((a, l) => a + l.projectCount, 0) };
}

export interface CapLine {
  contract: Contract;
  cap: number;
  used: number;
  over: boolean;
}

/**
 * A company's usage of each contract's company cap (warn only). Usage counts every project of the
 * company on that contract, whatever the period, because the cap belongs to the contract, not the year.
 */
export function capUsage(
  company: string, allProjects: Project[], contracts: Contract[], overrides: Map<string, Map<string, number | null>>,
): CapLine[] {
  const lines: CapLine[] = [];
  for (const contract of contracts) {
    const cap = overrides.get(contract.id)?.get(company) ?? contract.companyCap;
    if (!cap) continue;
    const mine = allProjects.filter(p => p.contractId === contract.id && p.namaSyarikat === company);
    if (mine.length === 0) continue;
    const used = mine.reduce((a, p) => a + (p.kosProjek || 0), 0);
    lines.push({ contract, cap, used, over: used > cap });
  }
  return lines;
}
