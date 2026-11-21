// Moving a project's BQ onto another rate book: keep every quantity, swap wording, unit, rate and source ids.
import type { BQGroup, BQItem, PresetGroup } from '../types';
import { findSource, indexBook, normText, normUnit, sameMoney, type BookIndex, type BookRow } from './rateBook/rows';

export interface RepriceMapping {
  from: { itemId: string; variantId?: string };
  to: { groupId: string; itemId: string; variantId?: string };
}

export interface RepriceSide {
  description: string;
  unit: string;
  rate: number;
  amount: number;
}

export interface RepriceTarget extends RepriceSide {
  sourceGroupId: string;
  sourceItemId: string;
  sourceVariantId?: string;
}

export interface RepriceRow {
  groupIndex: number;
  itemIndex: number;
  bqItemId: string;
  qty: number;
  status: 'SAME' | 'CHANGED' | 'MISSING';
  from: RepriceSide;
  to: RepriceTarget | null;
}

export interface RepricePlan {
  rows: RepriceRow[];
  totals: { before: number; after: number; missing: number; changed: number; same: number };
}

const money = (n: number): number => parseFloat(n.toFixed(2));
const lineAmount = (qty: number, rate: number): number => parseFloat((qty * rate).toFixed(2));

function resolveTarget(item: BQItem, index: BookIndex, mapped: Map<string, RepriceMapping['to']>): BookRow | undefined {
  const sameIds = findSource(index, item.sourceItemId!, item.sourceVariantId);
  if (sameIds) return sameIds;
  const viaMap = mapped.get(`${item.sourceItemId}/${item.sourceVariantId ?? ''}`);
  return viaMap ? findSource(index, viaMap.itemId, viaMap.variantId) : undefined;
}

function toTarget(row: BookRow, qty: number): RepriceTarget {
  return {
    description: row.variantId ? row.label ?? '' : row.itemDescription,
    unit: row.unit,
    rate: row.rate,
    amount: lineAmount(qty, row.rate),
    sourceGroupId: row.groupId,
    sourceItemId: row.itemId,
    ...(row.variantId ? { sourceVariantId: row.variantId } : {}),
  };
}

function isSame(item: BQItem, to: RepriceTarget): boolean {
  return sameMoney(item.rate, to.rate) && normText(item.description) === normText(to.description) && normUnit(item.unit) === normUnit(to.unit)
    && item.sourceItemId === to.sourceItemId && (item.sourceVariantId ?? undefined) === to.sourceVariantId;
}

export function planReprice(bq: BQGroup[], toBook: PresetGroup[], matches: RepriceMapping[] = []): RepricePlan {
  const index = indexBook(toBook);
  const mapped = new Map(matches.map((m) => [`${m.from.itemId}/${m.from.variantId ?? ''}`, m.to]));
  const rows: RepriceRow[] = [];
  bq.forEach((group, groupIndex) => group.items.forEach((item, itemIndex) => {
    if (item.type !== 'ITEM') return;
    const qty = Number(item.qty) || 0;
    const from = { description: item.description, unit: item.unit, rate: Number(item.rate) || 0, amount: Number(item.amount) || 0 };
    const target = item.sourceItemId ? resolveTarget(item, index, mapped) : undefined;
    const to = target ? toTarget(target, qty) : null;
    const status = !to ? 'MISSING' : isSame(item, to) ? 'SAME' : 'CHANGED';
    rows.push({ groupIndex, itemIndex, bqItemId: item.id, qty, status, from, to });
  }));
  const sum = (f: (r: RepriceRow) => number) => money(rows.reduce((s, r) => s + f(r), 0));
  return {
    rows,
    totals: {
      before: sum((r) => r.from.amount),
      after: sum((r) => (r.to ? r.to.amount : r.from.amount)),
      missing: rows.filter((r) => r.status === 'MISSING').length,
      changed: rows.filter((r) => r.status === 'CHANGED').length,
      same: rows.filter((r) => r.status === 'SAME').length,
    },
  };
}

export function applyReprice(bq: BQGroup[], plan: RepricePlan): BQGroup[] {
  const out: BQGroup[] = structuredClone(bq);
  for (const row of plan.rows) {
    if (!row.to) continue;
    const item = out[row.groupIndex].items[row.itemIndex];
    const { description, unit, rate, amount, sourceGroupId, sourceItemId, sourceVariantId } = row.to;
    Object.assign(item, { description, unit, rate, amount, sourceGroupId, sourceItemId, sourceVariantId });
  }
  return out;
}
