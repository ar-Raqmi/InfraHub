import React from 'react';
import { Layers, MoveRight, PlusCircle, Trash2 } from 'lucide-react';
import { PresetGroup, PresetItem } from '../../../types';
import AutoGrowTextarea from './AutoGrowTextarea';
import { LibraryActions } from './libraryTypes';
import { actionButton, dangerButton, outlineButton } from './buttonStyles';

interface LibraryItemEditorProps {
  group: PresetGroup;
  item: PresetItem;
  index: number;
  actions: LibraryActions;
  onDone: () => void;
}

const labelClass = 'block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1';
const fieldClass = 'w-full min-h-[48px] px-3 rounded-xl bg-white border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500';

const LibraryItemEditor: React.FC<LibraryItemEditorProps> = ({ group, item, index, actions, onDone }) => {
  const update = (updates: Partial<PresetItem>) => actions.onUpdateItem(group.id, item.id, updates);

  const deleteItem = () => {
    actions.onDeleteItem(group.id, item.id);
    onDone();
  };

  return (
    <div className="pb-4">
      <h1 className="text-2xl font-bold text-slate-900">Item {index + 1}</h1>
      <p className="text-sm text-slate-500 mb-4 break-words">{group.title}</p>

      <label className={labelClass} htmlFor="item-description">Penerangan Item (Auto L1 Header jika ada Varian)</label>
      <AutoGrowTextarea
        id="item-description"
        value={item.description}
        onChange={e => update({ description: e.target.value })}
        className="w-full p-3 rounded-xl bg-white border border-slate-200 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
        placeholder="CONTOH: ITEM BARU"
      />
      <p className="text-xs text-slate-400 text-right mt-1">{item.description.length} aksara</p>

      <div className="grid grid-cols-2 gap-3 mt-2">
        <div>
          <label className={labelClass} htmlFor="item-unit">Unit</label>
          <input id="item-unit" value={item.unit} onChange={e => update({ unit: e.target.value })} className={fieldClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="item-rate">Kadar (RM)</label>
          <input id="item-rate" type="number" inputMode="decimal" value={item.rate || ''} onChange={e => update({ rate: parseFloat(e.target.value) })} className={fieldClass} placeholder="0.00" />
        </div>
      </div>

      <div className="mt-6 pl-3 border-l-4 border-indigo-500/20 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="text-xs font-bold text-indigo-600 uppercase tracking-wide flex items-center gap-2"><Layers className="w-4 h-4" /> Varian & Pakej (L2 Sub-Items)</h2>
            <p className="text-xs text-slate-500 italic">Gunakan varian untuk memaksakan"ITEM BARU" menjadi Level 1 Header.</p>
          </div>
        </div>

        {(item.variants || []).map((v, vIdx) => (
          <div key={v.id} className="bg-white p-3 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-start gap-2">
              <span className="pt-3 text-xs font-black text-indigo-400 shrink-0">{vIdx + 1})</span>
              <AutoGrowTextarea
                value={v.label}
                onChange={e => actions.onUpdateVariant(group.id, item.id, v.id, { label: e.target.value })}
                className="flex-1 min-w-0 px-3 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="cth: dengan kaki / dengan tangan..."
                aria-label={`Varian ${vIdx + 1}`}
              />
              <button type="button" onClick={() => actions.onDeleteVariant(group.id, item.id, v.id)} className="w-11 h-11 shrink-0 flex items-center justify-center rounded-xl text-red-500 active:bg-red-50" aria-label="Padam varian"><Trash2 className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input type="number" inputMode="decimal" value={v.rate} onChange={e => actions.onUpdateVariant(group.id, item.id, v.id, { rate: parseFloat(e.target.value) })} className={`${fieldClass} text-right font-mono font-bold text-emerald-600`} placeholder="Rate" aria-label="Kadar varian" />
              <input value={v.unit} onChange={e => actions.onUpdateVariant(group.id, item.id, v.id, { unit: e.target.value })} className={`${fieldClass} uppercase font-bold text-center`} placeholder="Unit" aria-label="Unit varian" />
            </div>
          </div>
        ))}
        {(!item.variants || item.variants.length === 0) && <p className="text-xs text-slate-500 italic text-center py-3 rounded-xl border border-dashed border-slate-200">Tiada varian. Item akan diparentkan terus ke Kumpulan.</p>}

        <button type="button" onClick={() => actions.onAddVariant(group.id, item.id)} className={`${actionButton} bg-indigo-500 text-white`}>
          <PlusCircle className="w-4 h-4" /> Tambah Varian
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mt-6">
        <button type="button" onClick={() => actions.onMoveItem(group.id, item)} className={outlineButton}>
          <MoveRight className="w-4 h-4" /> Pindah ke kumpulan lain
        </button>
        <button type="button" onClick={deleteItem} className={dangerButton}>
          <Trash2 className="w-4 h-4" /> Padam item
        </button>
      </div>
      <button type="button" onClick={onDone} className="w-full min-h-[48px] mt-4 rounded-xl bg-slate-900 text-white font-bold">Selesai</button>
    </div>
  );
};

export default LibraryItemEditor;
