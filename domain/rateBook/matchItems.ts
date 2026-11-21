// Suggests which row of the previous rate book each new row continues. Scores and methods only
// SUGGEST: EXACT (same wording) and CODE (same item number + unit, similar wording) are accepted,
// everything fuzzy stays PENDING until an officer decides.
import type { MatchDecision, MatchMethod, PresetGroup } from '../../types';
import { flattenBook, normText, normUnit, type BookRow } from './rows';

export interface OldRef {
  groupId: string;
  itemId: string;
  variantId?: string;
}

export interface Suggestion {
  ref: string;
  score: number;
}

export interface RowMatch {
  newRef: string;
  old: OldRef | null;
  method: MatchMethod;
  score: number;
  decision: MatchDecision;
  alternatives?: Suggestion[];
}

export type MatchStats = Record<MatchMethod, number> & { removed: number; pending: number };

export interface MatchResult {
  matches: RowMatch[];
  removed: BookRow[];
  stats: MatchStats;
}

const FUZZY_THRESHOLD = 0.6;
const CODE_ACCEPT_TEXT_SIM = 0.5;
const METHOD_RANK: Record<string, number> = { EXACT: 0, CODE: 1, FUZZY: 2 };

interface Prepared {
  row: BookRow;
  desc: Set<string>;
  label: Set<string>;
  title: Set<string>;
  unit: string;
  exactKey: string;
}

interface Candidate {
  n: number;
  o: number;
  method: 'EXACT' | 'CODE' | 'FUZZY';
  score: number;
}

const tokens = (s: string | undefined): Set<string> => new Set(normText(s).split(/[^\p{L}\p{N}]+/u).filter(Boolean));

function dice(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  let common = 0;
  for (const t of a) if (b.has(t)) common++;
  return (2 * common) / (a.size + b.size);
}

function prepare(row: BookRow): Prepared {
  const desc = tokens(row.itemDescription);
  const label = tokens(row.label);
  const unit = normUnit(row.unit);
  return { row, desc, label, title: tokens(row.groupTitle), unit, exactKey: `${[...desc].join(' ')}|${[...label].join(' ')}|${unit}` };
}

const labelSim = (a: Prepared, b: Prepared): number => {
  if (!a.row.label && !b.row.label) return 1;
  if (!a.row.label || !b.row.label) return 0;
  return dice(a.label, b.label);
};

function fuzzyScore(a: Prepared, b: Prepared): number {
  const unitScore = a.unit === b.unit ? 1 : 0;
  return 0.45 * dice(a.desc, b.desc) + 0.35 * labelSim(a, b) + 0.1 * dice(a.title, b.title) + 0.1 * unitScore;
}

function candidateFor(a: Prepared, b: Prepared, n: number, o: number): Candidate | null {
  if (a.exactKey === b.exactKey) return { n, o, method: 'EXACT', score: 1 };
  const sameUnit = a.unit === b.unit;
  if (sameUnit && !!a.row.code && a.row.code === b.row.code) return { n, o, method: 'CODE', score: Math.max(fuzzyScore(a, b), 0.9) };
  // Different units are never the same priced line; skipping them also keeps the pairwise pass cheap.
  if (!sameUnit) return null;
  const score = fuzzyScore(a, b);
  return score >= FUZZY_THRESHOLD ? { n, o, method: 'FUZZY', score } : null;
}

const byStrength = (x: Candidate, y: Candidate): number => METHOD_RANK[x.method] - METHOD_RANK[y.method] || y.score - x.score;

function decide(c: Candidate, a: Prepared, b: Prepared): MatchDecision {
  if (c.method === 'EXACT') return 'ACCEPT';
  if (c.method === 'CODE') return dice(a.desc, b.desc) >= CODE_ACCEPT_TEXT_SIM && labelSim(a, b) >= CODE_ACCEPT_TEXT_SIM ? 'ACCEPT' : 'PENDING';
  return 'PENDING';
}

const toOldRef = (r: BookRow): OldRef => ({ groupId: r.groupId, itemId: r.itemId, ...(r.variantId ? { variantId: r.variantId } : {}) });
const round3 = (x: number): number => Math.round(x * 1000) / 1000;

function emptyStats(): MatchStats {
  return { EXACT: 0, CODE: 0, FUZZY: 0, AI: 0, MANUAL: 0, NEW: 0, removed: 0, pending: 0 };
}

export function matchBooks(next: PresetGroup[], prev: PresetGroup[]): MatchResult {
  const news = flattenBook(next).map(prepare);
  const olds = flattenBook(prev).map(prepare);
  const candidates: Candidate[] = [];
  const perNew: Candidate[][] = news.map(() => []);
  news.forEach((a, n) => olds.forEach((b, o) => {
    const c = candidateFor(a, b, n, o);
    if (c) { candidates.push(c); perNew[n].push(c); }
  }));
  candidates.sort(byStrength);

  const chosen = new Map<number, Candidate>();
  const usedOld = new Set<number>();
  for (const c of candidates) {
    if (chosen.has(c.n) || usedOld.has(c.o)) continue;
    chosen.set(c.n, c);
    usedOld.add(c.o);
  }

  const stats = emptyStats();
  const matches = news.map((a, n): RowMatch => {
    const c = chosen.get(n);
    const alternatives = perNew[n].sort(byStrength).filter((x) => x !== c).slice(0, 3).map((x) => ({ ref: olds[x.o].row.ref, score: round3(x.score) }));
    const match: RowMatch = c
      ? { newRef: a.row.ref, old: toOldRef(olds[c.o].row), method: c.method, score: round3(c.score), decision: decide(c, a, olds[c.o]) }
      : { newRef: a.row.ref, old: null, method: 'NEW', score: 0, decision: 'ACCEPT' };
    if (alternatives.length) match.alternatives = alternatives;
    stats[match.method]++;
    if (match.decision === 'PENDING') stats.pending++;
    return match;
  });
  const removed = olds.filter((_, o) => !usedOld.has(o)).map((p) => p.row);
  stats.removed = removed.length;
  return { matches, removed, stats };
}

// --- carry old ids forward ---------------------------------------------------------------

function majority(values: string[], taken: Set<string>): string | undefined {
  const counts = new Map<string, number>();
  for (const v of values) if (!taken.has(v)) counts.set(v, (counts.get(v) ?? 0) + 1);
  let best: string | undefined;
  for (const [v, n] of counts) if (best === undefined || n > counts.get(best)!) best = v;
  return best;
}

/** Returns a copy of `groups` where every ACCEPTed row keeps its old group/item/variant id. */
export function stabiliseIds(groups: PresetGroup[], matches: RowMatch[]): PresetGroup[] {
  const accepted = new Map(matches.filter((m) => m.decision === 'ACCEPT' && m.old).map((m) => [m.newRef, m.old!]));
  const used = { group: new Set<string>(), item: new Set<string>(), variant: new Set<string>() };
  const pick = (kind: keyof typeof used, candidates: string[], fallback: string): string => {
    const id = majority(candidates, used[kind]) ?? (used[kind].has(fallback) ? `${fallback}~` : fallback);
    used[kind].add(id);
    return id;
  };

  return groups.map((g) => {
    const oldRefsOf = (itemId: string, variantId?: string) => accepted.get(variantId ? `${g.id}/${itemId}/${variantId}` : `${g.id}/${itemId}`);
    const groupOlds = g.items.flatMap((i) => (i.variants?.length ? i.variants.map((v) => oldRefsOf(i.id, v.id)) : [oldRefsOf(i.id)]))
      .filter((r): r is OldRef => !!r);
    const items = g.items.map((item) => {
      const rowOlds = item.variants?.length ? item.variants.map((v) => oldRefsOf(item.id, v.id)) : [oldRefsOf(item.id)];
      const itemId = pick('item', rowOlds.filter((r): r is OldRef => !!r).map((r) => r.itemId), item.id);
      if (!item.variants?.length) return { ...item, id: itemId };
      const variants = item.variants.map((v) => {
        const old = oldRefsOf(item.id, v.id);
        return { ...v, id: pick('variant', old?.variantId ? [old.variantId] : [], v.id) };
      });
      return { ...item, id: itemId, variants };
    });
    return { ...g, id: pick('group', groupOlds.map((r) => r.groupId), g.id), items };
  });
}
