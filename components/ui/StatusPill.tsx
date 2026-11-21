import React from 'react';
import { ProjectStatus } from '../../types';
import { StatusHelper } from '../../services/StatusHelper';
import { cx } from './cx';
import { STATUS_ORDER, statusIndex } from './workflow';

export interface StatusPillProps {
  status: ProjectStatus;
  className?: string;
}

/** Status label plus six ticks, so the position in the workflow reads without a colour legend. */
const StatusPill: React.FC<StatusPillProps> = ({ status, className }) => {
  const at = statusIndex(status);
  const done = status === ProjectStatus.SIAP;
  return (
    <span
      className={cx(
        'inline-flex items-center gap-2 h-7 pl-2 pr-2.5 rounded-full border text-xs font-bold whitespace-nowrap',
        done ? 'bg-emerald-tint border-emerald-200 text-emerald-deep' : 'bg-surface border-line text-ink',
        className,
      )}
    >
      <span className="flex gap-[2px]" aria-hidden>
        {STATUS_ORDER.map((s, i) => (
          <span key={s} className={cx('w-1 h-3 rounded-full', i <= at ? 'bg-emerald-bright' : 'bg-line-strong', i === at && !done && 'bg-ink')} />
        ))}
      </span>
      <span>{StatusHelper.getStatusLabel(status)}</span>
      <span className="sr-only">, langkah {at + 1} daripada {STATUS_ORDER.length}</span>
    </span>
  );
};

export default StatusPill;
