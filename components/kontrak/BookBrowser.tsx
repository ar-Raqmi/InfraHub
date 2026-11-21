import React, { useMemo, useState } from 'react';
import { BookOpen } from 'lucide-react';
import { Card, EmptyState } from '../ui';
import { useRateBook } from '../../hooks/useRateBook';
import type { PresetGroup, PresetItem } from '../../types';
import { SearchField, UnitRate } from './bits';
import { cx } from '../ui/cx';

interface Props {
  contractId: string;
  /** Version number or id to browse; default = current TERBIT book. */
  version?: string | number;
  versionLabel: string;
  emptyAction?: React.ReactNode;
}

const ALL = '__all__';

const itemText = (i: PresetItem): string =>
  `${i.code ?? ''} ${i.description} ${(i.variants ?? []).map(v => `${v.code ?? ''} ${v.label} ${v.unit}`).join(' ')}`.toLowerCase();

function filterGroups(groups: PresetGroup[], category: string, q: string): PresetGroup[] {
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
  return groups
    .filter(g => category === ALL || g.category === category)
    .map(g => {
      const groupHit = terms.length > 0 && terms.every(t => g.title.toLowerCase().includes(t));
      const items = groupHit ? g.items : g.items.filter(i => terms.every(t => itemText(i).includes(t)));
      return { ...g, items };
    })
    .filter(g => g.items.length > 0);
}

const RateLine: React.FC<{ code?: string; label: string; unit?: string; rate?: number }> = ({ code, label, unit, rate }) => (
  <div className="flex items-baseline gap-3 py-2 border-t border-line first:border-t-0">
    <span className="w-14 md:w-16 shrink-0 text-sm font-bold text-kontrak ih-num">{code}</span>
    <span className="flex-1 min-w-0 text-[15px] text-ink break-words">{label}<span className="md:hidden text-sm text-muted"> · {unit}</span></span>
    <UnitRate unit={unit} rate={rate} />
  </div>
);

const ItemBlock: React.FC<{ item: PresetItem }> = ({ item }) => {
  const [open, setOpen] = useState(false);
  const variants = item.variants ?? [];
  return (
    <div className="py-3 border-t border-line first:border-t-0">
      <button type="button" onClick={() => setOpen(o => !o)} className="w-full text-left flex gap-3 min-h-11" aria-expanded={open}>
        <span className="w-14 md:w-16 shrink-0 text-sm font-bold text-kontrak ih-num">{item.code}</span>
        <span className={cx('flex-1 min-w-0 text-[15px] text-ink break-words', !open && 'line-clamp-3')}>{item.description}{!variants.length && <span className="md:hidden text-sm text-muted"> · {item.unit}</span>}</span>
        {!variants.length && <UnitRate unit={item.unit} rate={item.rate} />}
      </button>
      {open && item.notes?.length ? <ul className="ml-0 md:ml-[4.75rem] mt-1 space-y-1 text-[13px] text-muted list-disc pl-4">{item.notes.map((n, i) => <li key={i}>{n}</li>)}</ul> : null}
      {variants.length > 0 && (
        <div className="ml-0 md:ml-[4.75rem] mt-1 rounded-ih-md bg-paper px-3">
          {variants.map(v => <RateLine key={v.id} code={v.code} label={v.label} unit={v.unit} rate={v.rate} />)}
        </div>
      )}
    </div>
  );
};

const BookBrowser: React.FC<Props> = ({ contractId, version, versionLabel, emptyAction }) => {
  const { groups, index, isLoading } = useRateBook(contractId, version);
  const [category, setCategory] = useState(ALL);
  const [q, setQ] = useState('');
  const categories = useMemo(() => {
    const m = new Map<string, number>();
    index.rows.forEach(r => m.set(r.category, (m.get(r.category) ?? 0) + 1));
    return [...m.entries()];
  }, [index]);
  const shown = useMemo(() => filterGroups(groups, category, q), [groups, category, q]);

  if (isLoading) return <p className="text-muted">Memuatkan buku kadar…</p>;
  if (!groups.length) return <EmptyState icon={BookOpen} title="Belum ada buku kadar" body="Kontrak ini belum mempunyai versi yang diterbitkan. Import BQ induk (Excel) untuk mula." action={emptyAction} />;

  const catButton = (id: string, label: string, count: number) => (
    <button key={id} type="button" onClick={() => setCategory(id)} aria-pressed={category === id}
      className={cx('min-h-11 shrink-0 md:w-full flex items-center justify-between gap-3 px-3 rounded-ih-sm text-left text-[15px]', category === id ? 'bg-kontrak-tint text-kontrak font-bold' : 'text-ink hover:bg-paper-deep')}>
      <span className="truncate">{label}</span><span className="ih-num text-sm text-muted">{count}</span>
    </button>
  );

  return (
    <div className="grid md:grid-cols-[15rem_minmax(0,1fr)] gap-4 md:gap-6">
      <nav aria-label="Kategori" className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible md:sticky md:top-4 md:self-start -mx-1 px-1">
        {catButton(ALL, 'Semua kategori', index.rows.length)}
        {categories.map(([c, n]) => catButton(c, c, n))}
      </nav>
      <div className="min-w-0 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <SearchField className="flex-1 min-w-[14rem]" label="Cari item" placeholder="Cari kod, perkataan atau unit" value={q} onChange={setQ} testId="book-search" />
          <p className="text-sm text-muted ih-num">{versionLabel} · {index.rows.length} kadar</p>
        </div>
        {shown.length === 0 && <p className="text-muted">Tiada item sepadan dengan carian ini.</p>}
        {shown.map(g => (
          <Card key={g.id} padding="none" className="overflow-hidden">
            <header className="px-4 md:px-5 py-3 bg-paper border-b border-line flex flex-wrap items-baseline gap-x-3 gap-y-1">
              {g.code && <span className="text-sm font-bold text-kontrak ih-num whitespace-nowrap">{g.bill ? `Bil ${g.bill} · ` : ''}{g.code}</span>}
              <h3 className="font-display font-bold text-ink text-[16px] leading-snug min-w-0 break-words">{g.title}</h3>
              <span className="ml-auto text-[13px] text-muted shrink-0">{g.category}</span>
            </header>
            <div className="px-4 md:px-5">{g.items.map(i => <ItemBlock key={i.id} item={i} />)}</div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default BookBrowser;
