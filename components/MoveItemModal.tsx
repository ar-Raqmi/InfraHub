import React from 'react';
import { createPortal } from 'react-dom';
import { FolderOpen, X, ChevronRight } from 'lucide-react';
import { BQGroup } from '../types';

interface MoveItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    description: string;
    bills: BQGroup[];
    currentBillId: string;
    onMove: (targetBillId: string) => void;
    themeColor: 'emerald' | 'amber';
}

const THEME_STYLES = {
    emerald: {
        icon: 'text-emerald-600',
        hoverBorder: 'hover:border-emerald-500',
        hoverBg: 'hover:bg-emerald-50/30',
        chevronHover: 'group-hover:text-emerald-500',
    },
    amber: {
        icon: 'text-amber-600',
        hoverBorder: 'hover:border-amber-500',
        hoverBg: 'hover:bg-amber-50/30',
        chevronHover: 'group-hover:text-amber-500',
    },
};

const MoveItemModal: React.FC<MoveItemModalProps> = ({
    isOpen,
    onClose,
    description,
    bills,
    currentBillId,
    onMove,
    themeColor
}) => {
    if (!isOpen) return null;
    const t = THEME_STYLES[themeColor];

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 animate-fade-in" onClick={onClose}>
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-200 transform scale-100 transition-all animate-slide-up" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-4">
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <FolderOpen className={`w-5 h-5 ${t.icon}`} />
                        Pindah Bahagian BQ
                    </h3>
                    <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="mb-4">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Tajuk Bahagian</span>
                    <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-700 text-xs font-semibold break-words">
                        {description}
                    </div>
                </div>
                <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Pilih Destinasi Bil No.</span>
                    <div className="max-h-60 overflow-y-auto space-y-1.5 custom-scrollbar pr-1">
                        {bills.filter(b => b.id !== currentBillId).map(b => {
                            const match = b.title.match(/^(BIL NO\.\s*\d+)\s*[-–]\s*(.*)$/i);
                            const prefix = match ? match[1] : '';
                            const content = match ? match[2] : b.title;

                            return (
                                <button
                                    key={b.id}
                                    onClick={() => { onMove(b.id); onClose(); }}
                                    className={`w-full text-left p-3 rounded-xl border border-slate-100 ${t.hoverBorder} ${t.hoverBg} transition-all group flex justify-between items-center`}
                                >
                                    <div className="min-w-0 flex-1">
                                        {prefix && <div className={`text-[9px] font-black uppercase tracking-wider ${t.icon} mb-0.5`}>{prefix}</div>}
                                        <div className="text-xs font-bold text-slate-700 truncate">{content}</div>
                                    </div>
                                    <ChevronRight className={`w-4 h-4 text-slate-300 ${t.chevronHover} transition-colors shrink-0 ml-2`} />
                                </button>
                            );
                        })}
                        {bills.filter(b => b.id !== currentBillId).length === 0 && (
                            <div className="text-center py-6 text-slate-400 text-xs">Tiada destinasi bil lain tersedia.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default MoveItemModal;
