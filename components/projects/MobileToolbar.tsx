import React from 'react';
import { Filter, Grid, List, MoreHorizontal, Search } from 'lucide-react';

type ViewMode = 'list' | 'group';

interface MobileToolbarProps {
    viewMode: ViewMode;
    onViewModeChange: (mode: ViewMode) => void;
    searchTerm: string;
    onSearchChange: (term: string) => void;
    activeFilterCount: number;
    onOpenFilter: () => void;
    onOpenActions: () => void;
}

const segmentClass = (active: boolean) =>
    `flex-1 h-11 px-2 rounded-[10px] flex items-center justify-center gap-1.5 text-[13px] font-extrabold ${active ? 'bg-white text-emerald-700 border border-slate-200' : 'text-slate-500'}`;

// Sticky under the 56 px mobile top bar; solid background because blur is disabled app-wide.
const MobileToolbar: React.FC<MobileToolbarProps> = ({ viewMode, onViewModeChange, searchTerm, onSearchChange, activeFilterCount, onOpenFilter, onOpenActions }) => (
    <div className="md:hidden sticky top-14 z-30 -mx-4 sm:-mx-6 !-mt-4 px-4 sm:px-6 pt-3 pb-2.5 bg-white border-b border-slate-200 flex flex-col gap-2.5">
        {viewMode === 'list' && (
            <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                    type="text"
                    placeholder="Cari No. Fail, Aduan, Projek, Syarikat..."
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="w-full h-11 pl-11 pr-4 rounded-xl bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 outline-none text-base text-slate-900 placeholder-slate-400 font-medium"
                />
            </div>
        )}
        <div className="flex items-center gap-2">
            <div className="flex-1 flex p-0.5 bg-slate-100 rounded-xl">
                <button onClick={() => onViewModeChange('list')} aria-pressed={viewMode === 'list'} className={segmentClass(viewMode === 'list')}>
                    <List className="w-4 h-4" /> Senarai
                </button>
                <button onClick={() => onViewModeChange('group')} aria-pressed={viewMode === 'group'} className={segmentClass(viewMode === 'group')}>
                    <Grid className="w-4 h-4" /> Syarikat
                </button>
            </div>
            <button
                onClick={onOpenFilter}
                className={`relative h-12 px-3.5 rounded-xl border flex items-center gap-1.5 text-[13px] font-extrabold ${activeFilterCount > 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-white border-slate-200 text-slate-600'}`}
            >
                <Filter className="w-4 h-4" /> Filter
                {activeFilterCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-emerald-600 text-white text-[10px] flex items-center justify-center rounded-full">{activeFilterCount}</span>
                )}
            </button>
            <button onClick={onOpenActions} aria-label="Lagi tindakan" title="Lagi tindakan" className="w-12 h-12 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-500">
                <MoreHorizontal className="w-5 h-5" />
            </button>
        </div>
    </div>
);

export default MobileToolbar;
