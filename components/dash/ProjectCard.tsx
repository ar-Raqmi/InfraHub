import React from 'react';
import { ChevronRight } from 'lucide-react';
import { Project, formatCurrency } from '../../types';
import ExpandableText from '../ExpandableText';
import { StatusChip, NoticeChip } from './StatusChip';

interface ProjectCardProps {
  project: Project;
  pjaName?: string;
  pendingNotice: string | null;
  onOpen: () => void;
  onProgressCommit: (value: string) => void;
}

const Meta: React.FC<{ label: string; value?: string; empty: string; wide?: boolean }> = ({ label, value, empty, wide }) => (
  <div className={`min-w-0 ${wide ? 'col-span-2' : ''}`}>
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{label}</p>
    {value
      ? <p className="text-sm font-bold text-slate-700 break-words [overflow-wrap:anywhere]">{value}</p>
      : <p className="text-sm text-slate-400 italic">{empty}</p>}
  </div>
);

// Phone replacement for one row of the dashboard project table.
const ProjectCard: React.FC<ProjectCardProps> = ({ project, pjaName, pendingNotice, onOpen, onProgressCommit }) => {
  const progress = project.peratusSiap || 0;

  return (
    <div onClick={onOpen} className="bg-white rounded-2xl border border-slate-200 p-4 cursor-pointer active:bg-emerald-50/40">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5 min-w-0">
          <StatusChip status={project.status} />
          {pendingNotice && <NoticeChip notice={pendingNotice} />}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <span className="font-mono font-bold text-slate-900 tracking-tight text-sm">{formatCurrency(project.kosProjek)}</span>
          <ChevronRight className="w-4 h-4 text-slate-300" />
        </div>
      </div>

      <div className="mt-3">
        <ExpandableText text={project.namaProjek || ''} lines={3} className="text-[15px] font-bold text-slate-900 leading-snug [overflow-wrap:anywhere]" />
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-2">
        <Meta label="No. Fail" value={project.noFail} empty="Tiada No. Fail" />
        {pjaName !== undefined && <Meta label="PJA" value={pjaName} empty="-" />}
        <Meta label="Kontraktor" value={project.namaSyarikat} empty="Belum dilantik" wide />
      </div>

      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-100">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Kemajuan</span>
        <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} />
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
            className="w-full h-11 pl-3 pr-7 text-center bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-200 rounded-xl text-base font-bold text-slate-700 outline-none"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400 pointer-events-none">%</span>
        </label>
      </div>
    </div>
  );
};

export default ProjectCard;
