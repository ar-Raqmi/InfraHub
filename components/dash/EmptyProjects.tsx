import React from 'react';
import { Activity } from 'lucide-react';

const EmptyProjects: React.FC<{ onClear: () => void }> = ({ onClear }) => (
  <div className="flex flex-col items-center gap-4 text-center">
    <div className="w-20 h-20 bg-slate-50  rounded-full flex items-center justify-center">
      <Activity className="w-8 h-8 text-slate-300" />
    </div>
    <p className="text-slate-400 font-medium">Tiada projek ditemui dengan kriteria carian.</p>
    <button onClick={onClear} className="text-emerald-600 font-bold text-sm hover:underline max-md:min-h-[44px] max-md:px-4">Kosongkan Tapisan</button>
  </div>
);

export default EmptyProjects;
