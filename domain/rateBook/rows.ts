// Flat, comparable view of a rate book: one row per priced line (item rate or variant).
import type { PresetGroup } from '../../types';

export interface BookRow {
  ref: string; // groupId/itemId[/variantId]
  key: string; // itemId/variantId-or-empty: stable across versions
  groupId: string;
  itemId: string;
  variantId?: string;
  groupTitle: string;
  category: string;
  code?: string;
  itemDescription: string;
  label?: string;
  unit: string;
  rate: number;
}

export interface BookIndex {
  rows: BookRow[];
  byKey: Map<string, BookRow>;
  byVariant: Map<string, BookRow>;
}

export const collapse = (s: string | undefined | null): string => (s ?? '').replace(/\s+/g, ' ').trim();
export const normText = (s: string | undefined | null): string => collapse(s).toLowerCase();

const UNIT_ALIASES: Record<string, string> = { no: 'nos', 'no.': 'nos', nos: 'nos', 'nos.': 'nos', ls: 'l/s', 'l/s': 'l/s', 'l.s': 'l/s' };
export const normUnit = (s: string | undefined | null): string => {
  const u = normText(s).replace(/\s/g, '').replace(/²/g, '2').replace(/³/g, '3');
  return UNIT_ALIASES[u] ?? u;
};

export const rowRef = (groupId: string, itemId: string, variantId?: string): string =>
  variantId ? `${groupId}/${itemId}/${variantId}` : `${groupId}/${itemId}`;
export const rowKey = (itemId: string, variantId?: string): string => `${itemId}/${variantId ?? ''}`;

export function flattenBook(groups: PresetGroup[]): BookRow[] {
  const rows: BookRow[] = [];
  for (const g of groups) {
    for (const item of g.items) {
      const base = { groupId: g.id, itemId: item.id, groupTitle: g.title, category: g.category, itemDescription: item.description };
      if (item.variants?.length) {
        for (const v of item.variants) {
          rows.push({ ...base, ref: rowRef(g.id, item.id, v.id), key: rowKey(item.id, v.id), variantId: v.id, code: v.code, label: v.label, unit: v.unit, rate: v.rate });
        }
      } else {
        rows.push({ ...base, ref: rowRef(g.id, item.id), key: rowKey(item.id), code: item.code, unit: item.unit ?? '', rate: item.rate ?? 0 });
      }
    }
  }
  return rows;
}

export function indexBook(groups: PresetGroup[]): BookIndex {
  const rows = flattenBook(groups);
  const byVariant = new Map(rows.filter((r) => r.variantId).map((r) => [r.variantId!, r]));
  return { rows, byKey: new Map(rows.map((r) => [r.key, r])), byVariant };
}

/** The book row a BQ line was copied from. A variant may have moved to another item, so fall back to its id alone. */
export function findSource(index: BookIndex, itemId: string, variantId?: string): BookRow | undefined {
  return index.byKey.get(rowKey(itemId, variantId)) ?? (variantId ? index.byVariant.get(variantId) : undefined);
}

export const sameMoney = (a: number, b: number): boolean => Math.round((Number(a) || 0) * 100) === Math.round((Number(b) || 0) * 100);
