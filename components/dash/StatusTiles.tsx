import React from 'react';
import { Zap, FileClock, Clock, ClipboardCheck, Banknote, CheckCircle } from 'lucide-react';
import { Project, ProjectStatus, getStatusLabel } from '../../types';

const TILES = [
  { status: ProjectStatus.FASA_DRAF, Icon: Zap, active: 'border-slate-500 ring-2 ring-slate-500/20', ghost: 'text-slate-500', badge: 'bg-slate-50 text-slate-600 group-hover:bg-slate-500', dot: 'bg-slate-400' },
  { status: ProjectStatus.MENUNGGU_LANTIKAN, Icon: FileClock, active: 'border-yellow-500 ring-2 ring-yellow-500/20', ghost: 'text-slate-500', badge: 'bg-slate-100 text-slate-600 group-hover:bg-slate-600', dot: 'bg-yellow-500' },
  { status: ProjectStatus.DALAM_PROSES, Icon: Clock, active: 'border-blue-500 ring-2 ring-blue-500/20', ghost: 'text-blue-500', badge: 'bg-blue-50 text-blue-600 group-hover:bg-blue-500', dot: 'bg-blue-500' },
  { status: ProjectStatus.PEMERIKSAAN_TAPAK, Icon: ClipboardCheck, active: 'border-indigo-500 ring-2 ring-indigo-500/20', ghost: 'text-indigo-500', badge: 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-500', dot: 'bg-indigo-500' },
  { status: ProjectStatus.TUNTUTAN_BAYARAN, Icon: Banknote, active: 'border-orange-500 ring-2 ring-orange-500/20', ghost: 'text-orange-500', badge: 'bg-orange-50 text-orange-600 group-hover:bg-orange-500', dot: 'bg-orange-500' },
  { status: ProjectStatus.SIAP, Icon: CheckCircle, active: 'border-emerald-500 ring-2 ring-emerald-500/20', ghost: 'text-emerald-500', badge: 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-500', dot: 'bg-emerald-500' },
];

interface StatusTilesProps {
  projects: Project[];
  statusFilter: ProjectStatus | 'ALL';
  onToggle: (status: ProjectStatus) => void;
}

// Phones get a 3x2 grid of compact tiles; md+ keeps the original large cards.
const StatusTiles: React.FC<StatusTilesProps> = ({ projects, statusFilter, onToggle }) => (
  <div className="grid grid-cols-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2 md:gap-6">
    {TILES.map(({ status, Icon, active, ghost, badge, dot }) => (
      <div
        key={status}
        role="button"
        aria-pressed={statusFilter === status}
        onClick={() => onToggle(status)}
        className={`cursor-pointer bg-white rounded-[2rem] p-6 shadow-xl shadow-slate-200/50 hover:shadow-2xl transition-all group relative overflow-hidden border max-md:rounded-2xl max-md:p-3 max-md:min-h-[84px] max-md:flex max-md:flex-col max-md:justify-between ${statusFilter === status ? active : 'border-slate-100'}`}
      >
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity max-md:hidden">
          <Icon className={`w-24 h-24 ${ghost}`} />
        </div>
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 group-hover:text-white transition-colors duration-200 max-md:hidden ${badge}`}>
          <Icon className="w-7 h-7" />
        </div>
        <p className="text-3xl font-black text-slate-900 mb-1 max-md:text-2xl max-md:mb-0 max-md:flex max-md:items-center max-md:gap-1.5">
          <span className={`md:hidden w-2 h-2 rounded-full shrink-0 ${dot}`}></span>
          {projects.filter(p => p.status === status).length}
        </p>
        <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider max-md:leading-tight max-md:text-slate-500">{getStatusLabel(status)}</p>
      </div>
    ))}
  </div>
);

export default StatusTiles;
