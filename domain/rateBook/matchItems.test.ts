import { describe, expect, it } from 'vitest';
import type { PresetGroup } from '../../types';
import { matchBooks, stabiliseIds } from './matchItems';

const prev: PresetGroup[] = [
  {
    id: 'G2', title: 'KERJA PENGOREKAN', category: 'Longkang', items: [
      { id: 'G2-1', description: 'Kerja-kerja menggali dan membuang tembok longkang sedia ada tidak melebihi 1500mm ukuran', variants: [
        { id: 'G2-1-v1', label: 'Dengan jentera', unit: 'm3', rate: 18.7 },
        { id: 'G2-1-v2', label: 'Dengan tangan', unit: 'm3', rate: 53.4 },
      ] },
      { id: 'G2-2', description: 'Kerja-kerja menggali dan membuang tembok longkang sedia ada melebihi 1500mm tetapi tidak melebihi 3000mm', variants: [
        { id: 'G2-2-v1', label: 'Dengan jentera', unit: 'm3', rate: 19.3 },
        { id: 'G2-2-v2', label: 'Dengan tangan', unit: 'm3', rate: 88.3 },
      ] },
    ],
  },
  {
    id: 'G3', title: 'LEAN CONCRETE', category: 'Longkang', items: [
      { id: 'G3-1', description: 'Kerja membekal dan memadat konkrit tidak bertetulang (Site Mixed) 1:2:4 75mm tebal untuk tapak asas longkang', unit: 'm2', rate: 27.35 },
    ],
  },
  { id: 'G9', title: 'PAGAR LAMA', category: 'Pagar', items: [{ id: 'G9-1', description: 'Pagar kayu lama', unit: 'm', rate: 10 }] },
];

const next: PresetGroup[] = [
  {
    id: 'N1', title: 'KERJA PENGOREKAN', category: 'Longkang', code: '1', items: [
      // order swapped on purpose: context must pick the right parent for the repeated labels
      { id: 'N1-2', code: '1.2', description: 'Kerja-kerja menggali dan membuang tembok longkang sedia ada melebihi 1500mm tetapi tidak melebihi 3000mm', variants: [
        { id: 'N1-2-a', code: '1.2(a)', label: 'dengan jentera', unit: 'M3', rate: 20 },
        { id: 'N1-2-b', code: '1.2(b)', label: 'dengan tangan', unit: 'M3', rate: 90 },
      ] },
      { id: 'N1-1', code: '1.1', description: 'Kerja-kerja menggali dan membuang tembok longkang sedia ada tidak melebihi 1500mm ukuran', variants: [
        { id: 'N1-1-i', code: '1.1(i)', label: 'Dengan jentera', unit: 'M3', rate: 18.7 },
        { id: 'N1-1-ii', code: '1.1(ii)', label: 'Dengan tangan', unit: 'M3', rate: 53.4 },
      ] },
    ],
  },
  {
    id: 'N2', title: 'LEAN CONCRETE', category: 'Longkang', code: '2', items: [
      { id: 'N2-1', code: '2', description: 'Kerja-kerja membekal dan memadat konkrit tidak bertetulang (Site Mixed) (1:2:4-9mm) 75mm purata tebal lantai untuk tapak asas longkang', unit: 'M2', rate: 28 },
    ],
  },
  { id: 'N3', title: 'SUMP', category: 'Longkang', code: '16', items: [{ id: 'N3-1', code: '16', description: 'Kerja-kerja membina lurang', unit: 'Nos', rate: 462.83 }] },
];

describe('matchBooks', () => {
  const result = matchBooks(next, prev);
  const byRef = Object.fromEntries(result.matches.map((m) => [m.newRef, m]));

  it('matches identical wording EXACT and accepts it, using the parent to separate repeated labels', () => {
    expect(byRef['N1/N1-1/N1-1-i']).toMatchObject({ method: 'EXACT', decision: 'ACCEPT', old: { groupId: 'G2', itemId: 'G2-1', variantId: 'G2-1-v1' } });
    expect(byRef['N1/N1-2/N1-2-a']).toMatchObject({ method: 'EXACT', decision: 'ACCEPT', old: { itemId: 'G2-2', variantId: 'G2-2-v1' } });
    expect(byRef['N1/N1-2/N1-2-b'].old).toMatchObject({ variantId: 'G2-2-v2' });
  });

  it('leaves a reworded line as a PENDING fuzzy suggestion', () => {
    expect(byRef['N2/N2-1']).toMatchObject({ method: 'FUZZY', decision: 'PENDING', old: { itemId: 'G3-1' } });
    expect(byRef['N2/N2-1'].score).toBeGreaterThan(0.5);
    expect(byRef['N2/N2-1'].score).toBeLessThan(1);
  });

  it('marks unmatched new rows NEW and lists removed old rows', () => {
    expect(byRef['N3/N3-1']).toMatchObject({ method: 'NEW', old: null, decision: 'ACCEPT' });
    expect(result.removed.map((r) => r.ref)).toEqual(['G9/G9-1']);
    expect(result.stats).toEqual({ EXACT: 4, CODE: 0, FUZZY: 1, AI: 0, MANUAL: 0, NEW: 1, removed: 1, pending: 1 });
  });

  it('matches on code + unit when both books carry codes', () => {
    const reworded = structuredClone(next);
    reworded[1].items[0].description = 'Konkrit lean tuang disitu, wording rewritten completely';
    const coded = matchBooks(reworded, next);
    const lean = coded.matches.find((m) => m.newRef === 'N2/N2-1')!;
    expect(lean).toMatchObject({ method: 'CODE', old: { itemId: 'N2-1' } });
  });

  it('never maps two new rows to one old row', () => {
    const olds = result.matches.filter((m) => m.old).map((m) => `${m.old!.itemId}/${m.old!.variantId ?? ''}`);
    expect(new Set(olds).size).toBe(olds.length);
  });
});

describe('stabiliseIds', () => {
  it('gives accepted rows their old ids and leaves NEW/PENDING rows alone', () => {
    const { matches } = matchBooks(next, prev);
    const out = stabiliseIds(next, matches);
    const g1 = out.find((g) => g.title === 'KERJA PENGOREKAN')!;
    expect(g1.id).toBe('G2');
    expect(g1.items.map((i) => i.id)).toEqual(['G2-2', 'G2-1']);
    expect(g1.items[1].variants!.map((v) => v.id)).toEqual(['G2-1-v1', 'G2-1-v2']);
    expect(out.find((g) => g.title === 'LEAN CONCRETE')!.items[0].id).toBe('N2-1');
    expect(out.find((g) => g.title === 'SUMP')!.id).toBe('N3');
  });

  it('applies an accepted fuzzy decision', () => {
    const { matches } = matchBooks(next, prev);
    const decided = matches.map((m) => (m.newRef === 'N2/N2-1' ? { ...m, decision: 'ACCEPT' as const } : m));
    const out = stabiliseIds(next, decided);
    expect(out.find((g) => g.title === 'LEAN CONCRETE')!).toMatchObject({ id: 'G3', items: [{ id: 'G3-1', rate: 28 }] });
  });
});
