import React, { useEffect, useRef, useState } from 'react';
import { AutoResizeTextarea } from '../../lib/bqShared';

const LINE_PX = 24;

interface ClampedTextareaProps {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    lines: 2 | 3;
    className?: string;
    placeholder?: string;
    disabled?: boolean;
}

// Editable twin of ExpandableText: an auto-growing textarea clipped to N lines
// until "Lihat penuh" or focus opens it, so long descriptions stay editable.
const ClampedTextarea: React.FC<ClampedTextareaProps> = ({ value, onChange, lines, className = '', placeholder, disabled }) => {
    const boxRef = useRef<HTMLDivElement>(null);
    const [expanded, setExpanded] = useState(false);
    const [overflows, setOverflows] = useState(false);
    const maxHeight = lines * LINE_PX;

    useEffect(() => {
        const textarea = boxRef.current?.querySelector('textarea');
        if (!textarea) return;
        const measure = () => setOverflows(textarea.offsetHeight > maxHeight + 1);
        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(textarea);
        return () => observer.disconnect();
    }, [value, maxHeight]);

    return (
        <div>
            <div ref={boxRef} onFocus={() => setExpanded(true)} className={expanded ? '' : 'overflow-hidden'} style={expanded ? undefined : { maxHeight }}>
                <AutoResizeTextarea value={value} onChange={onChange} disabled={disabled} placeholder={placeholder} minHeight={LINE_PX} className={`${className} leading-6`} />
            </div>
            {overflows && (
                <button
                    type="button"
                    onClick={() => setExpanded(v => !v)}
                    aria-expanded={expanded}
                    className="min-h-[44px] pr-4 text-xs font-bold text-emerald-700 active:text-emerald-900"
                >
                    {expanded ? 'Tutup ▴' : 'Lihat penuh ▾'}
                </button>
            )}
        </div>
    );
};

export default ClampedTextarea;
