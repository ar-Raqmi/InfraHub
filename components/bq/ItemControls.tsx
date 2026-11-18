import React from 'react';
import { ChevronDown, ChevronUp, List, Trash2, Type } from 'lucide-react';
import { BQItem } from '../../types';
import { DimensionInput } from '../../lib/bqShared';
import TouchIconButton from './TouchIconButton';

// Small phone controls shared by the BQ and Pelarasan item cards.

export const CustomCalcToggle: React.FC<{ isCustomCalc: boolean; disabled: boolean; onToggle: () => void }> = ({ isCustomCalc, disabled, onToggle }) => (
    <TouchIconButton label={isCustomCalc ? 'Kiraan' : 'Teks'} onClick={onToggle} disabled={disabled} className={isCustomCalc ? '!bg-indigo-100 !text-indigo-600 !border-indigo-200' : ''}>
        {isCustomCalc ? <List className="w-4 h-4" /> : <Type className="w-4 h-4" />}
    </TouchIconButton>
);

export const CustomCalcFields: React.FC<{ item: BQItem; readOnly: boolean; onUpdate: (updates: Partial<BQItem>) => void }> = ({ item, readOnly, onUpdate }) => (
    <div className="flex items-center gap-2">
        <input type="text" value={item.customCalc || ''} onChange={(e) => onUpdate({ customCalc: e.target.value })} disabled={readOnly} className="flex-1 min-w-0 h-11 px-3 text-base bg-white border border-slate-200 rounded-lg font-mono text-slate-600" placeholder="e.g. 80 x 0.5 x 2" />
        <label className="h-11 w-28 shrink-0 flex items-center gap-1 px-2 bg-white rounded-lg border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400">QTY</span>
            <DimensionInput value={item.qty} onChange={(val) => onUpdate({ qty: val })} disabled={readOnly} className="w-full min-w-0 text-right text-base font-bold bg-transparent outline-none" />
        </label>
    </div>
);

interface ReorderDeleteButtonsProps {
    onMove: (direction: 'up' | 'down') => void;
    onDelete: () => void;
    upDisabled?: boolean;
    downDisabled?: boolean;
    iconClass?: string;
}

export const ReorderDeleteButtons: React.FC<ReorderDeleteButtonsProps> = ({ onMove, onDelete, upDisabled, downDisabled, iconClass = 'w-5 h-5' }) => (
    <>
        <TouchIconButton label="Naik" onClick={() => onMove('up')} disabled={upDisabled}><ChevronUp className={iconClass} /></TouchIconButton>
        <TouchIconButton label="Turun" onClick={() => onMove('down')} disabled={downDisabled}><ChevronDown className={iconClass} /></TouchIconButton>
        <TouchIconButton label="Padam" onClick={onDelete} danger><Trash2 className={iconClass} /></TouchIconButton>
    </>
);
