import React from 'react';
import { Columns, Rows, LayoutTemplate } from 'lucide-react';

type PhotoLayout = 'horizontal' | 'vertical' | 'big-left' | 'big-top';

const OPTIONS: Record<number, { value: PhotoLayout; label: string; icon: React.ReactNode }[]> = {
  2: [
    { value: 'horizontal', label: 'Sebelah-menyebelah', icon: <Columns size={16} /> },
    { value: 'vertical', label: 'Atas-bawah', icon: <Rows size={16} /> },
  ],
  3: [
    { value: 'big-left', label: 'Besar kiri', icon: <LayoutTemplate size={16} className="-rotate-90" /> },
    { value: 'big-top', label: 'Besar atas', icon: <LayoutTemplate size={16} /> },
  ],
};

interface LayoutToggleProps {
  photoCount: number;
  layout: string;
  onChange: (layout: PhotoLayout) => void;
}

// Desktop shows the bare icons; phones add the text label so the choice is readable.
const LayoutToggle: React.FC<LayoutToggleProps> = ({ photoCount, layout, onChange }) => (
  <div className="flex bg-slate-200/50 p-1 rounded-xl gap-1">
    {(OPTIONS[photoCount] || []).map(({ value, label, icon }) => (
      <button
        key={value}
        onClick={() => onChange(value)}
        aria-label={label}
        aria-pressed={layout === value}
        className={`p-2 rounded-lg max-md:flex-1 max-md:h-11 max-md:flex max-md:items-center max-md:justify-center max-md:gap-2 ${layout === value ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-400'}`}
      >
        {icon}
        <span className="md:hidden text-xs font-bold">{label}</span>
      </button>
    ))}
  </div>
);

export default LayoutToggle;
