
import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface YearSelectorProps {
  selectedYear: number;
  onYearChange: (year: number) => void;
}

const YearSelector: React.FC<YearSelectorProps> = ({ selectedYear, onYearChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewYear, setViewYear] = useState(selectedYear);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setViewYear(selectedYear);
    }
  }, [isOpen, selectedYear]);

  // Calculate the decade range for the current view
  const startDecade = Math.floor(viewYear / 10) * 10;
  const endDecade = startDecade + 9;
  
  // Generate a grid of 12 years (include 1 year before and 2 years after the decade for a full 4x3 grid)
  const years = [];
  for (let i = -1; i <= 10; i++) {
    years.push(startDecade + i);
  }

  const handlePrevRange = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewYear(y => y - 10);
  };

  const handleNextRange = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewYear(y => y + 10);
  };

  const handleYearSelect = (year: number) => {
    onYearChange(year);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md rounded-2xl px-4 py-2 shadow-sm border transition-all group ${
          isOpen 
            ? 'ring-2 ring-indigo-500 border-indigo-500 bg-white dark:bg-slate-800' 
            : 'border-white/20 dark:border-white/5 hover:bg-white dark:hover:bg-slate-700'
        }`}
      >
        <Calendar className="w-4 h-4 text-indigo-500 group-hover:scale-110 transition-transform" />
        <span className="font-bold text-slate-700 dark:text-slate-200 font-manrope">{selectedYear}</span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-indigo-500' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-72 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-4 z-[100] animate-slide-down ring-1 ring-black/5 dark:ring-white/10">
          
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-700">
            <button 
              onClick={handlePrevRange}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500 dark:text-slate-400 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-bold text-slate-900 dark:text-white font-manrope">
              {startDecade} - {endDecade}
            </span>
            <button 
              onClick={handleNextRange}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500 dark:text-slate-400 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {years.map(year => {
              const isSelected = year === selectedYear;
              const isOutsideDecade = year < startDecade || year > endDecade;
              
              return (
                <button
                  key={year}
                  onClick={() => handleYearSelect(year)}
                  className={`py-2 rounded-xl text-sm font-bold transition-all ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:scale-105'
                  } ${isOutsideDecade ? 'opacity-40' : ''}`}
                >
                  {year}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default YearSelector;
