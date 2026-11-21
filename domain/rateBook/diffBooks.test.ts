import { describe, expect, it } from 'vitest';
import type { PresetGroup } from '../../types';
import { diffBooks } from './diffBooks';

const a: PresetGroup[] = [
  { id: 'G1', title: 'A', category: 'X', items: [
    { id: 'I1', description: 'Item satu', unit: 'm', rate: 10 },
    { id: 'I2', description: 'Item dua', variants: [
      { id: 'V1', label: '300mm', unit: 'm', rate: 5 },
      { id: 'V2', label: '450mm', unit: 'm', rate: 6 },
    ] },
    { id: 'I3', description: 'Item tiga', unit: 'nos', rate: 1 },
  ] },
];

const b: PresetGroup[] = [
  { id: 'G1', title: 'A', category: 'X', items: [
    { id: 'I1', description: 'Item satu', unit: 'm', rate: 12 },
    { id: 'I2', description: 'Item dua', variants: [
      { id: 'V1', label: '300mm', unit: 'm', rate: 5 },
      { id: 'V2', label: '450 mm (baru)', unit: 'm', rate: 6 },
    ] },
    { id: 'I4', description: 'Item empat', unit: 'm2', rate: 3 },
  ] },
];

describe('diffBooks', () => {
  const diff = diffBooks(a, b);

  it('classifies every row', () => {
    expect(diff.stats).toEqual({ unchanged: 1, rateChanged: 1, wordingChanged: 1, added: 1, removed: 1 });
  });

  it('returns before/after rows', () => {
    expect(diff.rateChanged[0]).toMatchObject({ key: 'I1/', before: { rate: 10 }, after: { rate: 12 } });
    expect(diff.wordingChanged[0]).toMatchObject({ key: 'I2/V2', before: { label: '450mm' }, after: { label: '450 mm (baru)' } });
    expect(diff.added[0].after).toMatchObject({ itemId: 'I4' });
    expect(diff.removed[0].before).toMatchObject({ itemId: 'I3' });
  });

  it('is empty for identical books', () => {
    expect(diffBooks(a, a).stats).toEqual({ unchanged: 4, rateChanged: 0, wordingChanged: 0, added: 0, removed: 0 });
  });

  it('follows a variant that kept its id but moved to another item', () => {
    const moved: PresetGroup[] = [{ ...a[0], items: [a[0].items[0], { ...a[0].items[1], variants: [a[0].items[1].variants![0]] }, a[0].items[2], { id: 'I9', description: 'Item dua', variants: [a[0].items[1].variants![1]] }] }];
    expect(diffBooks(a, moved).stats).toMatchObject({ added: 0, removed: 0 });
  });
});
