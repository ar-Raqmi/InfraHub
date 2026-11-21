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
      <div className="absolute inset-0 bg-ink/45" onClick={onClose} />
      <div className="relative w-full md:max-w-lg max-h-[90vh] flex flex-col bg-surface text-ink rounded-t-ih-xl md:rounded-ih-xl border border-line animate-slide-up">
        <span className="md:hidden mx-auto mt-2 h-1 w-10 rounded-full bg-line-strong shrink-0" aria-hidden />
        <div className="flex items-center justify-between gap-3 pl-5 pr-2 border-b border-line shrink-0">
          <h2 className="font-display font-bold text-ink text-[18px] tracking-tight py-3 min-w-0 break-words">{title}</h2>
          <button onClick={onClose} aria-label="Tutup" className="w-11 h-11 shrink-0 flex items-center justify-center rounded-ih-md text-muted hover:text-ink hover:bg-paper-deep active:bg-paper-deep">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4 min-h-0">{children}</div>
        {footer && <div className="shrink-0 border-t border-line bg-paper px-5 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">{footer}</div>}
      </div>
    </div>,
    document.body
  );
};

export default BottomSheet;
