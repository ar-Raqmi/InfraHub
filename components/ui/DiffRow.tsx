import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Formatter } from '../../services/Formatter';
import { cx } from './cx';

export interface DiffRowProps {
  /** Official item number, e.g. "2.1(ii)". */
  code?: string;
  description: string;
  /** Previous wording; shown struck through only when it differs. */
  oldDescription?: string;
  unit?: string;
  /** null = the item did not exist before (added). */
  oldRate: number | null;
  /** null = the item is gone from the new book (removed). */
  newRate: number | null;
  className?: string;
}

type Change = 'added' | 'removed' | 'up' | 'down' | 'same';

const changeOf = (oldRate: number | null, newRate: number | null): Change => {
  if (oldRate === null) return 'added';
  if (newRate === null) return 'removed';
  if (newRate === oldRate) return 'same';
  return newRate > oldRate ? 'up' : 'down';
};

const percent = (oldRate: number, newRate: number): string => {
  if (oldRate === 0) return '';
  const p = ((newRate - oldRate) / oldRate) * 100;
  return `${p > 0 ? '+' : ''}${p.toFixed(1)}%`;
};

const BADGE: Record<Change, { text: string; cls: string }> = {
  added: { text: 'Baharu', cls: 'bg-emerald-tint text-emerald-deep border-emerald-200' },
  removed: { text: 'Tiada', cls: 'bg-danger-tint text-danger border-danger-line' },
  up: { text: '', cls: 'bg-amber-tint text-amber border-amber-line' },
  down: { text: '', cls: 'bg-teal-tint text-teal-deep border-teal-200' },
  same: { text: 'Sama', cls: 'bg-paper-deep text-muted border-line' },
};

const DiffRow: React.FC<DiffRowProps> = ({ code, description, oldDescription, unit, oldRate, newRate, className }) => {
  const change = changeOf(oldRate, newRate);
  const reworded = oldDescription !== undefined && oldDescription !== description;
  const badge = BADGE[change];
  const badgeText = change === 'up' || change === 'down' ? percent(oldRate as number, newRate as number) : badge.text;
  return (
    <div className={cx('grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_auto] gap-x-6 gap-y-2 py-3.5 border-b border-line last:border-b-0', className)}>
      <div className="min-w-0 flex gap-3">
        {code && <span className="text-sm font-bold text-kontrak ih-num shrink-0 w-14">{code}</span>}
        <div className="min-w-0">
          {reworded && <p className="text-sm text-muted line-through decoration-amber/60">{oldDescription}</p>}
          <p className={cx('text-[15px] text-ink', change === 'removed' && 'line-through text-muted')}>{description}</p>
          {unit && <p className="text-[13px] text-muted mt-0.5">unit {unit}</p>}
        </div>
      </div>
      <div className={cx('flex items-center gap-2.5 ih-num whitespace-nowrap', code && 'pl-[4.25rem] md:pl-0')}>
        {oldRate !== null && change !== 'same' && <span className={cx('text-sm', newRate === null ? 'text-ink' : 'text-muted line-through')}>{Formatter.formatCurrency(oldRate)}</span>}
        {(change === 'up' || change === 'down') && <ArrowRight className="w-4 h-4 text-muted" aria-label="kepada" />}
        {newRate !== null && <span className="text-[15px] font-bold text-ink">{Formatter.formatCurrency(newRate)}</span>}
        {badgeText && <span className={cx('text-xs font-bold px-2 py-0.5 rounded-full border', badge.cls)}>{badgeText}</span>}
      </div>
    </div>
  );
};

export default DiffRow;
