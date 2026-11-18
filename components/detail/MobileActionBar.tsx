import React from 'react';
import { createPortal } from 'react-dom';
import { Download, Loader2, Save } from 'lucide-react';

export const getSaveState = (isNewProject: boolean, hasUnsavedChanges: boolean) => {
  if (isNewProject) return { label: 'Baru', className: 'bg-blue-100 text-blue-700' };
  if (hasUnsavedChanges) return { label: 'Belum Disimpan', className: 'bg-amber-100 text-amber-700' };
  return { label: 'Disimpan', className: 'bg-emerald-100 text-emerald-700' };
};

interface MobileActionBarProps {
  saveState: { label: string; className: string };
  onExport: () => void;
  isExporting: boolean;
  onSave?: () => void;
  isSaving: boolean;
}

// Replaces the global bottom tab bar on the project page: save state, PDF and Simpan
// sit in the thumb zone.
const MobileActionBar: React.FC<MobileActionBarProps> = ({ saveState, onExport, isExporting, onSave, isSaving }) =>
  createPortal(
    <div className="md:hidden fixed bottom-0 inset-x-0 z-[90] bg-white border-t border-slate-200 px-3 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] flex items-center gap-2 no-print">
      <span className={`shrink-0 px-2 py-1 rounded-md text-[11px] font-black uppercase tracking-wider ${saveState.className}`}>{saveState.label}</span>
      <button
        onClick={onExport}
        disabled={isExporting}
        className="h-12 px-4 shrink-0 flex items-center justify-center gap-2 rounded-xl border-2 border-emerald-600 text-emerald-700 font-bold text-sm disabled:opacity-70"
      >
        {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} PDF
      </button>
      {onSave && (
        <button
          onClick={onSave}
          disabled={isSaving}
          className="h-12 flex-1 min-w-0 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 active:bg-emerald-700 text-white font-bold text-[15px]"
        >
          <Save className="w-5 h-5" /> {isSaving ? '...' : 'Simpan'}
        </button>
      )}
    </div>,
    document.body
  );

export default MobileActionBar;
