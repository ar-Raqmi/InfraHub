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
    `flex-1 h-11 px-2 rounded-ih-sm flex items-center justify-center gap-1.5 text-[13px] font-bold ${active ? 'bg-ink text-paper' : 'text-ink'}`;

// Sticky under the 56 px mobile top bar; solid background because blur is disabled app-wide.
const MobileToolbar: React.FC<MobileToolbarProps> = ({ viewMode, onViewModeChange, searchTerm, onSearchChange, activeFilterCount, onOpenFilter, onOpenActions }) => (
    <div className="md:hidden sticky top-14 z-30 -mx-4 sm:-mx-6 !-mt-4 px-4 sm:px-6 pt-3 pb-2.5 bg-surface border-b border-line flex flex-col gap-2.5">
        {viewMode === 'list' && (
            <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted" />
                <input
                    type="text"
                    placeholder="Cari No. Fail, Aduan, Projek, Syarikat..."
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="w-full h-11 pl-11 pr-4 rounded-ih-md bg-surface border border-line-strong focus:border-emerald focus:ring-2 focus:ring-emerald/25 outline-none text-base text-ink placeholder:text-muted-faint"
                />
            </div>
        )}
        <div className="flex items-center gap-2">
            <div className="flex-1 flex p-0.5 bg-surface border border-line-strong rounded-ih-md">
                <button onClick={() => onViewModeChange('list')} aria-pressed={viewMode === 'list'} className={segmentClass(viewMode === 'list')}>
                    <List className="w-4 h-4" /> Senarai
                </button>
                <button onClick={() => onViewModeChange('group')} aria-pressed={viewMode === 'group'} className={segmentClass(viewMode === 'group')}>
                    <Grid className="w-4 h-4" /> Syarikat
                </button>
            </div>
            <button
                onClick={onOpenFilter}
                className={`relative h-12 px-3.5 rounded-ih-md border flex items-center gap-1.5 text-[13px] font-bold ${activeFilterCount > 0 ? 'bg-emerald-tint text-emerald-deep border-emerald' : 'bg-surface border-line-strong text-ink'}`}
            >
                <Filter className="w-4 h-4" /> Tapis
                {activeFilterCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-ink text-paper text-[11px] font-bold flex items-center justify-center rounded-full">{activeFilterCount}</span>
                )}
            </button>
            <button onClick={onOpenActions} aria-label="Lagi tindakan" title="Lagi tindakan" className="w-12 h-12 rounded-ih-md border border-line-strong bg-surface flex items-center justify-center text-ink">
                <MoreHorizontal className="w-5 h-5" />
            </button>
        </div>
    </div>
);

export default MobileToolbar;
