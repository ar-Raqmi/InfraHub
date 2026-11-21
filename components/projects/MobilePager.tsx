import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MobilePagerProps {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    itemsPerPage: number;
    pageInput: string;
    onPageChange: (page: number) => void;
    onPageInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onPageInputBlur: () => void;
    onPageInputKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

const stepClass = "w-11 h-11 flex items-center justify-center rounded-ih-md border border-line-strong bg-surface text-ink disabled:opacity-40 active:bg-paper";

const MobilePager: React.FC<MobilePagerProps> = ({ currentPage, totalPages, totalCount, itemsPerPage, pageInput, onPageChange, onPageInputChange, onPageInputBlur, onPageInputKeyDown }) => (
    <nav aria-label="Muka surat" className="pt-2 pb-24 flex flex-col items-center gap-3">
        <div className="text-sm text-muted ih-num">
            Paparan <span className="font-bold text-ink">{Math.min(totalCount, (currentPage - 1) * itemsPerPage + 1)}</span> hingga <span className="font-bold text-ink">{Math.min(totalCount, currentPage * itemsPerPage)}</span> dari <span className="font-bold text-ink">{totalCount}</span> projek
        </div>
        <div className="flex items-center gap-3">
            <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} aria-label="Muka sebelumnya" className={stepClass}>
                <ChevronLeft className="w-5 h-5" />
            </button>
            <label className="flex items-center gap-2 text-sm text-muted">
                Muka
                <input
                    type="number"
                    inputMode="numeric"
                    aria-label="Muka"
                    value={pageInput}
                    onChange={onPageInputChange}
                    onBlur={onPageInputBlur}
                    onKeyDown={onPageInputKeyDown}
                    className="w-16 h-11 text-center text-base font-bold bg-surface border border-line-strong rounded-ih-md outline-none focus:border-emerald text-ink ih-num"
                />
                dari {totalPages}
            </label>
            <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} aria-label="Muka seterusnya" className={stepClass}>
                <ChevronRight className="w-5 h-5" />
            </button>
        </div>
    </nav>
);

export default MobilePager;
