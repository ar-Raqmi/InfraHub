import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { BQGroup, BQItem, Project, ProjectLocation, formatCurrency, GlobalDimensions, CalculationPart, Role } from '../types';
import { supabaseService } from '../services/supabaseService';
import { ChevronDown, ChevronRight, Save, Ruler, ChevronUp, Link, Unlink, PlusCircle, MinusCircle, FolderPlus, Calculator, MapPin, Layers, Info, AlertTriangle, X, Type, List, Trash2, Bookmark } from 'lucide-react';

interface BQPelarasanEditorProps {
  originalData: BQGroup[];
  pelarasanData: BQGroup[];
  onDataChange: (data: BQGroup[]) => void;
  projectData: Project;
  isPrintView?: boolean;
  locationRows: ProjectLocation[];
  globalCalculationsPelarasan: Record<string, GlobalDimensions>;
  onGlobalCalculationsPelarasanChange: (calculationId: string, dims: GlobalDimensions) => void;
  readOnly?: boolean;
}

const AutoResizeTextarea = ({ 
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
    globalCalculationsPelarasan,
    onGlobalCalculationsPelarasanChange,
    readOnly = false
}) => {
    const [activeBillId, setActiveBillId] = useState<string | null>(null);
    const [localDims, setLocalDims] = useState<GlobalDimensions>({ length: 0, width: 0, depth: 0 });
    const [isDimsDirty, setIsDimsDirty] = useState(false);
    const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);

    useEffect(() => {
        if (pelarasanData.length > 0 && !activeBillId) { setActiveBillId(pelarasanData[0].id); }
    }, [pelarasanData]);

    useEffect(() => {
        if (!activeBillId) return;
        const bill = pelarasanData.find(b => b.id === activeBillId);
        if (bill && bill.calculationId) {
            if (globalCalculationsPelarasan?.[bill.calculationId]) { 
                setLocalDims(globalCalculationsPelarasan[bill.calculationId]); 
            } 
            else {
                let foundSharedDims: GlobalDimensions | null = null;
                for (const b of pelarasanData) {
                    if (b.calculationId === bill.calculationId && globalCalculationsPelarasan?.[b.calculationId]) {
                        foundSharedDims = globalCalculationsPelarasan[b.calculationId];
                        break;
                    }
                }

                if (foundSharedDims) {
                    setLocalDims(foundSharedDims);
                }
                else if (projectData.globalCalculations?.[bill.calculationId]) { 
                    setLocalDims(projectData.globalCalculations[bill.calculationId]); 
                }
                else { 
                    setLocalDims({ length: 0, width: 0, depth: 0 }); 
                }
            }
        } else { 
            setLocalDims({ length: 0, width: 0, depth: 0 }); 
        }
        setIsDimsDirty(false);
    }, [activeBillId, globalCalculationsPelarasan, projectData.globalCalculations, pelarasanData]);

    const parseTitle = (title: string) => {
        const match = title.match(/^(BIL NO\.\s*\d+)\s*[-–]\s*(.*)$/i);
        if (match) return { prefix: match[1].toUpperCase(), content: match[2].trim() };
        return { prefix: '', content: title };
    };

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

    const updateBillsWithNewDimensions = (calculationId: string, newDims: GlobalDimensions) => {
        const updatedBills = pelarasanData.map(bill => {
            if (bill.calculationId !== calculationId) return bill;
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
        if (!bill || !bill.calculationId) return;
        onGlobalCalculationsPelarasanChange(bill.calculationId, localDims);
        updateBillsWithNewDimensions(bill.calculationId, localDims);
        setIsDimsDirty(false);
    };

    const handleLinkCalculation = (targetCalcId: string) => {
        if (readOnly) return;
        const updatedBills = pelarasanData.map(b => {
            if (b.id !== activeBillId) return b;
            const newBill = { ...b, calculationId: targetCalcId };
            const targetDims = globalCalculationsPelarasan?.[targetCalcId] || projectData.globalCalculations?.[targetCalcId] || { length: 0, width: 0, depth: 0 };
            setLocalDims(targetDims);
            const updatedItems = newBill.items.map(item => {
                if (!item.isGlobal || !item.calculationParts) return item;
                const newParts = item.calculationParts.map(part => ({
                    ...part,
                    length: part.hasLength ? targetDims.length : part.length,
                    width: part.hasWidth ? targetDims.width : part.width,
                    depth: part.hasDepth ? targetDims.depth : part.depth
                }));
                const newQty = recalculateQtyFromParts(newParts);
                return { ...item, calculationParts: newParts, qty: parseFloat(newQty.toFixed(2)), amount: parseFloat((newQty * item.rate).toFixed(2)) };
            });
            return { ...newBill, items: updatedItems };
        });
        onDataChange(updatedBills);
        setIsLinkModalOpen(false);
    };

    const handleUnlinkCalculation = () => {
        if (readOnly) return;
        const newCalcId = `calc-pelarasan-${Math.random().toString(36).substr(2, 9)}`;
        const updatedBills = pelarasanData.map(b => b.id === activeBillId ? { ...b, calculationId: newCalcId } : b);
        onDataChange(updatedBills);
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

    const toggleCustomCalc = (billId: string, itemId: string) => {
        if (readOnly) return;
        const newData = pelarasanData.map(bill => {
           if (bill.id !== billId) return bill;
           return { ...bill, items: bill.items.map(item => {
                   if (item.id !== itemId) return item;
                   const newMode = !item.isCustomCalc;
                   let calcStr = item.customCalc || '';
                   if (newMode && !calcStr && item.calculationParts) {
                       calcStr = item.calculationParts.map(p => {
                           const parts = []; if (p.hasLength) parts.push(`${p.length}m(P)`); if (p.hasWidth) parts.push(`${p.width}m(L)`); if (p.hasDepth) parts.push(`${p.depth}m(T)`); if (p.multiplier !== 1) parts.push(`x ${p.multiplier}`); return parts.join(' x ');
                       }).join(' + ');
                   }
                   return { ...item, isCustomCalc: newMode, customCalc: calcStr };
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
        const inputClassBase ="w-12 outline-none text-right font-bold text-sm transition-colors";
        const inputClass = isGlobal || readOnly ? `${inputClassBase} bg-transparent text-slate-400 cursor-not-allowed` : `${inputClassBase} bg-amber-50/50  text-amber-700  border-b border-amber-300  rounded-sm`;
        return (
          <div key={part.id} className="flex flex-wrap items-center gap-2 text-xs bg-white  p-1.5 rounded-lg border border-slate-200  mb-1 last:mb-0">
               <input type="text" value={part.label || ''} onChange={(e) => updateCalculationPart(bill.id, item.id, part.id, { label: e.target.value })} disabled={readOnly} className="w-16 bg-transparent border-b border-dashed border-slate-300  focus:border-amber-500 outline-none text-slate-500 placeholder-slate-400 text-[10px]" placeholder="Label" />
              <div className={`flex items-center gap-1 rounded px-1.5 py-0.5 border transition-colors ${part.hasLength ? 'bg-amber-50 border-amber-200' : 'bg-transparent border-transparent opacity-60'}`}><input type="checkbox" checked={part.hasLength} onChange={(e) => updateCalculationPart(bill.id, item.id, part.id, { hasLength: e.target.checked })} disabled={readOnly} className="w-3 h-3 rounded text-amber-600" /><span className="text-[10px] font-bold text-slate-500">P</span>{part.hasLength && (<input type="number" value={part.length || ''} onChange={e => updateCalculationPart(bill.id, item.id, part.id, { length: parseFloat(e.target.value) })} className={inputClass} placeholder="0" disabled={isGlobal || readOnly} />)}</div>
              {part.hasLength && (part.hasWidth || part.hasDepth) && <span className="text-slate-300">×</span>}
              <div className={`flex items-center gap-1 rounded px-1.5 py-0.5 border transition-colors ${part.hasWidth ? 'bg-amber-50 border-amber-200' : 'bg-transparent border-transparent opacity-60'}`}><input type="checkbox" checked={part.hasWidth} onChange={(e) => updateCalculationPart(bill.id, item.id, part.id, { hasWidth: e.target.checked })} disabled={readOnly} className="w-3 h-3 rounded text-amber-600" /><span className="text-[10px] font-bold text-slate-500">L</span>{part.hasWidth && (<input type="number" value={part.width || ''} onChange={e => updateCalculationPart(bill.id, item.id, part.id, { width: parseFloat(e.target.value) })} className={inputClass} placeholder="0" disabled={isGlobal || readOnly} />)}</div>
              {part.hasWidth && part.hasDepth && <span className="text-slate-300">×</span>}
              <div className={`flex items-center gap-1 rounded px-1.5 py-0.5 border transition-colors ${part.hasDepth ? 'bg-amber-50 border-amber-200' : 'bg-transparent border-transparent opacity-60'}`}><input type="checkbox" checked={part.hasDepth} onChange={(e) => updateCalculationPart(bill.id, item.id, part.id, { hasDepth: e.target.checked })} disabled={readOnly} className="w-3 h-3 rounded text-amber-600" /><span className="text-[10px] font-bold text-slate-500">T</span>{part.hasDepth && (<input type="number" value={part.depth || ''} onChange={e => updateCalculationPart(bill.id, item.id, part.id, { depth: parseFloat(e.target.value) })} className={inputClass} placeholder="0" disabled={isGlobal || readOnly} />)}</div>
              <span className="text-slate-300">×</span>
              <div className={`flex items-center gap-1 rounded px-1.5 py-0.5 border border-transparent ${part.multiplier !== 1 ? 'bg-orange-50  border-orange-200' : 'opacity-60'}`}><input type="number" value={part.multiplier || ''} onChange={e => updateCalculationPart(bill.id, item.id, part.id, { multiplier: parseFloat(e.target.value) })} disabled={readOnly} className="w-8 bg-transparent outline-none text-center font-bold text-slate-700  placeholder-slate-400" placeholder="1" /></div>
              
              <div className="ml-auto flex items-center gap-2 md:gap-3 pl-2 border-l border-slate-100">
                  <span className="hidden md:inline text-[10px] text-slate-400 font-mono">{item.unit}</span>
                  <div className="text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded min-w-[30px] text-center">
                      {(() => {
                          let product = 1; if (part.hasLength) product *= part.length; if (part.hasWidth) product *= part.width; if (part.hasDepth) product *= part.depth;
                          const qty = product * part.multiplier; return qty % 1 === 0 ? qty : qty.toFixed(2);
                      })()}
                  </div>
                  {!readOnly && <button onClick={() => removeCalculationPart(bill.id, item.id, part.id)} className="p-1 text-slate-300 hover:text-red-500 transition-colors"><MinusCircle className="w-4 h-4" /></button>}
              </div>
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
        
        // Coloring logic
        const isLess = diff < -0.01;
        const isMore = diff > 0.01;
        
        const cardStyle = isLess ? 'border-red-200 ring-1 ring-red-100' : (isMore ? 'border-blue-200 ring-1 ring-blue-100' : 'border-slate-100');
        const diffTextClass = isLess ? 'text-red-600 font-bold' : (isMore ? 'text-blue-600 font-bold' : 'text-slate-500');

        if (item.type === 'HEADER') {
            const isLevel0 = hierarchyLevel === 0;
            return (
                <div key={item.id} className={`flex items-center gap-2 py-3 border-b border-slate-100 ${isLevel0 ? 'bg-slate-100' : 'bg-slate-50/50'} px-4 -mx-4 group`}>
                    <span className="text-xs font-black text-slate-400 min-w-[30px]">{autoNumber}</span>
                    <button onClick={() => toggleCollapse(bill.id, item.id)} className="p-1 rounded hover:bg-slate-200  text-slate-400 transition-colors">{item.isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}</button>
                    <span className={`w-full bg-transparent outline-none text-slate-800  text-sm ${isLevel0 ? 'font-bold uppercase' : 'font-semibold pl-1'}`}>{item.description}</span>
                </div>
            );
        }

        return (
            <div key={item.id} className={`py-4 border border-transparent border-b-slate-100 last:border-0 hover:bg-slate-50 px-2 rounded-xl transition-all duration-300 ${cardStyle}`}>
                <div className="flex flex-col xl:flex-row gap-4">
                    <div className="flex-1 min-w-0">
                         <div className="flex gap-3 mb-2">
                             <div className="text-xs font-black text-slate-400 mt-1 min-w-[30px]">{autoNumber}</div>
                             <div className="flex-1 pl-10">
                                 <p className="text-sm font-medium text-slate-800 leading-relaxed">{item.description}</p>
                                 {item.variant && <p className="text-xs text-slate-500 italic mt-1">{item.variant}</p>}
                                 <div className="mt-2 flex items-center gap-2">
                                     <span className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-mono">{item.unit}</span>
                                     <span className="text-xs text-slate-400">@ {formatCurrency(item.rate)}</span>
                                 </div>
                             </div>
                         </div>
                         <div className="ml-12 bg-amber-50/30 p-3 rounded-lg border border-amber-100">
                             <div className="flex items-center justify-between mb-2">
                                 <div className="text-[10px] font-bold text-amber-600 uppercase tracking-wider flex items-center gap-1">
                                     <Calculator className="w-3 h-3" /> Pelarasan (Adjusted)
                                 </div>
                                 <div className="flex items-center gap-1">
                                    <button onClick={() => toggleGlobal(bill.id, item.id)} disabled={readOnly} className={`p-1 rounded-md transition-colors border text-[10px] flex items-center gap-1 ${item.isGlobal ? 'bg-emerald-100 text-emerald-600 border-emerald-200' : 'bg-white text-slate-400 border-slate-200'}`}>{item.isGlobal ? <Link className="w-3 h-3" /> : <Unlink className="w-3 h-3" />}{item.isGlobal ? 'Linked' : 'Manual'}</button>
                                    <button onClick={() => toggleCustomCalc(bill.id, item.id)} disabled={readOnly} className={`p-1.5 rounded-md transition-colors border ${item.isCustomCalc ? 'bg-indigo-100 text-indigo-600 border-indigo-200' : 'bg-white  text-slate-400 border-slate-200  hover:text-indigo-500'} ${readOnly ? 'cursor-not-allowed opacity-50' : ''}`}>{item.isCustomCalc ? <List className="w-3.5 h-3.5" /> : <Type className="w-3.5 h-3.5" />}</button>
                                 </div>
                             </div>

                             {item.isCustomCalc ? (
                                <div className="flex-1 w-full flex items-center gap-2">
                                    <input type="text" value={item.customCalc || ''} onChange={(e) => updateItem(bill.id, item.id, { customCalc: e.target.value })} disabled={readOnly} className="flex-1 text-xs bg-white border border-slate-200 rounded px-2 py-1 font-mono text-slate-600" placeholder="e.g. 80 x 0.5 x 2" />
                                    <div className="flex items-center gap-1 bg-white rounded px-2 py-1 border border-slate-200">
                                        <span className="text-[10px] font-bold text-slate-400">QTY</span>
                                        <DimensionInput value={item.qty} onChange={(val) => updateItem(bill.id, item.id, { qty: val })} disabled={readOnly} className="w-16 text-right text-sm font-bold bg-transparent outline-none" />
                                    </div>
                                </div>
                             ) : (
                                <div className="space-y-1">
                                    {(item.calculationParts || []).map(part => renderCalculationPartRow(bill, item, part))}
                                    {!readOnly && (
                                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-amber-200/50">
                                            <button onClick={() => addCalculationPart(bill.id, item.id)} className="text-[10px] flex items-center gap-1 text-amber-600 hover:text-amber-700 font-bold px-2 py-1 rounded hover:bg-amber-100/50 transition-colors">
                                                <PlusCircle className="w-3 h-3" /> Tambah Kiraan
                                            </button>
                                            <div className="flex items-center gap-2 ml-auto">
                                                <span className="text-xs text-slate-400">Qty Laras:</span>
                                                <div className="font-mono font-bold text-amber-600 text-sm border-l border-amber-200 pl-3">
                                                    = {item.qty}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                             )}
                         </div>
                    </div>
                    <div className="w-full xl:w-[320px] shrink-0 bg-slate-50  rounded-xl border border-slate-200  p-4 text-xs">
                         <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                             <div className="col-span-2 border-b border-slate-200  pb-1 mb-1 font-bold text-slate-400 uppercase tracking-widest text-[10px]">Perbandingan</div>
                             
                             <div className="text-slate-500">Asal (Qty)</div>
                             <div className="text-right font-mono text-slate-600">{originalQty}</div>
                             
                             <div className="text-slate-500">Asal (RM)</div>
                             <div className="text-right font-mono text-slate-600">{formatCurrency(originalAmount)}</div>
                             
                             <div className="col-span-2 border-b border-slate-200  my-1"></div>
                             
                             <div className="text-slate-500 font-bold">Laras (Qty)</div>
                             <div className="text-right font-mono font-bold text-slate-800">{item.qty}</div>
                             
                             <div className="text-slate-500 font-bold">Laras (RM)</div>
                             <div className="text-right font-mono font-bold text-slate-800">{formatCurrency(item.amount)}</div>
                             
                             <div className="col-span-2 border-b border-slate-200  my-1"></div>
                             
                             <div className="font-bold">Beza (RM)</div>
                             <div className={`text-right font-mono ${diffTextClass}`}>{diff > 0 ? '+' : ''}{formatCurrency(diff)}</div>
                         </div>
                    </div>
                </div>
            </div>
        );
    };

    const activeBillIndex = pelarasanData.findIndex(b => b.id === activeBillId);
    const activeBill = pelarasanData[activeBillIndex];

    const totalPelarasanRaw = pelarasanData.reduce((acc, bill) => {
        return acc + bill.items.reduce((sum, item) => sum + (item.amount || 0), 0);
    }, 0);

    const contractPrice = projectData.kosProjek || 0;
    const extraPrice = Math.max(0, totalPelarasanRaw - contractPrice);

    const billsByLocation: Record<string, BQGroup[]> = {};
    const permulaanBills: BQGroup[] = []; 
    const otherBills: BQGroup[] = [];
    
    pelarasanData.forEach(b => { 
        if (b.title.includes('PERMULAAN') || b.id.includes('permulaan')) { permulaanBills.push(b); } 
        else if (b.locationId) { if (!billsByLocation[b.locationId]) billsByLocation[b.locationId] = []; billsByLocation[b.locationId].push(b); } 
        else { otherBills.push(b); } 
    });
    const sortedLocationIds = Array.from(new Set(pelarasanData.filter(b => b.locationId && !b.title.includes('PERMULAAN') && !b.id.includes('permulaan')).map(b => b.locationId!))) as string[];

    const renderSidebarItem = (b: BQGroup) => {
        const isActive = activeBillId === b.id;
        const { prefix, content } = parseTitle(b.title);
        return (
            <div key={b.id} onClick={() => setActiveBillId(b.id)} className={`w-full text-left p-3 rounded-xl text-xs transition-colors relative group cursor-pointer border ${isActive ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/20 border-amber-500 ring-1 ring-amber-500' : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200 hover:border-amber-300'}`}>
                <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                        {prefix && <div className={`text-[9px] font-black tracking-widest uppercase mb-1 ${isActive ? 'text-amber-100' : 'text-slate-400 group-hover:text-amber-600'}`}>{prefix}</div>}
                        <div className={`font-bold leading-snug line-clamp-2 ${isActive ? 'text-white' : 'text-slate-700'}`}>{content || b.title}</div>
                    </div>
                </div>
            </div>
        );
    };

    if (isPrintView) return null;

    return (
        <div className="flex flex-col md:flex-row gap-4 items-start">
            {/* Editor Sidebar */}
            <div className="w-full md:w-72 flex flex-col gap-2 shrink-0 sticky top-24 max-h-[calc(100vh-8rem)]">
                <div className="bg-amber-50/80 p-3 rounded-xl border border-amber-200 shadow-sm flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-amber-700 tracking-wider">Navigasi Pelarasan</span>
                </div>
                
                {extraPrice > 0 && (
                    <div className="bg-blue-50  p-3 rounded-xl border border-blue-200 animate-pulse">
                        <div className="flex items-center gap-2 text-blue-600 mb-1">
                            <Info className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-wider">Lebihan Harga</span>
                        </div>
                        <div className="text-sm font-black text-blue-700 font-mono">
                            +{formatCurrency(extraPrice)}
                        </div>
                        <p className="text-[9px] text-blue-500 mt-1 leading-tight">
                            Harga akhir akan dihadkan mengikut Harga Kontrak.
                        </p>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-2 bg-white/40 rounded-xl p-2">
                    {permulaanBills.length > 0 && (
                        <div className="space-y-1">
                             <div className="px-2 text-[10px] font-bold text-slate-400 uppercase">Permulaan</div>
                             {permulaanBills.map(b => renderSidebarItem(b))}
                        </div>
                    )}
                    {sortedLocationIds.map(locId => {
                        const groupBills = billsByLocation[locId] || [];
                        const loc = locationRows.find(l => l.id === locId);
                        const locName = loc ? loc.lokasi : 'Unknown Location';
                        return (
                            <div key={locId} className="space-y-1">
                                <div className="px-2 text-[10px] font-bold text-slate-400 uppercase flex items-center justify-between mt-4 mb-2">
                                    <div className="flex items-center gap-1 truncate" title={locName}><MapPin className="w-3 h-3 shrink-0" /> {locName}</div>
                                </div>
                                <div className="space-y-2">{groupBills.map(b => renderSidebarItem(b))}</div>
                            </div>
                        );
                    })}
                    {otherBills.length > 0 && (
                        <div className="space-y-1">
                            <div className="px-2 text-[10px] font-bold text-slate-400 uppercase mt-4">Lain-lain</div>
                            {otherBills.map(b => renderSidebarItem(b))}
                        </div>
                    )}
                </div>
            </div>

            {/* Editor Main Content */}
            <div className="flex-1 bg-white rounded-xl shadow-inner flex flex-col w-full min-w-0">
                {activeBill ? (
                    <>
                        <div className="p-4 border-b border-slate-100 bg-slate-50/50 sticky top-20 z-20">
                            <div className="flex items-center justify-between mb-2">
                                <h2 className="text-lg font-bold text-slate-800 uppercase">{activeBill.title}</h2>
                                <div className="flex items-center gap-3">
                                    <div className="text-right text-xs text-slate-400 shrink-0">Pelarasan: <span className="text-amber-600 font-bold text-sm">{formatCurrency(activeBill.items.reduce((s,i) => s + (i.amount||0), 0))}</span></div>
                                </div>
                            </div>
                            
                            <div className={`mt-2 p-3 rounded-xl border transition-colors ${isDimsDirty ? 'bg-orange-50 border-orange-200' : 'bg-amber-50/50 border-amber-100'}`}>
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase">
                                            <Ruler className="w-4 h-4 text-amber-500" />
                                            Global Calculation (Pelarasan)
                                            {activeBill.calculationId && !globalCalculationsPelarasan?.[activeBill.calculationId] && projectData.globalCalculations?.[activeBill.calculationId] && (
                                                <span className="text-[9px] text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded ml-1 font-bold">
                                                    SYNCED FROM BQ
                                                </span>
                                            )}
                                        </div>
                                        {!readOnly && (
                                            <div className="flex items-center gap-1">
                                                <button onClick={() => setIsLinkModalOpen(true)} className="p-1 text-amber-600 hover:bg-amber-100 rounded transition-colors" title="Hubungkan dengan BIL NO. lain">
                                                    <Link className="w-3.5 h-3.5" />
                                                </button>
                                                {pelarasanData.filter(b => b.calculationId === activeBill.calculationId).length > 1 && (
                                                    <button onClick={handleUnlinkCalculation} className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors" title="Asingkan pengiraan ini">
                                                        <Unlink className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 w-full sm:w-auto">
                                        <div className="flex items-center bg-white rounded-lg border border-slate-200 px-2 py-1 shadow-sm"><span className="text-[10px] font-bold text-slate-400 mr-1">P</span><DimensionInput value={localDims.length || 0} onChange={val => { setLocalDims({...localDims, length: val}); setIsDimsDirty(true); }} disabled={readOnly} className="w-12 bg-transparent outline-none font-bold text-sm text-center" /></div>
                                        <div className="flex items-center bg-white rounded-lg border border-slate-200 px-2 py-1 shadow-sm"><span className="text-[10px] font-bold text-slate-400 mr-1">L</span><DimensionInput value={localDims.width || 0} onChange={val => { setLocalDims({...localDims, width: val}); setIsDimsDirty(true); }} disabled={readOnly} className="w-12 bg-transparent outline-none font-bold text-sm text-center" /></div>
                                        <div className="flex items-center bg-white rounded-lg border border-slate-200 px-2 py-1 shadow-sm"><span className="text-[10px] font-bold text-slate-400 mr-1">T</span><DimensionInput value={localDims.depth || 0} onChange={val => { setLocalDims({...localDims, depth: val}); setIsDimsDirty(true); }} disabled={readOnly} className="w-12 bg-transparent outline-none font-bold text-sm text-center" /></div>
                                        {isDimsDirty && !readOnly && (<button onClick={handleSaveGlobalDims} className="ml-2 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1 transition-colors"><Save className="w-3 h-3" /> Kemaskini</button>)}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 p-4">
                             {activeBill.items.length === 0 ? (
                                 <div className="h-40 flex flex-col items-center justify-center text-slate-400">
                                     <FolderPlus className="w-10 h-10 mb-2 opacity-50" />
                                     <p className="text-sm">Tiada item dalam senarai ini.</p>
                                 </div>
                             ) : (
                                <div className="space-y-2">
                                    {(() => {
                                        let currentLevel0Collapsed = false; 
                                        let currentLevel1Collapsed = false;
                                        return activeBill.items.map((item, idx) => {
                                            const level = getItemLevel(item); 
                                            let isHidden = false;
                                            if (level === 0) { currentLevel1Collapsed = false; currentLevel0Collapsed = !!item.isCollapsed; } 
                                            else if (level === 1) { if (currentLevel0Collapsed) isHidden = true; else currentLevel1Collapsed = !!item.isCollapsed; } 
                                            else { if (currentLevel0Collapsed || currentLevel1Collapsed) isHidden = true; }
                                            return renderItemRow(activeBill, item, idx, isHidden);
                                        });
                                    })()}
                                </div>
                             )}
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8">
                        <Layers className="w-16 h-16 mb-4 opacity-20" />
                        <h3 className="text-lg font-bold text-slate-600">Tiada Senarai Dipilih</h3>
                        <p className="text-sm max-w-xs text-center mt-2">Pilih senarai dari navigasi sebelah kiri untuk memulakan pelarasan.</p>
                    </div>
                )}
            </div>

            {/* Link Modal */}
            {isLinkModalOpen && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 animate-fade-in" onClick={() => setIsLinkModalOpen(false)}>
                    <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-md w-full p-8 border border-slate-200 transform scale-100 transition-colors animate-slide-up relative overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-500 to-orange-500"></div>
                        <div className="mb-6">
                            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                <Link className="w-5 h-5 text-amber-600" />
                                Hubungkan Pengiraan
                            </h3>
                            <p className="text-sm text-slate-500 mt-1">Pilih BIL NO. untuk berkongsi Global Calculation yang sama.</p>
                        </div>
                        
                        <div className="space-y-2 max-h-[40vh] overflow-y-auto custom-scrollbar pr-2 mb-6">
                            {pelarasanData
                                .filter(b => b.id !== activeBillId && b.calculationId !== activeBill?.calculationId)
                                .map(b => (
                                <button 
                                    key={b.id} 
                                    onClick={() => handleLinkCalculation(b.calculationId!)}
                                    className="w-full text-left p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:border-amber-500 hover:bg-amber-50 transition-colors group"
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-amber-600 transition-colors">{parseTitle(b.title).prefix}</div>
                                            <div className="text-sm font-bold text-slate-700">{parseTitle(b.title).content || b.title}</div>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-amber-500 transition-colors" />
                                    </div>
                                </button>
                            ))}
                            {pelarasanData.filter(b => b.id !== activeBillId && b.calculationId !== activeBill?.calculationId).length === 0 && (
                                <div className="text-center py-8 text-slate-400">
                                    <Info className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                    <p className="text-xs">Tiada BIL NO. lain yang tersedia untuk dihubungkan.</p>
                                </div>
                            )}
                        </div>
                        
                        <button onClick={() => setIsLinkModalOpen(false)} className="w-full py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors">
                            Batal
                        </button>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default BQPelarasanEditor;