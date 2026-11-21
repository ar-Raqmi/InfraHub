import React from 'react';
import { cx } from './cx';

/** Mirrors domain/rateBook/rowStatus results other than OK. */
export type IndicatorState = 'KADAR_BERUBAH' | 'PERKATAAN_BERUBAH' | 'TIADA';

export interface IndicatorProps {
  state: IndicatorState;
  /** Extra context after the label, e.g. "1 daripada 2" or "RM 420 → RM 455". */
  detail?: string;
  /** dot = compact row marker (label kept for screen readers and as a tooltip). */
  variant?: 'chip' | 'dot';
  className?: string;
}

const STATES: Record<IndicatorState, { label: string; chip: string; dot: string }> = {
  KADAR_BERUBAH: { label: 'Kadar berubah', chip: 'bg-amber-tint border-amber-line text-amber', dot: 'bg-amber' },
  PERKATAAN_BERUBAH: { label: 'Perkataan berubah', chip: 'bg-surface border-amber text-amber', dot: 'bg-surface border-2 border-amber' },
  TIADA: { label: 'Tiada dalam buku kadar', chip: 'bg-danger-tint border-danger-line text-danger', dot: 'bg-danger' },
};

const Indicator: React.FC<IndicatorProps> = ({ state, detail, variant = 'chip', className }) => {
  const s = STATES[state];
  const text = detail ? `${s.label} · ${detail}` : s.label;
  if (variant === 'dot') {
    return (
      <span title={text} className={cx('inline-flex w-3 h-3 rounded-full shrink-0', s.dot, className)}>
        <span className="sr-only">{text}</span>
      </span>
    );
  }
  return (
    <span className={cx('inline-flex items-center gap-2 h-7 px-2.5 border rounded-ih-sm text-xs font-bold whitespace-nowrap max-w-full', s.chip, className)}>
      <span className={cx('w-2 h-2 rounded-full shrink-0', s.dot, state === 'PERKATAAN_BERUBAH' && 'border-[1.5px]')} aria-hidden />
      <span className="truncate">{s.label}{detail && <span className="font-normal"> · {detail}</span>}</span>
    </span>
  );
};

export default Indicator;
