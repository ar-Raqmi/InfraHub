import React from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, ChevronDown } from 'lucide-react';
import { formatCurrency } from '../../types';
import { TriColourBar } from './progress';

export interface DetailTab {
  id: string;
  label: string;
  color: string;
}

interface MobileDetailHeaderProps {
  title: string;
  noFail: string;
  onBack: () => void;
  onOpenSwitcher?: () => void;
  grandTotal: number;
  finalTotal?: number;
  isLoading: boolean;
  progress: number;
  tabs: DetailTab[];
  activeTab: string;
  onTabChange: (id: string) => void;
}

// Phone-only replacement for CostHUD: identity + KOS, then a 4-step tab stepper that
// stays reachable on 6000 px pages.
const MobileDetailHeader: React.FC<MobileDetailHeaderProps> = ({
  title, noFail, onBack, onOpenSwitcher, grandTotal, finalTotal, isLoading,
  progress, tabs, activeTab, onTabChange
}) => {
  const active = tabs.find(t => t.id === activeTab) ?? tabs[0];
  const isPelarasan = finalTotal !== undefined;
  const shownTotal = finalTotal ?? grandTotal;
  const totalColour = shownTotal < grandTotal ? 'text-red-600' : shownTotal > grandTotal ? 'text-blue-600' : 'text-emerald-600';

  const selectTab = (id: string) => {
    onTabChange(id);
    window.scrollTo({ top: 0 });
  };

  return createPortal(
    <div className="md:hidden fixed top-0 inset-x-0 z-[90] bg-white border-b border-slate-200 no-print">
      <div className="h-14 flex items-center gap-2 px-2">
        <button onClick={onBack} aria-label="Kembali ke Senarai" className="w-11 h-11 shrink-0 flex items-center justify-center rounded-xl border border-slate-200 text-slate-700 active:bg-slate-100">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <button
          onClick={onOpenSwitcher}
          disabled={!onOpenSwitcher}
          className="flex-1 min-w-0 min-h-[44px] flex flex-col items-start justify-center text-left rounded-xl px-1 active:bg-slate-50"
        >
          <span className="flex items-center gap-1 text-[15px] font-bold text-slate-900 leading-tight">
            <span className="truncate">{title}</span>
            {onOpenSwitcher && <ChevronDown className="w-4 h-4 shrink-0 text-slate-400" />}
          </span>
          <span className="text-[11px] text-slate-500 font-mono uppercase tracking-wider truncate max-w-full">{noFail}</span>
        </button>
        <div className="shrink-0 flex flex-col items-end leading-tight pr-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{isPelarasan ? 'Harga Akhir' : 'Jumlah Kos'}</span>
          <span className={`font-mono font-bold text-[15px] ${totalColour}`}>{isLoading ? '---' : formatCurrency(shownTotal)}</span>
          {isPelarasan && <span className="font-mono text-[11px] text-slate-400 line-through">{formatCurrency(grandTotal)}</span>}
        </div>
      </div>
      <TriColourBar progress={progress} className="flex h-1 w-full bg-slate-100" segmentClassName="flex-1 h-full overflow-hidden" />
      <div className="h-[52px] flex items-center gap-1.5 px-2" role="tablist">
        {tabs.map((tab, i) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={tab.id === activeTab}
            aria-label={tab.label}
            onClick={() => selectTab(tab.id)}
            className={`w-11 h-11 shrink-0 rounded-full border-2 text-sm font-bold ${tab.id === activeTab ? tab.color : 'bg-slate-50 border-slate-200 text-slate-500'}`}
          >
            {i + 1}
          </button>
        ))}
        <span className={`min-w-0 clamp-2 px-3 py-1 rounded-2xl border text-[13px] leading-tight font-bold ${active.color}`}>{active.label}</span>
      </div>
    </div>,
    document.body
  );
};

export default MobileDetailHeader;
