
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { BQGroup, BQItem, PresetGroup, BQTemplateDefinition, BQTemplateBillDefinition, BQTemplateItemRef, BQTemplateType } from '../types';
import { supabaseService } from '../services/supabaseService';
import { createItem, createHeader } from '../data/bqPresets';
import { Plus, Trash2, X, ChevronRight, ChevronDown, ChevronUp, Save, Edit3, LayoutTemplate, FileInput, FolderPlus, Layers, GripVertical, FileText, List, Grid, CheckSquare, Zap, Briefcase, ClipboardList, Folder, Archive, Star, Award, Bookmark, Box, Package, Truck, Wrench, PenTool, Hammer, Ruler } from 'lucide-react';

interface BQTemplateCreatorProps {
  initialTemplate?: BQTemplateDefinition;
  onSave: (template: BQTemplateDefinition) => void;
  onCancel: () => void;
}

const ICON_MAP = {
    file: FileInput,
    'file-text': FileText,
    edit: Edit3,
    layout: LayoutTemplate,
    list: List,
    grid: Grid,
    plus: Plus,
    check: CheckSquare,
    clipboard: ClipboardList,
    layers: Layers,
    box: Box,
    package: Package,
    truck: Truck,
    wrench: Wrench,
    hammer: Hammer,
    ruler: Ruler,
    zap: Zap,
    briefcase: Briefcase,
    archive: Archive,
    star: Star,
    award: Award,
    bookmark: Bookmark,
    tool: PenTool
};

const AVAILABLE_COLORS = [
    'slate', 'red', 'orange', 'amber', 'yellow', 'lime', 
    'green', 'emerald', 'teal', 'cyan', 'sky', 'blue', 
    'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose'
];

// Helper for Roman Numerals
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

const isUppercase = (text: string) => text === text.toUpperCase() && /[A-Z]/.test(text);

const getItemLevel = (item: BQItem): 0 | 1 | 2 => {
    if (item.type === 'HEADER') {
        return isUppercase(item.description) ? 0 : 1;
    }
    return 2; 
};

const BQTemplateCreator: React.FC<BQTemplateCreatorProps> = ({ 
    initialTemplate,
    onSave,
    onCancel
}) => {
    const [templateInfo, setTemplateInfo] = useState<{
        title: string;
        key: BQTemplateType;
        subtitle: string;
        icon: string;
        color: string;
    }>({
        title: initialTemplate?.title || 'TEMPLATE BARU',
        key: initialTemplate?.key || 'CUSTOM',
        subtitle: initialTemplate?.subtitle || 'Keterangan Template',
        icon: initialTemplate?.icon || 'file',
        color: initialTemplate?.color || 'blue'
    });

    const [bills, setBills] = useState<BQGroup[]>([]);
    const [activeBillId, setActiveBillId] = useState<string | null>(null);
    const [bqLibrary, setBqLibrary] = useState<PresetGroup[]>([]);
    
    const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const library = await supabaseService.getLibraryGroups();
                setBqLibrary(library);

                // Hydrate bills from template definition if provided
                if (initialTemplate && initialTemplate.bills) {
                    const hydratedBills: BQGroup[] = initialTemplate.bills.map(billDef => {
                        const items: BQItem[] = [];
                        let lastGroupId = '';
                        let lastItemId = '';
                        
                        billDef.items.forEach(ref => {
                            const group = library.find(g => g.id === ref.groupId);
                            if (group) {
                                 // Insert Group Header if new group
                                 if (ref.groupId !== lastGroupId) {
                                     items.push(createHeader(group.title.toUpperCase()));
                                     lastGroupId = ref.groupId;
                                     lastItemId = '';
                                 }

                                 const libItem = group.items.find(i => i.id === ref.itemId);
                                 if (libItem) {
                                     // Insert Item Header if needed
                                     if (ref.variantId || (libItem.variants && libItem.variants.length > 0)) {
                                         const parentDesc = libItem.description.charAt(0).toUpperCase() + libItem.description.slice(1).toLowerCase();
                                         // Check if we already added a header for this item group
                                         if (ref.itemId !== lastItemId) {
                                             items.push(createHeader(parentDesc));
                                             lastItemId = ref.itemId;
                                         }
                                     } else {
                                         lastItemId = ref.itemId;
                                     }
                                     
                                     const bqItem = createItem(library, ref.groupId, ref.itemId, ref.variantId);
                                     // Tag with source info
                                     bqItem.sourceGroupId = ref.groupId;
                                     bqItem.sourceItemId = ref.itemId;
                                     bqItem.sourceVariantId = ref.variantId;
                                     
                                     items.push(bqItem);
                                 }
                            }
                        });

                        return {
                            id: billDef.id,
                            title: billDef.title,
                            items: items,
                            locationId: undefined // Templates generally don't have hardcoded location IDs unless 'EMPTY' or 'LONGKANG' logic is applied later
                        };
                    });
                    setBills(hydratedBills);
                    if (hydratedBills.length > 0) setActiveBillId(hydratedBills[0].id);
                } else {
                     // Start with one empty bill
                     const newBill = { id: `bill-${Date.now()}`, title: 'KERJA-KERJA PERMULAAN', items: [] };
                     setBills([newBill]);
                     setActiveBillId(newBill.id);
                }
            } catch (err) {
                console.error('Failed to load library groups:', err);
            }
        };
        fetchData();
    }, [initialTemplate]);

    const handleAddBill = () => {
        const newBill: BQGroup = {
            id: `bill-${Date.now()}`,
            title: `BUTIRAN BARU`,
            items: []
        };
        const newBills = [...bills, newBill];
        setBills(newBills);
        setActiveBillId(newBill.id);
    };

    const handleDeleteBill = (billId: string) => {
        if (bills.length <= 1 && bills[0].id === billId) {
             // Don't delete the last one, just clear it
             setBills([{ ...bills[0], title: 'BUTIRAN BARU', items: [] }]);
             return;
        }
        const newBills = bills.filter(b => b.id !== billId);
        setBills(newBills);
        if (activeBillId === billId) {
            setActiveBillId(newBills[0].id);
        }
    };

    const updateBillTitle = (billId: string, title: string) => {
        setBills(prev => prev.map(b => b.id === billId ? { ...b, title: title.toUpperCase() } : b));
    };

    const openAddItemModal = () => {
        const categories = Array.from(new Set(bqLibrary.map(g => g.category)));
        if (categories.length > 0 && !selectedCategory) setSelectedCategory(categories[0]);
        setIsAddItemModalOpen(true);
    };

    const toggleCollapse = (billId: string, itemId: string) => {
        setBills(prev => prev.map(b => {
            if (b.id !== billId) return b;
            return { ...b, items: b.items.map(item => item.id === itemId ? { ...item, isCollapsed: !item.isCollapsed } : item) };
        }));
    };

    const moveItem = (billId: string, itemId: string, direction: 'up' | 'down') => {
        setBills(prevBills => prevBills.map(bill => {
            if (bill.id !== billId) return bill;
            const items = [...bill.items];
            const index = items.findIndex(i => i.id === itemId);
            if (index === -1) return bill;
            const itemToMove = items[index];
            const currentLevel = getItemLevel(itemToMove);
            let blockEnd = index + 1;
            while (blockEnd < items.length && getItemLevel(items[blockEnd]) > currentLevel) blockEnd++;
            const block = items.slice(index, blockEnd);
            if (direction === 'up') {
                if (index === 0) return bill; 
                let prevSiblingIndex = index - 1;
                while (prevSiblingIndex >= 0) { const level = getItemLevel(items[prevSiblingIndex]); if (level === currentLevel) break; if (level < currentLevel) return bill; prevSiblingIndex--; }
                if (prevSiblingIndex < 0) return bill;
                const beforePrev = items.slice(0, prevSiblingIndex); const prevBlock = items.slice(prevSiblingIndex, index); const afterBlock = items.slice(blockEnd);
                return { ...bill, items: [...beforePrev, ...block, ...prevBlock, ...afterBlock] };
            } else {
                if (blockEnd >= items.length) return bill; 
                const nextItem = items[blockEnd];
                if (getItemLevel(nextItem) < currentLevel) return bill; 
                let nextSiblingEnd = blockEnd + 1;
                while (nextSiblingEnd < items.length && getItemLevel(items[nextSiblingEnd]) > currentLevel) nextSiblingEnd++;
                const before = items.slice(0, index); const nextBlock = items.slice(blockEnd, nextSiblingEnd); const after = items.slice(nextSiblingEnd);
                return { ...bill, items: [...before, ...nextBlock, ...block, ...after] };
            }
        }));
    };

    const handleLibraryAddItem = (groupId: string, itemId: string, variantId?: string) => {
        if (!activeBillId) return;
        
        const group = bqLibrary.find(g => g.id === groupId);
        if (!group) return;

        setBills(prev => prev.map(b => {
            if (b.id !== activeBillId) return b;
            
            const newItems = [...b.items];
            const libraryItem = group.items.find(i => i.id === itemId)!;
            const groupHeaderDesc = group.title.toUpperCase();

            // Check last item to determine if we need headers
            const lastItem = newItems.length > 0 ? newItems[newItems.length - 1] : null;

            // 1. Group Header Logic
            // If the last item is from a different group, add group header
            let needsGroupHeader = false;
            if (!lastItem || lastItem.sourceGroupId !== groupId) {
                 // But don't duplicate if the last item IS the group header itself
                 if (!lastItem || lastItem.type !== 'HEADER' || lastItem.description !== groupHeaderDesc) {
                     needsGroupHeader = true;
                 }
            }
            if (needsGroupHeader) {
                newItems.push(createHeader(groupHeaderDesc));
            }

            // 2. Item Header Logic (for variants)
            if (variantId || (libraryItem.variants && libraryItem.variants.length > 0)) {
                const parentDesc = libraryItem.description.charAt(0).toUpperCase() + libraryItem.description.slice(1).toLowerCase();
                let needsItemHeader = true;

                // Check the item immediately before insertion point (which is now the last item in newItems)
                const currentLast = newItems.length > 0 ? newItems[newItems.length - 1] : null;

                if (currentLast) {
                    // If last item is a variant of the SAME item, we don't need a header
                    if (currentLast.sourceItemId === itemId && currentLast.type === 'ITEM') {
                        needsItemHeader = false;
                    }
                    // If last item is the Header itself, we don't need another
                    if (currentLast.type === 'HEADER' && currentLast.description === parentDesc) {
                        needsItemHeader = false;
                    }
                }
                
                if (needsItemHeader) {
                    newItems.push(createHeader(parentDesc));
                }
            }

            const newItem = createItem(bqLibrary, groupId, itemId, variantId);
            newItem.sourceGroupId = groupId;
            newItem.sourceItemId = itemId;
            newItem.sourceVariantId = variantId;

            newItems.push(newItem);
            return { ...b, items: newItems };
        }));
    };

    const handleDeleteItem = (billId: string, itemIdx: number) => {
        setBills(prev => prev.map(b => {
            if (b.id !== billId) return b;
            const items = [...b.items];
            const itemToDelete = items[itemIdx];
            
            // If deleting a header, delete its children too (simple approach for now)
            // But wait, user might just want to delete the item.
            // Let's mimic BQEditor behavior: if Header, delete children.
            if (itemToDelete.type === 'HEADER') {
                const currentLevel = getItemLevel(itemToDelete);
                let nextHeaderIndex = itemIdx + 1;
                while (nextHeaderIndex < items.length && getItemLevel(items[nextHeaderIndex]) > currentLevel) {
                    nextHeaderIndex++;
                }
                items.splice(itemIdx, nextHeaderIndex - itemIdx);
            } else {
                items.splice(itemIdx, 1);
            }
            return { ...b, items };
        }));
    };

    const handleSaveTemplate = () => {
        // Dehydrate bills to BQTemplateBillDefinition
        const templateBills: BQTemplateBillDefinition[] = bills.map(b => {
            const items: BQTemplateItemRef[] = [];
            b.items.forEach(item => {
                if (item.type === 'ITEM' && item.sourceGroupId && item.sourceItemId) {
                    items.push({
                        groupId: item.sourceGroupId,
                        itemId: item.sourceItemId,
                        variantId: item.sourceVariantId
                    });
                }
            });
            return {
                id: b.id,
                title: b.title,
                items: items
            };
        });

        const template: BQTemplateDefinition = {
            id: initialTemplate?.id || `t-${Date.now()}`,
            key: templateInfo.key,
            title: templateInfo.title,
            subtitle: templateInfo.subtitle,
            icon: templateInfo.icon as any,
            color: templateInfo.color as any,
            bills: templateBills,
            groupRefs: [] // Legacy
        };

        onSave(template);
    };

    const activeBill = bills.find(b => b.id === activeBillId);
    const categories = Array.from(new Set(bqLibrary.map(g => g.category)));
    const currentCategoryGroups = bqLibrary.filter(g => g.category === selectedCategory);

    const inputClass ="w-full px-4 py-2.5 rounded-lg bg-slate-50  border border-slate-200  outline-none focus:ring-2 focus:ring-blue-500 text-sm";
    const labelClass ="block text-xs font-bold text-slate-500  uppercase tracking-wide mb-1";

    const IconComponent = ICON_MAP[templateInfo.icon as keyof typeof ICON_MAP] || FileText;

    return (
        <div className="flex flex-col h-full bg-white  rounded-[2.5rem] overflow-hidden">
             {/* Header */}
             <div className="p-6 border-b border-slate-200  flex justify-between items-center bg-white  shrink-0">
                  <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-${templateInfo.color}-100 text-${templateInfo.color}-600`}>
                          <IconComponent className="w-7 h-7" />
                      </div>
                      <div>
                          <h3 className="text-2xl font-bold text-slate-900">Penyunting Template BQ</h3>
                          <p className="text-sm text-slate-500">Bina struktur template dan pilih item dari pustaka.</p>
                      </div>
                  </div>
                  <button onClick={onCancel} className="text-slate-400 hover:text-slate-600  p-1 rounded-full hover:bg-slate-100  transition-colors">
                      <X className="w-7 h-7" />
                  </button>
             </div>

             <div className="flex-1 flex flex-col lg:flex-row gap-8 p-6 overflow-hidden bg-gray-50">
                 {/* Left Panel: Settings & Bills */}
                 <div className="w-full lg:w-80 flex flex-col gap-6 shrink-0 overflow-y-auto custom-scrollbar">
                      
                      {/* Template Settings Card */}
                      <div className="bg-white  p-5 rounded-3xl border border-slate-200  shadow-sm space-y-4">
                          <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1 border-b border-slate-100  pb-2">Maklumat Template</h5>
                          <div><label className={labelClass}>Tajuk</label><input value={templateInfo.title} onChange={e => setTemplateInfo({...templateInfo, title: e.target.value})} className={inputClass} /></div>
                          <div><label className={labelClass}>Sub-tajuk</label><input value={templateInfo.subtitle} onChange={e => setTemplateInfo({...templateInfo, subtitle: e.target.value})} className={inputClass} /></div>
                          <div>
                              <label className={labelClass}>Jenis (Key)</label>
                              <select value={templateInfo.key} onChange={e => setTemplateInfo({...templateInfo, key: e.target.value as any})} className={inputClass}>
                                  <option value="CUSTOM">CUSTOM</option>
                                  <option value="PERMULAAN_BASIC">PERMULAAN_BASIC</option>
                                  <option value="PERMULAAN_EMPTY">PERMULAAN_EMPTY</option>
                                  <option value="LONGKANG">LONGKANG</option>
                                  <option value="EMPTY">EMPTY</option>
                              </select>
                          </div>
                          
                          {/* Icon Selector */}
                          <div>
                              <label className={labelClass}>Ikon</label>
                              <div className="grid grid-cols-5 gap-2">
                                  {Object.keys(ICON_MAP).map((iconKey) => {
                                      const IconComp = ICON_MAP[iconKey as keyof typeof ICON_MAP];
                                      return (
                                          <button
                                              key={iconKey}
                                              onClick={() => setTemplateInfo({ ...templateInfo, icon: iconKey })}
                                              className={`p-2 rounded-xl flex items-center justify-center transition-colors ${templateInfo.icon === iconKey ? 'bg-slate-800 text-white   shadow-md scale-105' : 'bg-slate-100  text-slate-400 hover:bg-slate-200'}`}
                                              title={iconKey}
                                          >
                                              <IconComp className="w-4 h-4" />
                                          </button>
                                      )
                                  })}
                              </div>
                          </div>

                          {/* Color Selector */}
                          <div>
                              <label className={labelClass}>Warna Tema</label>
                              <div className="grid grid-cols-6 gap-2">
                                  {AVAILABLE_COLORS.map((colorKey) => (
                                       <button
                                          key={colorKey}
                                          onClick={() => setTemplateInfo({ ...templateInfo, color: colorKey })}
                                          className={`h-8 rounded-xl transition-colors border-2 ${templateInfo.color === colorKey ? 'border-slate-900  scale-105 ring-2 ring-offset-1 ring-slate-400' : 'border-transparent '} bg-${colorKey}-500`}
                                          title={colorKey}
                                       />
                                  ))}
                              </div>
                          </div>
                      </div>

                      {/* Bills Navigation */}
                      <div className="flex-1 flex flex-col gap-2">
                           <div className="flex items-center justify-between px-2">
                               <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Senarai Bil</label>
                               <button onClick={handleAddBill} className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200 transition-colors shadow-sm"><Plus className="w-4 h-4" /></button>
                           </div>
                           <div className="space-y-2">
                               {bills.map((bill, index) => (
                                   <div 
                                      key={bill.id} 
                                      onClick={() => setActiveBillId(bill.id)}
                                      className={`group flex items-center justify-between p-4 rounded-2xl border transition-colors cursor-pointer shadow-sm ${activeBillId === bill.id ? 'bg-emerald-600 text-white border-emerald-600 shadow-emerald-500/30 transform scale-[1.02]' : 'bg-white  border-slate-200  text-slate-600  hover:border-emerald-300'}`}
                                   >
                                       <div className="min-w-0">
                                           <p className={`text-[10px] font-black uppercase leading-none mb-1 ${activeBillId === bill.id ? 'text-emerald-200' : 'text-slate-400'}`}>BIL {index + 1}</p>
                                           <p className="text-xs font-bold truncate">{bill.title}</p>
                                       </div>
                                       <button 
                                          onClick={(e) => { e.stopPropagation(); handleDeleteBill(bill.id); }}
                                                                                      className={`opacity-0 group-hover:opacity-100 p-2 rounded-lg transition-colors ${activeBillId === bill.id ? 'text-white hover:bg-white/20' : 'text-red-400 hover:bg-red-50'}`}
                                           
                                       >
                                           <Trash2 className="w-4 h-4" />
                                       </button>
                                   </div>
                               ))}
                           </div>
                      </div>
                 </div>

                 {/* Right Panel: Bill Editor */}
                 <div className="flex-1 bg-white  rounded-[2.5rem] border border-slate-200  overflow-hidden flex flex-col shadow-xl">
                      {activeBill ? (
                          <>
                              <div className="p-6 border-b border-slate-100  bg-slate-50/50">
                                  <label className={labelClass}>Tajuk Bil</label>
                                  <input 
                                      value={activeBill.title} 
                                      onChange={e => updateBillTitle(activeBill.id, e.target.value)}
                                      className="text-xl font-black bg-transparent outline-none w-full border-b border-emerald-500/20 focus:border-emerald-500 transition-colors text-slate-800  uppercase"
                                      placeholder="BUTIRAN KERJA-KERJA..."
                                  />
                              </div>

                              <div className="flex-1 p-6 overflow-y-auto custom-scrollbar bg-slate-50/30">
                                   <div className="space-y-3">
                                       {(() => {
                                            let currentLevel0Collapsed = false; 
                                            let currentLevel1Collapsed = false;
                                            return activeBill.items.map((item, idx) => {
                                                const level = getItemLevel(item);
                                                const isHeader = item.type === 'HEADER';
                                                
                                                // Collapse logic
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
                                                
                                                if (isHidden) return null;

                                                return (
                                                                                                          <div key={idx} className={`relative flex items-center gap-4 p-4 rounded-2xl border transition-colors group ${isHeader ? (level === 0 ? 'bg-slate-100 border-slate-200' : 'bg-slate-50 border-slate-100 ml-4') : 'bg-white border-slate-100 shadow-sm hover:border-emerald-300 ml-8'}`}>
                                                    
                                                        {isHeader && (
                                                            <button onClick={() => toggleCollapse(activeBill.id, item.id)} className="p-1 rounded hover:bg-slate-200  text-slate-400 transition-colors">
                                                                {item.isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                            </button>
                                                        )}
                                                        <div className="pt-1 text-slate-300"><GripVertical className="w-4 h-4" /></div>
                                                        <div className="flex-1 min-w-0">
                                                                                                                          <p className={`text-sm ${isHeader ? (level === 0 ? 'font-black uppercase text-slate-700' : 'font-bold text-slate-600') : 'font-medium text-slate-800'} leading-relaxed`}>{item.description}</p>
                                                            
                                                            {item.variant && <p className="text-xs text-slate-500 italic mt-1">{item.variant}</p>}
                                                            {!isHeader && (
                                                                <div className="mt-2 flex items-center gap-2">
                                                                    <span className="text-[10px] bg-slate-100  px-2 py-0.5 rounded text-slate-500 font-mono font-bold uppercase">{item.unit}</span>
                                                                    {item.sourceGroupId && <span className="text-[9px] text-slate-400 font-mono">SRC: {item.sourceItemId}</span>}
                                                                </div>
                                                            )}
                                                        </div>
                                                        
                                                        {/* Controls */}
                                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button onClick={() => moveItem(activeBill.id, item.id, 'up')} disabled={idx === 0} className="text-slate-400 hover:text-emerald-500 p-1 rounded hover:bg-emerald-50  disabled:opacity-30">
                                                                <ChevronUp className="w-4 h-4" />
                                                            </button>
                                                            <button onClick={() => moveItem(activeBill.id, item.id, 'down')} disabled={idx === activeBill.items.length - 1} className="text-slate-400 hover:text-emerald-500 p-1 rounded hover:bg-emerald-50  disabled:opacity-30">
                                                                <ChevronDown className="w-4 h-4" />
                                                            </button>
                                                            <button onClick={() => handleDeleteItem(activeBill.id, idx)} className="text-slate-300 hover:text-red-500 p-1 rounded hover:bg-red-50  transition-colors">
                                                                <X className="w-5 h-5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            });
                                       })()}
                                       
                                       {activeBill.items.length === 0 && (
                                           <div className="py-20 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200  rounded-3xl bg-slate-50/50">
                                               <FolderPlus className="w-16 h-16 mb-4 opacity-20 text-slate-500" />
                                               <p className="text-sm font-medium">Senarai kosong.</p>
                                               <button onClick={openAddItemModal} className="mt-4 text-emerald-600 hover:text-emerald-700 font-bold text-sm">Tambah Item dari Pustaka</button>
                                           </div>
                                       )}
                                   </div>
                              </div>

                              <div className="p-4 border-t border-slate-200  bg-white">
                                  <button onClick={openAddItemModal} className="w-full py-3 border-2 border-dashed border-slate-200  rounded-xl text-slate-400 font-bold text-sm hover:border-emerald-500 hover:text-emerald-600 hover:bg-emerald-50  transition-colors flex items-center justify-center gap-2">
                                      <Plus className="w-5 h-5" /> Tambah Item Pustaka
                                  </button>
                              </div>
                          </>
                      ) : (
                          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8">
                              <Layers className="w-16 h-16 opacity-20 mb-4" />
                              <p>Pilih atau cipta bil untuk mula menyunting.</p>
                          </div>
                      )}
                 </div>
             </div>

             {/* Footer Actions */}
             <div className="p-6 border-t border-slate-200  bg-white  flex justify-end gap-4">
                  <button onClick={onCancel} className="px-8 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100  transition-colors">Batal</button>
                  <button onClick={handleSaveTemplate} className="px-8 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-500/20 flex items-center gap-2">
                      <Save className="w-5 h-5" /> Simpan Template
                  </button>
             </div>

             {/* Add Item Modal */}
             {isAddItemModalOpen && createPortal(
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60  animate-fade-in" onClick={() => setIsAddItemModalOpen(false)}>
                    <div className="bg-white  rounded-[2.5rem] shadow-2xl max-w-4xl w-full h-[80vh] flex flex-col overflow-hidden border border-slate-200  transform scale-100 transition-colors animate-slide-up" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-slate-100  flex justify-between items-center bg-white  shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><Plus className="w-5 h-5" /></div>
                                <div><h3 className="font-bold text-slate-900">Pilih Item dari Pustaka</h3><p className="text-xs text-slate-500">Klik item untuk menambahnya ke dalam template.</p></div>
                            </div>
                            <button onClick={() => setIsAddItemModalOpen(false)} className="p-2 hover:bg-slate-100  rounded-full text-slate-400 transition-colors"><X className="w-6 h-6" /></button>
                        </div>
                        <div className="flex-1 flex overflow-hidden">
                            <div className="w-64 bg-slate-50  border-r border-slate-100  p-4 space-y-1 overflow-y-auto custom-scrollbar shrink-0">
                                                                  {categories.map(cat => (<button key={cat} onClick={() => setSelectedCategory(cat)} className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-colors ${selectedCategory === cat ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500 hover:bg-emerald-50'}`}>{cat}</button>))}
                                 
                            </div>
                            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar bg-white">
                                <div className="space-y-6">
                                    {currentCategoryGroups.map(group => (
                                        <div key={group.id} className="space-y-3">
                                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100  pb-1">{group.title}</h4>
                                            <div className="grid grid-cols-1 gap-2">
                                                {group.items.map(item => (
                                                    <div key={item.id} className="p-3 bg-slate-50  rounded-2xl border border-slate-100  transition-colors hover:border-emerald-300  group/item">
                                                        <div className="flex justify-between items-start gap-4">
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-bold text-slate-800  leading-tight">{item.description}</p>
                                                                <div className="mt-2 flex gap-2 flex-wrap">
                                                                    {(!item.variants || item.variants.length === 0) ? (
                                                                        <button onClick={() => handleLibraryAddItem(group.id, item.id)} className="flex items-center gap-1.5 px-3 py-1.5 bg-white  border border-slate-200  text-emerald-600 text-[10px] font-bold rounded-lg hover:bg-emerald-600 hover:text-white transition-colors shadow-sm"><Plus className="w-3.5 h-3.5" /> Pilih Item</button>
                                                                    ) : (
                                                                        item.variants.map(v => (
                                                                            <button key={v.id} onClick={() => handleLibraryAddItem(group.id, item.id, v.id)} className="flex items-center gap-1.5 px-3 py-1.5 bg-white  border border-slate-200  text-emerald-600 text-[10px] font-bold rounded-lg hover:bg-emerald-600 hover:text-white transition-colors shadow-sm"><Plus className="w-3.5 h-3.5" /> {v.label}</button>
                                                                        ))
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="text-right shrink-0">
                                                                <span className="text-[10px] bg-slate-200  px-1.5 py-0.5 rounded text-slate-500 font-bold uppercase mt-2 inline-block">{item.unit}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
             )}
        </div>
    );
};

export default BQTemplateCreator;
