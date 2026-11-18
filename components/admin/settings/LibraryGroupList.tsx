import React, { useState } from 'react';
import { ChevronRight, Edit3, Plus } from 'lucide-react';
import { PresetGroup } from '../../../types';
import BottomSheet from '../../BottomSheet';
import { LibraryActions } from './libraryTypes';
import { outlineButton, primaryButton } from './buttonStyles';

interface LibraryGroupListProps {
  category: string;
  groups: PresetGroup[];
  actions: LibraryActions;
  onOpen: (groupId: string) => void;
  onRenamed: (newName: string) => void;
}

const LibraryGroupList: React.FC<LibraryGroupListProps> = ({ category, groups, actions, onOpen, onRenamed }) => {
  const [isRenaming, setIsRenaming] = useState(false);
  const itemCount = groups.reduce((n, g) => n + g.items.length, 0);

  const startRename = () => {
    actions.onStartRename(category);
    setIsRenaming(true);
  };

  const cancelRename = () => {
    actions.onCancelRename();
    setIsRenaming(false);
  };

  const commitRename = () => {
    const newName = actions.renameCategory.value.trim();
    actions.onCommitRename();
    setIsRenaming(false);
    if (newName && newName !== category) onRenamed(newName);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 break-words">{category}</h1>
      <p className="text-sm text-slate-500 mb-4">{groups.length} kumpulan · {itemCount} item</p>

      <div className="flex flex-wrap gap-2 mb-4">
        <button type="button" onClick={() => onOpen(actions.onAddGroup(category))} className={primaryButton}>
          <Plus className="w-4 h-4" /> Tambah Kumpulan
        </button>
        <button type="button" onClick={startRename} className={outlineButton}>
          <Edit3 className="w-4 h-4" /> Nama
        </button>
      </div>

      <h2 className="px-1 mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Kumpulan (L0 Header)</h2>
      <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-200 overflow-hidden bg-white">
        {groups.map(group => (
          <li key={group.id}>
            <button type="button" onClick={() => onOpen(group.id)} className="w-full min-h-[60px] flex items-center gap-3 px-4 py-2 text-left active:bg-slate-50">
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-bold text-slate-800 break-words clamp-3">{group.title}</span>
                <span className="block text-xs text-slate-500">{group.items.length} item</span>
              </span>
              <ChevronRight className="w-5 h-5 text-slate-300 shrink-0" />
            </button>
          </li>
        ))}
      </ul>

      <BottomSheet
        open={isRenaming}
        title="Namakan semula kategori"
        onClose={cancelRename}
        footer={<button type="button" onClick={commitRename} className="w-full min-h-[48px] rounded-xl bg-indigo-600 text-white font-bold">Simpan</button>}
      >
        <input
          type="text"
          value={actions.renameCategory.value}
          onChange={e => actions.renameCategory.set(e.target.value)}
          className="w-full min-h-[48px] px-4 rounded-xl border border-indigo-200 outline-none focus:ring-2 focus:ring-indigo-500"
          autoFocus
        />
      </BottomSheet>
    </div>
  );
};

export default LibraryGroupList;
