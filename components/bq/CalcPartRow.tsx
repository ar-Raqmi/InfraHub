import React from 'react';
import { Link, Unlink, MinusCircle } from 'lucide-react';
import { CalculationPart, GlobalDimensions, formatCurrency, partMultiplier } from '../../types';
import { DimensionInput } from '../../lib/bqShared';
import { useIsMobile } from './useIsMobile';

export type CalcTheme = 'emerald' | 'amber';

const THEMES: Record<CalcTheme, { input: string; linkedRow: string; linkOn: string; linkOff: string; labelFocus: string; dimOn: string; checkbox: string; globalChip: string; toggleOn: string; cell: string }> = {
    emerald: {
        input: 'bg-emerald-50/50 text-emerald-700 border-b border-emerald-300 rounded-sm',
        linkedRow: 'bg-emerald-50/30 border-emerald-100',
        linkOn: 'text-emerald-600 bg-emerald-100',
        linkOff: 'text-slate-300 hover:text-emerald-500 hover:bg-emerald-50',
        labelFocus: 'focus:border-emerald-500',
        dimOn: 'bg-emerald-50 border-emerald-200',
        checkbox: 'text-emerald-600',
        globalChip: 'text-emerald-500 bg-emerald-50',
        toggleOn: 'bg-emerald-50 border-emerald-300 text-emerald-700',
        cell: 'border-emerald-200 focus-within:border-emerald-500',
    },
    amber: {
        input: 'bg-amber-50/50 text-amber-700 border-b border-amber-300 rounded-sm',
        linkedRow: 'bg-amber-50/30 border-amber-100',
        linkOn: 'text-amber-600 bg-amber-100',
        linkOff: 'text-slate-300 hover:text-amber-500 hover:bg-amber-50',
        labelFocus: 'focus:border-amber-500',
        dimOn: 'bg-amber-50 border-amber-200',
        checkbox: 'text-amber-600',
        globalChip: 'text-amber-500 bg-amber-50',
        toggleOn: 'bg-amber-50 border-amber-300 text-amber-700',
        cell: 'border-amber-200 focus-within:border-amber-500',
    },
};

const DIMS = [
    { letter: 'P', value: 'length', flag: 'hasLength' },
    { letter: 'L', value: 'width', flag: 'hasWidth' },
    { letter: 'T', value: 'depth', flag: 'hasDepth' },
] as const;

const partQty = (part: CalculationPart) => {
    let product = 1;
    if (part.hasLength) product *= part.length;
    if (part.hasWidth) product *= part.width;
    if (part.hasDepth) product *= part.depth;
    return product * partMultiplier(part.multiplier);
};

const formatQty = (qty: number) => (qty % 1 === 0 ? qty : qty.toFixed(2));

export const globalDimLabel = (part: CalculationPart, dims: GlobalDimensions[]) =>
    part.isGlobal && part.globalIndex !== undefined ? (dims[part.globalIndex]?.label || `Kiraan ${part.globalIndex + 1}`) : '';

interface CalcPartRowProps {
    part: CalculationPart;
    unit: string;
    // BQ prices each row; Pelarasan shows the quantity only.
    rate?: number;
    theme: CalcTheme;
    globalLabel: string;
    readOnly: boolean;
    onUpdate: (updates: Partial<CalculationPart>) => void;
    onRemove: () => void;
    onLink: () => void;
}

// One calculation row (P x L x T x multiplier) for both BQ editors.
const CalcPartRow: React.FC<CalcPartRowProps> = (props) => {
    const isMobile = useIsMobile();
    return isMobile ? <MobileRow {...props} /> : <DesktopRow {...props} />;
};

const linkTitle = (part: CalculationPart, globalLabel: string) => (part.isGlobal ? `Terhubung dengan: ${globalLabel}` : 'Hubungkan dengan Global Calculation');

const DesktopRow: React.FC<CalcPartRowProps> = ({ part, unit, rate, theme, globalLabel, readOnly, onUpdate, onRemove, onLink }) => {
    const t = THEMES[theme];
    const isGlobal = part.isGlobal;
    const inputClassBase = 'w-12 outline-none text-right font-bold text-sm transition-colors';
    const inputClass = isGlobal || readOnly ? `${inputClassBase} bg-transparent text-slate-400 cursor-not-allowed` : `${inputClassBase} ${t.input}`;
    const qty = partQty(part);
    return (
        <div className={`flex flex-wrap items-center gap-2 text-xs p-1.5 rounded-lg border mb-1 last:mb-0 transition-colors ${isGlobal ? t.linkedRow : 'bg-white border-slate-200'}`}>
            {!readOnly && (
                <button onClick={onLink} className={`p-1 rounded transition-colors ${isGlobal ? t.linkOn : t.linkOff}`} title={linkTitle(part, globalLabel)}>
                    {isGlobal ? <Link className="w-3 h-3" /> : <Unlink className="w-3 h-3" />}
                </button>
            )}
            <input type="text" value={part.label || ''} onChange={(e) => onUpdate({ label: e.target.value })} disabled={readOnly} className={`w-16 bg-transparent border-b border-dashed border-slate-300 ${t.labelFocus} outline-none text-slate-500 placeholder-slate-400 text-[10px]`} placeholder="Label" />
            {DIMS.map((dim, i) => (
                <React.Fragment key={dim.letter}>
                    <div className={`flex items-center gap-1 rounded px-1.5 py-0.5 border transition-colors ${part[dim.flag] ? t.dimOn : 'bg-transparent border-transparent opacity-60'}`}>
                        <input type="checkbox" checked={part[dim.flag]} onChange={(e) => onUpdate({ [dim.flag]: e.target.checked })} disabled={readOnly} className={`w-3 h-3 rounded ${t.checkbox}`} />
                        <span className="text-[10px] font-bold text-slate-500">{dim.letter}</span>
                        {part[dim.flag] && (<DimensionInput value={part[dim.value] || 0} onChange={val => onUpdate({ [dim.value]: val })} className={inputClass} placeholder="0" disabled={isGlobal || readOnly} />)}
                    </div>
                    {i === 0 && part.hasLength && (part.hasWidth || part.hasDepth) && <span className="text-slate-300">×</span>}
                    {i === 1 && part.hasWidth && part.hasDepth && <span className="text-slate-300">×</span>}
                </React.Fragment>
            ))}
            <span className="text-slate-300">×</span>
            <div className={`flex items-center gap-1 rounded px-1.5 py-0.5 border border-transparent ${part.multiplier !== 1 ? 'bg-orange-50 border-orange-200' : 'opacity-60'}`}><DimensionInput value={part.multiplier || 0} onChange={val => onUpdate({ multiplier: val })} disabled={readOnly} className="w-8 bg-transparent outline-none text-center font-bold text-slate-700 placeholder-slate-400" placeholder="1" backspaceOnZero emptyValue={1} /></div>

            <div className="ml-auto flex items-center gap-2 md:gap-3 pl-2 border-l border-slate-100">
                {isGlobal && <span className={`text-[8px] font-bold uppercase tracking-tighter px-1 rounded ${t.globalChip}`}>{globalLabel}</span>}
                <span className="hidden md:inline text-[10px] text-slate-400 font-mono">{unit}</span>
                <div className="text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded min-w-[30px] text-center">{formatQty(qty)}</div>
                {rate !== undefined && (
                    <>
                        <div className="hidden md:block text-[10px] text-slate-400">x {formatCurrency(rate)}</div>
                        <div className="text-[10px] font-mono font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 min-w-[60px] text-right">{formatCurrency(qty * rate)}</div>
                    </>
                )}
                {!readOnly && <button onClick={onRemove} className="p-1 text-slate-300 hover:text-red-500 transition-colors"><MinusCircle className="w-4 h-4" /></button>}
            </div>
        </div>
    );
};

const MobileRow: React.FC<CalcPartRowProps> = ({ part, unit, rate, theme, globalLabel, readOnly, onUpdate, onRemove, onLink }) => {
    const t = THEMES[theme];
    const isGlobal = part.isGlobal;
    const dimLocked = isGlobal || readOnly;
    const qty = partQty(part);
    const cellBase = 'relative h-12 min-w-0 flex items-center rounded-lg border';
    const cellLetter = 'absolute left-1.5 top-1 text-[9px] leading-none font-bold text-slate-400';
    const inputBase = 'w-full h-full min-w-0 px-1.5 pt-2 bg-transparent outline-none text-right font-mono font-bold text-base';
    return (
        <div className={`rounded-xl border p-2 space-y-2 ${isGlobal ? t.linkedRow : 'bg-white border-slate-200'}`}>
            <div className="flex flex-wrap items-center gap-1.5">
                {!readOnly && (
                    <button type="button" onClick={onLink} aria-label={linkTitle(part, globalLabel)} title={linkTitle(part, globalLabel)} className={`w-11 h-11 shrink-0 flex items-center justify-center rounded-lg border ${isGlobal ? `${t.linkOn} ${t.cell}` : 'bg-white border-slate-200 text-slate-400'}`}>
                        {isGlobal ? <Link className="w-4 h-4" /> : <Unlink className="w-4 h-4" />}
                    </button>
                )}
                <input type="text" value={part.label || ''} onChange={(e) => onUpdate({ label: e.target.value })} disabled={readOnly} placeholder="Label" className={`flex-1 basis-[7.5rem] min-w-0 h-11 px-3 rounded-lg border border-dashed border-slate-300 bg-white ${t.labelFocus} outline-none text-base text-slate-600 placeholder-slate-400`} />
                <div className="ml-auto flex gap-1.5">
                    {DIMS.map(dim => (
                        <button key={dim.letter} type="button" aria-pressed={part[dim.flag]} aria-label={dim.letter} disabled={readOnly} onClick={() => onUpdate({ [dim.flag]: !part[dim.flag] })} className={`w-11 h-11 shrink-0 rounded-lg border text-sm font-bold ${part[dim.flag] ? t.toggleOn : 'bg-white border-slate-200 text-slate-300'}`}>
                            {dim.letter}
                        </button>
                    ))}
                </div>
            </div>
            {/* Cells wrap to a new line before a value would be cut. */}
            <div className="grid grid-cols-[repeat(auto-fit,minmax(3.5rem,1fr))] gap-1">
                {DIMS.map(dim => part[dim.flag] ? (
                    <label key={dim.letter} className={`${cellBase} ${dimLocked ? 'bg-slate-50 border-slate-200 text-slate-400' : `bg-white text-slate-800 ${t.cell}`}`}>
                        <span className={cellLetter}>{dim.letter}</span>
                        <DimensionInput value={part[dim.value] || 0} onChange={val => onUpdate({ [dim.value]: val })} disabled={dimLocked} placeholder="0" className={`${inputBase} ${dimLocked ? 'cursor-not-allowed' : ''}`} />
                    </label>
                ) : (
                    <div key={dim.letter} className={`${cellBase} px-2 border-dashed border-slate-200 text-[10px] font-bold text-slate-300`}>{dim.letter} –</div>
                ))}
                <label className={`${cellBase} ${part.multiplier !== 1 ? 'bg-orange-50 border-orange-300 text-orange-700' : 'bg-white border-slate-200 text-slate-700'}`}>
                    <span className={cellLetter}>×</span>
                    <DimensionInput value={part.multiplier || 0} onChange={val => onUpdate({ multiplier: val })} disabled={readOnly} placeholder="1" backspaceOnZero emptyValue={1} className={`${inputBase} placeholder-slate-400`} />
                </label>
            </div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 min-h-[44px] pl-1">
                {isGlobal && <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded shrink-0 ${t.globalChip}`}>{globalLabel}</span>}
                <span className="text-xs text-slate-500 font-mono whitespace-nowrap">
                    {rate === undefined ? '= ' : ''}<b className="text-slate-800">{formatQty(qty)}</b> {unit}{rate !== undefined && <> × {formatCurrency(rate)}</>}
                </span>
                {rate !== undefined && <span className="ml-auto shrink-0 text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">{formatCurrency(qty * rate)}</span>}
                {!readOnly && (
                    <button type="button" onClick={onRemove} aria-label="Padam Kiraan" title="Padam Kiraan" className={`${rate === undefined ? 'ml-auto' : ''} w-11 h-11 shrink-0 flex items-center justify-center rounded-lg text-slate-400 active:text-red-500 active:bg-red-50`}>
                        <MinusCircle className="w-5 h-5" />
                    </button>
                )}
            </div>
        </div>
    );
};

export default CalcPartRow;
