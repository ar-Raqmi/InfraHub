import React, { useState } from 'react';
import { ArrowDown, ArrowUp, ChevronRight, CheckSquare, Edit3, MoveRight, Plus, Trash2, X } from 'lucide-react';
import { PresetGroup } from '../../../types';
import ExpandableText from '../../ExpandableText';
import AutoGrowTextarea from './AutoGrowTextarea';
import { LibraryActions } from './libraryTypes';
import { dangerButton, primaryButton } from './buttonStyles';
import { itemSummary } from './itemSummary';
import MobileBottomBar from './MobileBottomBar';

interface LibraryGroupEditorProps {
  group: PresetGroup;
  actions: LibraryActions;
  onOpenItem: (itemId: string) => void;
}

const stepClass = 'w-11 h-11 shrink-0 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-500 active:bg-indigo-50 disabled:opacity-30';
const bulkClass = 'flex-1 min-h-[44px] px-2 flex items-center justify-center gap-1.5 rounded-xl text-xs font-bold';

const LibraryGroupEditor: React.FC<LibraryGroupEditorProps> = ({ group, actions, onOpenItem }) => {
  const [isSorting, setIsSorting] = useState(false);
  const selectedCount = group.items.filter(i => actions.selectedItemIds.has(i.id)).length;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Edit Kumpulan</h1>
      <p className="text-sm text-slate-500 mb-4">Perubahan disimpan dengan Simpan Pustaka.</p>

      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1" htmlFor="group-title">Tajuk Kumpulan (Auto L0 - Section)</label>
      <AutoGrowTextarea
        id="group-title"
        value={group.title}
        onChange={e => actions.onUpdateGroup(group.id, { title: e.target.value.toUpperCase() })}
        className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 font-black text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
        placeholder="CONTOH: KERJA PENGOREKAN"
      />

      <div className="flex flex-wrap items-center gap-2 mt-4 mb-3">
        {group.items.length > 0 && !isSorting && (
          <label className="min-h-[44px] flex items-center gap-2 pr-2 select-none">
            <input type="checkbox" checked={actions.allSelected} onChange={actions.onToggleAll} className="w-5 h-5 rounded border-slate-300 text-indigo-600" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Pilih Semua</span>
          </label>
        )}
        <span className="text-xs font-bold text-slate-500 uppercase">Items: {group.items.length}{selectedCount > 0 ? ` · ${selectedCount} dipilih` : ''}</span>
        <div className="flex-1" />
        {group.items.length > 1 && (
          <button type="button" onClick={() => { setIsSorting(v => !v); actions.onClearSelection(); }} className={`min-h-[44px] px-4 rounded-xl font-bold text-sm border ${isSorting ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-indigo-700 border-indigo-200'}`}>
            {isSorting ? 'Selesai' : 'Susun'}
          </button>
        )}
      </div>

      <ul className="space-y-3">
        {group.items.map((item, idx) => {
          const isSelected = actions.selectedItemIds.has(item.id);
          return (
            <li key={item.id} className={`rounded-2xl border-2 bg-white p-3 ${isSelected ? 'border-indigo-400 bg-indigo-50/40' : 'border-slate-100'}`}>
              <div className="flex items-center gap-2 mb-1">
                {!isSorting && (
                  <label className="w-11 h-11 -ml-1 flex items-center justify-center shrink-0" aria-label={`Pilih item ${idx + 1}`}>
                    <input type="checkbox" checked={isSelected} onChange={() => actions.onToggleItem(item.id)} className="w-5 h-5 rounded border-slate-300 text-indigo-600" />
                  </label>
                )}
                <span className="px-3 py-0.5 bg-indigo-600 text-white text-xs font-black rounded-full uppercase tracking-wide">Item {idx + 1}</span>
                <div className="flex-1" />
                {isSorting && (
                  <>
                    <button type="button" onClick={() => actions.onReorderItem(group.id, idx, 'up')} disabled={idx === 0} className={stepClass} aria-label="Naik"><ArrowUp className="w-4 h-4" /></button>
                    <button type="button" onClick={() => actions.onReorderItem(group.id, idx, 'down')} disabled={idx === group.items.length - 1} className={stepClass} aria-label="Turun"><ArrowDown className="w-4 h-4" /></button>
                  </>
                )}
              </div>
              <ExpandableText text={item.description} lines={3} className="text-sm font-bold text-slate-800 whitespace-pre-line" />
              <div className="flex items-center justify-between gap-2 mt-1">
                <span className="text-xs text-slate-500 break-words min-w-0">{itemSummary(item)}</span>
                {!isSorting && (
                  <button type="button" onClick={() => onOpenItem(item.id)} className="min-h-[44px] pl-3 flex items-center gap-1 shrink-0 text-sm font-bold text-indigo-700">
                    Edit <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {group.items.length === 0 && <p className="text-sm text-slate-400 italic text-center py-6">Tiada item.</p>}

      <div className="flex flex-wrap gap-2 mt-4">
        <button type="button" onClick={() => onOpenItem(actions.onAddItem(group.id))} className={primaryButton}>
          <Plus className="w-4 h-4" /> Tambah Item
        </button>
        <button type="button" onClick={() => actions.onDeleteGroup(group)} className={dangerButton}>
          <Trash2 className="w-4 h-4" /> Padam Kumpulan
        </button>
      </div>

      {selectedCount > 0 && (
        <MobileBottomBar className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-indigo-700">
            <span className="flex items-center gap-2"><CheckSquare className="w-4 h-4" /> {actions.selectedItemIds.size} item dipilih</span>
            <button type="button" onClick={actions.onClearSelection} className="w-11 h-11 -mr-2 flex items-center justify-center text-slate-500" aria-label="Batal pilihan"><X className="w-5 h-5" /></button>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={actions.onBulkEdit} className={`${bulkClass} bg-white text-indigo-700 border border-indigo-200`}><Edit3 className="w-4 h-4" /> Kemaskini Pukal</button>
            <button type="button" onClick={actions.onBulkMove} className={`${bulkClass} bg-white text-indigo-700 border border-indigo-200`}><MoveRight className="w-4 h-4" /> Pindah Pukal</button>
            <button type="button" onClick={actions.onBulkDelete} className={`${bulkClass} bg-red-600 text-white`}><Trash2 className="w-4 h-4" /> Padam</button>
          </div>
        </MobileBottomBar>
      )}
    </div>
  );
};

export default LibraryGroupEditor;
