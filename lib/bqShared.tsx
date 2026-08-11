import React, { useState, useEffect, useRef } from 'react';
import { BQItem } from '../types';

// Shared helpers for the BQ and BQ Pelarasan editors. Only logic that is
// identical between the two editors lives here; ICON_MAP and DimensionInput
// are intentionally NOT shared (they have drifted between the two editors).

export const getColorStyles = (color: string) => {
    const colors: Record<string, string> = {
        slate: "bg-slate-100 text-slate-600 border-slate-200",
        red: "bg-red-100 text-red-600 border-red-200",
        orange: "bg-orange-100 text-orange-600 border-orange-200",
        amber: "bg-amber-100 text-amber-600 border-amber-200",
        yellow: "bg-yellow-100 text-yellow-600 border-yellow-200",
        lime: "bg-lime-100 text-lime-600 border-lime-200",
        green: "bg-green-100 text-green-600 border-green-200",
        emerald: "bg-emerald-100 text-emerald-600 border-emerald-200",
        teal: "bg-teal-100 text-teal-600 border-teal-200",
        cyan: "bg-cyan-100 text-cyan-600 border-cyan-200",
        sky: "bg-sky-100 text-sky-600 border-sky-200",
        blue: "bg-blue-100 text-blue-600 border-blue-200",
        indigo: "bg-indigo-100 text-indigo-600 border-indigo-200",
        violet: "bg-violet-100 text-violet-600 border-violet-200",
        purple: "bg-purple-100 text-purple-600 border-purple-200",
        fuchsia: "bg-fuchsia-100 text-fuchsia-600 border-fuchsia-200",
        pink: "bg-pink-100 text-pink-600 border-pink-200",
        rose: "bg-rose-100 text-rose-600 border-rose-200",
    };
    return colors[color] || colors['blue'];
};

// Helper for Roman Numerals
export function toRoman(num: number): string {
    const lookup: { [key: string]: number } = { m: 1000, cm: 900, d: 500, cd: 400, c: 100, xc: 90, l: 50, xl: 40, x: 10, ix: 9, v: 5, iv: 4, i: 1 };
    let roman = '';
    for (let i in lookup) {
        while (num >= lookup[i]) {
            roman += i;
            num -= lookup[i];
        }
    }
    return roman;
}

export const getItemLevel = (item: BQItem): 0 | 1 | 2 => {
    if (item.type === 'HEADER') {
        const isUppercase = item.description === item.description.toUpperCase() && /[A-Z]/.test(item.description);
        return isUppercase ? 0 : 1;
    }
    return 2;
};

export const getAutoNumber = (items: BQItem[], currentIndex: number) => {
    let sectionIndex = 0;
    let itemIndex = 0;
    let variantIndex = 0;
    let lastHeaderType: 'NONE' | 'SECTION' | 'ITEM_PARENT' = 'NONE';

    for (let i = 0; i <= currentIndex; i++) {
        const item = items[i];
        const level = getItemLevel(item);
        if (level === 0) { sectionIndex++; itemIndex = 0; variantIndex = 0; lastHeaderType = 'SECTION'; }
        else if (level === 1) { itemIndex++; variantIndex = 0; lastHeaderType = 'ITEM_PARENT'; }
        else { if (lastHeaderType === 'ITEM_PARENT') { variantIndex++; } else { itemIndex++; } }
    }
    const currentItem = items[currentIndex];
    const level = getItemLevel(currentItem);
    if (level === 0) return `${sectionIndex}.0`;
    if (level === 1) return `${sectionIndex}.${itemIndex}`;
    if (lastHeaderType === 'ITEM_PARENT') { return `${toRoman(variantIndex)})`; } else { return `${sectionIndex}.${itemIndex}`; }
};

export const DimensionInput = ({
    value,
    onChange,
    className,
    placeholder,
    disabled,
    backspaceOnZero
}: {
    value: number;
    onChange: (val: number) => void;
    className?: string;
    placeholder?: string;
    disabled?: boolean;
    backspaceOnZero?: boolean;
}) => {
    const [localValue, setLocalValue] = useState<string>(value?.toString() || '');
    useEffect(() => {
        const parsedLocal = parseFloat(localValue);
        if (parsedLocal === value) return;
        if (isNaN(parsedLocal) && value === 0) return;
        setLocalValue(value?.toString() || '');
    }, [value]);
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let newVal = e.target.value;
        if (/^0+$/.test(newVal)) newVal = '0';
        newVal = newVal.replace(/^0+(?=[1-9])/, '');
        setLocalValue(newVal);
        const parsed = parseFloat(newVal);
        if (!isNaN(parsed)) { onChange(parsed); } else { onChange(0); }
    };
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && backspaceOnZero && localValue.length <= 1) {
            e.preventDefault();
            setLocalValue('0');
            onChange(0);
        }
    };
    return (
        <input
            type="number"
            value={localValue}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            className={className}
            placeholder={placeholder}
            step="any"
            disabled={disabled}
        />
    );
};

export const AutoResizeTextarea = ({
    value,
    onChange,
    className,
    placeholder,
    autoFocus,
    minHeight = 24,
    disabled
}: {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    className?: string;
    placeholder?: string;
    autoFocus?: boolean;
    minHeight?: number;
    disabled?: boolean;
}) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const adjustHeight = () => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.max(textareaRef.current.scrollHeight, minHeight)}px`;
        }
    };
    useEffect(() => { adjustHeight(); }, [value]);
    return (
        <textarea
            ref={textareaRef}
            value={value}
            onChange={onChange}
            className={`${className} resize-none overflow-hidden block ${disabled ? 'cursor-not-allowed' : ''}`}
            placeholder={placeholder}
            rows={1}
            autoFocus={autoFocus}
            style={{ minHeight: `${minHeight}px` }}
            disabled={disabled}
        />
    );
};
