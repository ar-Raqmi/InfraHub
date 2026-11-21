import React from 'react';
import { createPortal } from 'react-dom';
import { FileText, Loader2, Trash2, X } from 'lucide-react';
import { Button, Field, IconButton, Input } from '../ui';

const Dialog: React.FC<{ onClose: () => void; children: React.ReactNode; label: string }> = ({ onClose, children, label }) =>
  createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-ink/60 animate-fade-in" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={label} className="bg-surface border border-line rounded-ih-xl max-w-md w-full p-6 animate-slide-up relative" onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>,
    document.body,
  );

/** Delete needs a 5-second countdown before it can be confirmed (unchanged rule). */
export const DeleteProjectDialog: React.FC<{ noFail: string; countdown: number; onCancel: () => void; onConfirm: () => void }> = ({ noFail, countdown, onCancel, onConfirm }) => (
  <Dialog onClose={onCancel} label="Padam projek">
    <IconButton icon={X} label="Tutup" onClick={onCancel} className="absolute top-3 right-3" />
    <div className="text-center pt-2">
      <span className="w-14 h-14 mx-auto mb-4 rounded-full bg-danger-tint border border-danger-line inline-flex items-center justify-center text-danger"><Trash2 className="w-6 h-6" /></span>
      <h3 className="font-display text-display-m text-ink mb-2">Padam projek?</h3>
      <p className="text-muted text-sm mb-6">Projek ini dan semua datanya akan dibuang.
        <span className="font-bold text-ink block mt-2 p-2 bg-paper rounded-ih-sm border border-line break-words ih-num">{noFail}</span>
      </p>
      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={onCancel}>Batal</Button>
        <Button variant="danger" icon={Trash2} className="flex-1" disabled={countdown > 0} onClick={onConfirm}>
          {countdown > 0 ? `Tunggu (${countdown})` : 'Ya, padam'}
        </Button>
      </div>
    </div>
  </Dialog>
);

interface ExportDialogProps {
  scopeLabel: string;
  bil: string;
  onBilChange: (v: string) => void;
  generating: boolean;
  progress: number;
  onClose: () => void;
  onExport: () => void;
}

/** Laporan panel kontraktor (Senarai PDF); the scope that will be printed is shown before export. */
export const ExportReportDialog: React.FC<ExportDialogProps> = ({ scopeLabel, bil, onBilChange, generating, progress, onClose, onExport }) => (
  <Dialog onClose={onClose} label="Laporan panel kontraktor">
    <div className="flex items-center justify-between gap-3 mb-4">
      <h3 className="font-display text-title text-ink flex items-center gap-2"><FileText className="w-5 h-5" aria-hidden /> Laporan panel kontraktor</h3>
      <IconButton icon={X} label="Tutup" onClick={onClose} />
    </div>
    <p className="text-sm text-muted mb-4">Tajuk PDF akan mencetak skop ini: <span className="font-bold text-ink">{scopeLabel}</span>.</p>
    {generating ? (
      <div className="flex flex-col items-center py-4">
        <Loader2 className="w-8 h-8 animate-spin text-emerald mb-2" />
        <p className="text-sm font-bold text-ink ih-num">Menjana PDF… {progress}%</p>
        <div className="w-full bg-paper-deep h-2 rounded-full mt-2 overflow-hidden"><div className="bg-emerald-bright h-full" style={{ width: `${progress}%` }} /></div>
      </div>
    ) : (
      <div className="space-y-4">
        <Field label="Bilangan mesyuarat" htmlFor="bil-mesyuarat" hint="Dicetak di penjuru kanan atas halaman pertama.">
          <Input id="bil-mesyuarat" value={bil} onChange={e => onBilChange(e.target.value)} placeholder="cth: 01/01/2025" autoFocus />
        </Field>
        <Button variant="primary" block icon={FileText} onClick={onExport}>Jana PDF</Button>
      </div>
    )}
  </Dialog>
);
