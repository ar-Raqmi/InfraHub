// Joins a DRAF import (new rows + match suggestions) with the book it replaces, and sorts every row
// into the five review tabs. Pure: the screens only render what this returns.
import { flattenBook, indexBook, findSource, sameMoney, type BookIndex, type BookRow } from '../../../domain/rateBook/rows';
import type { PresetGroup, RateBookMatchRow } from '../../../types';

export type Bucket = 'same' | 'rate' | 'wording' | 'new' | 'removed';

export interface ReviewRow {
  id: string;
  bucket: Bucket;
  next?: BookRow;
  old?: BookRow;
  match?: RateBookMatchRow;
}

export const BUCKET_LABEL: Record<Bucket, string> = {
  same: 'Sama',
  rate: 'Kadar berubah',
  wording: 'Perkataan berubah (cadangan)',
  new: 'Baharu',
  removed: 'Dibuang',
};

export const BUCKETS: Bucket[] = ['wording', 'rate', 'new', 'removed', 'same'];

export const oldRefOf = (m: RateBookMatchRow): string | null =>
  m.oldGroupId && m.oldItemId ? [m.oldGroupId, m.oldItemId, m.oldVariantId].filter(Boolean).join('/') : null;

// EXACT = same wording: it only differs (or not) in rate. Every other kept link (CODE, FUZZY, AI, MANUAL)
// is a reworded line an officer confirms. A rejected suggestion publishes as a new row.
function bucketOf(m: RateBookMatchRow, next: BookRow, old: BookRow | undefined): Bucket {
  if (m.method === 'NEW' || m.decision === 'REJECT' || !old) return 'new';
  if (m.method === 'EXACT') return sameMoney(old.rate, next.rate) ? 'same' : 'rate';
  return 'wording';
}

export interface ReviewModel {
  rows: ReviewRow[];
  counts: Record<Bucket, number>;
  pending: number;
  oldIndex: BookIndex;
  /** Old ref -> new refs that currently claim it (to warn about double use). */
  claims: Map<string, string[]>;
}

export function buildReview(groups: PresetGroup[], matches: RateBookMatchRow[], removed: BookRow[], baseBook: PresetGroup[]): ReviewModel {
  const oldIndex = indexBook(baseBook);
  const byRef = new Map(matches.map(m => [m.newRef, m]));
  const claims = new Map<string, string[]>();
  const rows: ReviewRow[] = flattenBook(groups).map(next => {
    const match = byRef.get(next.ref);
    const old = match?.oldItemId ? findSource(oldIndex, match.oldItemId, match.oldVariantId ?? undefined) : undefined;
    if (match && old && match.decision !== 'REJECT') claims.set(old.ref, [...(claims.get(old.ref) ?? []), next.ref]);
    return { id: next.ref, next, old, match, bucket: match ? bucketOf(match, next, old) : 'new' };
  });
  removed.forEach(r => rows.push({ id: `removed:${r.ref}`, bucket: 'removed', old: r }));
  const counts = { same: 0, rate: 0, wording: 0, new: 0, removed: 0 } as Record<Bucket, number>;
  rows.forEach(r => { counts[r.bucket] += 1; });
  const pending = matches.filter(m => m.decision === 'PENDING').length;
  return { rows, counts, pending, oldIndex, claims };
}

export const describe = (r: BookRow | undefined): string =>
  r ? [r.itemDescription, r.label].filter(Boolean).join(' — ') : '';

export function rowMatchesQuery(row: ReviewRow, q: string): boolean {
  if (!q) return true;
  const hay = `${row.next?.code ?? ''} ${describe(row.next)} ${row.old?.code ?? ''} ${describe(row.old)}`.toLowerCase();
  return q.toLowerCase().split(/\s+/).every(t => hay.includes(t));
}
