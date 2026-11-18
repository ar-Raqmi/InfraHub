import React from 'react';
import { ChevronDown, ChevronUp, MapPin, Plus } from 'lucide-react';
import BottomSheet from '../BottomSheet';
import TouchIconButton from './TouchIconButton';
import { ReorderDeleteButtons } from './ItemControls';

export type NavTheme = 'emerald' | 'amber';

const GRADIENT: Record<NavTheme, string> = {
    emerald: 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-emerald-500',
    amber: 'bg-gradient-to-br from-amber-500 to-orange-600 text-white border-amber-500',
};
const ADD_BUTTON: Record<NavTheme, string> = {
    emerald: 'bg-emerald-600 active:bg-emerald-700',
    amber: 'bg-amber-600 active:bg-amber-700',
};

export interface BillTotal { label: string; value: string; className: string }

interface BillBarProps {
    prefix: string;
    content: string;
    locationName?: string;
    totals: BillTotal[];
    theme: NavTheme;
    onOpen: () => void;
}

// Pinned phone bar naming the active BIL and its total; tapping it opens the navigation sheet.
// INTEGRATION-RISK: the top offset reads --bq-sticky-top so the detail shell can match its header height.
export const BillBar: React.FC<BillBarProps> = ({ prefix, content, locationName, totals, theme, onOpen }) => (
    <div className="md:hidden sticky top-[var(--bq-sticky-top,3.5rem)] z-30 bg-white border-b border-slate-200 px-3 py-2 flex items-center gap-2">
        <button type="button" data-bq-bilbar onClick={onOpen} aria-haspopup="dialog" className={`flex-1 min-w-0 min-h-[52px] px-3 py-2 rounded-xl border text-left flex items-center gap-2 ${GRADIENT[theme]}`}>
            <span className="flex-1 min-w-0">
                <span className="block truncate text-xs font-black uppercase tracking-wide">{[prefix, content].filter(Boolean).join(' · ')}</span>
                {locationName && <span className="flex items-center gap-1 text-[11px] text-white/85 font-bold uppercase min-w-0"><MapPin className="w-3 h-3 shrink-0" /><span className="truncate">{locationName}</span></span>}
            </span>
            <ChevronDown className="w-5 h-5 shrink-0" />
        </button>
        <div className="shrink-0 text-right leading-tight">
            {totals.map(total => (
                <div key={total.label} className="text-[10px] text-slate-400 whitespace-nowrap">{total.label}: <span className={`font-mono font-bold text-xs ${total.className}`}>{total.value}</span></div>
            ))}
        </div>
    </div>
);

export interface NavBill {
    id: string;
    prefix: string;
    content: string;
    meta: string;
    canEdit: boolean;
    upDisabled: boolean;
    downDisabled: boolean;
}

export interface NavGroup {
    key: string;
    label: string;
    isLocation: boolean;
    bills: NavBill[];
    onMoveUp?: () => void;
    onMoveDown?: () => void;
    upDisabled?: boolean;
    downDisabled?: boolean;
}

interface BillNavSheetProps {
    open: boolean;
    onClose: () => void;
    title: string;
    projectTitle?: string;
    groups: NavGroup[];
    activeBillId: string | null;
    theme: NavTheme;
    readOnly: boolean;
    onSelect: (billId: string) => void;
    onMoveBill: (billId: string, direction: 'up' | 'down') => void;
    onDeleteBill: (billId: string) => void;
    onAddTemplate?: () => void;
    // Extra content above the BIL list (Pelarasan's price notice).
    children?: React.ReactNode;
}

// Phone version of the "Navigasi" sidebar, with reorder/delete always visible.
export const BillNavSheet: React.FC<BillNavSheetProps> = ({ open, onClose, title, projectTitle, groups, activeBillId, theme, readOnly, onSelect, onMoveBill, onDeleteBill, onAddTemplate, children }) => (
    <BottomSheet
        open={open}
        title={title}
        onClose={onClose}
        footer={!readOnly && onAddTemplate ? (
            <button type="button" onClick={() => { onClose(); onAddTemplate(); }} className={`w-full min-h-[48px] rounded-xl text-white font-bold flex items-center justify-center gap-2 ${ADD_BUTTON[theme]}`}>
                <Plus className="w-5 h-5" /> Tambah Template
            </button>
        ) : undefined}
    >
        {projectTitle && <p className="text-xs text-slate-500 truncate -mt-1 mb-3" title={projectTitle}>{projectTitle}</p>}
        {children}
        <div className="space-y-4">
            {groups.map(group => (
                <div key={group.key} className="space-y-2">
                    <div className="flex items-start gap-1">
                        <div className="flex-1 min-w-0 pt-3 text-[11px] font-bold text-slate-500 uppercase flex items-start gap-1 break-words">
                            {group.isLocation && <MapPin className="w-3.5 h-3.5 shrink-0 mt-px" />}<span className="min-w-0">{group.label}</span>
                        </div>
                        {!readOnly && group.onMoveUp && group.onMoveDown && (
                            <>
                                <TouchIconButton label="Naik" onClick={group.onMoveUp} disabled={group.upDisabled} className="border-transparent bg-transparent"><ChevronUp className="w-4 h-4" /></TouchIconButton>
                                <TouchIconButton label="Turun" onClick={group.onMoveDown} disabled={group.downDisabled} className="border-transparent bg-transparent"><ChevronDown className="w-4 h-4" /></TouchIconButton>
                            </>
                        )}
                    </div>
                    {group.bills.map(bill => {
                        const isActive = bill.id === activeBillId;
                        return (
                            <div key={`${group.key}-${bill.id}`} className="flex items-center gap-1.5">
                                <button type="button" onClick={() => { onSelect(bill.id); onClose(); }} aria-current={isActive} className={`flex-1 min-w-0 min-h-[56px] px-3 py-2 rounded-xl border text-left ${isActive ? GRADIENT[theme] : 'bg-white border-slate-200 text-slate-700 active:bg-slate-50'}`}>
                                    {bill.prefix && <span className={`block text-[10px] font-black tracking-widest uppercase ${isActive ? 'text-white/80' : 'text-slate-400'}`}>{bill.prefix}</span>}
                                    <span className="block font-bold text-sm leading-snug break-words">{bill.content}</span>
                                    <span className={`block mt-0.5 text-[11px] font-mono ${isActive ? 'text-white/80' : 'text-slate-400'}`}>{bill.meta}</span>
                                </button>
                                {!readOnly && bill.canEdit && (
                                    <ReorderDeleteButtons onMove={(direction) => onMoveBill(bill.id, direction)} onDelete={() => onDeleteBill(bill.id)} upDisabled={bill.upDisabled} downDisabled={bill.downDisabled} iconClass="w-4 h-4" />
                                )}
                            </div>
                        );
                    })}
                </div>
            ))}
        </div>
    </BottomSheet>
);
