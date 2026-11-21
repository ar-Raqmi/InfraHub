import React from 'react';
import { Check, TextSearch, X } from 'lucide-react';
import { Button, Chip } from '../../ui';
import type { ReviewRow } from './reviewModel';
import RowSide from './RowSide';
import { cx } from '../../ui/cx';

export const DECISION_LABEL = { PENDING: 'Menunggu', ACCEPT: 'Diterima', REJECT: 'Ditolak' } as const;
const DECISION_TONE = { PENDING: 'amber', ACCEPT: 'emerald', REJECT: 'danger' } as const;

export const scorePct = (score: number): string => `${Math.round(score * 100)}%`;

interface Props {
  row: ReviewRow;
  focused: boolean;
  busy: boolean;
  claimedBy?: number;
  onFocus: () => void;
  onDecide: (d: 'ACCEPT' | 'REJECT') => void;
  onPick: () => void;
}

/** One reworded-line suggestion, old and new side by side, with the three choices. */
const CandidateCard: React.FC<Props> = ({ row, focused, busy, claimedBy, onFocus, onDecide, onPick }) => {
  const m = row.match!;
  return (
    <article
      data-testid="candidate"
      data-decision={m.decision}
      tabIndex={-1}
      onClick={onFocus}
      className={cx('rounded-ih-lg border bg-surface p-4 space-y-3 outline-none', focused ? 'border-kontrak ring-2 ring-kontrak/30' : 'border-line')}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Chip tone={DECISION_TONE[m.decision]} dot>{DECISION_LABEL[m.decision]}</Chip>
        <Chip tone="kontrak">Keserupaan {scorePct(m.score)}</Chip>
        <Chip tone="neutral">{m.method}</Chip>
        {claimedBy && claimedBy > 1 && <Chip tone="amber">Item lama ini dipadankan {claimedBy} kali</Chip>}
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        <RowSide label="Buku semasa (lama)" row={row.old} other={row.next} tone="old" />
        <RowSide label="Excel baharu" row={row.next} other={row.old} tone="new" />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant={m.decision === 'ACCEPT' ? 'ink' : 'outline'} icon={Check} disabled={busy} onClick={e => { e.stopPropagation(); onDecide('ACCEPT'); }} data-testid="accept">Terima <kbd className="hidden md:inline text-[11px] opacity-60 ml-1">A</kbd></Button>
        <Button size="sm" variant={m.decision === 'REJECT' ? 'ink' : 'outline'} icon={X} disabled={busy} onClick={e => { e.stopPropagation(); onDecide('REJECT'); }} data-testid="reject">Tolak, jadikan baharu <kbd className="hidden md:inline text-[11px] opacity-60 ml-1">R</kbd></Button>
        <Button size="sm" variant="ghost" icon={TextSearch} disabled={busy} onClick={e => { e.stopPropagation(); onPick(); }}>Pilih item lain <kbd className="hidden md:inline text-[11px] opacity-60 ml-1">P</kbd></Button>
      </div>
    </article>
  );
};

export default CandidateCard;
