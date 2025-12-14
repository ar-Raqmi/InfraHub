
// ... existing imports ...
import React, { useState, useEffect } from 'react';
import { BQGroup, GlobalDimensions, Project, BQItem, formatCurrency, CalculationPart, ProjectLocation } from '../types';
import { ChevronDown, ChevronRight, Save, Ruler, ChevronUp, Link, Unlink, PlusCircle, MinusCircle, FolderPlus, Calculator, MapPin, Layers } from 'lucide-react';

interface BQPelarasanEditorProps {
  originalData: BQGroup[];
  pelarasanData: BQGroup[];
  onDataChange: (data: BQGroup[]) => void;
  projectData: Project;
  isPrintView?: boolean;
  locationRows: ProjectLocation[];
  locationDimensionsPelarasan: Record<string, GlobalDimensions>;
  onLocationDimensionsPelarasanChange: (locationId: string, dims: GlobalDimensions) => void;
}

// Helper to format float nicely
const fmt = (n: number | undefined) => {
    if (n === undefined || n === null) return '-';
    return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
};

// Improved DimensionInput to handle "0.4" typing correctly
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
        // Only sync from parent if the numeric value is actually different 
        // to prevent overwriting "0." or "0.0" while typing
        const parsedLocal = parseFloat(localValue);
        if (parsedLocal !== value) {
             // Edge case: if local is NaN/empty and value is 0, we might want to keep it empty if user cleared it
             if (value === 0 && (localValue === '' || isNaN(parsedLocal))) return;
             setLocalValue(value?.toString() || '');
        }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setLocalValue(val);
        
        const parsed = parseFloat(val);
        if (!isNaN(parsed)) {
            onChange(parsed);
        } else {
            // Do not emit 0 immediately if string is empty or just "-", let user finish typing
            if (val === '') onChange(0);
        }
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

// Reuse Helper
const getItemLevel = (item: BQItem): 0 | 1 | 2 => {
    if (item.type === 'HEADER') {
        const isUppercase = item.description === item.description.toUpperCase() && /[A-Z]/.test(item.description);
        return isUppercase ? 0 : 1;
    }
    return 2; 
};

const getAutoNumber = (items: BQItem[], currentIndex: number) => {
    let sectionIndex = 0;
    let itemIndex = 0;
    let variantIndex = 0;
    let lastHeaderType: 'NONE' | 'SECTION' | 'ITEM_PARENT' = 'NONE';

    function toRoman(num: number): string {
      const lookup: { [key: string]: number } = {m:1000,cm:900,d:500,cd:400,c:100,xc:90,l:50,xl:40,x:10,ix:9,v:5,iv:4,i:1};
      let roman = '';
      for (let i in lookup ) {
        while ( num >= lookup[i] ) {
          roman += i;
          num -= lookup[i];
        }
      }
      return roman;
    }

    for (let i = 0; i <= currentIndex; i++) {
        const item = items[i];
        const level = getItemLevel(item);

        if (level === 0) { 
            sectionIndex++;
            itemIndex = 0;
            variantIndex = 0;
            lastHeaderType = 'SECTION';
        } else if (level === 1) { 
            itemIndex++;
            variantIndex = 0;
            lastHeaderType = 'ITEM_PARENT';
        } else { 
            if (lastHeaderType === 'ITEM_PARENT') {
                variantIndex++;
            } else {
                itemIndex++; 
            }
        }
    }

    const currentItem = items[currentIndex];
    const level = getItemLevel(currentItem);
    
    if (level === 0) return `${sectionIndex}.0`;
    if (level === 1) return `${sectionIndex}.${itemIndex}`;
    
    if (lastHeaderType === 'ITEM_PARENT') {
        return `${toRoman(variantIndex)})`;
    } else {
        return `${sectionIndex}.${itemIndex}`;
    }
};

// --- PAGINATION LOGIC FOR PRINT (Optimized) ---
const groupItemsForPrint = (items: BQItem[]) => {
    const groups: { items: BQItem[], startIndex: number, hasFooter?: boolean, isFirstPage?: boolean }[] = [];
    
    // Adjusted Height Constants (Pixels at ~96DPI where 1mm ~ 3.78px)
    // A4 Content Height approx 260mm = 980px
    const PAGE_CONTENT_HEIGHT = 980; 
    const TABLE_HEADER_HEIGHT = 140; 
    const BILL_TITLE_HEIGHT = 35; 
    const FOOTER_HEIGHT = 45; 
    
    // Tighter row estimation to avoid "wasted space"
    const BASE_ROW_HEIGHT = 22; 
    const CHARS_PER_LINE = 45; // ~54mm column width / ~4.5px per char avg
    const LINE_HEIGHT = 13; 

    let currentGroup: BQItem[] = [];
    let startIndex = 0;
    
    let currentHeight = TABLE_HEADER_HEIGHT + BILL_TITLE_HEIGHT; 
    let isFirstPageOfBill = true;

    const calculateItemHeight = (item: BQItem) => {
        let h = BASE_ROW_HEIGHT;
        // Estimate lines based on char count
        const descLines = Math.ceil((item.description.length || 1) / CHARS_PER_LINE);
        // Add extra height only for additional lines beyond the first
        if (descLines > 1) {
            h += (descLines - 1) * LINE_HEIGHT;
        }
        
        // Add height for calculations display
        // Assuming about 13px per calculation line
        const dimLines = (item.calculationParts || []).length;
        if (dimLines > 0) {
            h += (dimLines * 13) + 20; // +20 for "Kiraan" labels/padding
        }

        return h;
    };

    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const itemHeight = calculateItemHeight(item);
        
        let forceBreak = false;

        // --- ORPHAN PROTECTION LOGIC ---
        // If this is a Header, we MUST check if the NEXT item (child) fits.
        // If Header + Child don't fit -> Move Header to next page.
        // If Header + Child DO fit -> Keep them here (don't waste space).
        if (item.type === 'HEADER' && i < items.length - 1) {
            const nextItem = items[i+1];
            const nextHeight = calculateItemHeight(nextItem);
            
            // Check if current page can hold BOTH this header AND the next item
            const neededSpace = itemHeight + nextHeight;
            const remainingSpace = PAGE_CONTENT_HEIGHT - currentHeight;

            // Exception: If we are at the very top of a new page (currentGroup empty), we can't break previous.
            if (currentGroup.length > 0 && neededSpace > remainingSpace) {
                forceBreak = true;
            }
        }

        // Standard check: Does this individual item fit?
        // Also account for footer space if this is the last item
        const isLastItem = i === items.length - 1;
        const extraHeight = isLastItem ? FOOTER_HEIGHT : 0;

        if (forceBreak || (currentHeight + itemHeight + extraHeight > PAGE_CONTENT_HEIGHT)) {
            // Push current group to pages
            groups.push({ 
                items: currentGroup, 
                startIndex, 
                hasFooter: false,
                isFirstPage: isFirstPageOfBill 
            });
            
            // Reset for next page
            currentGroup = [];
            startIndex = i;
            currentHeight = TABLE_HEADER_HEIGHT + itemHeight; // New page starts with table header + this item
            isFirstPageOfBill = false;
        } else {
            currentHeight += itemHeight;
        }

        currentGroup.push(item);
    }

    // Flush remaining items
    if (currentGroup.length > 0) {
        groups.push({ 
            items: currentGroup, 
            startIndex, 
            hasFooter: true,
            isFirstPage: isFirstPageOfBill
        });
    }
    
    return groups;
};

const BQPelarasanEditor: React.FC<BQPelarasanEditorProps> = ({ 
    originalData, 
    pelarasanData, 
    onDataChange, 
    projectData, 
    isPrintView,
    locationRows,
    locationDimensionsPelarasan,
    onLocationDimensionsPelarasanChange
}) => {
    const [activeBillId, setActiveBillId] = useState<string | null>(null);
    const [localDims, setLocalDims] = useState<GlobalDimensions>({ length: 0, width: 0, depth: 0 });
    const [isDimsDirty, setIsDimsDirty] = useState(false);

    // Initial Active Bill
    useEffect(() => {
        if (pelarasanData.length > 0 && !activeBillId) {
            setActiveBillId(pelarasanData[0].id);
        }
    }, [pelarasanData]);

    // Sync Local Dims - Now with Pre-fill from Original Contract logic
    useEffect(() => {
        if (!activeBillId) return;
        const bill = pelarasanData.find(b => b.id === activeBillId);
        
        if (bill && bill.locationId) {
            // Priority 1: Use explicitly saved Pelarasan dimensions
            if (locationDimensionsPelarasan?.[bill.locationId]) {
                setLocalDims(locationDimensionsPelarasan[bill.locationId]);
            } 
            // Priority 2: Fallback to Original Contract dimensions
            else if (projectData.locationDimensions?.[bill.locationId]) {
                setLocalDims(projectData.locationDimensions[bill.locationId]);
            } 
            // Default
            else {
                setLocalDims({ length: 0, width: 0, depth: 0 });
            }
        } else {
            setLocalDims({ length: 0, width: 0, depth: 0 });
        }
        setIsDimsDirty(false);
    }, [activeBillId, locationDimensionsPelarasan, projectData.locationDimensions]);

    const activeBillIndex = pelarasanData.findIndex(b => b.id === activeBillId);
    const activeBill = pelarasanData[activeBillIndex];

    // --- LOGIC ---

    const toggleCollapse = (billId: string, itemId: string) => {
        const newData = pelarasanData.map(b => {
            if (b.id !== billId) return b;
            return {
                ...b,
                items: b.items.map(item => item.id === itemId ? { ...item, isCollapsed: !item.isCollapsed } : item)
            };
        });
        onDataChange(newData);
    };

    const recalculateQtyFromParts = (parts: CalculationPart[]): number => {
        return parts.reduce((acc, part) => {
             let product = 1;
             if (part.hasLength) product *= part.length;
             if (part.hasWidth) product *= part.width;
             if (part.hasDepth) product *= part.depth;
             return acc + (product * part.multiplier);
        }, 0);
    };

    const updateBillsWithNewDimensions = (locationId: string, newDims: GlobalDimensions) => {
        const updatedBills = pelarasanData.map(bill => {
            if (bill.locationId !== locationId) return bill;
            const updatedItems = bill.items.map(item => {
                if (!item.isGlobal || !item.calculationParts) return item;
  
                const newParts = item.calculationParts.map(part => {
                    return {
                        ...part,
                        length: part.hasLength ? newDims.length : part.length,
                        width: part.hasWidth ? newDims.width : part.width,
                        depth: part.hasDepth ? newDims.depth : part.depth
                    };
                });
  
                const newQty = recalculateQtyFromParts(newParts);
                return {
                    ...item,
                    calculationParts: newParts,
                    qty: parseFloat(newQty.toFixed(2)),
                    amount: parseFloat((newQty * item.rate).toFixed(2))
                };
            });
            return { ...bill, items: updatedItems };
        });
        onDataChange(updatedBills);
    };
  
    const handleSaveGlobalDims = () => {
        const bill = pelarasanData.find(b => b.id === activeBillId);
        if (!bill || !bill.locationId) return;
        onLocationDimensionsPelarasanChange(bill.locationId, localDims);
        updateBillsWithNewDimensions(bill.locationId, localDims);
        setIsDimsDirty(false);
    };

    const updateItem = (billId: string, itemId: string, updates: Partial<BQItem>) => {
        const newData = pelarasanData.map(bill => {
            if (bill.id !== billId) return bill;
            return {
                ...bill,
                items: bill.items.map(item => {
                    if (item.id !== itemId) return item;
                    const newItem = { ...item, ...updates };
                    // Recalculate amount if qty changes directly (or if not calc-based)
                    if (updates.qty !== undefined) {
                        newItem.amount = parseFloat((newItem.qty * newItem.rate).toFixed(2));
                    }
                    return newItem;
                })
            };
        });
        onDataChange(newData);
    };

    const toggleGlobal = (billId: string, itemId: string) => {
        const newData = pelarasanData.map(bill => {
            if (bill.id !== billId) return bill;
            return {
                ...bill,
                items: bill.items.map(item => {
                    if (item.id !== itemId) return item;
                    
                    const newGlobal = !item.isGlobal;
                    let newItems = { ...item, isGlobal: newGlobal };
    
                    if (newGlobal && item.calculationParts) {
                         const newParts = item.calculationParts.map(part => ({
                            ...part,
                            length: part.hasLength ? localDims.length : part.length,
                            width: part.hasWidth ? localDims.width : part.width,
                            depth: part.hasDepth ? localDims.depth : part.depth
                         }));
                         newItems.calculationParts = newParts;
                         const qty = recalculateQtyFromParts(newParts);
                         newItems.qty = parseFloat(qty.toFixed(2));
                         newItems.amount = parseFloat((qty * newItems.rate).toFixed(2));
                    }
    
                    return newItems;
                })
            };
        });
        onDataChange(newData);
    };

    const updateCalculationPart = (billId: string, itemId: string, partId: string, updates: Partial<CalculationPart>) => {
        const newData = pelarasanData.map(bill => {
            if (bill.id !== billId) return bill;
            return {
                ...bill,
                items: bill.items.map(item => {
                    if (item.id !== itemId) return item;
  
                    if (item.isGlobal) {
                        if (updates.hasLength === true) updates.length = localDims.length;
                        if (updates.hasWidth === true) updates.width = localDims.width;
                        if (updates.hasDepth === true) updates.depth = localDims.depth;
                    }
  
                    const newParts = (item.calculationParts || []).map(p => {
                        if (p.id !== partId) return p;
                        return { ...p, ...updates };
                    });
  
                    const newQty = recalculateQtyFromParts(newParts);
                     return {
                        ...item,
                        calculationParts: newParts,
                        qty: parseFloat(newQty.toFixed(2)),
                        amount: parseFloat((newQty * item.rate).toFixed(2))
                    };
                })
            };
        });
        onDataChange(newData);
    };
  
    const addCalculationPart = (billId: string, itemId: string) => {
        const newData = pelarasanData.map(bill => {
            if (bill.id !== billId) return bill;
            return {
                ...bill,
                items: bill.items.map(item => {
                    if (item.id !== itemId) return item;
                    
                    const newPart: CalculationPart = {
                        id: Math.random().toString(36).substr(2, 9),
                        label: '',
                        length: 0, width: 0, depth: 0, multiplier: 1,
                        hasLength: false, hasWidth: false, hasDepth: false
                    };
  
                    if (item.isGlobal) {
                        newPart.length = localDims.length;
                        newPart.width = localDims.width;
                        newPart.depth = localDims.depth;
                    }

                    // Inherit flags from last part
                    const existingParts = item.calculationParts || [];
                    if (existingParts.length > 0) {
                        const last = existingParts[existingParts.length-1];
                        newPart.hasLength = last.hasLength;
                        newPart.hasWidth = last.hasWidth;
                        newPart.hasDepth = last.hasDepth;
                    }
  
                    const newParts = [...existingParts, newPart];
                    const newQty = recalculateQtyFromParts(newParts);
                    return {
                        ...item,
                        calculationParts: newParts,
                        qty: parseFloat(newQty.toFixed(2)),
                        amount: parseFloat((newQty * item.rate).toFixed(2))
                    };
                })
            };
        });
        onDataChange(newData);
    };
  
    const removeCalculationPart = (billId: string, itemId: string, partId: string) => {
        const newData = pelarasanData.map(bill => {
            if (bill.id !== billId) return bill;
            return {
                ...bill,
                items: bill.items.map(item => {
                    if (item.id !== itemId) return item;
                    const newParts = (item.calculationParts || []).filter(p => p.id !== partId);
                    const newQty = recalculateQtyFromParts(newParts);
                     return {
                        ...item,
                        calculationParts: newParts,
                        qty: parseFloat(newQty.toFixed(2)),
                        amount: parseFloat((newQty * item.rate).toFixed(2))
                    };
                })
            };
        });
        onDataChange(newData);
    };

    // --- RENDERERS ---

    const renderCalculationPartRow = (bill: BQGroup, item: BQItem, part: CalculationPart) => {
        const isGlobal = item.isGlobal;
        const inputClassBase = "w-12 outline-none text-right font-bold text-sm transition-all";
        const inputClass = isGlobal 
           ? `${inputClassBase} bg-transparent text-slate-400 cursor-not-allowed` 
           : `${inputClassBase} bg-yellow-50/50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 border-b border-yellow-300 dark:border-yellow-700/50 rounded-sm`;
  
        return (
          <div key={part.id} className="flex flex-wrap items-center gap-2 text-xs bg-white dark:bg-slate-700/50 p-1.5 rounded-lg border border-slate-200 dark:border-slate-600 mb-1 last:mb-0">
              <input 
                  type="text"
                  value={part.label || ''}
                  onChange={(e) => updateCalculationPart(bill.id, item.id, part.id, { label: e.target.value })}
                  className="w-16 bg-transparent border-b border-dashed border-slate-300 dark:border-slate-500 focus:border-yellow-500 outline-none text-slate-500 placeholder-slate-400 text-[10px]"
                  placeholder="Label"
               />
  
              <div className={`flex items-center gap-1 rounded px-1.5 py-0.5 border transition-all ${part.hasLength ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800' : 'bg-transparent border-transparent opacity-60'}`}>
                  <span className="text-[10px] font-bold text-slate-500">P</span>
                  {part.hasLength && (
                      <DimensionInput 
                          value={part.length || 0} 
                          onChange={val => updateCalculationPart(bill.id, item.id, part.id, { length: val })} 
                          className={inputClass}
                          disabled={isGlobal}
                      />
                  )}
              </div>
              
              {part.hasLength && (part.hasWidth || part.hasDepth) && <span className="text-slate-300">×</span>}
  
              <div className={`flex items-center gap-1 rounded px-1.5 py-0.5 border transition-all ${part.hasWidth ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800' : 'bg-transparent border-transparent opacity-60'}`}>
                  <span className="text-[10px] font-bold text-slate-500">L</span>
                  {part.hasWidth && (
                      <DimensionInput 
                          value={part.width || 0} 
                          onChange={val => updateCalculationPart(bill.id, item.id, part.id, { width: val })} 
                          className={inputClass}
                          disabled={isGlobal}
                      />
                  )}
              </div>
  
              {part.hasWidth && part.hasDepth && <span className="text-slate-300">×</span>}
  
              <div className={`flex items-center gap-1 rounded px-1.5 py-0.5 border transition-all ${part.hasDepth ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800' : 'bg-transparent border-transparent opacity-60'}`}>
                  <span className="text-[10px] font-bold text-slate-500">T</span>
                  {part.hasDepth && (
                      <DimensionInput 
                          value={part.depth || 0} 
                          onChange={val => updateCalculationPart(bill.id, item.id, part.id, { depth: val })} 
                          className={inputClass}
                          disabled={isGlobal}
                      />
                  )}
              </div>
  
              <span className="text-slate-300">×</span>
              
              <div className={`flex items-center gap-1 rounded px-1.5 py-0.5 border border-transparent ${part.multiplier !== 1 ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200' : 'opacity-60'}`}>
                  <DimensionInput 
                      value={part.multiplier || 1} 
                      onChange={val => updateCalculationPart(bill.id, item.id, part.id, { multiplier: val })} 
                      className="w-8 bg-transparent outline-none text-center font-bold text-slate-700 dark:text-slate-300 placeholder-slate-400" 
                      placeholder="1" 
                  />
              </div>
  
              <button onClick={() => removeCalculationPart(bill.id, item.id, part.id)} className="ml-auto p-1 text-slate-300 hover:text-red-500">
                  <MinusCircle className="w-4 h-4" />
              </button>
          </div>
        );
    };

    const renderItemRow = (bill: BQGroup, item: BQItem, index: number, isHidden: boolean) => {
        if (isHidden) return null;
        const autoNumber = getAutoNumber(bill.items, index);
        const hierarchyLevel = getItemLevel(item);

        // --- FIND ORIGINAL ITEM ---
        let originalItem: BQItem | undefined;
        let originalBill = originalData.find(b => b.id === bill.id);
        if (originalBill) {
            originalItem = originalBill.items.find(i => i.id === item.id);
        }

        const originalQty = originalItem?.qty || 0;
        const originalAmount = originalItem?.amount || 0;
        const currentAmount = item.amount || 0;
        const diff = currentAmount - originalAmount;
        
        let colorClass = "text-slate-500 dark:text-slate-400";
        if (diff > 0.01) colorClass = "text-blue-600 dark:text-blue-400 font-bold";
        else if (diff < -0.01) colorClass = "text-red-600 dark:text-red-400 font-bold";

        if (item.type === 'HEADER') {
            const isLevel0 = hierarchyLevel === 0;
            return (
                <div key={item.id} className={`flex items-center gap-2 py-3 border-b border-slate-100 dark:border-white/5 ${isLevel0 ? 'bg-slate-100 dark:bg-white/10' : 'bg-slate-50/50 dark:bg-white/5'} px-4 -mx-4`}>
                    <span className="text-xs font-black text-slate-400 min-w-[30px]">{autoNumber}</span>
                    <button 
                      onClick={() => toggleCollapse(bill.id, item.id)}
                      className="p-1 rounded hover:bg-slate-200 dark:hover:bg-white/10 text-slate-400 transition-colors"
                    >
                        {item.isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    <span className={`text-sm ${isLevel0 ? 'font-bold uppercase text-slate-800 dark:text-white' : 'font-semibold text-slate-700 dark:text-slate-300 pl-1'}`}>
                        {item.description}
                    </span>
                </div>
            );
        }

        const paddingLeftClass = 'pl-10';

        return (
            <div key={item.id} className={`py-4 border-b border-slate-100 dark:border-white/5 last:border-0 hover:bg-slate-50 dark:hover:bg-white/5 px-2 rounded-xl transition-all duration-300`}>
                <div className="flex flex-col xl:flex-row gap-4">
                    {/* LEFT: INFO & CALC */}
                    <div className="flex-1 min-w-0">
                         <div className="flex gap-3 mb-2">
                             <div className="text-xs font-black text-slate-400 mt-1 min-w-[30px]">{autoNumber}</div>
                             <div className={`flex-1 ${paddingLeftClass}`}>
                                 <p className="text-sm font-medium text-slate-800 dark:text-white leading-relaxed">{item.description}</p>
                                 {item.variant && <p className="text-xs text-slate-500 italic mt-1">{item.variant}</p>}
                                 <div className="mt-2 flex items-center gap-2">
                                     <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-500 font-mono">{item.unit}</span>
                                     <span className="text-xs text-slate-400">@ {formatCurrency(item.rate)}</span>
                                 </div>
                             </div>
                         </div>

                         {/* CALCULATION EDITOR (PELARASAN) */}
                         <div className={`ml-12 bg-yellow-50/30 dark:bg-yellow-900/10 p-3 rounded-lg border border-yellow-100 dark:border-yellow-900/30`}>
                             <div className="flex items-center gap-2 mb-2">
                                 <div className="text-[10px] font-bold text-yellow-600 dark:text-yellow-500 uppercase tracking-wider flex items-center gap-1">
                                    <Calculator className="w-3 h-3" /> Pelarasan (Adjusted)
                                 </div>
                                 <button
                                     onClick={() => toggleGlobal(bill.id, item.id)}
                                     className={`p-1 rounded-md transition-colors border text-[10px] flex items-center gap-1 ${item.isGlobal ? 'bg-emerald-100 text-emerald-600 border-emerald-200' : 'bg-white text-slate-400 border-slate-200'}`}
                                     title={item.isGlobal ? "Linked to Pelarasan Global Dims" : "Unlinked (Manual)"}
                                 >
                                     {item.isGlobal ? <Link className="w-3 h-3" /> : <Unlink className="w-3 h-3" />}
                                     {item.isGlobal ? 'Linked' : 'Manual'}
                                 </button>
                             </div>

                             <div className="space-y-1">
                                 {(item.calculationParts || []).map(part => renderCalculationPartRow(bill, item, part))}
                             </div>
                             
                             <div className="flex items-center justify-between mt-2 pt-2 border-t border-yellow-200 dark:border-yellow-800/30">
                                 <button onClick={() => addCalculationPart(bill.id, item.id)} className="text-[10px] flex items-center gap-1 text-yellow-600 hover:text-yellow-700 font-bold px-2 py-1 rounded hover:bg-yellow-100">
                                    <PlusCircle className="w-3 h-3" /> Tambah
                                 </button>
                                 <div className="flex items-center gap-2">
                                     <span className="text-xs text-slate-400">Qty Laras:</span>
                                     <DimensionInput 
                                        value={item.qty}
                                        onChange={(val) => updateItem(bill.id, item.id, { qty: val })}
                                        className="w-20 text-right bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-sm font-bold text-slate-700 dark:text-slate-200"
                                     />
                                 </div>
                             </div>
                         </div>
                    </div>

                    {/* RIGHT: COMPARISON TABLE */}
                    <div className="w-full xl:w-[320px] shrink-0 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-3 text-xs">
                         <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                             <div className="col-span-2 border-b border-slate-200 dark:border-slate-600 pb-1 mb-1 font-bold text-slate-400 uppercase tracking-widest text-[10px]">Perbandingan</div>
                             
                             {/* Asal */}
                             <div className="text-slate-500">Asal (Qty)</div>
                             <div className="text-right font-mono text-slate-600 dark:text-slate-300">{originalQty}</div>
                             
                             <div className="text-slate-500">Asal (RM)</div>
                             <div className="text-right font-mono text-slate-600 dark:text-slate-300">{formatCurrency(originalAmount)}</div>
                             
                             <div className="col-span-2 border-b border-slate-200 dark:border-slate-600 my-1"></div>

                             {/* Laras */}
                             <div className="text-slate-500 font-bold">Laras (Qty)</div>
                             <div className="text-right font-mono font-bold text-slate-800 dark:text-white">{item.qty}</div>
                             
                             <div className="text-slate-500 font-bold">Laras (RM)</div>
                             <div className="text-right font-mono font-bold text-slate-800 dark:text-white">{formatCurrency(item.amount)}</div>

                             <div className="col-span-2 border-b border-slate-200 dark:border-slate-600 my-1"></div>

                             {/* Beza */}
                             <div className="font-bold">Beza (RM)</div>
                             <div className={`text-right font-mono ${colorClass}`}>
                                 {diff > 0 ? '+' : ''}{formatCurrency(diff)}
                             </div>
                         </div>
                    </div>
                </div>
            </div>
        );
    };

    // --- PRINT VIEW RENDER ---
    if (isPrintView) {
        const grandTotalOriginal = originalData.reduce((sum, bill) => sum + bill.items.reduce((s, i) => s + i.amount, 0), 0);
        const grandTotalAdjusted = pelarasanData.reduce((sum, bill) => sum + bill.items.reduce((s, i) => s + i.amount, 0), 0);

        return (
             <div id="bq-pelarasan-print-doc" className="min-w-[210mm] w-[210mm] bg-white text-black dark:text-black text-[10px] font-sans leading-snug mx-auto">
                 
                 {pelarasanData.map((bill, billIdx) => {
                    const originalBill = originalData.find(b => b.id === bill.id);
                    const locationObj = locationRows.find(l => l.id === bill.locationId);
                    
                    const isPermulaan = bill.title.toUpperCase().includes('PERMULAAN');
                    const displayLoc = isPermulaan 
                        ? locationRows.filter(r => r.lokasi).map(r => r.lokasi).join('\n') 
                        : (locationObj ? locationObj.lokasi : '');
                    const displayAduan = isPermulaan 
                        ? locationRows.filter(r => r.aduan).map(r => r.aduan).join('\n') 
                        : (locationObj ? locationObj.aduan : '');

                    const itemGroups = groupItemsForPrint(bill.items);

                    return itemGroups.map((group, gIdx) => (
                        <div key={`${bill.id}-${gIdx}`} className="w-[210mm] h-[295mm] bg-white text-black dark:text-black p-[15mm] shadow-xl relative box-border mx-auto mb-10 overflow-hidden flex flex-col last:mb-0 print:mb-0 print:shadow-none print:h-[295mm] print:overflow-hidden print-break-page pdf-page">
                            
                            <table className="w-full border-collapse border border-black table-fixed text-black dark:text-black">
                                <colgroup>
                                    <col className="w-[4%]" />
                                    <col className="w-[30%]" />
                                    <col className="w-[6%]" />
                                    <col className="w-[8%]" />
                                    <col className="w-[8%]" />
                                    <col className="w-[11%]" />
                                    <col className="w-[8%]" />
                                    <col className="w-[11%]" />
                                    <col className="w-[14%]" />
                                </colgroup>
                                <thead>
                                    {/* ROW 1: TITLE */}
                                    <tr>
                                        <th colSpan={9} className="border border-black p-2 text-center font-bold text-[11px] uppercase h-[30px]">
                                            JADUAL PELARASAN HARGA - CADANGAN {projectData.namaProjek}
                                        </th>
                                    </tr>
                                    {/* ROW 2: HEADER LABELS */}
                                    <tr>
                                        <th colSpan={6} className="border border-black p-1 text-center font-bold text-[9px] uppercase h-[20px]">LOKASI ADUAN</th>
                                        <th colSpan={3} className="border border-black p-1 text-center font-bold text-[9px] uppercase h-[20px]">NO ADUAN</th>
                                    </tr>
                                    {/* ROW 3: HEADER VALUES */}
                                    <tr>
                                        <th colSpan={6} className="border border-black p-2 text-center font-bold text-[9px] uppercase align-middle whitespace-pre-line h-[40px] overflow-hidden">{displayLoc || 'TIADA LOKASI'}</th>
                                        <th colSpan={3} className="border border-black p-2 text-center font-bold text-[9px] uppercase align-middle whitespace-pre-line h-[40px] overflow-hidden">{displayAduan || projectData.noAduan || ''}</th>
                                    </tr>
                                    {/* ROW 4: COLUMNS */}
                                    <tr>
                                        <th className="border border-black p-1 text-center align-middle font-bold text-[8px] h-[30px]">BIL</th>
                                        <th className="border border-black p-1 text-center align-middle font-bold text-[8px] h-[30px]">KETERANGAN</th>
                                        <th className="border border-black p-1 text-center align-middle font-bold text-[8px] h-[30px]">UNIT</th>
                                        <th className="border border-black p-1 text-center align-middle font-bold text-[8px] h-[30px]">KADAR<br/>(RM)</th>
                                        <th className="border border-black p-1 text-center align-middle font-bold text-[8px] h-[30px] bg-gray-100">QTY<br/>(ASAL)</th>
                                        <th className="border border-black p-1 text-center align-middle font-bold text-[8px] h-[30px] bg-gray-100">AMAUN<br/>(ASAL)</th>
                                        <th className="border border-black p-1 text-center align-middle font-bold text-[8px] h-[30px]">QTY<br/>(LARAS)</th>
                                        <th className="border border-black p-1 text-center align-middle font-bold text-[8px] h-[30px]">AMAUN<br/>(LARAS)</th>
                                        <th className="border border-black p-1 text-center align-middle font-bold text-[8px] h-[30px]">BEZA<br/>(RM)</th>
                                    </tr>
                                </thead>
                                
                                <tbody className="align-top">
                                        {/* BILL TITLE ROW (Only on first page of bill) */}
                                        {group.isFirstPage && (
                                            <tr>
                                                <td className="border-x border-black p-1"></td>
                                                <td className="border-x border-black p-1 font-bold uppercase underline text-[9px]">
                                                    {bill.title}
                                                </td>
                                                <td className="border-x border-black p-1"></td>
                                                <td className="border-x border-black p-1"></td>
                                                <td className="border-x border-black p-1 bg-gray-50"></td>
                                                <td className="border-x border-black p-1 bg-gray-50"></td>
                                                <td className="border-x border-black p-1"></td>
                                                <td className="border-x border-black p-1"></td>
                                                <td className="border-x border-black p-1"></td>
                                            </tr>
                                        )}

                                        {group.items.map((item, itemIdx) => {
                                            const autoNumber = getAutoNumber(bill.items, group.startIndex + itemIdx);
                                            const originalItem = originalBill?.items.find(i => i.id === item.id);
                                            const origQty = originalItem?.qty || 0;
                                            const origAmt = originalItem?.amount || 0;
                                            const diff = (item.amount || 0) - origAmt;
                                            
                                            // Header Row
                                            if (item.type === 'HEADER') {
                                                const isUnderline = item.description.includes('ALL QUANTITY') || item.description === item.description.toUpperCase();
                                                return (
                                                    <tr key={item.id}>
                                                        <td className="border-x border-black p-1 text-center align-top font-bold text-[9px]">{autoNumber}</td>
                                                        <td className="border-x border-black p-1 align-top font-bold uppercase text-[9px]">
                                                            <span className={isUnderline ? 'underline' : ''}>{item.description}</span>
                                                        </td>
                                                        <td className="border-x border-black p-1"></td>
                                                        <td className="border-x border-black p-1"></td>
                                                        <td className="border-x border-black p-1 bg-gray-50"></td>
                                                        <td className="border-x border-black p-1 bg-gray-50"></td>
                                                        <td className="border-x border-black p-1"></td>
                                                        <td className="border-x border-black p-1"></td>
                                                        <td className="border-x border-black p-1"></td>
                                                    </tr>
                                                );
                                            }

                                            let diffColor = 'text-black dark:text-black';
                                            if (diff > 0.01) diffColor = 'text-blue-600 font-bold';
                                            else if (diff < -0.01) diffColor = 'text-red-600 font-bold';

                                            // Prepare Calculation Text
                                            const formatPart = (p: CalculationPart) => {
                                                const parts = [];
                                                if (p.hasLength && p.length > 0) parts.push(`${p.length} m(P)`);
                                                if (p.hasWidth && p.width > 0) parts.push(`${p.width} m(L)`);
                                                if (p.hasDepth && p.depth > 0) parts.push(`${p.depth} m(T)`);
                                                if (p.multiplier !== 1) parts.push(`${p.multiplier}`);
                                                return parts.join(' X ');
                                            };

                                            const originalParts = (originalItem?.calculationParts || [])
                                                .filter(p => (p.hasLength && p.length > 0) || (p.hasWidth && p.width > 0) || (p.hasDepth && p.depth > 0) || (p.multiplier !== 1));

                                            const newParts = (item.calculationParts || [])
                                                .filter(p => (p.hasLength && p.length > 0) || (p.hasWidth && p.width > 0) || (p.hasDepth && p.depth > 0) || (p.multiplier !== 1));

                                            return (
                                                <tr key={item.id}>
                                                    <td className="border-x border-black p-1 text-center align-top text-[9px] text-black dark:text-black">{autoNumber}</td>
                                                    <td className="border-x border-black p-1 align-top text-justify text-[9px] whitespace-pre-wrap leading-tight text-black dark:text-black">
                                                        {item.description}
                                                        {item.variant && <div className="italic mt-0.5 font-semibold">{item.variant}</div>}
                                                        
                                                        {/* CALCULATIONS DISPLAY */}
                                                        {(originalParts.length > 0 || newParts.length > 0) && (
                                                            <div className="mt-2 text-[8px] font-mono border-l-2 pl-2 border-gray-300">
                                                                {originalParts.length > 0 && (
                                                                    <div className="mb-1 text-gray-500">
                                                                        <div className="italic underline mb-0.5">Kiraan Asal:</div>
                                                                        {originalParts.map((p, i) => <div key={`orig-${i}`}>{formatPart(p)}</div>)}
                                                                    </div>
                                                                )}
                                                                {newParts.length > 0 && (
                                                                    <div className="text-black dark:text-black">
                                                                        <div className="italic underline mb-0.5">Kiraan Laras:</div>
                                                                        {newParts.map((p, i) => <div key={`new-${i}`}>{formatPart(p)}</div>)}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="border-x border-black p-1 text-center align-top font-bold text-[9px] text-black dark:text-black">{item.unit}</td>
                                                    <td className="border-x border-black p-1 text-right align-top text-[9px] text-black dark:text-black">
                                                        {item.rate === 0 ? '-' : fmt(item.rate)}
                                                    </td>
                                                    
                                                    {/* ASAL */}
                                                    <td className="border-x border-black p-1 text-center align-top text-[9px] bg-gray-50 text-gray-600">
                                                        {origQty === 0 ? '-' : origQty}
                                                    </td>
                                                    <td className="border-x border-black p-1 text-right align-top text-[9px] bg-gray-50 text-gray-600">
                                                        {origAmt === 0 ? '-' : fmt(origAmt)}
                                                    </td>

                                                    {/* LARAS */}
                                                    <td className="border-x border-black p-1 text-center align-top text-[9px] font-bold text-black dark:text-black">
                                                        {item.qty === 0 ? '-' : item.qty}
                                                    </td>
                                                    <td className="border-x border-black p-1 text-right align-top text-[9px] font-bold text-black dark:text-black">
                                                        {item.amount === 0 ? '-' : fmt(item.amount)}
                                                    </td>

                                                    {/* BEZA */}
                                                    <td className={`border-x border-black p-1 text-right align-top text-[9px] ${diffColor}`}>
                                                        {diff === 0 ? '-' : (diff > 0 ? '+' : '') + fmt(diff)}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        
                                        {/* FILLER ROW */}
                                        <tr style={{ height: '100%' }}>
                                            <td className="border-x border-black"></td>
                                            <td className="border-x border-black"></td>
                                            <td className="border-x border-black"></td>
                                            <td className="border-x border-black"></td>
                                            <td className="border-x border-black bg-gray-50"></td>
                                            <td className="border-x border-black bg-gray-50"></td>
                                            <td className="border-x border-black"></td>
                                            <td className="border-x border-black"></td>
                                            <td className="border-x border-black"></td>
                                        </tr>
                                </tbody>
                                
                                {/* BILL FOOTER */}
                                {group.hasFooter && (
                                    <tbody>
                                        <tr>
                                            <td className="border border-black p-1 border-b-0" colSpan={5}>
                                                <div className="text-right font-bold uppercase pr-2 text-[9px]">JUMLAH {bill.title}</div>
                                            </td>
                                            <td className="border border-black p-1 text-right font-bold align-bottom border-b-0 text-[9px] bg-gray-50">
                                                {fmt(originalBill?.items.reduce((s,i) => s + i.amount, 0))}
                                            </td>
                                            <td className="border border-black p-1 border-b-0"></td>
                                            <td className="border border-black p-1 text-right font-bold align-bottom border-b-0 text-[9px]">
                                                {fmt(bill.items.reduce((s,i) => s + i.amount, 0))}
                                            </td>
                                            <td className="border border-black p-1 text-right font-bold align-bottom border-b-0 text-[9px]">
                                                {fmt(bill.items.reduce((s,i) => s + i.amount, 0) - (originalBill?.items.reduce((s,i) => s + i.amount, 0) || 0))}
                                            </td>
                                        </tr>
                                    </tbody>
                                )}
                                {!group.hasFooter && (
                                    <tbody>
                                        <tr>
                                            <td className="border-t border-black" colSpan={9}></td>
                                        </tr>
                                    </tbody>
                                )}
                            </table>
                            {group.hasFooter && <div className="border-t border-black"></div>}
                        </div>
                    ));
                 })}

                 {/* SUMMARY PAGE */}
                 <div className="min-h-[295mm] w-[210mm] p-[20mm] relative box-border flex flex-col justify-between bg-white shadow-xl mx-auto mb-10 overflow-hidden print:mb-0 print:shadow-none print:h-[295mm] print:overflow-hidden print-break-page pdf-page text-black dark:text-black">
                    <div>
                        <div className="border border-black p-2 mb-6 font-bold text-[10px]">
                             <div className="grid grid-cols-[100px_1fr] gap-1">
                                    <div>CADANGAN</div>
                                    <div className="uppercase">: {projectData.namaProjek}</div>
                             </div>
                        </div>

                        <div className="text-center font-bold text-[16px] uppercase mb-6 underline">
                            RINGKASAN PELARASAN HARGA
                        </div>

                        <table className="w-full border-collapse border border-black mb-8 text-black dark:text-black">
                            <thead>
                                <tr className="bg-gray-50">
                                    <th className="border border-black p-1 text-center font-bold uppercase text-[9px]">KETERANGAN</th>
                                    <th className="border border-black p-1 w-[15%] text-center font-bold uppercase text-[9px]">ASAL (RM)</th>
                                    <th className="border border-black p-1 w-[15%] text-center font-bold uppercase text-[9px]">LARAS (RM)</th>
                                    <th className="border border-black p-1 w-[15%] text-center font-bold uppercase text-[9px]">BEZA (RM)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pelarasanData.map(bill => {
                                    const originalBill = originalData.find(b => b.id === bill.id);
                                    const origTotal = originalBill?.items.reduce((s,i) => s+i.amount, 0) || 0;
                                    const larasTotal = bill.items.reduce((s,i) => s+i.amount, 0);
                                    const diffTotal = larasTotal - origTotal;
                                    
                                    return (
                                        <tr key={bill.id}>
                                            <td className="border border-black p-2 font-bold uppercase text-[9px] align-top">
                                                {bill.title}
                                            </td>
                                            <td className="border border-black p-2 text-right font-bold text-[9px] align-top text-gray-600">
                                                {fmt(origTotal)}
                                            </td>
                                            <td className="border border-black p-2 text-right font-bold text-[9px] align-top">
                                                {fmt(larasTotal)}
                                            </td>
                                            <td className={`border border-black p-2 text-right font-bold text-[9px] align-top ${diffTotal > 0 ? 'text-blue-600' : (diffTotal < 0 ? 'text-red-600' : '')}`}>
                                                {diffTotal === 0 ? '-' : (diffTotal > 0 ? '+' : '') + fmt(diffTotal)}
                                            </td>
                                        </tr>
                                    );
                                })}
                                <tr>
                                    <td className="border border-black p-2 text-center font-bold text-[9px] uppercase">
                                        JUMLAH KESELURUHAN
                                    </td>
                                    <td className="border border-black p-2 text-right font-bold text-[9px] text-gray-600">
                                        {formatCurrency(grandTotalOriginal)}
                                    </td>
                                    <td className="border border-black p-2 text-right font-bold text-[9px]">
                                        {formatCurrency(grandTotalAdjusted)}
                                    </td>
                                    <td className={`border border-black p-2 text-right font-bold text-[9px] ${grandTotalAdjusted - grandTotalOriginal > 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                        {formatCurrency(grandTotalAdjusted - grandTotalOriginal)}
                                    </td>
                                </tr>
                            </tbody>
                        </table>

                        {/* NEW CONTRACT SUMMARY SECTION */}
                        <div className="mt-8 font-sans">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <div className="font-bold uppercase underline text-[11px]">PELARASAN JUMLAH HARGA KONTRAK</div>
                                    <div className="font-bold uppercase text-[11px]">JUMLAH DIBAYAR KEPADA KONTRAKTOR</div>
                                </div>
                                <div className="border-2 border-black w-40">
                                    <div className="border-b border-black px-2 py-1 text-right font-bold text-[11px] bg-gray-50">{formatCurrency(grandTotalAdjusted)}</div>
                                    <div className="px-2 py-1 text-right font-bold text-[11px] bg-gray-100">
                                        {(() => {
                                            // Capped Logic: Use Contract Price if Adjusted Price is higher
                                            const cappedTotal = (grandTotalAdjusted > grandTotalOriginal) ? grandTotalOriginal : grandTotalAdjusted;
                                            const deductions = (projectData.ladAmount || 0) + (projectData.wangTahanan || 0);
                                            return formatCurrency(cappedTotal - deductions);
                                        })()}
                                    </div>
                                </div>
                            </div>

                            <table className="w-full border-collapse border-2 border-black mb-6 text-[10px] text-black dark:text-black">
                                <tbody>
                                    <tr>
                                        <td className="border border-black p-2 font-bold w-1/2">HARGA KONTRAK</td>
                                        <td className="border border-black p-2 font-bold text-center">{formatCurrency(grandTotalOriginal)}</td>
                                    </tr>
                                    <tr>
                                        <td className="border border-black p-2 font-bold w-1/2">HARGA PELARASAN</td>
                                        <td className="border border-black p-2 font-bold text-center">{formatCurrency(grandTotalAdjusted)}</td>
                                    </tr>
                                    {/* Removed explicit Penambahan/Penolakan calculation rows as requested */}
                                    <tr>
                                        <td className="border border-black p-2 font-bold">WANG TAHANAN</td>
                                        <td className="border border-black p-2 font-bold text-center">
                                            {projectData.wangTahanan ? formatCurrency(projectData.wangTahanan) : '-'}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="border border-black p-2 font-bold">LAD</td>
                                        <td className="border border-black p-2 font-bold text-center">
                                            {projectData.ladAmount ? formatCurrency(projectData.ladAmount) : '-'}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="border border-black p-2 font-bold">LOC</td>
                                        <td className="border border-black p-2 font-bold text-center">-</td>
                                    </tr>
                                    <tr className="border-t-2 border-black bg-gray-100">
                                        <td className="border border-black p-2 font-bold uppercase">JUMLAH DIBAYAR KEPADA KONTRAKTOR</td>
                                        <td className="border border-black p-2 font-bold text-center">
                                            {(() => {
                                                // Capped Logic: Max payment cannot exceed original contract
                                                const cappedTotal = (grandTotalAdjusted > grandTotalOriginal) ? grandTotalOriginal : grandTotalAdjusted;
                                                const deductions = (projectData.ladAmount || 0) + (projectData.wangTahanan || 0);
                                                const finalAmount = cappedTotal - deductions;
                                                return formatCurrency(finalAmount);
                                            })()}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>

                            <div className="grid grid-cols-2 gap-8 text-[10px] font-bold mb-6">
                                <div>
                                    <div className="mb-2">Nilai Projek</div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className={`w-3 h-3 border border-black flex items-center justify-center`}>
                                            {(grandTotalAdjusted <= 100000 && grandTotalAdjusted >= 10000) && <div className="w-2 h-2 bg-black"></div>}
                                        </div>
                                        <div>RM 10,000 - RM 100,000</div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-3 h-3 border border-black flex items-center justify-center`}>
                                            {(grandTotalAdjusted > 100000) && <div className="w-2 h-2 bg-black"></div>}
                                        </div>
                                        <div>Melebihi RM 100,000</div>
                                    </div>
                                </div>
                                <div>
                                    <div className="mb-2">Tempoh Tanggungan kecacatan</div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className={`w-3 h-3 border border-black flex items-center justify-center`}>
                                            {(grandTotalAdjusted <= 100000) && <div className="w-2 h-2 bg-black"></div>}
                                        </div>
                                        <div>6 Bulan dari tarikh kerja diperakukan siap</div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-3 h-3 border border-black flex items-center justify-center`}>
                                            {(grandTotalAdjusted > 100000) && <div className="w-2 h-2 bg-black"></div>}
                                        </div>
                                        <div>12 bulan dari tarikh kerja diperakukan siap</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* SIGNATURES */}
                    <div className="mt-auto pt-8">
                        <div className="grid grid-cols-2 gap-20 text-[10px] font-bold">
                            <div>
                                <div className="mb-12">Disediakan oleh</div>
                                <div className="border-b border-black w-full"></div>
                            </div>
                            <div>
                                <div className="mb-12">Disemak oleh,</div>
                                <div className="border-b border-black w-full"></div>
                            </div>
                        </div>
                    </div>
                 </div>
             </div>
        );
    }

    // --- EDITOR VIEW RENDER ---

    const billsByLocation: Record<string, BQGroup[]> = {};
    const permulaanBills: BQGroup[] = [];
    const otherBills: BQGroup[] = [];

    pelarasanData.forEach(b => {
        if (b.title.includes('PERMULAAN') || b.id.includes('permulaan')) { 
            permulaanBills.push(b); 
        } else if (b.locationId) { 
            if (!billsByLocation[b.locationId]) billsByLocation[b.locationId] = []; 
            billsByLocation[b.locationId].push(b); 
        } else {
            otherBills.push(b);
        }
    });
    
    const sortedLocationIds = Array.from(new Set(pelarasanData.filter(b => b.locationId && !b.title.includes('PERMULAAN') && !b.id.includes('permulaan')).map(b => b.locationId!)));

    return (
        <div className="flex flex-col md:flex-row gap-4 items-start">
            {/* Sidebar */}
            <div className="w-full md:w-72 flex flex-col gap-2 shrink-0 sticky top-24 max-h-[calc(100vh-8rem)]">
                 <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-xl border border-yellow-100 dark:border-yellow-800/30 flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-yellow-700 dark:text-yellow-500 tracking-wider">Navigasi Pelarasan</span>
                </div>
                <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-2 bg-white/40 dark:bg-slate-900/40 rounded-xl p-2">
                     {/* Permulaan */}
                     {permulaanBills.length > 0 && (
                        <div className="space-y-1">
                             <div className="px-2 text-[10px] font-bold text-slate-400 uppercase">Permulaan</div>
                             {permulaanBills.map((b) => (
                                 <div 
                                    key={b.id} 
                                    onClick={() => setActiveBillId(b.id)}
                                    className={`p-3 rounded-xl text-xs cursor-pointer border transition-all ${activeBillId === b.id ? 'bg-yellow-100 dark:bg-yellow-900/40 border-yellow-400 dark:border-yellow-600 text-yellow-800 dark:text-yellow-200 shadow-sm' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 border-transparent'}`}
                                 >
                                     <div className="font-bold truncate">{b.title}</div>
                                 </div>
                             ))}
                        </div>
                     )}

                     {/* Location Bills */}
                     {sortedLocationIds.map(locId => {
                         const groupBills = billsByLocation[locId] || [];
                         const loc = locationRows.find(l => l.id === locId);
                         return (
                             <div key={locId} className="space-y-1">
                                 <div className="px-2 text-[10px] font-bold text-slate-400 uppercase mt-4 mb-2 flex items-center gap-1 truncate" title={loc ? loc.lokasi : 'Lokasi'}>
                                     <MapPin className="w-3 h-3 shrink-0" /> 
                                     <span className="truncate">{loc ? loc.lokasi : 'Lokasi Tidak Dijumpai'}</span>
                                 </div>
                                 {groupBills.map(b => (
                                     <div 
                                        key={b.id} 
                                        onClick={() => setActiveBillId(b.id)}
                                        className={`p-3 rounded-xl text-xs cursor-pointer border transition-all ${activeBillId === b.id ? 'bg-yellow-100 dark:bg-yellow-900/40 border-yellow-400 dark:border-yellow-600 text-yellow-800 dark:text-yellow-200 shadow-sm' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 border-transparent'}`}
                                     >
                                         <div className="font-bold truncate">{b.title}</div>
                                     </div>
                                 ))}
                             </div>
                         );
                     })}

                     {/* Other Bills */}
                     {otherBills.length > 0 && (
                        <div className="space-y-1">
                             <div className="px-2 text-[10px] font-bold text-slate-400 uppercase mt-4">Lain-lain</div>
                             {otherBills.map((b) => (
                                 <div 
                                    key={b.id} 
                                    onClick={() => setActiveBillId(b.id)}
                                    className={`p-3 rounded-xl text-xs cursor-pointer border transition-all ${activeBillId === b.id ? 'bg-yellow-100 dark:bg-yellow-900/40 border-yellow-400 dark:border-yellow-600 text-yellow-800 dark:text-yellow-200 shadow-sm' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 border-transparent'}`}
                                 >
                                     <div className="font-bold truncate">{b.title}</div>
                                 </div>
                             ))}
                        </div>
                     )}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 w-full min-w-0 bg-white dark:bg-slate-900 rounded-xl shadow-inner flex flex-col">
                {activeBill ? (
                    <>
                        <div className="p-4 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-800/50 sticky top-20 z-20 backdrop-blur-sm">
                             <div className="flex items-center justify-between mb-2">
                                 <h2 className="text-lg font-bold text-slate-800 dark:text-white uppercase">{activeBill.title}</h2>
                                 <div className="text-right text-xs text-slate-400 shrink-0 ml-4">
                                     Pelarasan Total: <span className="text-yellow-600 font-bold text-sm">{formatCurrency(activeBill.items.reduce((s,i) => s + (i.amount||0), 0))}</span>
                                 </div>
                             </div>

                             {/* GLOBAL DIMS BAR (PELARASAN ONLY) */}
                             {activeBill.locationId && (
                                <div className={`mt-2 p-3 rounded-xl border transition-all ${isDimsDirty ? 'bg-orange-50 border-orange-200 dark:bg-orange-900/10 dark:border-orange-800/50' : 'bg-yellow-50/50 border-yellow-100 dark:bg-yellow-900/10 dark:border-yellow-800/30'}`}>
                                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase">
                                            <Ruler className="w-4 h-4 text-yellow-500" />
                                            Global Calc (Pelarasan Only)
                                        </div>
                                        <div className="flex items-center gap-2 w-full sm:w-auto">
                                            
                                            {/* Original Dims Display */}
                                            {projectData.locationDimensions?.[activeBill.locationId] && (
                                                <div className="hidden md:flex items-center gap-2 text-[10px] text-slate-400 mr-4 border-r border-slate-300 dark:border-slate-700 pr-4">
                                                    <span className="uppercase font-bold">Asal:</span>
                                                    <span>P:{projectData.locationDimensions[activeBill.locationId].length}</span>
                                                    <span>L:{projectData.locationDimensions[activeBill.locationId].width}</span>
                                                    <span>T:{projectData.locationDimensions[activeBill.locationId].depth}</span>
                                                </div>
                                            )}

                                            <div className="flex items-center bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 px-2 py-1 shadow-sm">
                                                <span className="text-[10px] font-bold text-slate-400 mr-1">P</span>
                                                <DimensionInput 
                                                    value={localDims.length || 0} 
                                                    onChange={val => { setLocalDims({...localDims, length: val}); setIsDimsDirty(true); }}
                                                    className="w-12 bg-transparent outline-none font-bold text-sm text-center" 
                                                    placeholder="0" 
                                                />
                                            </div>
                                            <div className="flex items-center bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 px-2 py-1 shadow-sm">
                                                <span className="text-[10px] font-bold text-slate-400 mr-1">L</span>
                                                <DimensionInput 
                                                    value={localDims.width || 0} 
                                                    onChange={val => { setLocalDims({...localDims, width: val}); setIsDimsDirty(true); }}
                                                    className="w-12 bg-transparent outline-none font-bold text-sm text-center" 
                                                    placeholder="0" 
                                                />
                                            </div>
                                            <div className="flex items-center bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 px-2 py-1 shadow-sm">
                                                <span className="text-[10px] font-bold text-slate-400 mr-1">T</span>
                                                <DimensionInput 
                                                    value={localDims.depth || 0} 
                                                    onChange={val => { setLocalDims({...localDims, depth: val}); setIsDimsDirty(true); }}
                                                    className="w-12 bg-transparent outline-none font-bold text-sm text-center" 
                                                    placeholder="0" 
                                                />
                                            </div>
                                            {isDimsDirty && (
                                                <button 
                                                    onClick={handleSaveGlobalDims}
                                                    className="ml-2 px-3 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1 transition-all"
                                                >
                                                    <Save className="w-3 h-3" /> Kemaskini
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex-1 p-4 space-y-2">
                             {activeBill.items.length === 0 ? (
                                 <div className="h-40 flex flex-col items-center justify-center text-slate-400">
                                     <FolderPlus className="w-10 h-10 mb-2 opacity-50" />
                                     <p className="text-sm">Tiada item dalam senarai ini.</p>
                                 </div>
                             ) : (
                                 // RENDER ITEMS LOGIC
                                 (() => {
                                     let currentLevel0Collapsed = false;
                                     let currentLevel1Collapsed = false;
                                     
                                     return activeBill.items.map((item, idx) => {
                                         const level = getItemLevel(item);
                                         let isHidden = false;
                                         if (level === 0) {
                                             currentLevel1Collapsed = false;
                                             currentLevel0Collapsed = !!item.isCollapsed;
                                         } else if (level === 1) {
                                             if (currentLevel0Collapsed) isHidden = true;
                                             else currentLevel1Collapsed = !!item.isCollapsed;
                                         } else {
                                             if (currentLevel0Collapsed || currentLevel1Collapsed) isHidden = true;
                                         }
                                         
                                         return renderItemRow(activeBill, item, idx, isHidden);
                                     });
                                 })()
                             )}
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8">
                        <Layers className="w-16 h-16 mb-4 opacity-20" />
                        <h3 className="text-lg font-bold text-slate-600 dark:text-slate-300">Tiada Senarai Dipilih</h3>
                        <p className="text-sm max-w-xs text-center mt-2">Pilih senarai dari navigasi sebelah kiri untuk membuat pelarasan.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BQPelarasanEditor;
