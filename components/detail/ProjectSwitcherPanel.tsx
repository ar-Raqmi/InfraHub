import React from 'react';
import { Search } from 'lucide-react';
import { Project, ProjectStatus } from '../../types';

interface ProjectSwitcherPanelProps {
  projects: Project[];
  activeId?: number;
  query: string;
  onQueryChange: (q: string) => void;
  showSiap: boolean;
  onShowSiapChange: (v: boolean) => void;
  onPick: (p: Project) => void;
  autoFocusSearch: boolean;
  listClassName: string;
}

// Search + list for switching project; the desktop dropdown and the phone sheet share it.
const ProjectSwitcherPanel: React.FC<ProjectSwitcherPanelProps> = ({
  projects, activeId, query, onQueryChange, showSiap, onShowSiapChange, onPick, autoFocusSearch, listClassName
}) => (
  <>
    <div className="p-4 border-b border-slate-100 bg-slate-50/50">
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Cari No. Fail atau Nama Projek..."
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium max-md:min-h-[44px] max-md:text-base"
          autoFocus={autoFocusSearch}
        />
      </div>
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer select-none max-md:min-h-[44px]">
          <input
            type="checkbox"
            checked={showSiap}
            onChange={(e) => onShowSiapChange(e.target.checked)}
            className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 border-slate-300"
          />
          <span className="text-xs font-bold text-slate-600">Tunjuk Projek Siap</span>
        </label>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{projects.length} Projek Dijumpai</span>
      </div>
    </div>
    <div className={listClassName}>
      {projects.length > 0 ? (
        projects.map((p) => (
          <button
            key={p.id}
            onClick={() => onPick(p)}
            className={`w-full text-left p-3 rounded-xl transition-all mb-1 group/item ${p.id === activeId ? 'bg-emerald-50 ring-1 ring-emerald-500/20' : 'hover:bg-slate-50'}`}
          >
            <div className="flex items-start gap-3">
              <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${p.status === ProjectStatus.SIAP ? 'bg-emerald-500' : 'bg-amber-400'}`}></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <span className="text-[10px] font-black text-slate-400 font-mono uppercase tracking-tighter">{p.noFail}</span>
                  {p.id === activeId && <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded uppercase">Aktif</span>}
                </div>
                <h4 className="text-xs font-bold text-slate-800 leading-normal line-clamp-2 md:line-clamp-none group-hover/item:text-emerald-700 transition-colors">
                  {p.namaProjek}
                </h4>
              </div>
            </div>
          </button>
        ))
      ) : (
        <div className="p-8 text-center">
          <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <Search className="w-6 h-6 text-slate-300" />
          </div>
          <p className="text-sm font-bold text-slate-400">Tiada projek yang sepadan.</p>
        </div>
      )}
    </div>
  </>
);

export default ProjectSwitcherPanel;
