import React from 'react';
import { ChevronRight } from 'lucide-react';
import { Contract, Project, formatCurrency } from '../../types';
import ExpandableText from '../ExpandableText';
import { ContractChip, StatusPill } from '../ui';
import { NoticeChip } from './StatusChip';

interface ProjectCardProps {
  project: Project;
  pjaName?: string;
  pendingNotice: string | null;
  contract?: Contract;
  onOpen: () => void;
  onProgressCommit: (value: string) => void;
}

const Meta: React.FC<{ label: string; value?: string; empty: string; wide?: boolean }> = ({ label, value, empty, wide }) => (
  <div className={`min-w-0 ${wide ? 'col-span-2' : ''}`}>
    <p className="ih-eyebrow text-muted">{label}</p>
    {value
      ? <p className="text-sm font-bold text-ink break-words [overflow-wrap:anywhere]">{value}</p>
      : <p className="text-sm text-muted italic">{empty}</p>}
  </div>
);

// Phone replacement for one row of the dashboard project table.
const ProjectCard: React.FC<ProjectCardProps> = ({ project, pjaName, pendingNotice, contract, onOpen, onProgressCommit }) => {
  const progress = project.peratusSiap || 0;

  return (
    <article onClick={onOpen} className="bg-surface rounded-ih-lg border border-line p-4 cursor-pointer active:bg-paper">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5 min-w-0">
          <StatusPill status={project.status} />
          {pendingNotice && <NoticeChip notice={pendingNotice} />}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <span className="font-bold text-ink ih-num text-sm">{formatCurrency(project.kosProjek)}</span>
          <ChevronRight className="w-4 h-4 text-muted" aria-hidden />
        </div>
      </div>

      <div className="mt-3">
        <ExpandableText text={project.namaProjek || ''} lines={3} className="text-[15px] font-bold text-ink leading-snug [overflow-wrap:anywhere]" />
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-2">
        <Meta label="No. Fail" value={project.noFail} empty="Tiada No. Fail" />
        {pjaName !== undefined && <Meta label="PJA" value={pjaName} empty="-" />}
        <Meta label="Kontraktor" value={project.namaSyarikat} empty="Belum dilantik" wide />
      </div>
      {contract && <ContractChip code={contract.code} status={contract.status} className="mt-3" />}

      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-line">
        <span className="ih-eyebrow text-muted">Kemajuan</span>
        <div className="flex-1 h-1.5 rounded-full bg-paper-deep overflow-hidden">
          <div className="h-full bg-emerald-bright rounded-full" style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} />
        </div>
        <label className="relative w-24 shrink-0" onClick={(e) => e.stopPropagation()}>
          <input
            type="number"
            inputMode="numeric"
            min="0"
            max="100"
            aria-label="Kemajuan (%)"
            defaultValue={progress}
            onBlur={(e) => onProgressCommit(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
            className="w-full h-11 pl-3 pr-7 text-center bg-paper border border-line-strong focus:border-emerald focus:bg-surface focus:ring-2 focus:ring-emerald/25 rounded-ih-md text-base font-bold text-ink ih-num outline-none"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted pointer-events-none">%</span>
        </label>
      </div>
    </article>
  );
};

export default ProjectCard;
