// Row-by-row difference between two versions of a rate book. Rows are keyed by item/variant id,
// which import keeps stable for every row an officer matched to its predecessor.
import type { PresetGroup } from '../../types';
import { collapse, normUnit, sameMoney, flattenBook, type BookRow } from './rows';

export interface DiffRow {
  key: string;
  before?: BookRow;
  after?: BookRow;
}

export interface BookDiff {
  unchanged: DiffRow[];
  rateChanged: DiffRow[];
  wordingChanged: DiffRow[];
  added: DiffRow[];
  removed: DiffRow[];
  stats: { unchanged: number; rateChanged: number; wordingChanged: number; added: number; removed: number };
}

export const sameWording = (a: BookRow, b: BookRow): boolean =>
  collapse(a.itemDescription) === collapse(b.itemDescription) && collapse(a.label) === collapse(b.label) && normUnit(a.unit) === normUnit(b.unit);

export function diffBooks(a: PresetGroup[], b: PresetGroup[]): BookDiff {
  const before = new Map(flattenBook(a).map((r) => [r.key, r]));
  const beforeByVariant = new Map([...before.values()].filter((r) => r.variantId).map((r) => [r.variantId!, r]));
  const diff: BookDiff = { unchanged: [], rateChanged: [], wordingChanged: [], added: [], removed: [], stats: { unchanged: 0, rateChanged: 0, wordingChanged: 0, added: 0, removed: 0 } };
  for (const after of flattenBook(b)) {
    // A variant keeps its id when import moves it under another item id (see stabiliseIds).
    const old = before.get(after.key) ?? (after.variantId ? beforeByVariant.get(after.variantId) : undefined);
    if (old) before.delete(old.key);
    if (!old) diff.added.push({ key: after.key, after });
    else if (!sameMoney(old.rate, after.rate)) diff.rateChanged.push({ key: after.key, before: old, after });
    else if (!sameWording(old, after)) diff.wordingChanged.push({ key: after.key, before: old, after });
    else diff.unchanged.push({ key: after.key, before: old, after });
  }
  for (const [key, old] of before) diff.removed.push({ key, before: old });
  for (const k of Object.keys(diff.stats) as (keyof BookDiff['stats'])[]) diff.stats[k] = diff[k].length;
  return diff;
}
