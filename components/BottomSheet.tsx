import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface BottomSheetProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const BottomSheet: React.FC<BottomSheetProps> = ({ open, title, onClose, children, footer }) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end md:items-center md:justify-center" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-slate-900/50" onClick={onClose} />
      <div className="relative w-full md:max-w-lg max-h-[90vh] flex flex-col bg-white rounded-t-3xl md:rounded-3xl border border-slate-200 animate-slide-up">
        <div className="flex items-center justify-between gap-3 pl-5 pr-2 border-b border-slate-100 shrink-0">
          <h2 className="font-extrabold text-slate-800 text-base py-3 min-w-0 break-words">{title}</h2>
          <button onClick={onClose} aria-label="Tutup" className="w-11 h-11 shrink-0 flex items-center justify-center rounded-xl text-slate-500 active:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4 min-h-0">{children}</div>
        {footer && <div className="shrink-0 border-t border-slate-100 px-5 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">{footer}</div>}
      </div>
    </div>,
    document.body
  );
};

export default BottomSheet;
