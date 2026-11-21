import { describe, expect, it } from 'vitest';
import type { BQItem, PresetGroup } from '../../types';
import { indexBook } from './rows';
import { rowStatus } from './rowStatus';

const book: PresetGroup[] = [
  { id: 'G1', title: 'A', category: 'X', items: [
    { id: 'I1', description: 'Item satu', unit: 'm', rate: 10 },
    { id: 'I2', description: 'Item dua', variants: [{ id: 'V1', label: '300mm x 300mm', unit: 'm', rate: 5 }] },
  ] },
];

const row = (over: Partial<BQItem>): BQItem => ({ id: 'r', type: 'ITEM', description: 'Item satu', unit: 'm', rate: 10, qty: 2, amount: 20, sourceGroupId: 'G1', sourceItemId: 'I1', ...over });

describe('rowStatus', () => {
  it('is OK when the row still equals the book', () => {
    expect(rowStatus(row({}), book)).toBe('OK');
    expect(rowStatus(row({ description: '300mm x 300mm', unit: 'm', rate: 5, sourceItemId: 'I2', sourceVariantId: 'V1' }), book)).toBe('OK');
  });

  it('ignores case and spacing differences in wording and unit', () => {
    expect(rowStatus(row({ description: '  item  satu ', unit: 'M' }), indexBook(book))).toBe('OK');
    expect(rowStatus(row({ unit: 'm²', sourceItemId: 'I1' }), [{ ...book[0], items: [{ ...book[0].items[0], unit: 'M2' }] }])).toBe('OK');
  });

  it('reports a changed rate before a changed wording', () => {
    expect(rowStatus(row({ rate: 11 }), book)).toBe('KADAR_BERUBAH');
    expect(rowStatus(row({ rate: 11, description: 'lain' }), book)).toBe('KADAR_BERUBAH');
    expect(rowStatus(row({ description: 'Item satu (pindaan)' }), book)).toBe('PERKATAAN_BERUBAH');
    expect(rowStatus(row({ unit: 'm2' }), book)).toBe('PERKATAAN_BERUBAH');
  });

  it('is TIADA when the source row is gone', () => {
    expect(rowStatus(row({ sourceItemId: 'I9' }), book)).toBe('TIADA');
    expect(rowStatus(row({ sourceItemId: 'I2', sourceVariantId: 'V9' }), book)).toBe('TIADA');
  });

  it('is OK for headers, notes and rows without a source', () => {
    expect(rowStatus(row({ type: 'HEADER', sourceItemId: undefined }), book)).toBe('OK');
    expect(rowStatus(row({ sourceItemId: undefined, sourceGroupId: undefined }), book)).toBe('OK');
  });
});
