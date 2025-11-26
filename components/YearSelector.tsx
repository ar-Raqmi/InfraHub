import React from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

interface YearSelectorProps {
  selectedYear: number;
  onYearChange: (year: number) => void;
}

const YearSelector: React.FC<YearSelectorProps> = ({ selectedYear, onYearChange }) => {
  return (
    <div className="flex items-center bg-white/50 dark:bg-slate-800/50 backdrop-blur-md rounded-2xl p-1 shadow-sm border border-white/20 dark:border-white/5">
      <button 
        onClick={() => onYearChange(selectedYear - 1)}
        className="p-2 rounded-xl hover:bg-white dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-all"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      
      <div className="flex items-center gap-2 px-4 py-1">
        <Calendar className="w-4 h-4 text-indigo-500" />
        <span className="font-bold text-slate-700 dark:text-slate-200 font-manrope">{selectedYear}</span>
      </div>

      <button 
        onClick={() => onYearChange(selectedYear + 1)}
        className="p-2 rounded-xl hover:bg-white dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-all"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};

export default YearSelector;