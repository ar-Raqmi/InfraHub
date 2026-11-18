import React from 'react';
import { ChevronDown, ChevronUp, Link, List, PlusCircle, Trash2, Type, Unlink } from 'lucide-react';
import { BQItem, formatCurrency } from '../../types';
import { DimensionInput } from '../../lib/bqShared';
import ClampedTextarea from './ClampedTextarea';
import TouchIconButton from './TouchIconButton';

interface BQItemCardMobileProps {
    item: BQItem;
    autoNumber: string;
    readOnly: boolean;
    isRecentlyAdded: boolean;
    isFirst: boolean;
    onUpdate: (updates: Partial<BQItem>) => void;
    onToggleGlobal: () => void;
    onToggleCustomCalc: () => void;
    onAddPart: () => void;
    onMove: (direction: 'up' | 'down') => void;
    onDelete: () => void;
    // The item's CalcPartRow list, rendered by the editor.
    children: React.ReactNode;
}

// Phone layout of one BQ item: single column, description at full width,
// totals and always-visible actions at the foot.
const BQItemCardMobile: React.FC<BQItemCardMobileProps> = ({ item, autoNumber, readOnly, isRecentlyAdded, isFirst, onUpdate, onToggleGlobal, onToggleCustomCalc, onAddPart, onMove, onDelete, children }) => (
    <div id={`bq-item-${item.id}`} className={`p-3 rounded-2xl border bg-white transition-colors duration-700 ${isRecentlyAdded ? 'bg-emerald-50/80 ring-2 ring-emerald-500 border-emerald-200' : 'border-slate-200'}`}>
        <div className="flex items-center gap-2">
            <span className="text-xs font-black text-slate-500 bg-slate-100 rounded-lg px-2 py-1">{autoNumber}</span>
            {item.unit && <span className="text-xs text-slate-500 bg-slate-100 rounded-lg px-2 py-1 break-all">{item.unit}</span>}
            <label className="ml-auto h-11 w-36 shrink-0 flex items-center gap-1 px-3 rounded-xl border border-slate-200 focus-within:border-emerald-500 bg-white">
                <span className="text-xs text-slate-400">Kadar:</span>
                <DimensionInput value={item.rate} onChange={(val) => onUpdate({ rate: val })} disabled={readOnly} className="w-full min-w-0 text-right bg-transparent outline-none text-base text-slate-800 font-mono font-bold" />
            </label>
        </div>
        <div className="mt-3">
            <ClampedTextarea value={item.description} onChange={(e) => onUpdate({ description: e.target.value })} disabled={readOnly} lines={3} className="w-full bg-transparent outline-none text-base font-medium text-slate-800" />
            {item.variant && <div className="text-sm text-slate-500 italic mt-1 break-words">{item.variant}</div>}
        </div>
        <div className="mt-2 space-y-2">
            {item.isCustomCalc ? (
                <div className="flex items-center gap-2">
                    <input type="text" value={item.customCalc || ''} onChange={(e) => onUpdate({ customCalc: e.target.value })} disabled={readOnly} className="flex-1 min-w-0 h-11 px-3 text-base bg-white border border-slate-200 rounded-lg font-mono text-slate-600" placeholder="e.g. 80 x 0.5 x 2" />
                    <label className="h-11 w-28 shrink-0 flex items-center gap-1 px-2 bg-white rounded-lg border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400">QTY</span>
                        <DimensionInput value={item.qty} onChange={(val) => onUpdate({ qty: val })} disabled={readOnly} className="w-full min-w-0 text-right text-base font-bold bg-transparent outline-none" />
                    </label>
                </div>
            ) : (
                <>
                    {children}
                    {!readOnly && (
                        <button type="button" onClick={onAddPart} className="w-full min-h-[44px] flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-emerald-200 text-emerald-600 text-sm font-bold active:bg-emerald-50">
                            <PlusCircle className="w-4 h-4" /> Tambah Kiraan
                        </button>
                    )}
                </>
            )}
        </div>
        <div className="mt-3 flex items-end justify-between gap-3">
            <div className="font-mono font-bold text-emerald-600 text-base break-all">= {item.qty}</div>
            <div className="text-right shrink-0">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">Jumlah</div>
                <div className="font-bold text-slate-900 text-lg">{formatCurrency(item.amount)}</div>
            </div>
        </div>
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-1.5">
            <TouchIconButton label={item.isGlobal ? 'Linked' : 'Manual'} onClick={onToggleGlobal} disabled={readOnly} className={item.isGlobal ? '!bg-emerald-100 !text-emerald-600 !border-emerald-200' : ''}>
                {item.isGlobal ? <Link className="w-4 h-4" /> : <Unlink className="w-4 h-4" />}
            </TouchIconButton>
            <TouchIconButton label={item.isCustomCalc ? 'Kiraan' : 'Teks'} onClick={onToggleCustomCalc} disabled={readOnly} className={item.isCustomCalc ? '!bg-indigo-100 !text-indigo-600 !border-indigo-200' : ''}>
                {item.isCustomCalc ? <List className="w-4 h-4" /> : <Type className="w-4 h-4" />}
            </TouchIconButton>
            {!readOnly && (
                <div className="ml-auto flex items-center gap-1.5">
                    <TouchIconButton label="Naik" onClick={() => onMove('up')} disabled={isFirst}><ChevronUp className="w-5 h-5" /></TouchIconButton>
                    <TouchIconButton label="Turun" onClick={() => onMove('down')}><ChevronDown className="w-5 h-5" /></TouchIconButton>
                    <TouchIconButton label="Padam" onClick={onDelete} danger><Trash2 className="w-5 h-5" /></TouchIconButton>
                </div>
            )}
        </div>
    </div>
);

export default BQItemCardMobile;
