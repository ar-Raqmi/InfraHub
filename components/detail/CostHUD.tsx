// Desktop fixed header of the project page. Its left edge (md:left-28) meets the w-28 desktop rail exactly:
// change both together (components/Sidebar.tsx).
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Edit } from 'lucide-react';
import { ProjectStatus, formatCurrency } from '../../types';
import { getSaveState } from './MobileActionBar';
import { STATUS_OPTIONS, TriColourBar, parseProgress } from './progress';

export interface CostHUDProps {
  grandTotal: number;
  finalTotal?: number;
  extraTotal?: number;
  status: ProjectStatus;
  progress: number;
  onStatusChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onProgressChange: (val: number) => void;
  saveAction: React.ReactNode;
  exportAction: React.ReactNode;
  isPelarasanActive: boolean;
  isReadOnly?: boolean;
  isVerifying?: boolean;
  hasFullData?: boolean;
  showRemoteUpdateNotice?: boolean;
  onApplyRemoteUpdate?: () => void;
  hasUnsavedChanges?: boolean;
  isNewProject?: boolean;
}

const CostHUD = ({
  grandTotal, finalTotal, extraTotal, status, progress,
  onStatusChange, onProgressChange, saveAction, exportAction,
  isPelarasanActive, isReadOnly, isVerifying, hasFullData,
  showRemoteUpdateNotice, onApplyRemoteUpdate,
  hasUnsavedChanges, isNewProject
}: CostHUDProps) => {
  const saveState = getSaveState(!!isNewProject, !!hasUnsavedChanges);
  const [localProgress, setLocalProgress] = useState(progress ? progress.toString() : '0');
  const [isEditingProgress, setIsEditingProgress] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setLocalProgress(progress !== undefined ? progress.toString() : '0'); }, [progress]);

  const handleBlur = () => {
    const val = parseProgress(localProgress);
    onProgressChange(val); setLocalProgress(val.toString());
    setIsEditingProgress(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
      (e.currentTarget as HTMLInputElement).blur();
    }
  };

  const toggleEdit = () => {
    if (isReadOnly) return;
    setIsEditingProgress(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  return createPortal(
    <div className="fixed top-0 left-0 md:left-28 right-0 z-[90] max-md:hidden bg-white border-b border-slate-300 shadow-xl no-print">
      <div className="grid grid-cols-1 md:grid-cols-[auto_minmax(0,1fr)_auto] items-center px-3 py-1.5 md:px-8 md:py-3 gap-2 md:gap-6">

        <div className="flex items-center gap-2 md:gap-3 justify-between md:justify-start w-full">
          <div className="flex items-center gap-2 md:gap-3 shrink-0">

            <div className="relative group">
              <select
                name="status"
                value={status}
                onChange={onStatusChange}
                disabled={isReadOnly}
                className="appearance-none bg-slate-100 border-2 border-slate-200 rounded-xl py-1 md:py-1.5 pl-3 md:pl-4 pr-8 md:pr-10 text-[10px] md:text-[11px] font-black text-slate-700 focus:ring-2 focus:ring-emerald-500 transition-all uppercase tracking-wider cursor-pointer hover:bg-white hover:border-emerald-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 md:w-4 md:h-4 text-slate-400 pointer-events-none group-hover:text-emerald-500 transition-colors" />
            </div>
            {!isReadOnly && <div className="scale-90 md:scale-95">{saveAction}</div>}
            <div className="scale-90 md:scale-95">{exportAction}</div>
            
            <div className={`hidden sm:flex px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider items-center ${saveState.className}`}>
              {saveState.label}
            </div>
          </div>

        </div>

        <div className="hidden md:flex flex-col items-center justify-center w-full max-w-md mx-auto px-4">
          <div className="flex items-center justify-between w-full mb-1 px-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Prestasi Projek</span>
            <div
              className={`flex items-center gap-1 px-2 py-0 rounded-lg transition-all ${isReadOnly ? '' : 'hover:bg-emerald-50 cursor-pointer group'}`}
              onClick={toggleEdit}
            >
              <div className="flex items-baseline">
                <input
                  ref={inputRef}
                  type="number"
                  value={localProgress}
                  onChange={(e) => setLocalProgress(e.target.value)}
                  onBlur={handleBlur}
                  onKeyDown={handleKeyDown}
                  disabled={isReadOnly}
                  className={`w-10 text-right bg-transparent border-b-2 border-transparent p-0 text-base font-black text-emerald-600 focus:ring-0 outline-none transition-all ${isEditingProgress ? 'border-emerald-500 bg-white shadow-inner rounded-t px-1' : ''}`}
                />
                <span className="text-xs font-black text-emerald-500/50">%</span>
              </div>
              {!isReadOnly && <Edit className="w-3 h-3 text-emerald-300 opacity-0 group-hover:opacity-100 transition-opacity" />}
            </div>
          </div>
          <TriColourBar progress={progress} className="flex gap-1 h-3.5 w-full" segmentClassName="flex-1 bg-slate-100 border border-slate-900 overflow-hidden h-full" />
        </div>

        {/* Column 3: Price Breakdown (Right) */}
        <div className="hidden md:flex items-center justify-end gap-6 w-full">
          <div className="flex flex-col items-end shrink-0">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5 leading-none text-right">
              {isPelarasanActive ? 'Harga Kontrak' : 'Jumlah Kos'}
            </p>
            <p className={`font-mono font-bold leading-none ${isPelarasanActive ? 'text-slate-400 line-through text-base' : 'text-xl text-emerald-600'}`}>
              {(isVerifying || !hasFullData) ? (
                <span className="animate-pulse opacity-50 px-2 bg-slate-100 rounded text-sm font-sans uppercase tracking-tight text-slate-400">Memuatkan...</span>
              ) : formatCurrency(grandTotal)}
            </p>
          </div>

          {isPelarasanActive && finalTotal !== undefined && (
            <div className="flex items-center gap-6 border-l-2 border-slate-100 pl-6 shrink-0">
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-0.5 leading-none text-right">Harga Akhir</span>
                <p className={`text-xl font-black font-mono leading-none ${finalTotal < grandTotal ? 'text-red-600' : finalTotal > grandTotal ? 'text-blue-600' : 'text-emerald-600'}`}>
                  {formatCurrency(finalTotal)}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>,
    document.body
  );
};

export default CostHUD;
