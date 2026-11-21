import React from 'react';
import { cx } from './cx';

export interface CardProps extends React.HTMLAttributes<HTMLElement> {
  /** ink = the one "do this next" card per screen; sunken = grouped secondary content. */
  variant?: 'surface' | 'ink' | 'sunken';
  padding?: 'none' | 'md' | 'lg';
  as?: 'section' | 'div' | 'article';
}

const VARIANTS = {
  surface: 'bg-surface border border-line text-ink',
  ink: 'bg-ink text-paper border border-ink',
  sunken: 'bg-paper-deep border border-line text-ink',
};

const PADDING = { none: '', md: 'p-4 md:p-5', lg: 'p-5 md:p-7' };

const Card: React.FC<CardProps> = ({ variant = 'surface', padding = 'md', as: Tag = 'section', className, ...rest }) => (
  <Tag className={cx('rounded-ih-lg min-w-0', VARIANTS[variant], PADDING[padding], className)} {...rest} />
);

export default Card;
