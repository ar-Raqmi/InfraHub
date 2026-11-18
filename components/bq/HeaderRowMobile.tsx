import React, { useState } from 'react';
import { ChevronDown, ChevronRight, ChevronUp, MoreHorizontal, Trash2 } from 'lucide-react';
import BottomSheet from '../BottomSheet';
import ExpandableText from '../ExpandableText';
import { AutoResizeTextarea } from '../../lib/bqShared';
import ClampedTextarea from './ClampedTextarea';

export interface HeaderAction {
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
    disabled?: boolean;
    danger?: boolean;
}

export const reorderDeleteActions = (isFirst: boolean, onMove: (direction: 'up' | 'down') => void, onDelete: () => void): HeaderAction[] => [
    { label: 'Naik', icon: <ChevronUp className="w-5 h-5" />, onClick: () => onMove('up'), disabled: isFirst },
    { label: 'Turun', icon: <ChevronDown className="w-5 h-5" />, onClick: () => onMove('down') },
    { label: 'Padam', icon: <Trash2 className="w-5 h-5" />, onClick: onDelete, danger: true },
];

interface HeaderRowMobileProps {
    id?: string;
    autoNumber: string;
    isLevel0: boolean;
    isCollapsed: boolean;
    onToggleCollapse: () => void;
    description: string;
    // Omitted for read-only headers (Pelarasan rows copied from the BQ).
    onDescriptionChange?: (value: string) => void;
    readOnly: boolean;
    textClass: string;
    highlightClass?: string;
    actions: HeaderAction[];
}

const SHEET_TITLE_CHARS = 60;

// Phone header row: the title gets the full width; reorder/move/delete live in a ⋯ sheet.
const HeaderRowMobile: React.FC<HeaderRowMobileProps> = ({ id, autoNumber, isLevel0, isCollapsed, onToggleCollapse, description, onDescriptionChange, readOnly, textClass, highlightClass = '', actions }) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const textStyle = `w-full bg-transparent outline-none text-base ${textClass} ${isLevel0 ? 'font-bold uppercase' : 'font-semibold'}`;
    const sheetTitle = `${autoNumber} ${description.length > SHEET_TITLE_CHARS ? `${description.slice(0, SHEET_TITLE_CHARS)}…` : description}`;

    const renderText = () => {
        if (onDescriptionChange) {
            const onChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => onDescriptionChange(e.target.value);
            return isLevel0
                ? <AutoResizeTextarea value={description} onChange={onChange} disabled={readOnly} placeholder="TAJUK..." minHeight={24} className={`${textStyle} leading-6`} />
                : <ClampedTextarea value={description} onChange={onChange} disabled={readOnly} placeholder="TAJUK..." lines={2} className={textStyle} />;
        }
        return isLevel0 ? <p className={`${textStyle} leading-6 break-words`}>{description}</p> : <ExpandableText text={description} lines={2} className={`${textStyle} leading-6`} />;
    };

    return (
        <div id={id} className={`flex items-start gap-1 py-1 border-b border-slate-100 ${isLevel0 ? 'bg-slate-100' : 'bg-slate-50/50'} -mx-2 px-1 rounded-xl ${highlightClass}`}>
            <span className="text-xs font-black text-slate-400 min-w-[28px] pt-[14px]">{autoNumber}</span>
            <button type="button" onClick={onToggleCollapse} aria-label={isCollapsed ? 'Expand' : 'Collapse'} aria-expanded={!isCollapsed} className="w-11 h-11 shrink-0 flex items-center justify-center rounded-lg text-slate-400 active:bg-slate-200">
                {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
            <div className="flex-1 min-w-0 pt-[10px] pb-1">{renderText()}</div>
            {!readOnly && actions.length > 0 && (
                <button type="button" onClick={() => setMenuOpen(true)} aria-label="Tindakan" title="Tindakan" className="w-11 h-11 shrink-0 flex items-center justify-center rounded-lg text-slate-500 active:bg-slate-200">
                    <MoreHorizontal className="w-5 h-5" />
                </button>
            )}
            <BottomSheet open={menuOpen} title={sheetTitle} onClose={() => setMenuOpen(false)}>
                <div className="space-y-2">
                    {actions.map(action => (
                        <button
                            key={action.label}
                            type="button"
                            disabled={action.disabled}
                            onClick={() => { setMenuOpen(false); action.onClick(); }}
                            className={`w-full min-h-[52px] px-4 flex items-center gap-3 rounded-xl border text-sm font-bold disabled:opacity-30 ${action.danger ? 'border-red-100 text-red-600 active:bg-red-50' : 'border-slate-200 text-slate-700 active:bg-slate-50'}`}
                        >
                            {action.icon}{action.label}
                        </button>
                    ))}
                </div>
            </BottomSheet>
        </div>
    );
};

export default HeaderRowMobile;
