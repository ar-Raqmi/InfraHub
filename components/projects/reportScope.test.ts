import { describe, expect, it } from 'vitest';
import { Contract, Project, ProjectStatus } from '../../types';
import { NO_CONTRACT, allocationYear, capUsage, inScope, presetRange, scopeLabel, voteSummary, voteTotals } from './reportScope';

const c = (id: string, code: string, cap: number | null = 200000): Contract => ({ id, code, title: code, kind: 'PANEL', status: 'AKTIF', companyCap: cap });
const p = (id: number, over: Partial<Project>): Project => ({ id, status: ProjectStatus.DALAM_PROSES, tarikhBuka: '2026-03-01', kosProjek: 100, ...over } as Project);
const contracts = [c('a', 'SH/A'), c('b', 'SH/B', null)];
const byId = new Map(contracts.map(x => [x.id, x]));
const projects = [
  p(1, { contractId: 'a', noVote: 'V1', namaSyarikat: 'S1', kosProjek: 150000 }),
  p(2, { contractId: 'a', noVote: 'V2', namaSyarikat: 'S1', kosProjek: 60000, tarikhBuka: '2025-12-30' }),
  p(3, { contractId: 'b', noVote: 'V1', namaSyarikat: 'S1', kosProjek: 500 }),
  p(4, { contractId: null, noVote: 'V1', kosProjek: 7, tarikhBuka: '2026-08-01' }),
];

describe('inScope', () => {
  it('combines sebutharga (multi) with Tahun / Semua tahun / Julat', () => {
    const ids = (scope: Parameters<typeof inScope>[1]) => projects.filter(x => inScope(x, scope, 2026)).map(x => x.id);
    expect(ids({ contractIds: [], period: { kind: 'YEAR' } })).toEqual([1, 3, 4]);
    expect(ids({ contractIds: ['a'], period: { kind: 'ALL' } })).toEqual([1, 2]);
    expect(ids({ contractIds: ['a', NO_CONTRACT], period: { kind: 'YEAR' } })).toEqual([1, 4]);
    expect(ids({ contractIds: [], period: { kind: 'RANGE', from: '2025-12-01', to: '2026-03-01' } })).toEqual([1, 2, 3]);
  });
});

describe('scopeLabel / allocationYear / presetRange', () => {
  it('names the filter in words', () => {
    expect(scopeLabel({ contractIds: ['a'], period: { kind: 'YEAR' } }, 2026, byId)).toBe('Sebutharga SH/A · Tahun 2026');
    expect(scopeLabel({ contractIds: [], period: { kind: 'ALL' } }, 2026, byId)).toBe('Semua sebutharga · Semua tahun');
  });
  it('gives an allocation year only when the scope sits in one year', () => {
    expect(allocationYear({ kind: 'YEAR' }, 2026)).toBe(2026);
    expect(allocationYear({ kind: 'ALL' }, 2026)).toBeNull();
    expect(allocationYear({ kind: 'RANGE', from: '2025-07-01', to: '2025-12-31' }, 2026)).toBe(2025);
    expect(allocationYear({ kind: 'RANGE', from: '2025-12-01', to: '2026-01-31' }, 2026)).toBeNull();
  });
  it('anchors presets on the selected year or on today', () => {
    expect(presetRange('H2', 2026, '2026-11-21')).toEqual({ from: '2026-07-01', to: '2026-12-31' });
    expect(presetRange('MONTH', 2026, '2026-02-10')).toEqual({ from: '2026-02-01', to: '2026-02-28' });
    expect(presetRange('LAST90', 2026, '2026-11-21')).toEqual({ from: '2026-08-23', to: '2026-11-21' });
  });
});

describe('voteSummary / voteTotals', () => {
  const votes = [{ code: 'V1', name: 'Vot 1', allocation: 1000000 }];
  it('sums contract value per vote from the scoped list only', () => {
    const s = voteSummary(projects.slice(0, 3), votes, 'contract', () => 0);
    expect(s.V1).toEqual({ allocated: 1000000, used: 150500, projectCount: 2 });
    expect(s.V2).toEqual({ allocated: 0, used: 60000, projectCount: 1 });
    expect(voteTotals(s)).toEqual({ allocated: 1000000, used: 210500, balance: 789500, projectCount: 3 });
  });
  it('has no allocation or balance when the scope spans years', () => {
    const t = voteTotals(voteSummary(projects, null, 'actual', x => x.kosProjek! / 2));
    expect(t.allocated).toBeNull();
    expect(t.balance).toBeNull();
    expect(t.used).toBeCloseTo(105253.5);
  });
});

describe('capUsage', () => {
  it('counts every project of the company on the contract, whatever the period, and warns over the cap', () => {
    const lines = capUsage('S1', projects, contracts, new Map());
    expect(lines.map(l => [l.contract.code, l.used, l.cap, l.over])).toEqual([['SH/A', 210000, 200000, true]]);
  });
  it('prefers a per-company override and skips contracts without a cap', () => {
    const lines = capUsage('S1', projects, contracts, new Map([['a', new Map([['S1', 250000]])], ['b', new Map([['S1', 1000]])]]));
    expect(lines.map(l => [l.contract.code, l.cap, l.over])).toEqual([['SH/A', 250000, false], ['SH/B', 1000, false]]);
  });
});
