import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cx } from './cx';
import { TONES, Tone } from './tones';

export interface ChipProps {
  tone?: Tone;
  icon?: LucideIcon;
  dot?: boolean;
  size?: 'sm' | 'md';
  className?: string;
  children: React.ReactNode;
}

const Chip: React.FC<ChipProps> = ({ tone = 'neutral', icon: Icon, dot, size = 'sm', className, children }) => (
  <span
    className={cx(
      'inline-flex items-center gap-1.5 border rounded-full font-bold whitespace-nowrap max-w-full',
      size === 'sm' ? 'h-7 px-2.5 text-xs' : 'h-8 px-3 text-sm',
      TONES[tone].soft, className,
    )}
  >
    {dot && <span className={cx('w-1.5 h-1.5 rounded-full shrink-0', TONES[tone].dot)} aria-hidden />}
    {Icon && <Icon className="w-3.5 h-3.5 shrink-0" strokeWidth={2.25} aria-hidden />}
    <span className="truncate">{children}</span>
  </span>
);

export default Chip;
