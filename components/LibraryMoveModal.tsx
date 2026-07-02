import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { FolderInput, X, ChevronRight, Edit3, Save, PlusCircle, Layers } from 'lucide-react';
import { PresetGroup } from '../types';

interface LibraryMoveModalProps {
    isOpen: boolean;
    onClose: () => void;
    groups: PresetGroup[];
    excludeGroupId: string;
    itemDescription: string;
    onMove: (targetGroupId: string) => void;
    isBulk?: boolean;
    selectionCount?: number;
}

const LibraryMoveModal: React.FC<LibraryMoveModalProps> = ({
    isOpen,
    onClose,
    groups,
    excludeGroupId,
    itemDescription,
    onMove,
    isBulk = false,
    selectionCount = 0
}) => {
    if (!isOpen) return null;

    const availableGroups = groups.filter(g => g.id !== excludeGroupId);

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 animate-fade-in" onClick={onClose}>
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-slide-up" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-4">
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <FolderInput className="w-5 h-5 text-indigo-600" />
                        {isBulk ? `Pindah ${selectionCount} Item` : 'Pindah Item'}
                    </h3>
                    <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {!isBulk && (
                    <div className="mb-4">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Item</span>
                        <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-700 text-xs font-semibold break-words max-h-24 overflow-y-auto">
                            {itemDescription}
                        </div>
                    </div>
                )}

                <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Pilih Kumpulan Destinasi</span>
                    <div className="max-h-72 overflow-y-auto space-y-3 custom-scrollbar pr-1">
                        {availableGroups.length > 0 ? (
                            (() => {
                                const grouped = availableGroups.reduce((acc, g) => {
                                    if (!acc[g.category]) acc[g.category] = [];
                                    acc[g.category].push(g);
                                    return acc;
                                }, {} as Record<string, PresetGroup[]>);
                                return Object.entries(grouped).map(([category, groups]) => (
                                    <div key={category}>
                                        <div className="text-[10px] font-black uppercase tracking-wider text-indigo-500 mb-1.5 flex items-center gap-2">
                                            <span className="w-4 h-px bg-indigo-300"></span>
                                            {category}
                                            <span className="w-4 h-px bg-indigo-300"></span>
                                        </div>
                                        <div className="space-y-1 ml-1">
                                            {groups.map(g => (
                                                <button
                                                    key={g.id}
                                                    onClick={() => { onMove(g.id); onClose(); }}
                                                    className="w-full text-left p-2.5 rounded-lg border border-slate-100 hover:border-indigo-500 hover:bg-indigo-50/30 transition-all group flex justify-between items-center"
                                                >
                                                    <div className="min-w-0 flex-1">
                                                        <div className="text-xs font-bold text-slate-700 truncate">{g.title}</div>
                                                        <div className="text-[9px] text-slate-400 truncate">{g.items.length} item</div>
                                                    </div>
                                                    <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-500 transition-colors shrink-0 ml-2" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ));
                            })()
                        ) : (
                            <div className="text-center py-6 text-slate-400 text-xs">
                                {isBulk ? 'Tiada kumpulan lain tersedia.' : 'Tiada kumpulan lain tersedia. Cipta kumpulan baru dahulu.'}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default LibraryMoveModal;