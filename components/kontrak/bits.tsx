// Small presentational pieces shared by the Kontrak screens (no data, no business rules).
import React from 'react';
import { Search, type LucideIcon } from 'lucide-react';
import { Button, Input } from '../ui';
import { money } from './format';
import { cx } from '../ui/cx';

export const SearchField: React.FC<{ label: string; value: string; onChange: (v: string) => void; placeholder?: string; testId?: string; autoFocus?: boolean; className?: string }> = ({ label, value, onChange, placeholder, testId, autoFocus, className }) => (
  <div className={cx('relative', className)}>
    <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden />
    <Input aria-label={label} placeholder={placeholder ?? label} value={value} onChange={e => onChange(e.target.value)} className="pl-9" data-testid={testId} autoFocus={autoFocus} />
  </div>
);

const NOTICE_TONE = {
  error: 'border-danger-line bg-danger-tint text-danger font-bold',
  ok: 'border-emerald-200 bg-emerald-tint text-emerald-deep font-bold',
  warn: 'border-amber-line bg-amber-tint text-amber',
} as const;

/** Inline result line: errors are announced (role=alert), the rest politely (role=status). */
export const Notice: React.FC<{ tone: keyof typeof NOTICE_TONE; children: React.ReactNode; testId?: string; className?: string }> = ({ tone, children, testId, className }) => (
  <p role={tone === 'error' ? 'alert' : 'status'} data-testid={testId} className={cx('rounded-ih-md border px-3 py-2 text-sm', NOTICE_TONE[tone], className)}>{children}</p>
);

export const TextButton: React.FC<{ onClick: () => void; children: React.ReactNode }> = ({ onClick, children }) => (
  <button type="button" className="font-bold text-kontrak underline min-h-11" onClick={onClick}>{children}</button>
);

/** "Tunjuk N lagi" for long lists rendered a page at a time. */
export const MoreButton: React.FC<{ shown: number; total: number; page: number; onMore: () => void }> = ({ shown, total, page, onMore }) =>
  total > shown ? <Button variant="outline" onClick={onMore}>Tunjuk {Math.min(page, total - shown)} lagi (baki {total - shown})</Button> : null;

/** Unit + rate cells of a rate-book line; on phones the unit moves under the text. */
export const UnitRate: React.FC<{ unit?: string; rate?: number }> = ({ unit, rate }) => (
  <>
    <span className="hidden md:block w-12 shrink-0 text-sm text-muted text-right">{unit}</span>
    <span className="w-24 md:w-28 shrink-0 text-[15px] font-bold text-ink text-right ih-num">{money(rate)}</span>
  </>
);

/** Section heading inside a card, with an optional purple icon. */
export const CardTitle: React.FC<{ icon?: LucideIcon; className?: string; children: React.ReactNode }> = ({ icon: Icon, className, children }) => (
  <h3 className={cx('font-display font-bold text-title text-ink flex items-center gap-2', className)}>{Icon && <Icon className="w-5 h-5 text-kontrak" aria-hidden />}{children}</h3>
);

/** Back + forward buttons at the end of a wizard step, with the step's error above them. */
export const StepFooter: React.FC<{ error?: string; back: React.ReactNode; next: React.ReactNode }> = ({ error, back, next }) => (
  <>
    {error && <Notice tone="error">{error}</Notice>}
    <div className="flex flex-wrap justify-between gap-2">{back}{next}</div>
  </>
);
