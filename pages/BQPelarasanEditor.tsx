
import React, { useState, useEffect } from 'react';
import { BQGroup, GlobalDimensions, Project, BQItem, formatCurrency, CalculationPart, ProjectLocation } from '../types';
import { ChevronDown, ChevronRight, Save, Ruler, ChevronUp, Link, Unlink, PlusCircle, MinusCircle, FolderPlus, Calculator, MapPin, Layers, Info, AlertTriangle } from 'lucide-react';

interface BQPelarasanEditorProps {
  originalData: BQGroup[];
  pelarasanData: BQGroup[];
  onDataChange: (data: BQGroup[]) => void;
  projectData: Project;
  isPrintView?: boolean;
  locationRows: ProjectLocation[];
  locationDimensionsPelarasan: Record<string, GlobalDimensions>;
  onLocationDimensionsPelarasanChange: (locationId: string, dims: GlobalDimensions) => void;
  readOnly?: boolean;
}

// Improved DimensionInput
const DimensionInput = ({ 
    value, 
    onChange, 
    className, 
    placeholder,
    disabled
}: { 
    value: number, 
    onChange: (val: number) => void, 
    className?: string, 
    placeholder?: string,
    disabled?: boolean
}) => {
    const [localValue, setLocalValue] = useState<string>(value?.toString() || '');
    useEffect(() => {
        const parsedLocal = parseFloat(localValue);
        if (parsedLocal !== value) {
             if (value === 0 && (localValue === '' || isNaN(parsedLocal))) return;
             setLocalValue(value?.toString() || '');
        }
    }, [value]);
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setLocalValue(val);
        const parsed = parseFloat(val);
        if (!isNaN(parsed)) { onChange(parsed); } else { if (val === '') onChange(0); }
    };
    return (
        <input 
            type="number" 
            value={localValue} 
            onChange={handleChange} 
            className={className} 
            placeholder={placeholder}
            step="any"
            disabled={disabled}
        />
    );
};

const getItemLevel = (item: BQItem): 0 | 1 | 2 => {
    if (item.type === 'HEADER') {
        const isUppercase = item.description === item.description.toUpperCase() && /[A-Z]/.test(item.description);
        return isUppercase ? 0 : 1;
    }
    return 2; 
};

function toRoman(num: number): string {
  const lookup: { [key: string]: number } = {m:1000,cm:900,d:500,cd:400,c:100,xc:90,l:50,xl:40,x:10,ix:9,v:5,iv:4,i:1};
  let roman = '';
  for (let i in lookup ) { while ( num >= lookup[i] ) { roman += i; num -= lookup[i]; } }
  return roman;
}

const getAutoNumber = (items: BQItem[], currentIndex: number) => {
    let sectionIndex = 0; let itemIndex = 0; let variantIndex = 0; let lastHeaderType: 'NONE' | 'SECTION' | 'ITEM_PARENT' = 'NONE';
    for (let i = 0; i <= currentIndex; i++) {
        const item = items[i]; const level = getItemLevel(item);
        if (level === 0) { sectionIndex++; itemIndex = 0; variantIndex = 0; lastHeaderType = 'SECTION'; } 
        else if (level === 1) { itemIndex++; variantIndex = 0; lastHeaderType = 'ITEM_PARENT'; } 
        else { if (lastHeaderType === 'ITEM_PARENT') { variantIndex++; } else { itemIndex++; } }
    }
    const currentItem = items[currentIndex]; const level = getItemLevel(currentItem);
    if (level === 0) return `${sectionIndex}.0`;
    if (level === 1) return `${sectionIndex}.${itemIndex}`;
    if (lastHeaderType === 'ITEM_PARENT') { return `${toRoman(variantIndex)})`; } else { return `${sectionIndex}.${itemIndex}`; }
};

const BQPelarasanEditor: React.FC<BQPelarasanEditorProps> = ({ 
    originalData, 
    pelarasanData, 
    onDataChange, 
    projectData, 
    isPrintView,
    locationRows,
    locationDimensionsPelarasan,
    onLocationDimensionsPelarasanChange,
    readOnly = false
}) => {
    const [activeBillId, setActiveBillId] = useState<string | null>(null);
    const [localDims, setLocalDims] = useState<GlobalDimensions>({ length: 0, width: 0, depth: 0 });
    const [isDimsDirty, setIsDimsDirty] = useState(false);

    useEffect(() => {
        if (pelarasanData.length > 0 && !activeBillId) { setActiveBillId(pelarasanData[0].id); }
    }, [pelarasanData]);

    useEffect(() => {
        if (!activeBillId) return;
        const bill = pelarasanData.find(b => b.id === activeBillId);
        if (bill && bill.locationId) {
            if (locationDimensionsPelarasan?.[bill.locationId]) { setLocalDims(locationDimensionsPelarasan[bill.locationId]); } 
            else if (projectData.locationDimensions?.[bill.locationId]) { setLocalDims(projectData.locationDimensions[bill.locationId]); } 
            else { setLocalDims({ length: 0, width: 0, depth: 0 }); }
        } else { setLocalDims({ length: 0, width: 0, depth: 0 }); }
        setIsDimsDirty(false);
    }, [activeBillId, locationDimensionsPelarasan, projectData.locationDimensions]);

    const toggleCollapse = (billId: string, itemId: string) => {
        const newData = pelarasanData.map(b => {
            if (b.id !== billId) return b;
            return { ...b, items: b.items.map(item => item.id === itemId ? { ...item, isCollapsed: !item.isCollapsed } : item) };
        });
        onDataChange(newData);
    };

    const recalculateQtyFromParts = (parts: CalculationPart[]): number => {
        return parts.reduce((acc, part) => {
             let product = 1; if (part.hasLength) product *= part.length; if (part.hasWidth) product *= part.width; if (part.hasDepth) product *= part.depth;
             return acc + (product * part.multiplier);
        }, 0);
    };

    const updateBillsWithNewDimensions = (locationId: string, newDims: GlobalDimensions) => {
        const updatedBills = pelarasanData.map(bill => {
            if (bill.locationId !== locationId) return bill;
            const updatedItems = bill.items.map(item => {
                if (!item.isGlobal || !item.calculationParts) return item;
                const newParts = item.calculationParts.map(part => ({ ...part, length: part.hasLength ? newDims.length : part.length, width: part.hasWidth ? newDims.width : part.width, depth: part.hasDepth ? newDims.depth : part.depth }));
                const newQty = recalculateQtyFromParts(newParts);
                return { ...item, calculationParts: newParts, qty: parseFloat(newQty.toFixed(2)), amount: parseFloat((newQty * item.rate).toFixed(2)) };
            });
            return { ...bill, items: updatedItems };
        });
        onDataChange(updatedBills);
    };
  
    const handleSaveGlobalDims = () => {
        if (readOnly) return;
        const bill = pelarasanData.find(b => b.id === activeBillId);
        if (!bill || !bill.locationId) return;
        onLocationDimensionsPelarasanChange(bill.locationId, localDims);
        updateBillsWithNewDimensions(bill.locationId, localDims);
        setIsDimsDirty(false);
    };

    const updateItem = (billId: string, itemId: string, updates: Partial<BQItem>) => {
        if (readOnly) return;
        const newData = pelarasanData.map(bill => {
            if (bill.id !== billId) return bill;
            return { ...bill, items: bill.items.map(item => {
                    if (item.id !== itemId) return item;
                    const newItem = { ...item, ...updates };
                    if (updates.qty !== undefined) { newItem.amount = parseFloat((newItem.qty * newItem.rate).toFixed(2)); }
                    return newItem;
                })
            };
        });
        onDataChange(newData);
    };

    const toggleGlobal = (billId: string, itemId: string) => {
        if (readOnly) return;
        const newData = pelarasanData.map(bill => {
            if (bill.id !== billId) return bill;
            return { ...bill, items: bill.items.map(item => {
                    if (item.id !== itemId) return item;
                    const newGlobal = !item.isGlobal; let newItems = { ...item, isGlobal: newGlobal };
                    if (newGlobal && item.calculationParts) {
                         const newParts = item.calculationParts.map(part => ({ ...part, length: part.hasLength ? localDims.length : part.length, width: part.hasWidth ? localDims.width : part.width, depth: part.hasDepth ? localDims.depth : part.depth }));
                         newItems.calculationParts = newParts; const newQty = recalculateQtyFromParts(newParts);
                         newItems.qty = parseFloat(newQty.toFixed(2)); newItems.amount = parseFloat((newQty * newItems.rate).toFixed(2));
                    }
                    return newItems;
                })
            };
        });
        onDataChange(newData);
    };

    const updateCalculationPart = (billId: string, itemId: string, partId: string, updates: Partial<CalculationPart>) => {
        if (readOnly) return;
        const newData = pelarasanData.map(bill => {
            if (bill.id !== billId) return bill;
            return { ...bill, items: bill.items.map(item => {
                    if (item.id !== itemId) return item;
                    if (item.isGlobal) { if (updates.hasLength === true) updates.length = localDims.length; if (updates.hasWidth === true) updates.width = localDims.width; if (updates.hasDepth === true) updates.depth = localDims.depth; }
                    const newParts = (item.calculationParts || []).map(p => p.id === partId ? { ...p, ...updates } : p);
                    const newQty = recalculateQtyFromParts(newParts);
                     return { ...item, calculationParts: newParts, qty: parseFloat(newQty.toFixed(2)), amount: parseFloat((newQty * item.rate).toFixed(2)) };
                })
            };
        });
        onDataChange(newData);
    };
  
    const addCalculationPart = (billId: string, itemId: string) => {
        if (readOnly) return;
        const newData = pelarasanData.map(bill => {
            if (bill.id !== billId) return bill;
            return { ...bill, items: bill.items.map(item => {
                    if (item.id !== itemId) return item;
                    const newPart: CalculationPart = { id: Math.random().toString(36).substr(2, 9), label: '', length: 0, width: 0, depth: 0, multiplier: 1, hasLength: false, hasWidth: false, hasDepth: false };
                    if (item.isGlobal) { newPart.length = localDims.length; newPart.width = localDims.width; newPart.depth = localDims.depth; }
                    const existingParts = item.calculationParts || [];
                    if (existingParts.length > 0) { const last = existingParts[existingParts.length-1]; newPart.hasLength = last.hasLength; newPart.hasWidth = last.hasWidth; newPart.hasDepth = last.hasDepth; }
                    const newParts = [...existingParts, newPart]; const newQty = recalculateQtyFromParts(newParts);
                    return { ...item, calculationParts: newParts, qty: parseFloat(newQty.toFixed(2)), amount: parseFloat((newQty * item.rate).toFixed(2)) };
                })
            };
        });
        onDataChange(newData);
    };
  
    const removeCalculationPart = (billId: string, itemId: string, partId: string) => {
        if (readOnly) return;
        const newData = pelarasanData.map(bill => {
            if (bill.id !== billId) return bill;
            return { ...bill, items: bill.items.map(item => {
                    if (item.id !== itemId) return item;
                    const newParts = (item.calculationParts || []).filter(p => p.id !== partId);
                    const newQty = recalculateQtyFromParts(newParts);
                     return { ...item, calculationParts: newParts, qty: parseFloat(newQty.toFixed(2)), amount: parseFloat((newQty * item.rate).toFixed(2)) };
                })
            };
        });
        onDataChange(newData);
    };

    const renderCalculationPartRow = (bill: BQGroup, item: BQItem, part: CalculationPart) => {
        const isGlobal = item.isGlobal;
        const inputClassBase = "w-12 outline-none text-right font-bold text-sm transition-all";
        const inputClass = isGlobal || readOnly ? `${inputClassBase} bg-transparent text-slate-400 cursor-not-allowed` : `${inputClassBase} bg-yellow-50/50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 border-b border-yellow-300 dark:border-yellow-700/50 rounded-sm`;
        return (
          <div key={part.id} className="flex flex-wrap items-center gap-2 text-xs bg-white dark:bg-slate-700/50 p-1.5 rounded-lg border border-slate-200 dark:border-slate-600 mb-1 last:mb-0">
              <input type="text" value={part.label || ''} onChange={(e) => updateCalculationPart(bill.id, item.id, part.id, { label: e.target.value })} disabled={readOnly} className="w-16 bg-transparent border-b border-dashed border-slate-300 dark:border-slate-500 focus:border-yellow-500 outline-none text-slate-500 placeholder-slate-400 text-[10px]" placeholder="Label" />
              <div className={`flex items-center gap-1 rounded px-1.5 py-0.5 border transition-all ${part.hasLength ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800' : 'bg-transparent border-transparent opacity-60'}`}><span className="text-[10px] font-bold text-slate-500">P</span>{part.hasLength && (<DimensionInput value={part.length || 0} onChange={val => updateCalculationPart(bill.id, item.id, part.id, { length: val })} className={inputClass} disabled={isGlobal || readOnly} />)}</div>
              {part.hasLength && (part.hasWidth || part.hasDepth) && <span className="text-slate-300">×</span>}
              <div className={`flex items-center gap-1 rounded px-1.5 py-0.5 border transition-all ${part.hasWidth ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800' : 'bg-transparent border-transparent opacity-60'}`}><span className="text-[10px] font-bold text-slate-500">L</span>{part.hasWidth && (<DimensionInput value={part.width || 0} onChange={val => updateCalculationPart(bill.id, item.id, part.id, { width: val })} className={inputClass} disabled={isGlobal || readOnly} />)}</div>
              {part.hasWidth && part.hasDepth && <span className="text-slate-300">×</span>}
              <div className={`flex items-center gap-1 rounded px-1.5 py-0.5 border transition-all ${part.hasDepth ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800' : 'bg-transparent border-transparent opacity-60'}`}><span className="text-[10px] font-bold text-slate-500">T</span>{part.hasDepth && (<DimensionInput value={part.depth || 0} onChange={val => updateCalculationPart(bill.id, item.id, part.id, { depth: val })} className={inputClass} disabled={isGlobal || readOnly} />)}</div>
              <span className="text-slate-300">×</span>
              <div className={`flex items-center gap-1 rounded px-1.5 py-0.5 border border-transparent ${part.multiplier !== 1 ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200' : 'opacity-60'}`}><DimensionInput value={part.multiplier || 1} onChange={val => updateCalculationPart(bill.id, item.id, part.id, { multiplier: val })} disabled={readOnly} className="w-8 bg-transparent outline-none text-center font-bold text-slate-700 dark:text-slate-300 placeholder-slate-400" placeholder="1" /></div>
              {!readOnly && (<button onClick={() => removeCalculationPart(bill.id, item.id, part.id)} className="ml-auto p-1 text-slate-300 hover:text-red-500"><MinusCircle className="w-4 h-4" /></button>)}
          </div>
        );
    };

    const renderItemRow = (bill: BQGroup, item: BQItem, index: number, isHidden: boolean) => {
        if (isHidden) return null;
        const autoNumber = getAutoNumber(bill.items, index);
        const hierarchyLevel = getItemLevel(item);
        let originalItem: BQItem | undefined;
        let originalBill = originalData.find(b => b.id === bill.id);
        if (originalBill) { originalItem = originalBill.items.find(i => i.id === item.id); }
        const originalQty = originalItem?.qty || 0;
        const originalAmount = originalItem?.amount || 0;
        const currentAmount = item.amount || 0;
        const diff = currentAmount - originalAmount;
        let colorClass = "text-slate-500 dark:text-slate-400";
        if (diff > 0.01) colorClass = "text-blue-600 dark:text-blue-400 font-bold"; else if (diff < -0.01) colorClass = "text-red-600 dark:text-red-400 font-bold";

        if (item.type === 'HEADER') {
            const isLevel0 = hierarchyLevel === 0;
            return (
                <div key={item.id} className={`flex items-center gap-2 py-3 border-b border-slate-100 dark:border-white/5 ${isLevel0 ? 'bg-slate-100 dark:bg-white/10' : 'bg-slate-50/50 dark:bg-white/5'} px-4 -mx-4`}>
                    <span className="text-xs font-black text-slate-400 min-w-[30px]">{autoNumber}</span>
                    <button onClick={() => toggleCollapse(bill.id, item.id)} className="p-1 rounded hover:bg-slate-200 dark:hover:bg-white/10 text-slate-400 transition-colors">{item.isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}</button>
                    <span className={`text-sm ${isLevel0 ? 'font-bold uppercase text-slate-800 dark:text-white' : 'font-semibold text-slate-700 dark:text-slate-300 pl-1'}`}>{item.description}</span>
                </div>
            );
        }
        return (
            <div key={item.id} className="py-4 border-b border-slate-100 dark:border-white/5 last:border-0 hover:bg-slate-50 dark:hover:bg-white/5 px-2 rounded-xl transition-all duration-300">
                <div className="flex flex-col xl:flex-row gap-4">
                    <div className="flex-1 min-w-0">
                         <div className="flex gap-3 mb-2">
                             <div className="text-xs font-black text-slate-400 mt-1 min-w-[30px]">{autoNumber}</div>
                             <div className="flex-1 pl-10"><p className="text-sm font-medium text-slate-800 dark:text-white leading-relaxed">{item.description}</p>{item.variant && <p className="text-xs text-slate-500 italic mt-1">{item.variant}</p>}<div className="mt-2 flex items-center gap-2"><span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-500 font-mono">{item.unit}</span><span className="text-xs text-slate-400">@ {formatCurrency(item.rate)}</span></div></div>
                         </div>
                         <div className="ml-12 bg-yellow-50/30 dark:bg-yellow-900/10 p-3 rounded-lg border border-yellow-100 dark:border-yellow-900/30">
                             <div className="flex items-center gap-2 mb-2"><div className="text-[10px] font-bold text-yellow-600 dark:text-yellow-500 uppercase tracking-wider flex items-center gap-1"><Calculator className="w-3 h-3" /> Pelarasan (Adjusted)</div><button onClick={() => toggleGlobal(bill.id, item.id)} disabled={readOnly} className={`p-1 rounded-md transition-colors border text-[10px] flex items-center gap-1 ${item.isGlobal ? 'bg-emerald-100 text-emerald-600 border-emerald-200' : 'bg-white text-slate-400 border-slate-200'}`}>{item.isGlobal ? <Link className="w-3 h-3" /> : <Unlink className="w-3 h-3" />}{item.isGlobal ? 'Linked' : 'Manual'}</button></div>
                             <div className="space-y-1">{(item.calculationParts || []).map(part => renderCalculationPartRow(bill, item, part))}</div>
                             <div className="flex items-center justify-between mt-2 pt-2 border-t border-yellow-200 dark:border-yellow-800/30">{!readOnly && (<button onClick={() => addCalculationPart(bill.id, item.id)} className="text-[10px] flex items-center gap-1 text-yellow-600 hover:text-yellow-700 font-bold px-2 py-1 rounded hover:bg-yellow-100"><PlusCircle className="w-3 h-3" /> Tambah</button>)}<div className="flex items-center gap-2 ml-auto"><span className="text-xs text-slate-400">Qty Laras:</span><DimensionInput value={item.qty} onChange={(val) => updateItem(bill.id, item.id, { qty: val })} disabled={readOnly} className="w-20 text-right bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-sm font-bold text-slate-700 dark:text-slate-200" /></div></div>
                         </div>
                    </div>
                    <div className="w-full xl:w-[320px] shrink-0 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-3 text-xs">
                         <div className="grid grid-cols-2 gap-x-4 gap-y-2"><div className="col-span-2 border-b border-slate-200 dark:border-slate-600 pb-1 mb-1 font-bold text-slate-400 uppercase tracking-widest text-[10px]">Perbandingan</div><div className="text-slate-500">Asal (Qty)</div><div className="text-right font-mono text-slate-600 dark:text-slate-300">{originalQty}</div><div className="text-slate-500">Asal (RM)</div><div className="text-right font-mono text-slate-600 dark:text-slate-300">{formatCurrency(originalAmount)}</div><div className="col-span-2 border-b border-slate-200 dark:border-slate-600 my-1"></div><div className="text-slate-500 font-bold">Laras (Qty)</div><div className="text-right font-mono font-bold text-slate-800 dark:text-white">{item.qty}</div><div className="text-slate-500 font-bold">Laras (RM)</div><div className="text-right font-mono font-bold text-slate-800 dark:text-white">{formatCurrency(item.amount)}</div><div className="col-span-2 border-b border-slate-200 dark:border-slate-600 my-1"></div><div className="font-bold">Beza (RM)</div><div className={`text-right font-mono ${colorClass}`}>{diff > 0 ? '+' : ''}{formatCurrency(diff)}</div></div>
                    </div>
                </div>
            </div>
        );
    };

    const activeBill = pelarasanData.find(b => b.id === activeBillId);
    const billsByLocation: Record<string, BQGroup[]> = {}; const permulaanBills: BQGroup[] = []; const otherBills: BQGroup[] = [];
    pelarasanData.forEach(b => { if (b.title.includes('PERMULAAN') || b.id.includes('permulaan')) { permulaanBills.push(b); } else if (b.locationId) { if (!billsByLocation[b.locationId]) billsByLocation[b.locationId] = []; billsByLocation[b.locationId].push(b); } else { otherBills.push(b); } });
    const sortedLocationIds = Array.from(new Set(pelarasanData.filter(b => b.locationId && !b.title.includes('PERMULAAN') && !b.id.includes('permulaan')).map(b => b.locationId!)));

    return (
        <div className="flex flex-col md:flex-row gap-4 items-start">
            <div className="w-full md:w-72 flex flex-col gap-2 shrink-0 sticky top-24 max-h-[calc(100vh-8rem)]">
                 <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-xl border border-yellow-100 dark:border-yellow-800/30 flex items-center justify-between"><span className="text-xs font-bold uppercase text-yellow-700 dark:text-yellow-500 tracking-wider">Navigasi Pelarasan</span></div>
                <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-2 bg-white/40 dark:bg-slate-900/40 rounded-xl p-2">
                     {permulaanBills.length > 0 && (<div className="space-y-1"><div className="px-2 text-[10px] font-bold text-slate-400 uppercase">Permulaan</div>{permulaanBills.map((b) => (<div key={b.id} onClick={() => setActiveBillId(b.id)} className={`p-3 rounded-xl text-xs cursor-pointer border transition-all ${activeBillId === b.id ? 'bg-yellow-100 dark:bg-yellow-900/40 border-yellow-400 dark:border-yellow-600 text-yellow-800 dark:text-yellow-200' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-transparent'}`}><div className="font-bold truncate">{b.title}</div></div>))}</div>)}
                     {sortedLocationIds.map(locId => {
                         const groupBills = billsByLocation[locId] || []; const loc = locationRows.find(l => l.id === locId);
                         return (<div key={locId} className="space-y-1"><div className="px-2 text-[10px] font-bold text-slate-400 uppercase mt-4 mb-2 flex items-center gap-1 truncate"><MapPin className="w-3 h-3 shrink-0" /><span className="truncate">{loc ? loc.lokasi : 'Lokasi'}</span></div>{groupBills.map(b => (<div key={b.id} onClick={() => setActiveBillId(b.id)} className={`p-3 rounded-xl text-xs cursor-pointer border transition-all ${activeBillId === b.id ? 'bg-yellow-100 dark:bg-yellow-900/40 border-yellow-400 dark:border-yellow-600 text-yellow-800 dark:text-yellow-200' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-transparent'}`}><div className="font-bold truncate">{b.title}</div></div>))}</div>);
                     })}
                </div>
            </div>
            <div className="flex-1 w-full min-w-0 bg-white dark:bg-slate-900 rounded-xl shadow-inner flex flex-col">
                {activeBill ? (
                    <>
                        <div className="p-4 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-800/50 sticky top-20 z-20 backdrop-blur-sm"><div className="flex items-center justify-between mb-2"><h2 className="text-lg font-bold text-slate-800 dark:text-white uppercase">{activeBill.title}</h2><div className="text-right text-xs text-slate-400 shrink-0 ml-4">Pelarasan Total: <span className="text-yellow-600 font-bold text-sm">{formatCurrency(activeBill.items.reduce((s,i) => s + (i.amount||0), 0))}</span></div></div>
                             {activeBill.locationId && (<div className={`mt-2 p-3 rounded-xl border transition-all ${isDimsDirty ? 'bg-orange-50 border-orange-200 dark:bg-orange-900/10 dark:border-orange-800/50' : 'bg-yellow-50/50 border-yellow-100 dark:bg-yellow-900/10 dark:border-yellow-800/30'}`}><div className="flex flex-col sm:flex-row items-center justify-between gap-3"><div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase"><Ruler className="w-4 h-4 text-yellow-500" />Global Calc (Pelarasan Only)</div><div className="flex items-center gap-2 w-full sm:w-auto"><div className="flex items-center bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 px-2 py-1 shadow-sm"><span className="text-[10px] font-bold text-slate-400 mr-1">P</span><DimensionInput value={localDims.length || 0} onChange={val => { setLocalDims({...localDims, length: val}); setIsDimsDirty(true); }} disabled={readOnly} className="w-12 bg-transparent outline-none font-bold text-sm text-center" /></div><div className="flex items-center bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 px-2 py-1 shadow-sm"><span className="text-[10px] font-bold text-slate-400 mr-1">L</span><DimensionInput value={localDims.width || 0} onChange={val => { setLocalDims({...localDims, width: val}); setIsDimsDirty(true); }} disabled={readOnly} className="w-12 bg-transparent outline-none font-bold text-sm text-center" /></div><div className="flex items-center bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 px-2 py-1 shadow-sm"><span className="text-[10px] font-bold text-slate-400 mr-1">T</span><DimensionInput value={localDims.depth || 0} onChange={val => { setLocalDims({...localDims, depth: val}); setIsDimsDirty(true); }} disabled={readOnly} className="w-12 bg-transparent outline-none font-bold text-sm text-center" /></div>{isDimsDirty && !readOnly && (<button onClick={handleSaveGlobalDims} className="ml-2 px-3 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1 transition-all"><Save className="w-3 h-3" /> Kemaskini</button>)}</div></div></div>)}
                        </div>
                        <div className="flex-1 p-4 space-y-2">
                             {activeBill.items.length === 0 ? (<div className="h-40 flex flex-col items-center justify-center text-slate-400"><FolderPlus className="w-10 h-10 mb-2 opacity-50" /><p className="text-sm">Tiada item dalam senarai ini.</p></div>) : (
                                 (() => {
                                     let currentLevel0Collapsed = false; let currentLevel1Collapsed = false;
                                     return activeBill.items.map((item, idx) => {
                                         const level = getItemLevel(item); let isHidden = false;
                                         if (level === 0) { currentLevel1Collapsed = false; currentLevel0Collapsed = !!item.isCollapsed; } else if (level === 1) { if (currentLevel0Collapsed) isHidden = true; else currentLevel1Collapsed = !!item.isCollapsed; } else { if (currentLevel0Collapsed || currentLevel1Collapsed) isHidden = true; }
                                         return renderItemRow(activeBill, item, idx, isHidden);
                                     });
                                 })()
                             )}
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8"><Layers className="w-16 h-16 mb-4 opacity-20" /><h3 className="text-lg font-bold text-slate-600 dark:text-slate-300">Tiada Senarai Dipilih</h3><p className="text-sm max-w-xs text-center mt-2">Pilih senarai dari navigasi sebelah kiri untuk membuat pelarasan.</p></div>
                )}
            </div>
        </div>
    );
};

export default BQPelarasanEditor;
