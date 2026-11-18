import React from 'react';

interface EditorModalHeaderProps {
  title: string;
  subtitle: string;
  className: string;
  titleClassName: string;
  onCancel: () => void;
  onSave: () => void;
}

// On phones the header shrinks to one 44 px row so Batal/Simpan always stay on screen.
const EditorModalHeader: React.FC<EditorModalHeaderProps> = ({ title, subtitle, className, titleClassName, onCancel, onSave }) => (
  <div className={`border-b border-slate-100 flex items-center justify-between bg-slate-50/50 max-md:p-2 max-md:gap-2 max-md:pt-[calc(0.5rem+env(safe-area-inset-top))] ${className}`}>
    <div className="min-w-0">
      <h3 className={`font-black text-slate-900 uppercase tracking-tight max-md:text-sm max-md:truncate max-md:pl-2 ${titleClassName}`}>{title}</h3>
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1 max-md:hidden">{subtitle}</p>
    </div>
    <div className="flex gap-4 shrink-0 max-md:gap-2">
      <button onClick={onCancel} className="px-8 py-3 text-slate-600 font-bold hover:bg-slate-100 rounded-2xl transition-all uppercase tracking-widest text-xs max-md:h-11 max-md:px-3 max-md:py-0 max-md:rounded-xl">Batal</button>
      <button onClick={onSave} className="px-10 py-3 bg-emerald-600 text-white font-bold rounded-2xl shadow-xl shadow-emerald-600/20 hover:bg-emerald-700 transition-all uppercase tracking-widest text-xs max-md:h-11 max-md:px-5 max-md:py-0 max-md:rounded-xl">Simpan</button>
    </div>
  </div>
);

export default EditorModalHeader;
