import React from 'react';
import { cx } from './cx';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
}

export interface TabsProps {
  items: TabItem[];
  value: string;
  onChange: (id: string) => void;
  label: string;
  className?: string;
}

/** Segmented tabs; the track scrolls sideways on a narrow phone instead of wrapping. */
const Tabs: React.FC<TabsProps> = ({ items, value, onChange, label, className }) => (
  <div className={cx('max-w-full overflow-x-auto', className)}>
    <div role="tablist" aria-label={label} className="inline-flex gap-1 p-1 bg-paper-deep border border-line rounded-ih-md">
      {items.map(t => {
        const active = t.id === value;
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.id)}
            className={cx(
              'min-h-11 md:min-h-10 px-4 rounded-ih-sm text-[15px] font-bold whitespace-nowrap inline-flex items-center gap-2 transition-colors',
              active ? 'bg-surface text-ink border border-line-strong' : 'text-muted hover:text-ink border border-transparent',
            )}
          >
            {t.label}
            {t.count !== undefined && (
              <span className={cx('min-w-6 h-6 px-1.5 rounded-full text-xs inline-flex items-center justify-center ih-num', active ? 'bg-ink text-paper' : 'bg-line text-ink-soft')}>{t.count}</span>
            )}
          </button>
        );
      })}
    </div>
  </div>
);

export default Tabs;
