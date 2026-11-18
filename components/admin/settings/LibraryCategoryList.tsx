import React, { useState } from 'react';
import { ChevronRight, FileSpreadsheet, HelpCircle, Loader2, PlusCircle } from 'lucide-react';
import { PresetGroup } from '../../../types';
import BottomSheet from '../../BottomSheet';
import { LibraryActions } from './libraryTypes';
import { actionButton } from './buttonStyles';
import { librarySummary } from './librarySummary';

interface LibraryCategoryListProps {
  groups: PresetGroup[];
  actions: LibraryActions;
  onOpen: (category: string) => void;
}

const LibraryCategoryList: React.FC<LibraryCategoryListProps> = ({ groups, actions, onOpen }) => {
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const categories = Array.from(new Set(groups.map(g => g.category)));
  const exportDisabled = actions.isDirty || actions.saveStatus === 'saving' || actions.isExporting || groups.length === 0;

  const addCategory = () => {
    const name = actions.newCategory.value.trim();
    if (!name) return;
    actions.onAddCategory();
    setIsAdding(false);
    onOpen(name);
  };

  return (
    <div>
      <div className="flex items-start justify-between gap-2 mb-1">
        <h1 className="text-2xl font-bold text-slate-900">Pengurusan Pustaka BQ</h1>
        <button type="button" onClick={() => setIsHelpOpen(true)} className="w-11 h-11 shrink-0 flex items-center justify-center rounded-xl text-slate-400 active:bg-slate-100" aria-label="Panduan Hierarki">
          <HelpCircle className="w-5 h-5" />
        </button>
      </div>
      <p className="text-sm text-slate-500 mb-4">{librarySummary(groups)}</p>

      <div className="flex flex-wrap gap-2 mb-4">
        <button type="button" onClick={() => setIsAdding(true)} className={`${actionButton} border border-indigo-200 bg-white text-indigo-700`}>
          <PlusCircle className="w-4 h-4" /> Tambah Kategori
        </button>
        <button
          type="button"
          onClick={actions.onExport}
          disabled={exportDisabled}
          className={`${actionButton} bg-emerald-600 text-white disabled:opacity-40`}
        >
          {actions.isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
          {actions.isExporting ? 'Menjana...' : 'Export Excel'}
        </button>
      </div>
      {actions.isDirty && <p className="text-xs text-amber-700 mb-3">Simpan pustaka dahulu sebelum eksport</p>}

      <h2 className="px-1 mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Kategori</h2>
      <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-200 overflow-hidden bg-white">
        {categories.map(cat => {
          const catGroups = groups.filter(g => g.category === cat);
          const itemCount = catGroups.reduce((n, g) => n + g.items.length, 0);
          return (
            <li key={cat}>
              <button type="button" onClick={() => onOpen(cat)} className="w-full min-h-[60px] flex items-center gap-3 px-4 py-2 text-left active:bg-slate-50">
                <span className="flex-1 min-w-0">
                  <span className="block font-bold text-slate-800 break-words">{cat}</span>
                  <span className="block text-sm text-slate-500">{catGroups.length} kumpulan · {itemCount} item</span>
                </span>
                <ChevronRight className="w-5 h-5 text-slate-300 shrink-0" />
              </button>
            </li>
          );
        })}
      </ul>

      <BottomSheet open={isHelpOpen} title="Panduan Hierarki:" onClose={() => setIsHelpOpen(false)}>
        <ul className="space-y-2 text-sm text-slate-700">
          <li><strong>L0 (Group):</strong> X3, KERJA PENGOREKAN (Huruf Besar)</li>
          <li><strong>L1 (Item):</strong> Jika ada Varian, Penerangan Item menjadi sub-header (cth: 1.1 ITEM BARU)</li>
          <li><strong>L2 (Variant):</strong> Item sebenar dengan kiraan (cth: i) dengan kaki)</li>
        </ul>
      </BottomSheet>

      <BottomSheet
        open={isAdding}
        title="Tambah Kategori"
        onClose={() => setIsAdding(false)}
        footer={<button type="button" onClick={addCategory} className="w-full min-h-[48px] rounded-xl bg-indigo-600 text-white font-bold">Simpan</button>}
      >
        <input
          type="text"
          value={actions.newCategory.value}
          onChange={e => actions.newCategory.set(e.target.value)}
          className="w-full min-h-[48px] px-4 rounded-xl border border-indigo-200 outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Nama kategori..."
          autoFocus
        />
      </BottomSheet>
    </div>
  );
};

export default LibraryCategoryList;
