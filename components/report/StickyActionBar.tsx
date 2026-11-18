import React from 'react';
import { ArrowRight, FileDown, RefreshCw } from 'lucide-react';

interface StickyActionBarProps {
  currentStep: number;
  canProceed: boolean;
  isExporting: boolean;
  onBack: () => void;
  onReset: () => void;
  onNext: () => void;
  onExport: () => void;
}

// Sits on top of the 64 px tab bar so the step's main action stays under the thumb.
const StickyActionBar: React.FC<StickyActionBarProps> = ({ currentStep, canProceed, isExporting, onBack, onReset, onNext, onExport }) => {
  const isLast = currentStep === 4;

  return (
    <div className="md:hidden fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-40 bg-white border-t border-slate-200 px-4 py-2 flex gap-2">
      <button
        onClick={currentStep === 1 ? onReset : onBack}
        className="h-12 px-4 rounded-xl bg-slate-100 text-slate-700 font-bold text-sm active:bg-slate-200"
      >
        {currentStep === 1 ? 'Mula Semula' : 'Kembali'}
      </button>
      <button
        onClick={isLast ? onExport : onNext}
        disabled={isLast ? isExporting : !canProceed}
        className="flex-1 h-12 rounded-xl bg-emerald-600 text-white font-bold text-sm flex items-center justify-center gap-2 active:bg-emerald-700 disabled:opacity-50"
      >
        {isLast ? (
          <>
            {isExporting ? <RefreshCw className="w-5 h-5 animate-spin" /> : <FileDown className="w-5 h-5" />}
            Eksport PDF Laporan
          </>
        ) : (
          <>Seterusnya <ArrowRight className="w-4 h-4" /></>
        )}
      </button>
    </div>
  );
};

export default StickyActionBar;
