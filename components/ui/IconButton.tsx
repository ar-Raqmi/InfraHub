import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cx } from './cx';

export interface IconButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  icon: LucideIcon;
  /** Required: becomes aria-label and title, because the button has no visible text. */
  label: string;
  variant?: 'ghost' | 'outline' | 'ink';
}

const VARIANTS = {
  ghost: 'text-muted hover:text-ink hover:bg-paper-deep',
  outline: 'bg-surface text-ink border border-line-strong hover:border-ink',
  ink: 'bg-ink text-paper hover:bg-ink-soft',
};

const IconButton: React.FC<IconButtonProps> = ({ icon: Icon, label, variant = 'ghost', className, type = 'button', ...rest }) => (
  <button
    type={type}
    aria-label={label}
    title={label}
    className={cx('w-11 h-11 shrink-0 inline-flex items-center justify-center rounded-ih-md transition-colors disabled:opacity-45', VARIANTS[variant], className)}
    {...rest}
  >
    <Icon className="w-5 h-5" strokeWidth={2} aria-hidden />
  </button>
);

export default IconButton;
