import { describe, expect, it } from 'vitest';
import type { BQGroup, PresetGroup } from '../types';
import { applyReprice, planReprice } from './reprice';

const toBook: PresetGroup[] = [
  { id: 'G1', title: 'A', category: 'X', items: [
    { id: 'I1', description: 'Item satu', unit: 'm', rate: 12.5 },
    { id: 'I2', description: 'Item dua', variants: [{ id: 'V1', label: '300mm (baru)', unit: 'm', rate: 5 }] },
  ] },
  { id: 'G7', title: 'B', category: 'X', items: [{ id: 'I7', description: 'Item tujuh', unit: 'nos', rate: 70 }] },
];

const bq: BQGroup[] = [
  { id: 'b1', title: 'BIL 1', items: [
    { id: 'h', type: 'HEADER', description: 'KERJA', unit: '', rate: 0, qty: 0, amount: 0 },
    { id: 'r1', type: 'ITEM', description: 'Item satu', unit: 'm', rate: 10, qty: 3.5, amount: 35, sourceGroupId: 'G1', sourceItemId: 'I1' },
    { id: 'r2', type: 'ITEM', description: '300mm', unit: 'm', rate: 5, qty: 2, amount: 10, sourceGroupId: 'G1', sourceItemId: 'I2', sourceVariantId: 'V1' },
    { id: 'r3', type: 'ITEM', description: 'Item hilang', unit: 'm', rate: 9, qty: 1, amount: 9, sourceGroupId: 'G1', sourceItemId: 'I3' },
    { id: 'r4', type: 'ITEM', description: 'Item lama', unit: 'nos', rate: 60, qty: 1.333, amount: 79.98, sourceGroupId: 'OLD', sourceItemId: 'OLD-1' },
  ] },
];

describe('planReprice', () => {
  const plan = planReprice(bq, toBook, [{ from: { itemId: 'OLD-1' }, to: { groupId: 'G7', itemId: 'I7' } }]);

  it('lists every ITEM row with old vs new and keeps quantities', () => {
    expect(plan.rows.map((r) => [r.bqItemId, r.status])).toEqual([['r1', 'CHANGED'], ['r2', 'CHANGED'], ['r3', 'MISSING'], ['r4', 'CHANGED']]);
    expect(plan.rows[0]).toMatchObject({ from: { rate: 10, amount: 35 }, to: { rate: 12.5, amount: 43.75 }, qty: 3.5 });
    expect(plan.rows[1].to).toMatchObject({ description: '300mm (baru)', rate: 5, amount: 10 });
    expect(plan.rows[3].to).toMatchObject({ sourceGroupId: 'G7', sourceItemId: 'I7', rate: 70, amount: 93.31 });
  });

  it('totals before and after and counts missing rows', () => {
    expect(plan.totals).toEqual({ before: 133.98, after: 156.06, missing: 1, changed: 3, same: 0 });
  });

  it('marks an unchanged row SAME', () => {
    const same = planReprice([{ id: 'b', title: 'b', items: [bq[0].items[2]] }], [{ ...toBook[0], items: [{ id: 'I2', description: 'x', variants: [{ id: 'V1', label: '300mm', unit: 'm', rate: 5 }] }] }]);
    expect(same.rows[0].status).toBe('SAME');
  });
});

describe('applyReprice', () => {
  const plan = planReprice(bq, toBook, [{ from: { itemId: 'OLD-1' }, to: { groupId: 'G7', itemId: 'I7' } }]);
  const out = applyReprice(bq, plan);

  it('swaps description, unit, rate and ids, keeps qty, leaves MISSING rows untouched', () => {
    expect(out[0].items[1]).toMatchObject({ id: 'r1', description: 'Item satu', rate: 12.5, qty: 3.5, amount: 43.75 });
    expect(out[0].items[2]).toMatchObject({ description: '300mm (baru)' });
    expect(out[0].items[3]).toEqual(bq[0].items[3]);
    expect(out[0].items[4]).toMatchObject({ sourceGroupId: 'G7', sourceItemId: 'I7', sourceVariantId: undefined, description: 'Item tujuh', unit: 'nos', amount: 93.31 });
    expect(out[0].items[0]).toEqual(bq[0].items[0]);
  });

  it('does not mutate the input', () => {
    expect(bq[0].items[1].rate).toBe(10);
  });
});
