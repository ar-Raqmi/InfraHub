import React, { useMemo, useState } from 'react';
import { DiffRow, Tabs } from '../ui';
import { useRateBookDiff } from '../../hooks/useRateBook';
import type { DiffRow as DiffRowData, BookDiff } from '../../domain/rateBook/diffBooks';
import type { BookRow } from '../../domain/rateBook/rows';
import { MoreButton, Notice, SearchField } from './bits';

type Kind = 'rateChanged' | 'wordingChanged' | 'added' | 'removed' | 'unchanged';

const TAB_LABEL: Record<Kind, string> = {
  rateChanged: 'Kadar berubah',
  wordingChanged: 'Perkataan berubah',
  added: 'Ditambah',
  removed: 'Dibuang',
  unchanged: 'Sama',
};
const ORDER: Kind[] = ['rateChanged', 'wordingChanged', 'added', 'removed', 'unchanged'];
const PAGE = 60;

const text = (r?: BookRow): string => (r ? [r.itemDescription, r.label].filter(Boolean).join(' — ') : '');

function hit(d: DiffRowData, q: string): boolean {
  if (!q) return true;
  const hay = `${d.after?.code ?? ''} ${d.before?.code ?? ''} ${text(d.after)} ${text(d.before)}`.toLowerCase();
  return q.toLowerCase().split(/\s+/).every(t => hay.includes(t));
}

const Row: React.FC<{ d: DiffRowData }> = ({ d }) => {
  const shown = d.after ?? d.before!;
  return (
    <DiffRow
      code={shown.code}
      description={text(shown)}
      oldDescription={d.before && d.after ? text(d.before) : undefined}
      unit={shown.unit}
      oldRate={d.before ? d.before.rate : null}
      newRate={d.after ? d.after.rate : null}
    />
  );
};

/** Row-level difference between two versions, with counts per kind, a filter and paging. */
export const DiffList: React.FC<{ diff: BookDiff; initial?: Kind }> = ({ diff, initial }) => {
  const first = initial ?? ORDER.find(k => diff.stats[k] > 0) ?? 'rateChanged';
  const [kind, setKind] = useState<Kind>(first);
  const [q, setQ] = useState('');
  const [limit, setLimit] = useState(PAGE);
  const rows = useMemo(() => diff[kind].filter(d => hit(d, q)), [diff, kind, q]);
  return (
    <div className="space-y-3" data-testid="diff-list">
      <Tabs label="Jenis perubahan" value={kind} onChange={id => { setKind(id as Kind); setLimit(PAGE); }}
        items={ORDER.map(k => ({ id: k, label: TAB_LABEL[k], count: diff.stats[k] }))} />
      <SearchField label="Tapis baris" placeholder="Tapis kod atau perkataan" value={q} onChange={setQ} />
      <div className="bg-surface border border-line rounded-ih-lg px-4 md:px-5">
        {rows.slice(0, limit).map(d => <Row key={d.key} d={d} />)}
        {rows.length === 0 && <p className="py-6 text-muted">Tiada baris dalam kumpulan ini.</p>}
      </div>
      <MoreButton shown={limit} total={rows.length} page={PAGE} onMore={() => setLimit(l => l + PAGE)} />
    </div>
  );
};

const DiffViewer: React.FC<{ from: string; to: string }> = ({ from, to }) => {
  const { data, isLoading, error } = useRateBookDiff(from, to);
  if (isLoading) return <p className="text-muted">Membanding versi…</p>;
  if (error || !data) return <Notice tone="error">Perbandingan gagal dimuatkan.</Notice>;
  return <DiffList diff={data} />;
};

export default DiffViewer;
