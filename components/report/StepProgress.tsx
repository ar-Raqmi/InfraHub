import React from 'react';

const SHORT_LABELS = ['Projek', 'Pelan', 'Gambar', 'Eksport'];

interface StepProgressProps {
  currentStep: number;
  label: string;
  onReset: () => void;
}

// Phone stepper: the desktop pill row can't show its labels at 390 px.
const StepProgress: React.FC<StepProgressProps> = ({ currentStep, label, onReset }) => (
  <div className="md:hidden bg-white rounded-2xl border border-slate-200 px-4 pt-3 pb-3">
    <div className="flex items-center justify-between gap-3">
      <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 shrink-0">
        Langkah {currentStep} / {SHORT_LABELS.length}
      </p>
      <p className="font-extrabold text-slate-800 text-sm truncate">{label}</p>
    </div>
    <div className="grid grid-cols-4 gap-1.5 mt-2" aria-hidden>
      {SHORT_LABELS.map((short, idx) => (
        <div key={short}>
          <div className={`h-1.5 rounded-full ${idx < currentStep ? 'bg-emerald-500' : 'bg-slate-200'}`} />
          <p className={`text-[10px] font-bold uppercase tracking-wide mt-1 ${idx + 1 === currentStep ? 'text-emerald-700' : 'text-slate-400'}`}>{short}</p>
        </div>
      ))}
    </div>
    {currentStep > 1 && (
      <button onClick={onReset} className="mt-1 -mb-2 h-11 text-xs font-bold text-slate-500 active:text-red-600">
        Mula Semula
      </button>
    )}
  </div>
);

export default StepProgress;
