import { PresetGroup, PresetItem, PresetVariant } from '../../../types';

export type LibrarySaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface Draft {
  value: string;
  set: (value: string) => void;
}

// Everything the phone Pustaka screens need from AdminSettings, which keeps
// owning the state so unsaved edits survive moving between levels.
export interface LibraryActions {
  isDirty: boolean;
  saveStatus: LibrarySaveStatus;
  isExporting: boolean;
  onSave: () => void;
  onExport: () => void;
  newCategory: Draft;
  onAddCategory: () => void;
  renameCategory: Draft;
  onStartRename: (category: string) => void;
  onCommitRename: () => void;
  onCancelRename: () => void;
  onAddGroup: (category: string) => string;
  onDeleteGroup: (group: PresetGroup) => void;
  onUpdateGroup: (groupId: string, updates: Partial<PresetGroup>) => void;
  onAddItem: (groupId: string) => string;
  onUpdateItem: (groupId: string, itemId: string, updates: Partial<PresetItem>) => void;
  onDeleteItem: (groupId: string, itemId: string) => void;
  onReorderItem: (groupId: string, index: number, direction: 'up' | 'down') => void;
  onMoveItem: (groupId: string, item: PresetItem) => void;
  onAddVariant: (groupId: string, itemId: string) => void;
  onUpdateVariant: (groupId: string, itemId: string, variantId: string, updates: Partial<PresetVariant>) => void;
  onDeleteVariant: (groupId: string, itemId: string, variantId: string) => void;
  selectedItemIds: Set<string>;
  allSelected: boolean;
  onToggleItem: (itemId: string) => void;
  onToggleAll: () => void;
  onClearSelection: () => void;
  onBulkEdit: () => void;
  onBulkMove: () => void;
  onBulkDelete: () => void;
}
