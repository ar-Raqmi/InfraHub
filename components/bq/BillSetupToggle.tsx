import React from 'react';
import { ChevronDown, ChevronUp, MapPin, Ruler } from 'lucide-react';
import { GlobalDimensions } from '../../types';

export const globalDimsSummary = (dims: GlobalDimensions[]) => {
    const [first] = dims;
    if (!first) return '';
    const head = `${first.label || 'Kiraan 1'} · P ${first.length} · L ${first.width} · T ${first.depth}`;
    return dims.length > 1 ? `${head} · +${dims.length - 1}` : head;
};

interface BillSetupToggleProps {
    open: boolean;
    onToggle: () => void;
    // Undefined for Permulaan/Insurans BILs, which have no Lokasi.
    locationCount?: number;
    summary: string;
    dirty: boolean;
}

// Phone summary row that folds the Lokasi + Global Calculation panel into one line.
const BillSetupToggle: React.FC<BillSetupToggleProps> = ({ open, onToggle, locationCount, summary, dirty }) => (
    <button
        type="button"
        data-bq-setup-toggle
        onClick={onToggle}
        aria-expanded={open}
        className={`md:hidden w-full min-h-[56px] px-3 py-2 rounded-xl border text-left flex items-center gap-2 ${dirty ? 'bg-orange-50 border-orange-200' : 'bg-white border-slate-200'}`}
    >
        <span className="flex-1 min-w-0">
            <span className="flex flex-wrap items-center gap-x-2 text-[11px] font-bold uppercase text-slate-500">
                {locationCount !== undefined && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> Lokasi: {locationCount}</span>}
                <span className="flex items-center gap-1"><Ruler className="w-3.5 h-3.5" /> Global Calculation</span>
            </span>
            <span className="block font-mono text-sm text-slate-700 break-words">{summary}</span>
        </span>
        {open ? <ChevronUp className="w-5 h-5 shrink-0 text-slate-400" /> : <ChevronDown className="w-5 h-5 shrink-0 text-slate-400" />}
    </button>
);

export default BillSetupToggle;
