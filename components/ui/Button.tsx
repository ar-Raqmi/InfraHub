import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cx } from './cx';

export type ButtonVariant = 'primary' | 'ink' | 'outline' | 'ghost' | 'kontrak' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
  /** Second line under the label: turns a large button into a "choice" (e.g. Kekal kadar kontrak). */
  hint?: string;
  block?: boolean;
}

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-emerald-bright text-ink hover:bg-emerald active:bg-emerald-deep active:text-white',
  ink: 'bg-ink text-paper hover:bg-ink-soft',
  outline: 'bg-surface text-ink border-[1.5px] border-ink hover:bg-paper',
  ghost: 'bg-transparent text-ink hover:bg-paper-deep',
  kontrak: 'bg-kontrak text-white hover:bg-kontrak-soft',
  danger: 'bg-surface text-danger border-[1.5px] border-danger-line hover:bg-danger-tint',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'min-h-11 md:min-h-9 px-3.5 text-sm rounded-ih-sm gap-1.5',
  md: 'min-h-11 px-4 text-[15px] rounded-ih-md gap-2',
  lg: 'min-h-14 px-5 text-base rounded-ih-lg gap-2.5',
};

const Button: React.FC<ButtonProps> = ({
  variant = 'primary', size = 'md', icon: Icon, hint, block, className, children, type = 'button', ...rest
}) => (
  <button
    type={type}
    className={cx(
      'inline-flex items-center font-bold transition-colors disabled:opacity-45 disabled:pointer-events-none',
      hint ? 'justify-start text-left py-3' : 'justify-center',
      VARIANTS[variant], SIZES[size], block && 'w-full', className,
    )}
    {...rest}
  >
    {Icon && <Icon className={size === 'lg' ? 'w-5 h-5 shrink-0' : 'w-[18px] h-[18px] shrink-0'} strokeWidth={2.25} aria-hidden />}
    {hint ? (
      <span className="flex flex-col min-w-0">
        <span>{children}</span>
        <span className="text-sm font-normal opacity-75 mt-0.5">{hint}</span>
      </span>
    ) : children}
  </button>
);

export default Button;
