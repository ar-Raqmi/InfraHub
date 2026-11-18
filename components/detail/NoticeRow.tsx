import React from 'react';

const NOTICE_OPTIONS = [
  { value: 'PENDING', label: 'Belum', selectedClass: 'bg-rose-500 text-white shadow-sm' },
  { value: 'SENT', label: 'Dihantar', selectedClass: 'bg-emerald-600 text-white shadow-sm' },
  { value: 'NOT_REQUIRED', label: 'Tidak Perlu', selectedClass: 'bg-slate-600 text-white shadow-sm' }
];

interface NoticeRowProps {
  label: string;
  date: string;
  field: string;
  value?: string;
  isWarning: boolean;
  readOnly: boolean;
  onChange: (field: string, val: string) => void;
}

// One notice (Peringatan 1/2/3, Kerja Tidak Siap) with its Belum / Dihantar / Tidak Perlu control.
const NoticeRow: React.FC<NoticeRowProps> = ({ label, date, field, value, isWarning, readOnly, onChange }) => {
  const current = value || 'PENDING';
  return (
    <div className={`p-3.5 rounded-2xl border transition-all flex flex-col gap-2.5 ${isWarning ? 'border-rose-300 bg-rose-50/10 ring-2 ring-rose-500/20' : 'bg-slate-50/50 border-slate-100'}`}>
      <div className="flex flex-col max-md:flex-row max-md:items-baseline max-md:justify-between max-md:gap-2">
        <span className="text-[12px] font-black text-slate-400 uppercase tracking-wider">{label}</span>
        <span className={`text-[14px] font-bold ${isWarning ? 'text-rose-600' : 'text-slate-500'}`}>{date}</span>
      </div>

      <div className="flex gap-1 bg-slate-100 p-0.5 rounded-xl w-fit max-md:w-full">
        {NOTICE_OPTIONS.map((opt) => {
          const isSelected = current === opt.value;
          return (
            <label
              key={opt.value}
              className={`px-2.5 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider cursor-pointer transition-all select-none max-md:flex-1 max-md:h-11 max-md:flex max-md:items-center max-md:justify-center max-md:text-[13px] max-md:normal-case max-md:tracking-normal ${
                isSelected ? opt.selectedClass : 'text-slate-500 hover:text-slate-800'
              } ${readOnly ? 'pointer-events-none opacity-60' : ''}`}
            >
              <input
                type="radio"
                name={field}
                value={opt.value}
                checked={isSelected}
                onChange={() => onChange(field, opt.value)}
                disabled={readOnly}
                className="sr-only"
              />
              {opt.label}
            </label>
          );
        })}
      </div>
    </div>
  );
};

export default NoticeRow;
