import React from 'react';
import { ChevronLeft } from 'lucide-react';

interface MobileBackBarProps {
  label: string;
  onBack: () => void;
  children?: React.ReactNode;
}

const MobileBackBar: React.FC<MobileBackBarProps> = ({ label, onBack, children }) => (
  <div className="md:hidden sticky top-14 z-30 -mx-4 -mt-4 px-2 h-12 flex items-center justify-between gap-2 bg-slate-50 border-b border-slate-200">
    <button type="button" onClick={onBack} className="min-h-[44px] min-w-0 flex items-center gap-0.5 pr-3 text-emerald-700 font-bold active:text-emerald-900">
      <ChevronLeft className="w-6 h-6 shrink-0" />
      <span className="truncate">{label}</span>
    </button>
    {children && <div className="flex items-center gap-2 shrink-0">{children}</div>}
  </div>
);

export default MobileBackBar;
