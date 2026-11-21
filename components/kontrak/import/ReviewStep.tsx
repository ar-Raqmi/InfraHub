import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Check, CheckCheck, Keyboard, TextSearch, X } from 'lucide-react';
import { Button, Chip, DiffRow, Sheet, StatTile, Tabs } from '../../ui';
import { useIsMobile } from '../../../lib/useIsMobile';
import type { BookRow } from '../../../domain/rateBook/rows';
import type { MatchDecisionBody } from '../../../services/apiService';
import CandidateCard, { DECISION_LABEL, scorePct } from './CandidateCard';
import OldItemPicker from './OldItemPicker';
import { BUCKETS, BUCKET_LABEL, describe, rowMatchesQuery, type Bucket, type ReviewModel, type ReviewRow } from './reviewModel';
import { errorText, money } from '../format';
import AiSuggestButton from './AiSuggestButton';
import { MoreButton, Notice, SearchField } from '../bits';
import RowSide from './RowSide';

interface Props {
  model: ReviewModel;
  versionId: string;
  decide: (d: MatchDecisionBody[]) => Promise<unknown>;
  deciding: boolean;
  onPublish: () => void;
}

const PAGE = 60;
const THRESHOLDS = [0.95, 0.9, 0.85, 0.8, 0.7];

const isTyping = (t: EventTarget | null) => t instanceof HTMLElement && (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName));

const PlainRow: React.FC<{ row: ReviewRow; onPick?: () => void }> = ({ row, onPick }) => {
  const shown = row.next ?? row.old!;
  return (
    <div className="flex items-start gap-2">
      <DiffRow className="flex-1 min-w-0" code={shown.code} description={describe(shown)} unit={shown.unit}
        oldRate={row.bucket === 'new' ? null : row.old?.rate ?? null} newRate={row.bucket === 'removed' ? null : row.next?.rate ?? null} />
      {onPick && <Button size="sm" variant="ghost" icon={TextSearch} onClick={onPick} className="mt-2.5 shrink-0">Padankan</Button>}
    </div>
  );
};

/** Phone: one suggestion per sheet, two big choices, like the field "kadar berubah" sheet. */
const DecisionSheet: React.FC<{ row?: ReviewRow; index: number; total: number; busy: boolean; onClose: () => void; onDecide: (d: 'ACCEPT' | 'REJECT') => void; onPick: () => void }> = ({ row, index, total, busy, onClose, onDecide, onPick }) => {
  if (!row?.match) return null;
  return (
    <Sheet open onClose={onClose} title={row.next?.code ? `Item ${row.next.code}` : 'Cadangan padanan'}
      lead={<Chip tone="amber" dot>Perkataan berubah · {index + 1} daripada {total}</Chip>}>
      <div className="space-y-3">
        <RowSide label="Excel baharu" row={row.next} other={row.old} tone="new" />
        <RowSide label="Buku semasa (lama)" row={row.old} other={row.next} tone="old" />
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-ih-md border border-line bg-paper p-3"><p className="text-[13px] text-muted">Kadar lama</p><p className="font-display font-extrabold text-2xl ih-num">{money(row.old?.rate)}</p><p className="text-[13px] text-muted">{row.old?.unit}</p></div>
          <div className="rounded-ih-md border border-kontrak-line bg-kontrak-tint p-3"><p className="text-[13px] text-kontrak">Kadar baharu</p><p className="font-display font-extrabold text-2xl ih-num text-kontrak">{money(row.next?.rate)}</p><p className="text-[13px] text-muted">{row.next?.unit} · keserupaan {scorePct(row.match.score)}</p></div>
        </div>
        <p className="text-[13px] text-muted">Status: {DECISION_LABEL[row.match.decision]}</p>
        <Button size="lg" block variant="outline" icon={Check} hint="Item lama diteruskan; projek yang memakainya kekal terpaut" disabled={busy} onClick={() => onDecide('ACCEPT')} data-testid="sheet-accept">Terima cadangan</Button>
        <Button size="lg" block variant="ink" icon={X} hint="Baris ini menjadi item baharu; item lama dibuang" disabled={busy} onClick={() => onDecide('REJECT')}>Tolak</Button>
        <Button block variant="ghost" icon={TextSearch} onClick={onPick}>Pilih item lama lain</Button>
        <p className="text-center text-[13px] text-muted">Keputusan direkod dengan nama dan tarikh anda.</p>
      </div>
    </Sheet>
  );
};

const ReviewStep: React.FC<Props> = ({ model, versionId, decide, deciding, onPublish }) => {
  const isMobile = useIsMobile();
  const [bucket, setBucket] = useState<Bucket>(model.counts.wording ? 'wording' : 'rate');
  const [q, setQ] = useState('');
  const [onlyPending, setOnlyPending] = useState(false);
  const [limit, setLimit] = useState(PAGE);
  const [focus, setFocus] = useState(0);
  const [sheetIndex, setSheetIndex] = useState<number | null>(null);
  const [pickFor, setPickFor] = useState<ReviewRow | null>(null);
  const [threshold, setThreshold] = useState(0.9);
  const [error, setError] = useState('');

  const rows = useMemo(() => model.rows
    .filter(r => r.bucket === bucket && rowMatchesQuery(r, q))
    .filter(r => !onlyPending || r.match?.decision === 'PENDING')
    // Undecided suggestions first, most similar on top, so the officer works top-down.
    .sort((a, b) => Number(b.match?.decision === 'PENDING') - Number(a.match?.decision === 'PENDING') || (b.match?.score ?? 0) - (a.match?.score ?? 0)), [model, bucket, q, onlyPending]);
  const bulk = useMemo(() => model.rows.filter(r => r.match?.decision === 'PENDING' && r.match.score >= threshold), [model, threshold]);

  const run = useCallback(async (body: MatchDecisionBody[]) => {
    setError('');
    try { await decide(body); } catch (err) { setError(errorText(err)); }
  }, [decide]);

  const decideRow = useCallback(async (row: ReviewRow, d: 'ACCEPT' | 'REJECT') => {
    const m = row.match!;
    await run([{ new_ref: m.newRef, decision: d, ...(d === 'ACCEPT' && m.oldItemId ? { old_group_id: m.oldGroupId!, old_item_id: m.oldItemId, old_variant_id: m.oldVariantId } : {}) }]);
  }, [run]);

  const pickOld = async (old: BookRow) => {
    if (!pickFor?.next) return;
    await run([{ new_ref: pickFor.next.ref, decision: 'ACCEPT', old_group_id: old.groupId, old_item_id: old.itemId, old_variant_id: old.variantId ?? null }]);
    setPickFor(null);
  };

  const nextPendingAfter = (i: number) => {
    const j = rows.findIndex((r, k) => k > i && r.match?.decision === 'PENDING');
    return j === -1 ? Math.min(i + 1, rows.length - 1) : j;
  };

  // Desktop keyboard: J/K or arrows move, A accept, R reject, P pick another old item.
  useEffect(() => {
    if (isMobile || bucket !== 'wording' || pickFor) return;
    const onKey = (e: KeyboardEvent) => {
      if (isTyping(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;
      keyMoved.current = true;
      const row = rows[focus];
      const key = e.key.toLowerCase();
      if (key === 'j' || e.key === 'ArrowDown') { e.preventDefault(); setFocus(f => Math.min(f + 1, rows.length - 1)); }
      else if (key === 'k' || e.key === 'ArrowUp') { e.preventDefault(); setFocus(f => Math.max(f - 1, 0)); }
      else if (row && (key === 'a' || key === 'r')) { e.preventDefault(); decideRow(row, key === 'a' ? 'ACCEPT' : 'REJECT').then(() => setFocus(nextPendingAfter(focus))); }
      else if (row && key === 'p') { e.preventDefault(); setPickFor(row); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const keyMoved = useRef(false);
  useEffect(() => {
    if (!keyMoved.current) return;
    keyMoved.current = false;
    document.querySelectorAll<HTMLElement>('[data-testid="candidate"]')[focus]?.scrollIntoView({ block: 'nearest' });
  }, [focus]);

  const sheetRow = sheetIndex !== null ? rows[sheetIndex] : undefined;
  const decideInSheet = async (d: 'ACCEPT' | 'REJECT') => {
    if (!sheetRow || sheetIndex === null) return;
    await decideRow(sheetRow, d);
    const next = rows.findIndex((r, k) => k > sheetIndex && r.match?.decision === 'PENDING');
    setSheetIndex(next === -1 ? null : next);
  };

  const exactTotal = model.counts.same + model.counts.rate;

  return (
    <div className="space-y-5 pb-24">
      <div className="hidden md:grid grid-cols-5 gap-3" data-testid="review-counts">
        {BUCKETS.map(b => (
          <StatTile key={b} value={model.counts[b]} label={BUCKET_LABEL[b]} onClick={() => { setBucket(b); setLimit(PAGE); setFocus(0); }}
            tone={b === 'wording' ? 'amber' : b === 'removed' ? 'danger' : b === 'new' ? 'emerald' : b === 'rate' ? 'kontrak' : 'neutral'}
            hint={b === 'wording' ? `${model.pending} menunggu` : undefined} className={bucket === b ? 'border-ink' : undefined} />
        ))}
      </div>
      <p className="text-sm text-muted ih-num" data-testid="match-summary">
        Padanan tepat {exactTotal} (sama {model.counts.same} + kadar berubah {model.counts.rate}) · cadangan perkataan {model.counts.wording} · baharu {model.counts.new} · dibuang {model.counts.removed}
      </p>

      <Tabs label="Kumpulan semakan" value={bucket} onChange={id => { setBucket(id as Bucket); setLimit(PAGE); setFocus(0); }}
        items={BUCKETS.map(b => ({ id: b, label: BUCKET_LABEL[b], count: model.counts[b] }))} />

      <div className="flex flex-wrap items-center gap-2">
        <SearchField className="flex-1 min-w-[14rem]" label="Tapis baris" placeholder="Tapis kod atau perkataan" value={q} onChange={setQ} />
        {bucket === 'wording' && (
          <>
            <label className="flex items-center gap-2 min-h-11 text-[15px] px-1"><input type="checkbox" checked={onlyPending} onChange={e => setOnlyPending(e.target.checked)} className="w-5 h-5 accent-[#3B2E8C]" />Menunggu sahaja</label>
            <div className="flex items-center gap-2">
              <select aria-label="Skor minimum" value={threshold} onChange={e => setThreshold(Number(e.target.value))} className="min-h-11 rounded-ih-md border border-line-strong bg-surface px-2 text-base md:text-[15px]">
                {THRESHOLDS.map(t => <option key={t} value={t}>≥ {scorePct(t)}</option>)}
              </select>
              <Button variant="outline" icon={CheckCheck} disabled={!bulk.length || deciding} data-testid="bulk-accept"
                onClick={() => run(bulk.map(r => ({ new_ref: r.match!.newRef, decision: 'ACCEPT' as const })))}>Terima {bulk.length} cadangan</Button>
            </div>
            <AiSuggestButton versionId={versionId} />
          </>
        )}
      </div>
      {bucket === 'wording' && !isMobile && <p className="text-[13px] text-muted flex items-center gap-1.5"><Keyboard className="w-4 h-4" aria-hidden /> Papan kekunci: J/K atau ↑/↓ pilih, A terima, R tolak, P pilih item lain.</p>}
      {error && <Notice tone="error">{error}</Notice>}

      <div className="space-y-3" data-testid="review-list">
        {bucket === 'wording' && !isMobile && rows.slice(0, limit).map((r, i) => (
          <CandidateCard key={r.id} row={r} focused={i === focus} busy={deciding} claimedBy={r.old ? model.claims.get(r.old.ref)?.length : undefined}
            onFocus={() => setFocus(i)} onDecide={d => decideRow(r, d).then(() => setFocus(nextPendingAfter(i)))} onPick={() => setPickFor(r)} />
        ))}
        {bucket === 'wording' && isMobile && (
          <ul className="bg-surface border border-line rounded-ih-lg divide-y divide-line">
            {rows.slice(0, limit).map((r, i) => (
              <li key={r.id}>
                <button type="button" onClick={() => setSheetIndex(i)} data-testid="candidate-row" className="w-full text-left px-4 py-3 min-h-14">
                  <p className="text-[15px] text-ink line-clamp-2"><b className="text-kontrak mr-1">{r.next?.code}</b>{describe(r.next)}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-2 text-[13px] text-muted ih-num">
                    <Chip tone={r.match?.decision === 'PENDING' ? 'amber' : r.match?.decision === 'ACCEPT' ? 'emerald' : 'danger'} dot>{DECISION_LABEL[r.match!.decision]}</Chip>
                    {scorePct(r.match!.score)} · {money(r.old?.rate)} → {money(r.next?.rate)}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )}
        {bucket !== 'wording' && (
          <div className="bg-surface border border-line rounded-ih-lg px-4 md:px-5">
            {rows.slice(0, limit).map(r => <PlainRow key={r.id} row={r} onPick={r.bucket === 'new' && r.next ? () => setPickFor(r) : undefined} />)}
          </div>
        )}
        {rows.length === 0 && <p className="text-muted py-4">Tiada baris dalam kumpulan ini.</p>}
        <MoreButton shown={limit} total={rows.length} page={PAGE} onMore={() => setLimit(l => l + PAGE)} />
      </div>

      <div className="fixed bottom-16 md:bottom-0 inset-x-0 md:left-28 z-30 bg-surface border-t border-line px-4 md:px-8 py-3 flex items-center gap-3">
        <p className="flex-1 min-w-0 text-[15px] ih-num" data-testid="pending-count">
          {model.pending ? <><b className="text-amber">{model.pending}</b> padanan menunggu keputusan</> : <b className="text-emerald-deep">Semua padanan sudah diputuskan</b>}
        </p>
        <Button icon={ArrowRight} disabled={model.pending > 0} onClick={onPublish} data-testid="to-publish">Teruskan ke terbit</Button>
      </div>

      <DecisionSheet row={sheetRow} index={sheetIndex ?? 0} total={rows.length} busy={deciding} onClose={() => setSheetIndex(null)} onDecide={decideInSheet} onPick={() => sheetRow && setPickFor(sheetRow)} />
      <OldItemPicker open={!!pickFor} target={pickFor?.next} oldRows={model.oldIndex.rows} claims={model.claims} onClose={() => setPickFor(null)} onPick={pickOld} />
    </div>
  );
};

export default ReviewStep;
