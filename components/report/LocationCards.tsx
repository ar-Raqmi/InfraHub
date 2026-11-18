import React, { useEffect, useLayoutEffect, useRef } from 'react';
import { Plus, Trash2 } from 'lucide-react';

export interface LocationRow {
  id: string;
  location: string;
  description: string;
}

interface LocationCardsProps {
  rows: LocationRow[];
  onChange: (id: string, patch: Partial<LocationRow>) => void;
  onRemove: (id: string) => void;
  onAdd: () => void;
}

// Grows with its value so the whole Lokasi/Aduan text is readable; Enter is
// blocked because these are single-line fields in the PDF.
const AutoGrowField: React.FC<{ value: string; placeholder: string; label: string; onChange: (v: string) => void; className: string }> = ({ value, placeholder, label, onChange, className }) => {
  const ref = useRef<HTMLTextAreaElement>(null);

  const fit = () => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight + el.offsetHeight - el.clientHeight}px`;
  };

  useLayoutEffect(fit, [value]);
  useEffect(() => {
    document.fonts?.ready.then(fit);
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  return (
    <textarea
      ref={ref}
      rows={1}
      aria-label={label}
      value={value}
      placeholder={placeholder}
      onChange={e => onChange(e.target.value)}
      onKeyDown={e => { if (e.key === 'Enter') e.preventDefault(); }}
      className={`w-full min-h-[48px] resize-none overflow-hidden bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-base uppercase leading-snug focus:ring-2 focus:ring-emerald-500 outline-none ${className}`}
    />
  );
};

const LocationCards: React.FC<LocationCardsProps> = ({ rows, onChange, onRemove, onAdd }) => (
  <div className="md:hidden flex flex-col gap-3">
    {rows.map((row, idx) => (
      <div key={row.id} className="border border-slate-200 rounded-2xl p-3">
        <div className="flex items-center justify-between min-h-[44px] mb-1">
          <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-400">
            <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">{idx + 1}</span>
            Lokasi
          </p>
          {rows.length > 1 && (
            <button onClick={() => onRemove(row.id)} aria-label={`Padam lokasi ${idx + 1}`} className="w-11 h-11 -mr-1 flex items-center justify-center rounded-xl text-slate-400 active:bg-red-50 active:text-red-500">
              <Trash2 size={18} />
            </button>
          )}
        </div>
        <AutoGrowField label={`Lokasi ${idx + 1}`} value={row.location} placeholder="CONTOH: JALAN 1/1, TAMAN DESA" onChange={v => onChange(row.id, { location: v })} className="font-bold text-slate-800" />
        <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mt-3 mb-1">Aduan</p>
        <AutoGrowField label={`Aduan ${idx + 1}`} value={row.description} placeholder="CONTOH: KERJA-KERJA MENURAP JALAN" onChange={v => onChange(row.id, { description: v })} className="font-medium text-slate-600" />
      </div>
    ))}
    <button onClick={onAdd} className="h-12 flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-emerald-300 text-emerald-700 font-bold text-sm active:bg-emerald-50">
      <Plus size={18} /> Tambah Lokasi
    </button>
  </div>
);

export default LocationCards;
