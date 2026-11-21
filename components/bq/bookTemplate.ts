// Applying a BQ template against the PROJECT's rate book. Templates store item ids (or whole row snapshots);
// ids stay stable across book versions, so they resolve in any book that still has the line. Lines the book
// lacks are collected and shown to the officer instead of vanishing.
import type { BQItem, BQTemplateItemRef, PresetGroup, PresetItem } from '../../types';
import { findSource, type BookIndex } from '../../domain/rateBook/rows';

export interface TemplateMiss {
  ref: string;
  description: string;
  /** true = the snapshot row was added with the template's own rate (and gets the TIADA indicator). */
  kept: boolean;
}

const refText = (groupId: string | undefined, itemId: string, variantId?: string): string =>
  [groupId, itemId, variantId].filter(Boolean).join('/');

/**
 * Re-price a template snapshot row from the book (rate, unit, group id). Returns a miss when the row came from a
 * book line that this book does not have; the row is still added, unchanged.
 */
export function syncSnapshot(item: BQItem, index: BookIndex): TemplateMiss | null {
  if (!item.sourceItemId) return null;
  const row = findSource(index, item.sourceItemId, item.sourceVariantId);
  if (!row) return { ref: refText(item.sourceGroupId, item.sourceItemId, item.sourceVariantId), description: item.description, kept: true };
  item.rate = row.rate;
  item.unit = row.unit;
  item.sourceGroupId = row.groupId;
  return null;
}

/** The book group and item a legacy template reference points at, looked up by its stable item id. */
export function locateRef(groups: PresetGroup[], ref: BQTemplateItemRef): { group: PresetGroup; item: PresetItem } | null {
  const holds = (g: PresetGroup) => g.items.some((i) => i.id === ref.itemId);
  const group = groups.find((g) => g.id === ref.groupId && holds(g)) ?? groups.find(holds);
  const item = group?.items.find((i) => i.id === ref.itemId);
  if (!group || !item) return null;
  if (ref.variantId && !item.variants?.some((v) => v.id === ref.variantId)) return null;
  return { group, item };
}

export const refMiss = (ref: BQTemplateItemRef): TemplateMiss =>
  ({ ref: refText(ref.groupId, ref.itemId, ref.variantId), description: `Rujukan item ${refText(ref.groupId, ref.itemId, ref.variantId)}`, kept: false });
