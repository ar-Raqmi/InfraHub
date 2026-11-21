import React, { useState } from 'react';
import type { BookRow } from '../../../domain/rateBook/rows';
import { markChanged } from './wordDiff';
import { money } from '../format';
import { cx } from '../../ui/cx';

const Marked: React.FC<{ text: string; against?: string; tone: 'old' | 'new' }> = ({ text, against, tone }) => {
  if (against === undefined) return <>{text}</>;
  return (
    <>
      {markChanged(text, against).map((p, i) => (p.changed
        ? <mark key={i} className={cx('rounded-sm px-0.5', tone === 'new' ? 'bg-amber-tint text-ink font-bold' : 'bg-paper-deep text-muted line-through')}>{p.text}</mark>
        : <React.Fragment key={i}>{p.text}</React.Fragment>))}
    </>
  );
};

interface Props {
  label: string;
  row?: BookRow;
  other?: BookRow;
  tone: 'old' | 'new';
  clampLines?: boolean;
}

/** One side of an old-vs-new comparison: item text (changed words marked), variant label, unit and rate. */
const RowSide: React.FC<Props> = ({ label, row, other, tone, clampLines = true }) => {
  const [open, setOpen] = useState(false);
  if (!row) return <div className="rounded-ih-md border border-line bg-paper p-3 text-sm text-muted">Tiada item lama dipadankan</div>;
  const rateDiffers = other !== undefined && other.rate !== row.rate;
  return (
    <div className={cx('min-w-0 rounded-ih-md border p-3', tone === 'new' ? 'border-kontrak-line bg-surface' : 'border-line bg-paper')}>
      <p className="ih-eyebrow text-muted mb-1">{label}</p>
      <button type="button" onClick={e => { e.stopPropagation(); setOpen(o => !o); }} aria-expanded={open}
        className={cx('w-full text-left text-[15px] text-ink break-words', clampLines && !open && 'line-clamp-4')}>
        {row.code && <span className="font-bold text-kontrak ih-num mr-1.5">{row.code}</span>}
        <Marked text={row.itemDescription} against={other?.itemDescription} tone={tone} />
      </button>
      {row.label && <p className="mt-1.5 text-[15px] font-bold text-ink break-words">↳ <Marked text={row.label} against={other?.label ?? ''} tone={tone} /></p>}
      <p className="mt-1.5 text-sm text-muted ih-num">
        {row.unit} · <b className={cx(rateDiffers ? 'text-amber' : 'text-ink')}>{money(row.rate)}</b>
      </p>
    </div>
  );
};

export default RowSide;
