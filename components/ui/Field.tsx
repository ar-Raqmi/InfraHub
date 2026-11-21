import React from 'react';
import { ChevronDown } from 'lucide-react';
import { cx } from './cx';

export interface FieldProps {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const Field: React.FC<FieldProps> = ({ label, htmlFor, hint, error, required, children, className }) => (
  <div className={cx('flex flex-col gap-1.5 min-w-0', className)}>
    <label htmlFor={htmlFor} className="text-sm font-bold text-ink">
      {label}{required && <span className="text-danger" aria-hidden> *</span>}
    </label>
    {children}
    {error
      ? <p id={`${htmlFor}-error`} className="text-[13px] font-bold text-danger">{error}</p>
      : hint && <p id={`${htmlFor}-hint`} className="text-[13px] text-muted">{hint}</p>}
  </div>
);

// 16px text below md stops iOS from zooming into the field.
const CONTROL = 'w-full min-h-12 bg-surface border rounded-ih-md px-3.5 text-base md:text-[15px] text-ink placeholder:text-muted-faint transition-colors focus:outline-none focus:border-emerald focus:ring-2 focus:ring-emerald/25 disabled:bg-paper-deep disabled:text-muted';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
  /** Unit shown inside the right edge, e.g. "m" or "RM". */
  suffix?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ invalid, suffix, className, ...rest }, ref) => (
  <div className="relative">
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cx(CONTROL, invalid ? 'border-danger' : 'border-line-strong', suffix && 'pr-12', rest.inputMode === 'decimal' && 'ih-num', className)}
      {...rest}
    />
    {suffix && <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-muted pointer-events-none">{suffix}</span>}
  </div>
));
Input.displayName = 'Input';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({ invalid, className, children, ...rest }, ref) => (
  <div className="relative">
    <select
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cx(CONTROL, 'appearance-none pr-10', invalid ? 'border-danger' : 'border-line-strong', className)}
      {...rest}
    >
      {children}
    </select>
    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted pointer-events-none" aria-hidden />
  </div>
));
Select.displayName = 'Select';
