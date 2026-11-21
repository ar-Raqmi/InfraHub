import React from 'react';
import { Lock } from 'lucide-react';
import { cx } from './cx';

export type ContractStatus = 'DRAF' | 'AKTIF' | 'DITUTUP';

export interface ContractChipProps {
  code: string;
  status: ContractStatus;
  /** Rate-book name, e.g. "Kadar 2026 v3". */
  book?: string;
  /** Second line in the large chip, e.g. "dikunci 12 Mac · 31 item". */
  meta?: string;
  locked?: boolean;
  size?: 'sm' | 'lg';
  className?: string;
}

// DRAF is hatched (not live yet); DITUTUP is desaturated but still purple: it is still a contract.
const STATUS_STYLE: Record<ContractStatus, { box: string; dot: string; word: string }> = {
  AKTIF: { box: 'bg-kontrak-tint border-kontrak-line text-kontrak', dot: 'bg-kontrak', word: 'text-kontrak' },
  DRAF: { box: 'ih-hatch bg-surface border-dashed border-kontrak-soft text-kontrak', dot: 'border-2 border-kontrak-soft bg-surface', word: 'text-kontrak-soft' },
  DITUTUP: { box: 'bg-paper-deep border-line-strong text-[#5E5A78]', dot: 'bg-[#9C97B8]', word: 'text-[#5E5A78]' },
};

const ContractChip: React.FC<ContractChipProps> = ({ code, status, book, meta, locked, size = 'sm', className }) => {
  const s = STATUS_STYLE[status];
  const label = `Kontrak ${code}${book ? `, ${book}` : ''}, status ${status}`;
  if (size === 'sm') {
    return (
      <span aria-label={label} className={cx('inline-flex items-center gap-1.5 h-7 pl-2 pr-2.5 border rounded-full text-xs font-bold whitespace-nowrap max-w-full ih-num', s.box, className)}>
        <span className={cx('w-2 h-2 rounded-full shrink-0', s.dot)} aria-hidden />
        <span className="truncate">{code}</span>
        <span className="opacity-50" aria-hidden>·</span>
        <span className={cx('tracking-wider', s.word)}>{status}</span>
        {locked && <Lock className="w-3 h-3 shrink-0" strokeWidth={2.5} aria-hidden />}
      </span>
    );
  }
  return (
    <div aria-label={label} className={cx('flex items-start gap-3 border rounded-ih-md px-3.5 py-3', s.box, className)}>
      <span className={cx('mt-1.5 w-2.5 h-2.5 rounded-full shrink-0', s.dot)} aria-hidden />
      <div className="min-w-0">
        <p className="font-bold text-[15px] leading-snug ih-num">
          Kontrak {code}{book && <span className="font-semibold"> · {book}</span>}
          <span className={cx('ml-2 text-[11px] tracking-wider align-middle', s.word)}>{status}</span>
        </p>
        {(meta || locked) && (
          <p className="mt-0.5 text-[13px] opacity-80 flex items-center gap-1.5">
            {locked && <Lock className="w-3.5 h-3.5 shrink-0" strokeWidth={2.25} aria-hidden />}
            <span className="min-w-0">{meta}</span>
          </p>
        )}
      </div>
    </div>
  );
};

export default ContractChip;
