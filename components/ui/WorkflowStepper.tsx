import React from 'react';
import { Check } from 'lucide-react';
import { ProjectStatus } from '../../types';
import { StatusHelper } from '../../services/StatusHelper';
import { cx } from './cx';
import { STATUS_ORDER, statusIndex } from './workflow';

export interface WorkflowStepperProps {
  current: ProjectStatus;
  orientation?: 'vertical' | 'horizontal';
  /** Right-hand note per step: a date for past steps, an owner ("PT") for future ones. */
  notes?: Partial<Record<ProjectStatus, string>>;
  /** Shown under the current step in the vertical layout ("giliran anda" card). */
  children?: React.ReactNode;
  className?: string;
}

type StepState = 'done' | 'current' | 'todo';

const stateOf = (i: number, at: number, current: ProjectStatus): StepState => {
  if (i < at || (i === at && current === ProjectStatus.SIAP)) return 'done';
  return i === at ? 'current' : 'todo';
};

const Node: React.FC<{ state: StepState; n: number }> = ({ state, n }) => (
  <span
    className={cx(
      'w-8 h-8 shrink-0 rounded-full inline-flex items-center justify-center text-[13px] font-bold ih-num',
      state === 'done' && 'bg-emerald text-white',
      state === 'current' && 'bg-surface text-ink border-2 border-ink',
      state === 'todo' && 'bg-surface text-muted border border-line-strong',
    )}
    aria-hidden
  >
    {state === 'done' ? <Check className="w-4 h-4" strokeWidth={3} /> : n}
  </span>
);

const Vertical: React.FC<WorkflowStepperProps> = ({ current, notes, children, className }) => {
  const at = statusIndex(current);
  return (
    <ol className={cx('relative', className)}>
      {STATUS_ORDER.map((s, i) => {
        const state = stateOf(i, at, current);
        const last = i === STATUS_ORDER.length - 1;
        return (
          <li key={s} className="relative flex gap-3 pb-1" aria-current={state === 'current' ? 'step' : undefined}>
            {!last && <span className={cx('absolute left-4 top-8 bottom-0 w-0.5 -translate-x-1/2', i < at ? 'bg-emerald' : 'bg-line')} aria-hidden />}
            <Node state={state} n={i + 1} />
            <div className="flex-1 min-w-0 pb-3">
              <div className="min-h-8 flex items-center justify-between gap-3">
                <span className={cx('text-[15px]', state === 'current' ? 'font-bold text-ink' : state === 'done' ? 'text-ink' : 'text-muted')}>
                  {StatusHelper.getStatusLabel(s)}
                </span>
                {notes?.[s] && <span className="text-[13px] text-muted ih-num shrink-0">{notes[s]}</span>}
              </div>
              {state === 'current' && children && <div className="mt-2">{children}</div>}
            </div>
          </li>
        );
      })}
    </ol>
  );
};

const Horizontal: React.FC<WorkflowStepperProps> = ({ current, notes, className }) => {
  const at = statusIndex(current);
  return (
    <ol className={cx('grid grid-cols-6', className)}>
      {STATUS_ORDER.map((s, i) => {
        const state = stateOf(i, at, current);
        return (
          <li key={s} className="relative flex flex-col items-start gap-2 pr-2 min-w-0" aria-current={state === 'current' ? 'step' : undefined}>
            {i < STATUS_ORDER.length - 1 && <span className={cx('absolute left-10 right-2 top-4 h-0.5 -translate-y-1/2', i < at ? 'bg-emerald' : 'bg-line')} aria-hidden />}
            <Node state={state} n={i + 1} />
            <span className={cx('text-[13px] leading-tight clamp-2', state === 'current' ? 'font-bold text-ink' : state === 'done' ? 'text-ink' : 'text-muted')}>
              {StatusHelper.getStatusLabel(s)}
            </span>
            {notes?.[s] && <span className="text-xs text-muted ih-num">{notes[s]}</span>}
          </li>
        );
      })}
    </ol>
  );
};

const WorkflowStepper: React.FC<WorkflowStepperProps> = ({ orientation = 'vertical', ...props }) =>
  orientation === 'vertical' ? <Vertical {...props} /> : <Horizontal {...props} />;

export default WorkflowStepper;
