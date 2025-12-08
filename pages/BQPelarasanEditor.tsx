import React from 'react';
import { Construction, FileDiff, Ruler } from 'lucide-react';
import { BQGroup, GlobalDimensions, Project } from '../types';

interface BQPelarasanEditorProps {
  originalData: BQGroup[];
  pelarasanData: BQGroup[];
  globalDims: GlobalDimensions;
  onDataChange: (data: BQGroup[], dims: GlobalDimensions) => void;
  projectData: Project;
  isPrintView?: boolean;
}

const BQPelarasanEditor: React.FC<BQPelarasanEditorProps> = () => {
    return (
        <div className="flex flex-col items-center justify-center py-24 px-4 text-center animate-fade-in-up w-full">
            <div className="relative">
                 <div className="absolute inset-0 bg-blue-500 blur-2xl opacity-20 rounded-full animate-pulse"></div>
                 <div className="relative w-32 h-32 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-full flex items-center justify-center mb-8 shadow-inner border border-slate-200 dark:border-slate-700">
                    <FileDiff className="w-16 h-16 text-slate-400 dark:text-slate-500 relative z-10" strokeWidth={1.5} />
                    <div className="absolute -left-2 -bottom-2 bg-blue-500 text-white p-2 rounded-full shadow-lg">
                        <Ruler className="w-5 h-5 animate-pulse" />
                    </div>
                 </div>
            </div>
          
          <h3 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-700 to-slate-500 dark:from-white dark:to-slate-400 mb-4 font-manrope">
            Pelarasan BQ Sedang Dinaik Taraf
          </h3>
          
          <p className="text-slate-500 dark:text-slate-400 max-w-lg mx-auto mb-8 text-lg leading-relaxed">
            Fungsi pelarasan dan semakan akhir sedang dikemaskini untuk ketepatan yang lebih tinggi.
          </p>
    
          <div className="flex gap-4 items-center justify-center">
            <span className="flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-500 rounded-full text-sm font-bold border border-blue-200 dark:border-blue-800">
                <Construction className="w-4 h-4" /> Work-in-Progress
            </span>
          </div>
        </div>
      );
};

export default BQPelarasanEditor;