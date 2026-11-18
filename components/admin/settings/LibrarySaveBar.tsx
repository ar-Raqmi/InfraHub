import React from 'react';
import { AlertTriangle, Check, Loader2, Save } from 'lucide-react';
import { LibrarySaveStatus } from './libraryTypes';
import MobileBottomBar from './MobileBottomBar';

interface LibrarySaveBarProps {
  isDirty: boolean;
  status: LibrarySaveStatus;
  onSave: () => void;
}

const LibrarySaveBar: React.FC<LibrarySaveBarProps> = ({ isDirty, status, onSave }) => {
  if (!isDirty && status === 'idle') return null;

  return (
    <MobileBottomBar className="flex items-center justify-between gap-3">
      <span className="text-sm font-bold">
        {status === 'saving' && <span className="flex items-center gap-2 text-emerald-600"><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</span>}
        {status === 'saved' && <span className="flex items-center gap-2 text-emerald-600"><Check className="w-4 h-4" /> Disimpan</span>}
        {status === 'error' && <span className="flex items-center gap-2 text-red-600"><AlertTriangle className="w-4 h-4" /> Gagal menyimpan</span>}
        {status === 'idle' && <span className="flex items-center gap-2 text-amber-600"><span className="w-2 h-2 rounded-full bg-amber-500" /> Belum disimpan</span>}
      </span>
      <button type="button" onClick={onSave} disabled={!isDirty || status === 'saving'} className="min-h-[44px] px-4 flex items-center gap-2 rounded-xl bg-indigo-600 text-white font-bold disabled:opacity-40">
        <Save className="w-4 h-4" /> Simpan Pustaka
      </button>
    </MobileBottomBar>
  );
};

export default LibrarySaveBar;
