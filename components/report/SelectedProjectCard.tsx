import React from 'react';
import { Project, ProjectStatus, getStatusLabel } from '../../types';
import ExpandableText from '../ExpandableText';

interface SelectedProjectCardProps {
  project: Project;
  label: string;
  onChange?: () => void;
}

const SelectedProjectCard: React.FC<SelectedProjectCardProps> = ({ project, label, onChange }) => (
  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-left">
    <div className="flex items-center justify-between gap-2">
      <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">{label}</p>
      <span className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
        <span className={`w-2 h-2 rounded-full ${project.status === ProjectStatus.FASA_DRAF ? 'bg-slate-300' : 'bg-yellow-400'}`} />
        {getStatusLabel(project.status)}
      </span>
    </div>
    <span className="inline-block mt-2 text-xs font-black px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600">{project.noFail || 'TIADA NO FAIL'}</span>
    <div className="mt-2">
      <ExpandableText text={project.namaProjek || ''} lines={3} className="text-sm font-black uppercase leading-snug text-emerald-950 [overflow-wrap:anywhere]" />
    </div>
    {onChange && (
      <button onClick={onChange} className="mt-1 h-11 px-4 rounded-xl bg-white border border-emerald-200 text-sm font-bold text-emerald-800 active:bg-emerald-100">
        Tukar projek
      </button>
    )}
  </div>
);

export default SelectedProjectCard;
