// The project's place in the 6-status workflow, with the 4 phase tabs laid under the statuses they cover.
import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { WorkflowStepper, STATUS_ORDER } from '../ui';
import { cx } from '../ui/cx';
import { ProjectStatus, formatDate, type Project } from '../../types';
import { StatusHelper } from '../../services/StatusHelper';
import type { DetailTab } from './MobileDetailHeader';

/** Which statuses each phase tab works on (tab order = workflow order). */
export const PHASE_STATUSES: Record<string, ProjectStatus[]> = {
  phase1: [ProjectStatus.FASA_DRAF],
  phase2: [ProjectStatus.MENUNGGU_LANTIKAN, ProjectStatus.DALAM_PROSES],
  phase3: [ProjectStatus.PEMERIKSAAN_TAPAK],
  phase4: [ProjectStatus.TUNTUTAN_BAYARAN, ProjectStatus.SIAP],
};

const OWNER: Record<ProjectStatus, string> = {
  [ProjectStatus.FASA_DRAF]: 'PJA',
  [ProjectStatus.MENUNGGU_LANTIKAN]: 'PT',
  [ProjectStatus.DALAM_PROSES]: 'PT',
  [ProjectStatus.PEMERIKSAAN_TAPAK]: 'PJA',
  [ProjectStatus.TUNTUTAN_BAYARAN]: 'PT',
  [ProjectStatus.SIAP]: 'PT',
};

const dateOf = (p: Partial<Project>, s: ProjectStatus): string | undefined => ({
  [ProjectStatus.FASA_DRAF]: p.tarikhBuka,
  [ProjectStatus.MENUNGGU_LANTIKAN]: undefined,
  [ProjectStatus.DALAM_PROSES]: p.tarikhLantikan,
  [ProjectStatus.PEMERIKSAAN_TAPAK]: p.tarikhPemeriksaan,
  [ProjectStatus.TUNTUTAN_BAYARAN]: p.tarikhTuntutanBayaran,
  [ProjectStatus.SIAP]: p.tarikhPadanan,
}[s]);

/** Past steps show their date, future steps show who acts next. */
function stepNotes(p: Partial<Project>, current: ProjectStatus): Partial<Record<ProjectStatus, string>> {
  const at = STATUS_ORDER.indexOf(current);
  const notes: Partial<Record<ProjectStatus, string>> = {};
  STATUS_ORDER.forEach((s, i) => {
    const date = dateOf(p, s);
    if (i <= at && date) notes[s] = formatDate(date);
    else if (i > at) notes[s] = OWNER[s];
  });
  return notes;
}

interface PhaseStepperProps {
  project: Partial<Project>;
  tabs: DetailTab[];
  activeTab: string;
  onTabChange: (id: string) => void;
}

/** Desktop: horizontal stepper, then the phase tabs spanning the columns of their statuses. */
export const PhaseStepperDesktop: React.FC<PhaseStepperProps> = ({ project, tabs, activeTab, onTabChange }) => {
  const current = (project.status as ProjectStatus) || ProjectStatus.FASA_DRAF;
  return (
    <div className="bg-surface border border-line rounded-ih-lg px-5 pt-5 pb-3" data-testid="phase-stepper">
      <WorkflowStepper orientation="horizontal" current={current} notes={stepNotes(project, current)} />
      <div className="mt-4 grid grid-cols-6 gap-2" role="tablist" aria-label="Fasa projek">
        {tabs.map((tab) => {
          const covers = PHASE_STATUSES[tab.id] ?? [];
          const here = covers.includes(current);
          return (
            <button key={tab.id} role="tab" aria-selected={activeTab === tab.id} onClick={() => onTabChange(tab.id)}
              style={{ gridColumn: `span ${covers.length || 1}` }}
              className={cx('min-h-11 px-3 rounded-ih-md text-sm font-bold text-left border transition-colors',
                activeTab === tab.id ? 'bg-ink text-paper border-ink' : 'bg-paper text-ink border-line hover:border-line-strong')}>
              <span className="block">{tab.label}</span>
              {here && <span className={cx('block text-xs font-normal', activeTab === tab.id ? 'text-paper/80' : 'text-emerald-deep')}>Status semasa di sini</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
};

/** Phone: one line with the current step; the full vertical stepper opens on tap. */
export const PhaseStepperPhone: React.FC<{ project: Partial<Project> }> = ({ project }) => {
  const [open, setOpen] = useState(false);
  const current = (project.status as ProjectStatus) || ProjectStatus.FASA_DRAF;
  const at = STATUS_ORDER.indexOf(current);
  return (
    <div className="bg-surface border border-line rounded-ih-lg mb-4" data-testid="phase-stepper-phone">
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open}
        className="w-full min-h-14 px-4 py-2 flex items-center gap-3 text-left">
        <span className="flex gap-1" aria-hidden>
          {STATUS_ORDER.map((s, i) => <span key={s} className={cx('w-2 h-5 rounded-full', i <= at ? 'bg-emerald' : 'bg-line')} />)}
        </span>
        <span className="flex-1 min-w-0">
          <span className="block ih-eyebrow text-muted">Langkah {at + 1} daripada {STATUS_ORDER.length}</span>
          <span className="block text-[15px] font-bold text-ink truncate">{StatusHelper.getStatusLabel(current)}</span>
        </span>
        <ChevronDown className={cx('w-5 h-5 text-muted transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="px-4 pb-2 border-t border-line pt-3">
          <WorkflowStepper current={current} notes={stepNotes(project, current)} />
        </div>
      )}
    </div>
  );
};
