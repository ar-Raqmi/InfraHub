import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MobilePagerProps {
  page: number;
  totalPages: number;
  from: number;
  to: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
}

const PagerButton: React.FC<{ label: string; disabled: boolean; onClick: () => void; children: React.ReactNode }> = ({ label, disabled, onClick, children }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    aria-label={label}
    className="w-11 h-11 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 disabled:text-slate-300 active:bg-slate-100"
  >
    {children}
  </button>
);

const MobilePager: React.FC<MobilePagerProps> = ({ page, totalPages, from, to, total, onPrev, onNext }) => (
  <div className="flex items-center justify-between gap-3">
    <span className="text-xs font-bold text-slate-500">
      <span className="text-emerald-600">{from}</span>-{to} <span className="text-slate-400 font-medium mx-0.5">/</span> {total}
    </span>
    {totalPages > 1 && (
      <div className="flex items-center gap-2">
        <PagerButton label="Halaman sebelum" disabled={page === 1} onClick={onPrev}><ChevronLeft className="w-5 h-5" /></PagerButton>
        <span className="text-xs font-black text-slate-700 min-w-[48px] text-center">{page} / {totalPages}</span>
        <PagerButton label="Halaman seterusnya" disabled={page === totalPages} onClick={onNext}><ChevronRight className="w-5 h-5" /></PagerButton>
      </div>
    )}
  </div>
);

export default MobilePager;
