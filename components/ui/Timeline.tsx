import React from 'react';
import { cx } from './cx';
import { TONES, Tone } from './tones';

export interface TimelineItem {
  id: string;
  at: string;
  title: string;
  actor?: string;
  body?: string;
  tone?: Tone;
  /** Short marker before the title, e.g. "v3". */
  tag?: string;
}

export interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

/** Commit-log style history: newest first, one dot per event. */
const Timeline: React.FC<TimelineProps> = ({ items, className }) => (
  <ol className={cx('relative', className)}>
    {items.map((item, i) => {
      const tone = item.tone ?? 'neutral';
      return (
        <li key={item.id} className="relative flex gap-4 pb-5 last:pb-0">
          {i < items.length - 1 && <span className="absolute left-[7px] top-5 bottom-0 w-0.5 bg-line" aria-hidden />}
          <span className={cx('relative mt-1 w-4 h-4 shrink-0 rounded-full ring-4 ring-surface', TONES[tone].dot)} aria-hidden />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              {item.tag && <span className={cx('text-xs font-bold px-1.5 py-0.5 rounded border ih-num', TONES[tone].soft)}>{item.tag}</span>}
              <span className="font-bold text-ink text-[15px]">{item.title}</span>
            </div>
            <p className="text-[13px] text-muted mt-0.5 ih-num">{item.at}{item.actor && <> · oleh {item.actor}</>}</p>
            {item.body && <p className="text-sm text-ink-soft mt-1.5">{item.body}</p>}
          </div>
        </li>
      );
    })}
  </ol>
);

export default Timeline;
