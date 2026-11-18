import React from 'react';
import { Calculator, ChevronDown, ChevronUp, Link, List, PlusCircle, Trash2, Type, Unlink } from 'lucide-react';
import { BQItem, formatCurrency } from '../../types';
import { DimensionInput } from '../../lib/bqShared';
import ExpandableText from '../ExpandableText';
import ClampedTextarea from './ClampedTextarea';
import TouchIconButton from './TouchIconButton';

interface PelarasanItemCardMobileProps {
    item: BQItem;
    autoNumber: string;
    originalQty: number;
    originalAmount: number;
    diff: number;
    cardStyle: string;
    diffTextClass: string;
    readOnly: boolean;
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

// formatCurrency joins "RM" and the number with a no-break space; a plain space lets a
// narrow column wrap between them instead of inside the number.
const breakableAmount = (amount: string) => amount.replace('\u00a0', ' ');

const StripCell: React.FC<{ label: string; qty?: number; amount: string; className?: string; amountClass?: string }> = ({ label, qty, amount, className = '', amountClass = '' }) => (
    <div className={`min-w-0 px-2 py-2 text-center ${className}`}>
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</div>
        {qty !== undefined && <div className="font-mono text-base font-bold text-slate-800 break-all">{qty}</div>}
        <div className={`font-mono text-[11px] break-words ${amountClass}`}>{breakableAmount(amount)}</div>
    </div>
);

// Phone layout of one Pelarasan item: the Asal | Laras | Beza verdict sits right under
// the description, before the adjusted calculation.
const PelarasanItemCardMobile: React.FC<PelarasanItemCardMobileProps> = ({ item, autoNumber, originalQty, originalAmount, diff, cardStyle, diffTextClass, readOnly, isFirst, onUpdate, onToggleGlobal, onToggleCustomCalc, onAddPart, onMove, onDelete, children }) => {
    const isAdded = !!item.isAdjustment;
    const tone = isAdded
        ? { block: 'bg-blue-50/30 border-blue-100', title: 'text-blue-600', add: 'border-blue-200 text-blue-600 active:bg-blue-50', qty: 'text-blue-600' }
        : { block: 'bg-amber-50/30 border-amber-100', title: 'text-amber-600', add: 'border-amber-200 text-amber-600 active:bg-amber-50', qty: 'text-amber-600' };
    const bezaBg = diff < -0.01 ? 'bg-red-50' : diff > 0.01 ? 'bg-blue-50' : 'bg-slate-50';
    return (
        <div id={`bq-item-${item.id}`} className={`p-3 rounded-2xl border bg-white transition-all duration-700 ${cardStyle}`}>
            <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-black text-slate-500 bg-slate-100 rounded-lg px-2 py-1">{autoNumber}</span>
                {isAdded ? (
                    <>
                        <input type="text" value={item.unit} onChange={(e) => onUpdate({ unit: e.target.value })} disabled={readOnly} className="h-11 w-16 px-2 text-base bg-blue-50 rounded-lg text-blue-600 font-mono outline-none border border-blue-100" />
                        <span className="text-sm text-slate-400">@</span>
                        <DimensionInput value={item.rate} onChange={(val) => onUpdate({ rate: val })} disabled={readOnly} className="h-11 w-28 px-2 text-base bg-blue-50 rounded-lg text-blue-600 font-mono outline-none border border-blue-100" />
                    </>
                ) : (
                    <>
                        <span className="text-xs bg-slate-100 px-2 py-1 rounded-lg text-slate-500 font-mono break-all">{item.unit}</span>
                        <span className="text-sm text-slate-400">@ {formatCurrency(item.rate)}</span>
                    </>
                )}
            </div>
            <div className="mt-3">
                {isAdded
                    ? <ClampedTextarea value={item.description} onChange={(e) => onUpdate({ description: e.target.value })} disabled={readOnly} lines={3} className="w-full bg-transparent outline-none text-base font-medium text-blue-600" />
                    : <ExpandableText text={item.description} lines={3} className="text-base font-medium text-slate-800 leading-6" />}
                {item.variant && <p className="text-sm text-slate-500 italic mt-1 break-words">{item.variant}</p>}
            </div>
            <div className="mt-2 grid grid-cols-3 rounded-xl border border-slate-200 divide-x divide-slate-200 overflow-hidden">
                <StripCell label="Asal" qty={originalQty} amount={formatCurrency(originalAmount)} className="bg-slate-50" amountClass="text-slate-500" />
                <StripCell label="Laras" qty={item.qty} amount={formatCurrency(item.amount)} amountClass="font-bold text-slate-800" />
                <StripCell label="Beza (RM)" amount={`${diff > 0 ? '+' : ''}${formatCurrency(diff)}`} className={`${bezaBg} flex flex-col justify-center`} amountClass={`!text-sm ${diffTextClass}`} />
            </div>
            <div className={`mt-3 p-2 rounded-xl border space-y-2 ${tone.block}`}>
                <div className="flex flex-wrap items-center gap-2">
                    <div className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 ${tone.title}`}>
                        <Calculator className="w-3.5 h-3.5 shrink-0" /> {isAdded ? 'Penambahan (New)' : 'Pelarasan (Adjusted)'}
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                        <button type="button" onClick={onToggleGlobal} disabled={readOnly} className={`h-11 px-3 shrink-0 rounded-xl border text-sm font-bold flex items-center gap-1.5 ${item.isGlobal ? 'bg-emerald-100 text-emerald-600 border-emerald-200' : 'bg-white text-slate-400 border-slate-200'}`}>
                            {item.isGlobal ? <Link className="w-4 h-4" /> : <Unlink className="w-4 h-4" />}{item.isGlobal ? 'Linked' : 'Manual'}
                        </button>
                        <TouchIconButton label={item.isCustomCalc ? 'Kiraan' : 'Teks'} onClick={onToggleCustomCalc} disabled={readOnly} className={item.isCustomCalc ? '!bg-indigo-100 !text-indigo-600 !border-indigo-200' : ''}>
                            {item.isCustomCalc ? <List className="w-4 h-4" /> : <Type className="w-4 h-4" />}
                        </TouchIconButton>
                    </div>
                </div>
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
                            <div className="flex items-center gap-2 pt-1">
                                <button type="button" onClick={onAddPart} className={`min-h-[44px] px-3 flex items-center gap-1.5 rounded-xl border-2 border-dashed text-sm font-bold whitespace-nowrap ${tone.add}`}>
                                    <PlusCircle className="w-4 h-4" /> Tambah Kiraan
                                </button>
                                <div className="ml-auto flex items-center gap-2 min-w-0">
                                    <span className="text-xs text-slate-400 whitespace-nowrap">Qty {isAdded ? 'Baru' : 'Laras'}:</span>
                                    <span className={`font-mono font-bold text-base break-all ${tone.qty}`}>= {item.qty}</span>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
            {!readOnly && isAdded && (
                <div className="mt-3 pt-3 border-t border-slate-100 flex justify-end gap-2">
                    <TouchIconButton label="Naik" onClick={() => onMove('up')} disabled={isFirst}><ChevronUp className="w-5 h-5" /></TouchIconButton>
                    <TouchIconButton label="Turun" onClick={() => onMove('down')}><ChevronDown className="w-5 h-5" /></TouchIconButton>
                    <TouchIconButton label="Padam" onClick={onDelete} danger><Trash2 className="w-5 h-5" /></TouchIconButton>
                </div>
            )}
        </div>
    );
};

export default PelarasanItemCardMobile;
