import React from 'react';
import { cx } from './cx';
import { TONES, Tone } from './tones';

export interface StatTileProps {
  value: React.ReactNode;
  label: string;
  hint?: string;
  /** Colours the number only; neutral reads as ink. */
  tone?: Tone;
  onClick?: () => void;
  className?: string;
}

const StatTile: React.FC<StatTileProps> = ({ value, label, hint, tone = 'neutral', onClick, className }) => {
  const body = (
    <>
      <span className={cx('block font-display font-extrabold text-[2rem] leading-none ih-num tracking-tight', TONES[tone].text)}>{value}</span>
      <span className="block mt-2 text-sm font-bold text-ink leading-snug">{label}</span>
      {hint && <span className="block text-[13px] text-muted mt-0.5">{hint}</span>}
    </>
  );
  const cls = cx('block text-left bg-surface border border-line rounded-ih-lg p-4 min-h-[112px] min-w-0', className);
  return onClick
    ? <button type="button" onClick={onClick} className={cx(cls, 'hover:border-ink transition-colors')}>{body}</button>
    : <div className={cls}>{body}</div>;
};

export default StatTile;
