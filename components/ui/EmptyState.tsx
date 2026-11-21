import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cx } from './cx';

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  body?: string;
  action?: React.ReactNode;
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon: Icon, title, body, action, className }) => (
  <div className={cx('flex flex-col items-center text-center px-6 py-10 border border-dashed border-line-strong rounded-ih-lg bg-paper', className)}>
    <span className="w-12 h-12 rounded-ih-md bg-surface border border-line inline-flex items-center justify-center text-muted mb-4">
      <Icon className="w-6 h-6" strokeWidth={1.75} aria-hidden />
    </span>
    <h3 className="font-display text-title text-ink">{title}</h3>
    {body && <p className="text-sm text-muted mt-1 max-w-sm">{body}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
);

export default EmptyState;
