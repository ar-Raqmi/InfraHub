import { describe, expect, it } from 'vitest';
import fixture from './__fixtures__/mini-master-bq.json';
import { parseMasterBq } from './parseMasterBq';
import { defaultRateColumn, toPresetGroups } from './toPresetGroups';
import type { SheetRows } from './types';

const book = parseMasterBq(fixture as SheetRows[], { sheets: ['KESELURUHAN'] });

describe('toPresetGroups', () => {
  it('defaults to the KONTRAKTOR column', () => {
    expect(defaultRateColumn(book)).toBe('KADAR HARGA KONTRAKTOR (RM)');
  });

  const groups = toPresetGroups(book, 'KADAR HARGA KONTRAKTOR (RM)');

  it('makes one group per numbered heading and keeps bill, category and code', () => {
    expect(groups).toHaveLength(9);
    const uShape = groups.find((g) => g.title === 'LONGKANG JENIS U-SHAPE')!;
    expect(uShape).toMatchObject({ code: '8', bill: '2', category: 'Longkang' });
    expect(uShape.items[0]).toMatchObject({
      code: '8',
      description: 'Kerja-kerja membekal dan memasang longkang jenis U-Shape with Dry weather flow',
      variants: [
        { code: '8(i)', label: '300mm x 300mm', unit: 'M', rate: 169.33 },
        { code: '8(ii)', label: '450mm x 450mm', unit: 'M', rate: 254 },
      ],
    });
    expect(groups[0].category).toBe('Permulaan');
  });

  it('puts the rate on the item when it has no variants', () => {
    const lean = groups.find((g) => g.title === 'LEAN CONCRETE')!;
    expect(lean.items[0]).toMatchObject({ code: '2', unit: 'M2', rate: 27.35 });
    expect(lean.items[0].variants).toBeUndefined();
  });

  it('copies the chosen column as written', () => {
    const jab = toPresetGroups(book, 'KADAR HARGA JABATAN (RM)');
    expect(jab.find((g) => g.title === 'LONGKANG JENIS U-SHAPE')!.items[0].variants![0].rate).toBe(199.21);
  });

  it('gives unique ids to groups, items and variants', () => {
    const ids = groups.flatMap((g) => [g.id, ...g.items.flatMap((i) => [i.id, ...(i.variants ?? []).map((v) => v.id)])]);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
