import React from 'react';
import { cx } from './cx';

export interface SectionHeaderProps {
  title: string;
  eyebrow?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  /** page = the screen's h1 in display type; section = an h2 inside the page. */
  level?: 'page' | 'section';
  className?: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ title, eyebrow, description, actions, level = 'section', className }) => {
  const Heading = level === 'page' ? 'h1' : 'h2';
  return (
    <header className={cx('flex flex-wrap items-end justify-between gap-x-6 gap-y-3', className)}>
      <div className="min-w-0">
        {eyebrow && <div className="ih-eyebrow text-emerald-deep mb-1.5 flex items-center gap-2">{eyebrow}</div>}
        <Heading className={cx('font-display text-ink', level === 'page' ? 'text-[2rem] md:text-display-xl font-extrabold' : 'text-title md:text-display-m font-bold')}>
          {title}
        </Heading>
        {description && <p className={cx('text-muted mt-1', level === 'page' ? 'text-base' : 'text-sm')}>{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
};

export default SectionHeader;
