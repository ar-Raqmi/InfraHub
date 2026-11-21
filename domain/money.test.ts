import { describe, expect, it } from 'vitest';
import { calculateLADDailyRate } from '../services/finance';
import { ProjectStatus } from '../types';
import { hargaAkhir, kosSebenar, ladAmount, ladDailyRate, locAmount, pelarasanExtra } from './money';
import { DEFAULT_LAD_POLICY, DEFAULT_LOC_POLICY } from './policy';

// Expected values were produced by running verbatim copies of today's expressions
// (ProjectDetail.tsx LAD/LoC/kos sebenar effects, ProjectsList.tsx getHargaAkhir) on these inputs.
const pelarasan = (...amounts: unknown[]) => [{ id: 'g', title: 'g', items: amounts.map((amount, i) => ({ id: `i${i}`, amount })) }] as any;

describe('ladAmount (ProjectDetail LAD effect)', () => {
  const cases: [any, { days: number; amount: number }][] = [
    [{ tarikhTamatKontrak: '2026-03-01', tarikhSiapSebenar: '2026-03-11', kosProjek: 15000 }, { days: 10, amount: 200 }],
    [{ tarikhTamatKontrak: '2026-03-01', tarikhSiapSebenar: '2026-03-11', kosProjek: 48765.43 }, { days: 10, amount: 85.5 }],
    [{ tarikhTamatKontrak: '2026-03-01', tarikhSiapSebenar: '2026-02-20', kosProjek: 48765.43 }, { days: 0, amount: 0 }],
    [{ tarikhTamatKontrak: '2026-03-01', kosProjek: 48765.43 }, { days: 0, amount: 0 }],
    [{ tarikhTamatKontrak: '2026-01-31', tarikhSiapSebenar: '2026-03-02', kosProjek: 20000 }, { days: 30, amount: 105.3 }],
    [{ tarikhTamatKontrak: '2026-01-31', tarikhSiapSebenar: '2026-04-02', kosProjek: 199999.99 }, { days: 61, amount: 2139.27 }],
  ];
  it.each(cases)('%j', (input, expected) => {
    expect(ladAmount(input, DEFAULT_LAD_POLICY)).toEqual(expected);
  });

  it('daily rate equals services/finance.ts calculateLADDailyRate for many sums', () => {
    for (let sum = 0; sum < 250000; sum += 137.37) {
      expect(ladDailyRate(sum, DEFAULT_LAD_POLICY)).toBe(calculateLADDailyRate(sum));
    }
  });

  it('takes the policy from parameters', () => {
    const policy = { ...DEFAULT_LAD_POLICY, smallProjectDailyRate: 30 };
    expect(ladAmount({ tarikhTamatKontrak: '2026-03-01', tarikhSiapSebenar: '2026-03-03', kosProjek: 100 }, policy)).toEqual({ days: 2, amount: 60 });
  });
});

describe('locAmount (ProjectDetail LoC effect)', () => {
  const cases: [any, { days: number; amount: number }][] = [
    [{ tarikhSiapSebenar: '2026-03-01', tarikhTuntutanBayaran: '2026-03-25' }, { days: 10, amount: 1000 }],
    [{ tarikhSiapSebenar: '2026-03-01', tarikhTuntutanBayaran: '2026-03-10' }, { days: 0, amount: 0 }],
    [{ tarikhSiapSebenar: '2026-03-01', tarikhTuntutanBayaran: '2026-03-25', isLocDeductionEnabled: false }, { days: 0, amount: 0 }],
    [{ tarikhSiapSebenar: '2026-03-01' }, { days: 0, amount: 0 }],
  ];
  it.each(cases)('%j', (input, expected) => {
    expect(locAmount(input, DEFAULT_LOC_POLICY)).toEqual(expected);
  });
});

describe('kosSebenar and pelarasanExtra (ProjectDetail capped total effect)', () => {
  const cases: [any, number, number][] = [
    [{ kosProjek: 10000, bqDataPelarasan: pelarasan(4000.1, 5000.2), ladAmount: 100.05, locAmount: 200, wangTahanan: 0 }, 8700.25, 0],
    [{ kosProjek: 10000, bqDataPelarasan: pelarasan(6000.333, 5000.2) }, 10000, 1000.53],
    [{ kosProjek: 10000 }, 10000, 0],
    [{ kosProjek: 10000, bqDataPelarasan: [] }, 10000, 0],
    [{ kosProjek: 500, bqDataPelarasan: pelarasan(100), ladAmount: 300, locAmount: 400 }, 0, 0],
    [{ kosProjek: '12345.675', bqDataPelarasan: pelarasan('0.1', '0.2'), wangTahanan: '0.3' }, 0, 0],
  ];
  it.each(cases)('%j', (input, expectedKos, expectedExtra) => {
    expect(kosSebenar(input)).toBe(expectedKos);
    expect(pelarasanExtra(input)).toBe(expectedExtra);
  });
});

describe('hargaAkhir (ProjectsList getHargaAkhir)', () => {
  const cases: [any, number][] = [
    [{ status: ProjectStatus.FASA_DRAF, kosProjek: 9000, kosSebenar: 1 }, 9000],
    [{ status: ProjectStatus.DALAM_PROSES }, 0],
    [{ status: ProjectStatus.SIAP, kosProjek: 9000, kosSebenar: 8500 }, 8500],
    [{ status: ProjectStatus.SIAP, kosProjek: 9000, kosSebenar: null, bqDataPelarasan: pelarasan(8000, 500), ladAmount: 100, wangTahanan: 50 }, 8350],
    [{ status: ProjectStatus.TUNTUTAN_BAYARAN, kosProjek: 9000, bqDataPelarasan: pelarasan(0) }, 9000],
    [{ status: ProjectStatus.SIAP, kosProjek: 9000, kosSebenar: 0 }, 0],
  ];
  it.each(cases)('%j', (input, expected) => {
    expect(hargaAkhir(input)).toBe(expected);
  });
});
