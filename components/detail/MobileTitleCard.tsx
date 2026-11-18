import React, { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { ProjectStatus } from '../../types';
import ExpandableText from '../ExpandableText';
import { STATUS_OPTIONS, parseProgress } from './progress';

interface MobileTitleCardProps {
  title: string;
  status: ProjectStatus;
  onStatusChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  progress: number;
  onProgressChange: (val: number) => void;
  readOnly: boolean;
}

// Phone-only card under the header: the project title (clamped, "Lihat penuh" to
// read all of it) with the status and Prestasi Projek that CostHUD shows on desktop.
const MobileTitleCard: React.FC<MobileTitleCardProps> = ({ title, status, onStatusChange, progress, onProgressChange, readOnly }) => {
  const [localProgress, setLocalProgress] = useState(String(progress ?? 0));

  useEffect(() => { setLocalProgress(String(progress ?? 0)); }, [progress]);

  const commitProgress = () => {
    const val = parseProgress(localProgress);
    onProgressChange(val);
    setLocalProgress(String(val));
  };

  return (
    <div className="md:hidden mb-4 bg-white border border-slate-200 rounded-3xl p-4">
      {title && <ExpandableText text={title} lines={3} className="text-[15px] leading-[1.45] font-bold uppercase text-slate-900" />}
      <div className="mt-2 grid grid-cols-[1fr_auto] gap-2">
        <div className="relative">
          <select
            name="status"
            aria-label="Status"
            value={status}
            onChange={onStatusChange}
            disabled={readOnly}
            className="appearance-none w-full h-12 bg-slate-100 border-2 border-slate-200 rounded-xl pl-3 pr-9 text-base font-black text-slate-700 uppercase tracking-wide disabled:opacity-50"
          >
            {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
        <label className="relative w-32 h-12 rounded-xl bg-emerald-50 border border-emerald-100">
          <span className="absolute left-3 top-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none pointer-events-none">Prestasi Projek</span>
          <input
            type="number"
            inputMode="decimal"
            value={localProgress}
            onChange={(e) => setLocalProgress(e.target.value)}
            onBlur={commitProgress}
            onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
            disabled={readOnly}
            className="w-full h-full bg-transparent pt-4 pl-3 pr-7 text-base font-black text-emerald-600 outline-none"
          />
          <span className="absolute right-3 bottom-2 text-sm font-black text-emerald-600 pointer-events-none">%</span>
        </label>
      </div>
    </div>
  );
};

export default MobileTitleCard;
