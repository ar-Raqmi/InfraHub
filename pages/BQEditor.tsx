
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { BQGroup, BQItem, Project, ProjectLocation, formatCurrency, GlobalDimensions, CalculationPart, PresetGroup, BQTemplateDefinition } from '../types';
import { supabaseService } from '../services/supabaseService';
import { createItem, createHeader } from '../data/bqPresets';
import { Plus, Trash2, MapPin, X, Copy, List, Calculator, Edit3, ArrowRight, ChevronRight, Check, LayoutTemplate, FilePlus, Info, Play, Link, Unlink, FileText, FolderPlus, Layers, RotateCcw, PlusCircle, MinusCircle, AlertTriangle, Settings2, RefreshCw, Save, Ruler, Box, Package, ChevronDown, ChevronUp, GripVertical, Type, FolderOpen, Folder, Download, Loader2, FileInput, ClipboardList, Truck, Wrench, Hammer, CheckSquare, Grid, Zap, Briefcase, Archive, Star, Award, Bookmark, PenTool } from 'lucide-react';

interface BQEditorProps {
  initialData?: BQGroup[];
  onDataChange: (data: BQGroup[]) => void;
  projectData: Project;
  isPrintView?: boolean;
  onPreviewCostChange?: (cost: number) => void;
  locationRows: ProjectLocation[];
  onLocationDimensionsChange?: (locationId: string, dims: GlobalDimensions) => void;
  onShowToast?: (message: string, type: 'success' | 'error' | 'info') => void;
  readOnly?: boolean;
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

const getColorStyles = (color: string) => {
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
}

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
        if (parsedLocal === value) return;
        if (isNaN(parsedLocal) && value === 0) return;
        setLocalValue(value?.toString() || '');
    }, [value]);
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVal = e.target.value;
        setLocalValue(newVal);
        const parsed = parseFloat(newVal);
        if (!isNaN(parsed)) { onChange(parsed); } else { onChange(0); }
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

const BQEditor: React.FC<BQEditorProps> = ({ 
    initialData, 
    onDataChange, 
    isPrintView, 
    locationRows,
    projectData,
    onLocationDimensionsChange,
    onShowToast,
    readOnly = false
}) => {
  const [activeBillId, setActiveBillId] = useState<string | null>(null);
  const [bqLibrary, setBqLibrary] = useState<PresetGroup[]>([]);
  const [bqTemplates, setBqTemplates] = useState<BQTemplateDefinition[]>([]);
  const [bills, setBills] = useState<BQGroup[]>(() => {
    let data = initialData && initialData.length > 0 ? initialData : [];
    return data.map(b => ({
        ...b,
        calculationId: b.calculationId || `calc-${Math.random().toString(36).substr(2, 9)}`
    }));
  });

  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [lastAddedItemId, setLastAddedItemId] = useState<string | null>(null);

  const [selectedTemplate, setSelectedTemplate] = useState<BQTemplateDefinition | null>(null);
  const [templateLocation, setTemplateLocation] = useState<string>('');
  const [templateDims, setTemplateDims] = useState<GlobalDimensions>({ length: 0, width: 0, depth: 0 });
  const [step, setStep] = useState(1);
  const [templateError, setTemplateError] = useState(false);

  const [localDims, setLocalDims] = useState<GlobalDimensions>({ length: 0, width: 0, depth: 0 });
  const [isDimsDirty, setIsDimsDirty] = useState(false);

  const existingDims = templateLocation ? projectData.locationDimensions?.[templateLocation] : null;
  const isDimsModified = existingDims && (existingDims.length !== templateDims.length || existingDims.width !== templateDims.width || existingDims.depth !== templateDims.depth);

  const [deleteConfirm, setDeleteConfirm] = useState<{
      isOpen: boolean;
      type: 'BILL' | 'ITEM' | 'HEADER';
      billId: string;
      itemId?: string;
      title: string;
      count?: number; 
  } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
        try {
            const [library, templates] = await Promise.all([
                supabaseService.getLibraryGroups(),
                supabaseService.getTemplates()
            ]);
            setBqLibrary(library);
            setBqTemplates(templates);
        } catch (err) {
            console.error('Failed to load BQ data:', err);
        }
    };
    fetchData();
  }, []);

  useEffect(() => { onDataChange(bills); }, [bills]);

  useEffect(() => {
      if (bills.length > 0 && !activeBillId) { setActiveBillId(bills[0].id); }
  }, [bills]);

  useEffect(() => {
      if (!activeBillId) return;
      const bill = bills.find(b => b.id === activeBillId);
      if (bill && bill.calculationId && projectData.globalCalculations?.[bill.calculationId]) {
          setLocalDims(projectData.globalCalculations[bill.calculationId]);
      } else if (bill && bill.locationId && projectData.locationDimensions?.[bill.locationId]) {
          // Fallback for old data: if bill has no globalCalc but location has dims, use them as initial
          setLocalDims(projectData.locationDimensions[bill.locationId]);
      } else {
          setLocalDims({ length: 0, width: 0, depth: 0 });
      }
      setIsDimsDirty(false);
  }, [activeBillId, bills, projectData.globalCalculations, projectData.locationDimensions]);

  useEffect(() => {
    if (templateLocation && projectData.locationDimensions?.[templateLocation]) {
        setTemplateDims(projectData.locationDimensions[templateLocation]);
    } else if (templateLocation && !projectData.locationDimensions?.[templateLocation]) {
        setTemplateDims({ length: 0, width: 0, depth: 0 });
    }
  }, [templateLocation, projectData.locationDimensions]);

  useEffect(() => {
    if (!isAddItemModalOpen && lastAddedItemId) {
      const element = document.getElementById(`bq-item-${lastAddedItemId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const timer = setTimeout(() => { setLastAddedItemId(null); }, 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [isAddItemModalOpen, lastAddedItemId]);

  const parseTitle = (title: string) => {
      const match = title.match(/^(BIL NO\.\s*\d+)\s*[-–]\s*(.*)$/i);
      if (match) return { prefix: match[1].toUpperCase(), content: match[2].trim() };
      const matchOnlyPrefix = title.match(/^(BIL NO\.\s*\d+)$/i);
      if (matchOnlyPrefix) return { prefix: matchOnlyPrefix[1].toUpperCase(), content: '' };
      return { prefix: '', content: title };
  };

  const resequenceTitles = (currentBills: BQGroup[]): BQGroup[] => {
      let counter = 1;
      return currentBills.map(bill => {
          if (/^BIL NO\.\s*\d+/i.test(bill.title)) {
              const currentDesc = bill.title.replace(/^BIL NO\.\s*\d+\s*[-–]\s*/i, '');
              const newDesc = (currentDesc && currentDesc !== bill.title) ? currentDesc : bill.title.replace(/^BIL NO\.\s*\d+/i, '').trim().replace(/^-/, '').trim();
              const newTitle = `BIL NO. ${counter} - ${newDesc}`;
              counter++;
              return { ...bill, title: newTitle };
          }
          return bill;
      });
  };

  const isUppercase = (text: string) => text === text.toUpperCase() && /[A-Z]/.test(text);

  const getItemLevel = (item: BQItem): 0 | 1 | 2 => {
      if (item.type === 'HEADER') {
          return isUppercase(item.description) ? 0 : 1;
      }
      return 2; 
  };

  const getAutoNumber = (items: BQItem[], currentIndex: number) => {
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

  const handleAddTemplate = () => {
    if (readOnly) return;
    setStep(1);
    setSelectedTemplate(null);
    setTemplateLocation('');
    setTemplateDims({ length: 0, width: 0, depth: 0 });
    setTemplateError(false);
    setIsTemplateModalOpen(true);
  };

  const openAddItemModal = () => {
      if (readOnly) return;
      const categories = Array.from(new Set(bqLibrary.map(g => g.category)));
      if (categories.length > 0) setSelectedCategory(categories[0]);
      setIsAddItemModalOpen(true);
  };

  const toggleCollapse = (billId: string, itemId: string) => {
      setBills(prev => prev.map(b => {
          if (b.id !== billId) return b;
          return { ...b, items: b.items.map(item => item.id === itemId ? { ...item, isCollapsed: !item.isCollapsed } : item) };
      }));
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

  const handleLibraryAddItem = (groupId: string, itemId?: string, variantId?: string) => {
      if (!activeBillId || readOnly) return;
      const group = bqLibrary.find(g => g.id === groupId);
      if (!group || !itemId) return;
      setBills(prev => prev.map(b => {
          if (b.id !== activeBillId) return b;
          let newItems = [...b.items];
          const libraryItem = group.items.find(i => i.id === itemId)!;
          const groupHeaderDesc = group.title.toUpperCase(); 
          let level0Index = -1;
          for (let i = newItems.length - 1; i >= 0; i--) {
              if (getItemLevel(newItems[i]) === 0 && newItems[i].description === groupHeaderDesc) { level0Index = i; break; }
          }
          let insertionIndex = newItems.length; 
          let needsGroupHeader = level0Index === -1;
          if (!needsGroupHeader) {
              let groupEndIndex = newItems.length;
              for (let i = level0Index + 1; i < newItems.length; i++) {
                  if (getItemLevel(newItems[i]) === 0) { groupEndIndex = i; break; }
              }
              insertionIndex = groupEndIndex; 
          }
          const itemsToAdd: BQItem[] = [];
          if (needsGroupHeader) { itemsToAdd.push(createHeader(groupHeaderDesc)); }
          
          if (variantId || (libraryItem.variants && libraryItem.variants.length > 0)) {
              const rawParentDesc = libraryItem.description;
              const parentDesc = rawParentDesc.charAt(0).toUpperCase() + rawParentDesc.slice(1).toLowerCase();
              
              // Intelligent Parent Header Check
              let needsParentHeader = true;
              // Check the item immediately before insertion point
              const prevItem = newItems.length > 0 ? newItems[insertionIndex - 1] : null;
              
              if (prevItem) {
                  // If prev item is a variant of the same parent
                   if (prevItem.sourceItemId === itemId && prevItem.type === 'ITEM') {
                       needsParentHeader = false;
                   }
                   // If prev item is the header itself
                   if (prevItem.type === 'HEADER' && prevItem.description === parentDesc) {
                       needsParentHeader = false;
                   }
              }

              if (needsParentHeader) { itemsToAdd.push(createHeader(parentDesc)); }
              if (variantId) { 
                  const newItem = createItem(bqLibrary, groupId, itemId, variantId); 
                  newItem.sourceGroupId = groupId;
                  newItem.sourceItemId = itemId;
                  newItem.sourceVariantId = variantId;
                  itemsToAdd.push(newItem); 
              }
          } else { 
              const newItem = createItem(bqLibrary, groupId, itemId); 
              newItem.sourceGroupId = groupId;
              newItem.sourceItemId = itemId;
              itemsToAdd.push(newItem); 
          }

          const d = localDims;
          if (d) {
               itemsToAdd.forEach(newItem => {
                   if (newItem.type === 'ITEM' && newItem.calculationParts && newItem.isGlobal) {
                       newItem.calculationParts = newItem.calculationParts?.map(part => ({
                            ...part,
                            length: part.hasLength ? d.length : part.length,
                            width: part.hasWidth ? d.width : part.width,
                            depth: part.hasDepth ? d.depth : part.depth
                       }));
                       const qty = recalculateQtyFromParts(newItem.calculationParts || []);
                       newItem.qty = parseFloat(qty.toFixed(2));
                       newItem.amount = parseFloat((qty * newItem.rate).toFixed(2));
                   }
               });
          }
          if (itemsToAdd.length > 0) { const lastItem = itemsToAdd[itemsToAdd.length-1]; setLastAddedItemId(lastItem.id); }
          newItems.splice(insertionIndex, 0, ...itemsToAdd);
          return { ...b, items: newItems };
      }));
      if (onShowToast) onShowToast(`Item ditambah`, 'success');
  };
  
  const updateBillsWithNewDimensions = (calculationId: string, newDims: GlobalDimensions) => {
      const updatedBills = bills.map(bill => {
          if (bill.calculationId !== calculationId) return bill;
          const updatedItems = bill.items.map(item => {
              if (!item.isGlobal || !item.calculationParts) return item;
              const newParts = item.calculationParts.map(part => {
                  return { ...part, length: part.hasLength ? newDims.length : part.length, width: part.hasWidth ? newDims.width : part.width, depth: part.hasDepth ? newDims.depth : part.depth };
              });
              const newQty = recalculateQtyFromParts(newParts);
              return { ...item, calculationParts: newParts, qty: parseFloat(newQty.toFixed(2)), amount: parseFloat((newQty * item.rate).toFixed(2)) };
          });
          return { ...bill, items: updatedItems };
      });
      setBills(updatedBills);
  };

  const handleSaveGlobalDims = () => {
      if (readOnly) return;
      const bill = bills.find(b => b.id === activeBillId);
      if (!bill || !bill.calculationId) return;
      if (onLocationDimensionsChange) { onLocationDimensionsChange(bill.calculationId, localDims); }
      updateBillsWithNewDimensions(bill.calculationId, localDims);
      setIsDimsDirty(false);
  };

  const updateBillLocation = (billId: string, locationId: string) => {
      if (readOnly) return;
      setBills(prev => prev.map(b => b.id === billId ? { ...b, locationId } : b));
  };

  const handleLinkCalculation = (targetCalcId: string) => {
      if (readOnly) return;
      setBills(prev => prev.map(b => {
          if (b.id !== activeBillId) return b;
          const newBill = { ...b, calculationId: targetCalcId };
          // Immediately sync dimensions if target already has them
          const targetDims = projectData.globalCalculations?.[targetCalcId] || { length: 0, width: 0, depth: 0 };
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
      }));
      setIsLinkModalOpen(false);
      if (onShowToast) onShowToast("Pengiraan telah dihubungkan.", "success");
  };

  const handleUnlinkCalculation = () => {
      if (readOnly) return;
      const newCalcId = `calc-${Math.random().toString(36).substr(2, 9)}`;
      setBills(prev => prev.map(b => b.id === activeBillId ? { ...b, calculationId: newCalcId } : b));
      if (onShowToast) onShowToast("Pengiraan telah diasingkan.", "info");
  };

  const handleFinishTemplate = (tplOverride?: BQTemplateDefinition) => {
      if (readOnly) return;
      const tpl = tplOverride || selectedTemplate;
      if (!tpl) return;
      const isMultistep = (tpl.key === 'LONGKANG' || tpl.key === 'EMPTY' || tpl.key === 'CUSTOM');
      if (isMultistep && !templateLocation) { setTemplateError(true); if (onShowToast) onShowToast("Sila pilih lokasi terlebih dahulu.", "error"); return; }
      
      const newGroups: BQGroup[] = [];
      if (tpl.bills && tpl.bills.length > 0) {
          tpl.bills.forEach((billDef, bIdx) => {
              const billCalcId = `calc-${Math.random().toString(36).substr(2, 9)}`;
              if (isMultistep && templateLocation) {
                  if (onLocationDimensionsChange) onLocationDimensionsChange(billCalcId, templateDims);
              }

              const bill: BQGroup = { 
                  id: `bil-${Date.now()}-${bIdx}`, 
                  calculationId: billCalcId,
                  title: `BIL NO. 999 - ${billDef.title.toUpperCase()}`, 
                  locationId: tpl.key === 'PERMULAAN_BASIC' || tpl.key === 'PERMULAAN_EMPTY' ? undefined : templateLocation, 
                  items: [] 
              };
              if (tpl.key === 'PERMULAAN_BASIC' || tpl.key === 'PERMULAAN_EMPTY') { bill.items.push(createHeader('ALL QUANTITY ARE PROVISIONAL')); }
              
              // NEW LOGIC: Iterate linearly to respect template order and avoid duplicate headers
              let lastGroupId = '';
              let lastItemId = '';
              
              billDef.items.forEach(ref => {
                  const group = bqLibrary.find(g => g.id === ref.groupId);
                  if (group) {
                      // Add Group Header if changed
                      if (ref.groupId !== lastGroupId) {
                          bill.items.push(createHeader(group.title.toUpperCase()));
                          lastGroupId = ref.groupId;
                          lastItemId = ''; // Reset item tracker on group change
                      }
                      
                      const libItem = group.items.find(i => i.id === ref.itemId);
                      if (libItem) {
                          // Handle Item Header for Variants
                          if (ref.variantId || (libItem.variants && libItem.variants.length > 0)) {
                               const parentDesc = libItem.description.charAt(0).toUpperCase() + libItem.description.slice(1).toLowerCase();
                               // Only add header if we are switching to a new item parent
                               if (ref.itemId !== lastItemId) {
                                   bill.items.push(createHeader(parentDesc));
                                   lastItemId = ref.itemId;
                               }
                          } else {
                              // Reset item id if it's a standard item (no variants) to allow subsequent variants to trigger header
                              lastItemId = ref.itemId; 
                          }
                          
                          const bqIt = createItem(bqLibrary, ref.groupId, ref.itemId, ref.variantId);
                          // Restore source tracking
                          bqIt.sourceGroupId = ref.groupId;
                          bqIt.sourceItemId = ref.itemId;
                          bqIt.sourceVariantId = ref.variantId;

                          const currentTplDims = (tpl.key === 'PERMULAAN_BASIC' || tpl.key === 'PERMULAAN_EMPTY') ? null : templateDims;
                          if (bqIt.isGlobal && currentTplDims) {
                              bqIt.calculationParts = bqIt.calculationParts?.map(p => ({ ...p, length: p.hasLength ? currentTplDims.length : p.length, width: p.hasWidth ? currentTplDims.width : p.width, depth: p.hasDepth ? currentTplDims.depth : p.depth }));
                              const qty = recalculateQtyFromParts(bqIt.calculationParts || []);
                              bqIt.qty = parseFloat(qty.toFixed(2));
                              bqIt.amount = parseFloat((qty * bqIt.rate).toFixed(2));
                          }
                          bill.items.push(bqIt);
                      }
                  }
              });
              newGroups.push(bill);
          });
      } else if (tpl.key === 'EMPTY') { 
          const billCalcId = `calc-${Math.random().toString(36).substr(2, 9)}`;
          if (templateLocation && onLocationDimensionsChange) onLocationDimensionsChange(billCalcId, templateDims);
          newGroups.push({ id: `bil-${Date.now()}`, calculationId: billCalcId, title: `BIL NO. 999 - BUTIRAN KERJA-KERJA`, locationId: templateLocation, items: [] }); 
      }
      const newBills = [...bills, ...newGroups];
      const renumberedBills = resequenceTitles(newBills);
      setBills(renumberedBills);
      if (renumberedBills.length > 0 && newGroups.length > 0) setActiveBillId(newGroups[0].id);
      setIsTemplateModalOpen(false);
  };

  const requestDeleteBill = (bill: BQGroup) => {
      if (readOnly) return;
      setDeleteConfirm({ isOpen: true, type: 'BILL', billId: bill.id, title: bill.title });
  };

  const requestDeleteItem = (billId: string, item: BQItem, index: number) => {
      if (readOnly) return;
      const bill = bills.find(b => b.id === billId);
      if (!bill) return;
      let childCount = 0;
      const currentLevel = getItemLevel(item);
      if (item.type === 'HEADER') {
          for (let i = index + 1; i < bill.items.length; i++) {
              if (getItemLevel(bill.items[i]) > currentLevel) childCount++; else break;
          }
      }
      setDeleteConfirm({ isOpen: true, type: item.type === 'HEADER' ? 'HEADER' : 'ITEM', billId: billId, itemId: item.id, title: item.description, count: childCount });
  };

  const performDelete = () => {
      if (!deleteConfirm || readOnly) return;
      if (deleteConfirm.type === 'BILL') {
          const filteredBills = bills.filter(b => b.id !== deleteConfirm.billId);
          const renumberedBills = resequenceTitles(filteredBills);
          setBills(renumberedBills);
          if (activeBillId === deleteConfirm.billId) setActiveBillId(renumberedBills.length > 0 ? renumberedBills[0].id : null);
      } else if (deleteConfirm.type === 'ITEM' || deleteConfirm.type === 'HEADER') {
          setBills(prevBills => prevBills.map(bill => {
              if (bill.id !== deleteConfirm.billId) return bill;
              if (deleteConfirm.type === 'HEADER') {
                  const itemIndex = bill.items.findIndex(i => i.id === deleteConfirm.itemId);
                  if (itemIndex === -1) return bill;
                  const currentLevel = getItemLevel(bill.items[itemIndex]);
                  let nextHeaderIndex = itemIndex + 1;
                  while (nextHeaderIndex < bill.items.length && getItemLevel(bill.items[nextHeaderIndex]) > currentLevel) nextHeaderIndex++;
                  const newItems = [...bill.items];
                  newItems.splice(itemIndex, nextHeaderIndex - itemIndex);
                  return { ...bill, items: newItems };
              } else { return { ...bill, items: bill.items.filter(i => i.id !== deleteConfirm.itemId) }; }
          }));
      }
      setDeleteConfirm(null);
  };

  const updateBillTitle = (billId: string, newTitle: string) => {
      if (readOnly) return;
      setBills(bills.map(b => b.id === billId ? { ...b, title: newTitle.toUpperCase() } : b));
  };

  const updateItem = (billId: string, itemId: string, updates: Partial<BQItem>) => {
      if (readOnly) return;
      setBills(bills.map(bill => {
          if (bill.id !== billId) return bill;
          return { ...bill, items: bill.items.map(item => {
                  if (item.id !== itemId) return item;
                  const newItem = { ...item, ...updates };
                  newItem.amount = parseFloat((newItem.qty * newItem.rate).toFixed(2));
                  return newItem;
              })
          };
      }));
  };

  const addCalculationPart = (billId: string, itemId: string) => {
      if (readOnly) return;
      setBills(bills.map(bill => {
          if (bill.id !== billId) return bill;
          return { ...bill, items: bill.items.map(item => {
                  if (item.id !== itemId) return item;
                  const newPart: CalculationPart = { id: Math.random().toString(36).substr(2, 9), label: '', length: 0, width: 0, depth: 0, multiplier: 1, hasLength: false, hasWidth: false, hasDepth: false };
                  if (item.isGlobal) { newPart.length = localDims.length; newPart.width = localDims.width; newPart.depth = localDims.depth; }
                  const existingParts = item.calculationParts || [];
                  if (existingParts.length > 0) { const last = existingParts[existingParts.length - 1]; newPart.hasLength = last.hasLength; newPart.hasWidth = last.hasWidth; newPart.hasDepth = last.hasDepth; }
                  const newParts = [...existingParts, newPart];
                  const newQty = recalculateQtyFromParts(newParts);
                  return { ...item, calculationParts: newParts, qty: parseFloat(newQty.toFixed(2)), amount: parseFloat((newQty * item.rate).toFixed(2)) };
              })
          };
      }));
  };

  const removeCalculationPart = (billId: string, itemId: string, partId: string) => {
      if (readOnly) return;
      setBills(bills.map(bill => {
          if (bill.id !== billId) return bill;
          return { ...bill, items: bill.items.map(item => {
                  if (item.id !== itemId) return item;
                  const newParts = (item.calculationParts || []).filter(p => p.id !== partId);
                  const newQty = recalculateQtyFromParts(newParts);
                   return { ...item, calculationParts: newParts, qty: parseFloat(newQty.toFixed(2)), amount: parseFloat((newQty * item.rate).toFixed(2)) };
              })
          };
      }));
  };

  const updateCalculationPart = (billId: string, itemId: string, partId: string, updates: Partial<CalculationPart>) => {
      if (readOnly) return;
      setBills(bills.map(bill => {
          if (bill.id !== billId) return bill;
          return { ...bill, items: bill.items.map(item => {
                  if (item.id !== itemId) return item;
                  if (item.isGlobal) {
                      if (updates.hasLength === true) updates.length = localDims.length;
                      if (updates.hasWidth === true) updates.width = localDims.width;
                      if (updates.hasDepth === true) updates.depth = localDims.depth;
                  }
                  let newItemUnit = item.unit; 
                  const newParts = (item.calculationParts || []).map(p => {
                      if (p.id !== partId) return p;
                      const updatedPart = { ...p, ...updates };
                      if ('hasLength' in updates || 'hasWidth' in updates || 'hasDepth' in updates) {
                          const metricUnits = ['m', 'm2', 'm²', 'm3', 'm³', '', 'meter'];
                          if (metricUnits.includes(item.unit.toLowerCase().trim())) {
                               const dimCount = [updatedPart.hasLength, updatedPart.hasWidth, updatedPart.hasDepth].filter(Boolean).length;
                               if (dimCount === 1) newItemUnit = 'm'; else if (dimCount === 2) newItemUnit = 'm²'; else if (dimCount === 3) newItemUnit = 'm³';
                          }
                      }
                      return updatedPart;
                  });
                  const newQty = recalculateQtyFromParts(newParts);
                   return { ...item, unit: newItemUnit, calculationParts: newParts, qty: parseFloat(newQty.toFixed(2)), amount: parseFloat((newQty * item.rate).toFixed(2)) };
              })
          };
      }));
  };

  const toggleCustomCalc = (billId: string, itemId: string) => {
     if (readOnly) return;
     setBills(bills.map(bill => {
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
     }));
  };

  const toggleGlobal = (billId: string, itemId: string) => {
    if (readOnly) return;
    setBills(bills.map(bill => {
        if (bill.id !== billId) return bill;
        return { ...bill, items: bill.items.map(item => {
                if (item.id !== itemId) return item;
                const newGlobal = !item.isGlobal;
                let newItems = { ...item, isGlobal: newGlobal };
                if (newGlobal && item.calculationParts) {
                     const newParts = item.calculationParts.map(part => ({ ...part, length: part.hasLength ? localDims.length : part.length, width: part.hasWidth ? localDims.width : part.width, depth: part.hasDepth ? localDims.depth : part.depth }));
                     newItems.calculationParts = newParts;
                     const qty = recalculateQtyFromParts(newParts);
                     newItems.qty = parseFloat(qty.toFixed(2));
                     newItems.amount = parseFloat((qty * newItems.rate).toFixed(2));
                }
                return newItems;
            })
        };
    }));
  };

  const moveBill = (billId: string, direction: 'up' | 'down') => {
      if (readOnly) return;
      const index = bills.findIndex(b => b.id === billId);
      if (index === -1) return;
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= bills.length) return;
      const newBills = [...bills];
      const temp = newBills[index];
      newBills[index] = newBills[newIndex];
      newBills[newIndex] = temp;
      setBills(resequenceTitles(newBills));
  };

  const moveLocation = (locId: string, direction: 'up' | 'down') => {
      if (readOnly) return;
      const permulaan = bills.filter(b => b.title.includes('PERMULAAN') || b.id.includes('permulaan'));
      const locationBills = bills.filter(b => b.locationId && !b.title.includes('PERMULAAN') && !b.id.includes('permulaan'));
      const otherBills = bills.filter(b => !b.locationId && !b.title.includes('PERMULAAN') && !b.id.includes('permulaan'));
      const uniqueLocIds = Array.from(new Set(locationBills.map(b => b.locationId!)));
      const currentIndex = uniqueLocIds.indexOf(locId);
      if (currentIndex === -1) return;
      const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      if (newIndex < 0 || newIndex >= uniqueLocIds.length) return;
      const temp = uniqueLocIds[currentIndex];
      uniqueLocIds[currentIndex] = uniqueLocIds[newIndex];
      uniqueLocIds[newIndex] = temp;
      let reorderedLocationBills: BQGroup[] = [];
      uniqueLocIds.forEach(id => { const billsForThisLoc = locationBills.filter(b => b.locationId === id); reorderedLocationBills = [...reorderedLocationBills, ...billsForThisLoc]; });
      const finalBills = [...permulaan, ...reorderedLocationBills, ...otherBills];
      setBills(resequenceTitles(finalBills));
  };

  const moveItem = (billId: string, itemId: string, direction: 'up' | 'down') => {
      if (readOnly) return;
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

  const renderCalculationPartRow = (bill: BQGroup, item: BQItem, part: CalculationPart, index: number) => {
      const isGlobal = item.isGlobal;
      const inputClassBase = "w-12 outline-none text-right font-bold text-sm transition-all";
      const inputClass = isGlobal || readOnly ? `${inputClassBase} bg-transparent text-slate-400 cursor-not-allowed` : `${inputClassBase} bg-emerald-50/50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-b border-emerald-300 dark:border-emerald-700/50 rounded-sm`;
      return (
        <div key={part.id} className="flex flex-wrap items-center gap-2 text-xs bg-white dark:bg-slate-700/50 p-1.5 rounded-lg border border-slate-200 dark:border-slate-600 mb-1 last:mb-0">
             <input type="text" value={part.label || ''} onChange={(e) => updateCalculationPart(bill.id, item.id, part.id, { label: e.target.value })} disabled={readOnly} className="w-16 bg-transparent border-b border-dashed border-slate-300 dark:border-slate-500 focus:border-emerald-500 outline-none text-slate-500 placeholder-slate-400 text-[10px]" placeholder="Label" />
            <div className={`flex items-center gap-1 rounded px-1.5 py-0.5 border transition-all ${part.hasLength ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' : 'bg-transparent border-transparent opacity-60'}`}><input type="checkbox" checked={part.hasLength} onChange={(e) => updateCalculationPart(bill.id, item.id, part.id, { hasLength: e.target.checked })} disabled={readOnly} className="w-3 h-3 rounded text-emerald-600" /><span className="text-[10px] font-bold text-slate-500">P</span>{part.hasLength && (<input type="number" value={part.length || ''} onChange={e => updateCalculationPart(bill.id, item.id, part.id, { length: parseFloat(e.target.value) })} className={inputClass} placeholder="0" disabled={isGlobal || readOnly} />)}</div>
            {part.hasLength && (part.hasWidth || part.hasDepth) && <span className="text-slate-300">×</span>}
            <div className={`flex items-center gap-1 rounded px-1.5 py-0.5 border transition-all ${part.hasWidth ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' : 'bg-transparent border-transparent opacity-60'}`}><input type="checkbox" checked={part.hasWidth} onChange={(e) => updateCalculationPart(bill.id, item.id, part.id, { hasWidth: e.target.checked })} disabled={readOnly} className="w-3 h-3 rounded text-emerald-600" /><span className="text-[10px] font-bold text-slate-500">L</span>{part.hasWidth && (<input type="number" value={part.width || ''} onChange={e => updateCalculationPart(bill.id, item.id, part.id, { width: parseFloat(e.target.value) })} className={inputClass} placeholder="0" disabled={isGlobal || readOnly} />)}</div>
            {part.hasWidth && part.hasDepth && <span className="text-slate-300">×</span>}
            <div className={`flex items-center gap-1 rounded px-1.5 py-0.5 border transition-all ${part.hasDepth ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' : 'bg-transparent border-transparent opacity-60'}`}><input type="checkbox" checked={part.hasDepth} onChange={(e) => updateCalculationPart(bill.id, item.id, part.id, { hasDepth: e.target.checked })} disabled={readOnly} className="w-3 h-3 rounded text-emerald-600" /><span className="text-[10px] font-bold text-slate-500">T</span>{part.hasDepth && (<input type="number" value={part.depth || ''} onChange={e => updateCalculationPart(bill.id, item.id, part.id, { depth: parseFloat(e.target.value) })} className={inputClass} placeholder="0" disabled={isGlobal || readOnly} />)}</div>
            <span className="text-slate-300">×</span>
            <div className={`flex items-center gap-1 rounded px-1.5 py-0.5 border border-transparent ${part.multiplier !== 1 ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200' : 'opacity-60'}`}><input type="number" value={part.multiplier || ''} onChange={e => updateCalculationPart(bill.id, item.id, part.id, { multiplier: parseFloat(e.target.value) })} disabled={readOnly} className="w-8 bg-transparent outline-none text-center font-bold text-slate-700 dark:text-slate-300 placeholder-slate-400" placeholder="1" /></div>
            {!readOnly && <button onClick={() => removeCalculationPart(bill.id, item.id, part.id)} className="ml-auto p-1 text-slate-300 hover:text-red-500"><MinusCircle className="w-4 h-4" /></button>}
        </div>
      );
  };

  const renderItemRow = (bill: BQGroup, item: BQItem, index: number, isHidden: boolean) => {
    if (isHidden) return null;
    const autoNumber = getAutoNumber(bill.items, index);
    const hierarchyLevel = getItemLevel(item); 
    if (item.type === 'HEADER') {
      const isLevel0 = hierarchyLevel === 0;
      return (
          <div key={item.id} className={`flex items-center gap-2 py-3 border-b border-slate-100 dark:border-white/5 ${isLevel0 ? 'bg-slate-100 dark:bg-white/10' : 'bg-slate-50/50 dark:bg-white/5'} px-4 -mx-4 group`}>
              <span className="text-xs font-black text-slate-400 min-w-[30px]">{autoNumber}</span>
              <button onClick={() => toggleCollapse(bill.id, item.id)} className="p-1 rounded hover:bg-slate-200 dark:hover:bg-white/10 text-slate-400 transition-colors">{item.isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}</button>
              <AutoResizeTextarea value={item.description} onChange={(e) => updateItem(bill.id, item.id, { description: e.target.value })} disabled={readOnly} className={`w-full bg-transparent outline-none text-slate-800 dark:text-slate-200 text-sm ${isLevel0 ? 'font-bold uppercase' : 'font-semibold pl-1'}`} placeholder="TAJUK..." minHeight={24} />
              {!readOnly && (<div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => moveItem(bill.id, item.id, 'up')} disabled={index === 0} className="text-slate-400 hover:text-emerald-500 p-1 rounded hover:bg-emerald-50 dark:hover:bg-emerald-900/20 disabled:opacity-30"><ChevronUp className="w-4 h-4" /></button><button onClick={() => moveItem(bill.id, item.id, 'down')} className="text-slate-400 hover:text-emerald-500 p-1 rounded hover:bg-emerald-50 dark:hover:bg-emerald-900/20 disabled:opacity-30"><ChevronDown className="w-4 h-4" /></button><button onClick={() => requestDeleteItem(bill.id, item, index)} className="text-slate-400 hover:text-red-500 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20"><Trash2 className="w-4 h-4" /></button></div>)}
          </div>
      );
    }
    const paddingLeftClass = 'pl-10'; 
    const isRecentlyAdded = lastAddedItemId === item.id;
    return (
        <div key={item.id} id={`bq-item-${item.id}`} className={`py-4 border-b border-slate-100 dark:border-white/5 last:border-0 group hover:bg-slate-50 dark:hover:bg-white/5 px-2 rounded-xl transition-all duration-700 ${isRecentlyAdded ? 'bg-emerald-50/80 dark:bg-emerald-900/20 ring-2 ring-emerald-500' : ''}`}>
            <div className="flex justify-between items-start gap-3 mb-2">
                <div className="text-xs font-black text-slate-400 mt-1.5 min-w-[30px]">{autoNumber}</div>
                <div className={`flex-1 ${paddingLeftClass}`}><AutoResizeTextarea value={item.description} onChange={(e) => updateItem(bill.id, item.id, { description: e.target.value })} disabled={readOnly} className="w-full bg-transparent outline-none text-sm font-medium text-slate-800 dark:text-white" minHeight={40} />{item.variant && <div className="text-xs text-slate-500 italic mt-1">{item.variant}</div>}</div>
                <div className="flex flex-col items-end gap-1"><div className="flex items-center gap-1 text-xs text-slate-400"><span>Kadar:</span><input type="number" value={item.rate} onChange={(e) => updateItem(bill.id, item.id, { rate: parseFloat(e.target.value) })} disabled={readOnly} className="w-20 text-right bg-transparent border-b border-slate-200 focus:border-emerald-500 outline-none text-slate-700 dark:text-slate-300 font-mono" /></div><span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-500">{item.unit}</span></div>
            </div>
            <div className={`flex flex-col sm:flex-row items-start gap-3 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg ml-12`}>
                <div className="flex flex-col gap-1 mt-0.5"><button onClick={() => toggleGlobal(bill.id, item.id)} disabled={readOnly} className={`p-1.5 rounded-md transition-colors border ${item.isGlobal ? 'bg-emerald-100 text-emerald-600 border-emerald-200' : 'bg-white dark:bg-slate-700 text-slate-400 border-slate-200 dark:border-slate-600 hover:border-slate-300'} ${readOnly ? 'cursor-not-allowed opacity-50' : ''}`}>{item.isGlobal ? <Link className="w-4 h-4" /> : <Unlink className="w-4 h-4" />}</button><button onClick={() => toggleCustomCalc(bill.id, item.id)} disabled={readOnly} className={`p-1.5 rounded-md transition-colors border ${item.isCustomCalc ? 'bg-indigo-100 text-indigo-600 border-indigo-200' : 'bg-white dark:bg-slate-700 text-slate-400 border-slate-200 dark:border-slate-600 hover:text-indigo-500'} ${readOnly ? 'cursor-not-allowed opacity-50' : ''}`}>{item.isCustomCalc ? <List className="w-4 h-4" /> : <Type className="w-4 h-4" />}</button></div>
                {item.isCustomCalc ? (<div className="flex-1 w-full flex items-center gap-2"><input type="text" value={item.customCalc || ''} onChange={(e) => updateItem(bill.id, item.id, { customCalc: e.target.value })} disabled={readOnly} className="flex-1 text-xs bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded px-2 py-1 font-mono text-slate-600 dark:text-slate-300" placeholder="e.g. 80 x 0.5 x 2" /><div className="flex items-center gap-1 bg-white dark:bg-slate-700 rounded px-2 py-1 border border-slate-200 dark:border-slate-600"><span className="text-[10px] font-bold text-slate-400">QTY</span><input type="number" value={item.qty} onChange={(e) => updateItem(bill.id, item.id, { qty: parseFloat(e.target.value) })} disabled={readOnly} className="w-16 text-right text-sm font-bold bg-transparent outline-none" /></div></div>) : (<div className="flex-1 w-full"><div className="space-y-1">{(item.calculationParts || []).map((part, pIdx) => renderCalculationPartRow(bill, item, part, pIdx))}</div>{!readOnly && (<div className="flex items-center justify-between mt-2"><button onClick={() => addCalculationPart(bill.id, item.id)} className="text-[10px] flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-bold px-2 py-1 rounded hover:bg-emerald-50"><PlusCircle className="w-3 h-3" /> Tambah Kiraan</button><div className="font-mono font-bold text-emerald-600 text-sm border-l border-slate-200 dark:border-slate-700 pr-2 px-2">= {item.qty}</div></div>)}</div>)}
                <div className="flex flex-col items-end gap-2 w-full sm:w-auto border-t sm:border-t-0 border-slate-200 dark:border-slate-700 pt-2 sm:pt-0 pl-2 border-l-0 sm:border-l"><div className="text-right w-24"><div className="text-[10px] text-slate-400 uppercase tracking-wider">Jumlah</div><div className="font-bold text-slate-900 dark:text-white">{formatCurrency(item.amount)}</div></div>{!readOnly && (<div className="mt-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => moveItem(bill.id, item.id, 'up')} disabled={index === 0} className="p-1 text-slate-300 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors disabled:opacity-30"><ChevronUp className="w-4 h-4" /></button><button onClick={() => moveItem(bill.id, item.id, 'down')} className="p-1 text-slate-300 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors disabled:opacity-30"><ChevronDown className="w-4 h-4" /></button><button onClick={() => requestDeleteItem(bill.id, item, index)} className="p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button></div>)}</div>
            </div>
        </div>
    );
  };

  const renderSidebarItem = (b: BQGroup, index: number, total: number, moveFn: (id: string, dir: 'up'|'down') => void, deleteFn: (b: BQGroup) => void) => {
    const isActive = activeBillId === b.id;
    const { prefix, content } = parseTitle(b.title);
    return (
        <div key={b.id} onClick={() => setActiveBillId(b.id)} className={`w-full text-left p-3 rounded-xl text-xs transition-all relative group cursor-pointer border ${isActive ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20 border-emerald-500 ring-1 ring-emerald-500' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700'}`}><div className="flex justify-between items-start gap-2"><div className="flex-1 min-w-0">{prefix && <div className={`text-[9px] font-black tracking-widest uppercase mb-1 ${isActive ? 'text-emerald-100' : 'text-slate-400 group-hover:text-emerald-600'}`}>{prefix}</div>}<div className={`font-bold leading-snug line-clamp-2 ${isActive ? 'text-white' : 'text-slate-700 dark:text-slate-200'}`}>{content || b.title}</div><div className={`mt-2 text-[9px] font-mono flex items-center gap-2 ${isActive ? 'text-emerald-100' : 'text-slate-400'}`}><span className="bg-white/20 px-1.5 py-0.5 rounded">{b.items.length} items</span></div></div>{!readOnly && (<div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2 bg-white/90 dark:bg-slate-900/90 rounded-lg p-0.5 shadow-sm backdrop-blur-sm"><button onClick={(e) => { e.stopPropagation(); moveFn(b.id, 'up'); }} disabled={index === 0} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded disabled:opacity-30 text-slate-500"><ChevronUp className="w-3 h-3" /></button><button onClick={(e) => { e.stopPropagation(); moveFn(b.id, 'down'); }} disabled={index === total - 1} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded disabled:opacity-30 text-slate-500"><ChevronDown className="w-3 h-3" /></button><button type="button" onClick={(e) => { e.stopPropagation(); deleteFn(b); }} className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors mt-1"><Trash2 className="w-3.5 h-3.5" /></button></div>)}</div></div>
    );
  };

  const activeBillIndex = bills.findIndex(b => b.id === activeBillId);
  const activeBill = bills[activeBillIndex];
  const billsByLocation: Record<string, BQGroup[]> = {};
  const permulaanBills: BQGroup[] = [];
  const otherBills: BQGroup[] = [];
  bills.forEach(b => {
      if (b.title.includes('PERMULAAN') || b.id.includes('permulaan')) { permulaanBills.push(b); } 
      else if (b.locationId) { if (!billsByLocation[b.locationId]) billsByLocation[b.locationId] = []; billsByLocation[b.locationId].push(b); } 
      else { otherBills.push(b); }
  });
  const sortedLocationIds = Array.from(new Set(bills.filter(b => b.locationId && !b.title.includes('PERMULAAN') && !b.id.includes('permulaan')).map(b => b.locationId!))) as string[];
  const categories = Array.from(new Set(bqLibrary.map(g => g.category)));
  const libraryGroups = selectedCategory ? bqLibrary.filter(g => g.category === selectedCategory) : [];

  if (isPrintView) return null;

  return (
    <div className={`flex flex-col md:flex-row gap-4 items-start`}>
        {/* Editor Sidebar */}
        <div className="w-full md:w-72 flex flex-col gap-2 shrink-0 sticky top-24 max-h-[calc(100vh-8rem)]">
                <div className="bg-white/80 dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">Navigasi BQ</span>
                    {!readOnly && <button onClick={handleAddTemplate} className="p-1 bg-emerald-100 text-emerald-600 rounded hover:bg-emerald-200 transition-colors" title="Tambah Template"><Plus className="w-4 h-4" /></button>}
                </div>
                <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-2 bg-white/40 dark:bg-slate-900/40 rounded-xl p-2">
                    {permulaanBills.length > 0 && (
                        <div className="space-y-1">
                             <div className="px-2 text-[10px] font-bold text-slate-400 uppercase">Permulaan</div>
                             {permulaanBills.map((b, idx) => renderSidebarItem(b, idx, permulaanBills.length, moveBill, requestDeleteBill))}
                        </div>
                    )}
                    {sortedLocationIds.map((locId, index) => {
                        const groupBills = billsByLocation[locId] || [];
                        const loc = locationRows.find(l => l.id === locId);
                        const locName = loc ? loc.lokasi : 'Unknown Location';
                        return (
                            <div key={locId} className="space-y-1">
                                <div className="px-2 text-[10px] font-bold text-slate-400 uppercase flex items-center justify-between group/header mt-4 mb-2">
                                    <div className="flex items-center gap-1 truncate max-w-[70%]" title={locName}><MapPin className="w-3 h-3 shrink-0" /> {locName}</div>
                                    {!readOnly && (<div className="flex items-center gap-0.5 opacity-0 group-hover/header:opacity-100 transition-opacity"><button onClick={(e) => { e.stopPropagation(); moveLocation(locId, 'up'); }} disabled={index === 0} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded disabled:opacity-30"><ChevronUp className="w-3 h-3" /></button><button onClick={(e) => { e.stopPropagation(); moveLocation(locId, 'down'); }} disabled={index === sortedLocationIds.length - 1} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded disabled:opacity-30"><ChevronDown className="w-3 h-3" /></button></div>)}
                                </div>
                                <div className="space-y-2">{groupBills.map((b, idx) => renderSidebarItem(b, idx, groupBills.length, moveBill, requestDeleteBill))}</div>
                            </div>
                        );
                    })}
                    {otherBills.length > 0 && (
                        <div className="space-y-1">
                            <div className="px-2 text-[10px] font-bold text-slate-400 uppercase mt-4">Lain-lain</div>
                            {otherBills.map((b, idx) => renderSidebarItem(b, idx, otherBills.length, moveBill, requestDeleteBill))}
                        </div>
                    )}
                </div>
        </div>

        {/* Editor Main Content */}
        <div className="flex-1 bg-white dark:bg-slate-900 rounded-xl shadow-inner flex flex-col w-full min-w-0">
            {activeBill ? (
                <>
                    <div className="p-4 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-800/50 sticky top-20 z-20 backdrop-blur-sm">
                        <div className="flex items-center justify-between mb-2">
                             <input value={activeBill.title} onChange={(e) => updateBillTitle(activeBill.id, e.target.value)} disabled={readOnly} className={`text-lg font-bold bg-transparent outline-none w-full text-slate-800 dark:text-white uppercase ${readOnly ? 'cursor-not-allowed' : ''}`} />
                            <div className="text-right text-xs text-slate-400 shrink-0 ml-4">Total: <span className="text-emerald-600 font-bold text-sm">{formatCurrency(activeBill.items.reduce((s,i) => s + (i.amount||0), 0))}</span></div>
                        </div>
                        {!activeBill.title.toUpperCase().includes('PERMULAAN') && (
                            <div className="mb-2">
                                <select value={activeBill.locationId || ''} onChange={(e) => updateBillLocation(activeBill.id, e.target.value)} disabled={readOnly} className={`w-full text-xs font-bold bg-transparent text-slate-500 dark:text-slate-400 outline-none flex items-center border border-transparent rounded px-1 py-0.5 transition-colors ${readOnly ? 'cursor-not-allowed' : 'hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer hover:border-slate-200 dark:hover:border-slate-700'}`} ><option value="">-- Tiada Lokasi --</option>{locationRows.filter(r => r.lokasi).map(r => (<option key={r.id} value={r.id}>{r.lokasi}</option>))}</select>
                            </div>
                        )}
                        {activeBill && (
                            <div className={`mt-2 p-3 rounded-xl border transition-all ${isDimsDirty ? 'bg-orange-50 border-orange-200 dark:bg-orange-900/10 dark:border-orange-800/50' : 'bg-blue-50/50 border-blue-100 dark:bg-blue-900/10 dark:border-blue-800/30'}`}>
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase"><Ruler className="w-4 h-4" />Global Calculation</div>
                                        {!readOnly && (
                                            <div className="flex items-center gap-1">
                                                <button onClick={() => setIsLinkModalOpen(true)} className="p-1 text-emerald-600 hover:bg-emerald-100 rounded transition-colors" title="Hubungkan dengan BIL NO. lain">
                                                    <Link className="w-3.5 h-3.5" />
                                                </button>
                                                {bills.filter(b => b.calculationId === activeBill.calculationId).length > 1 && (
                                                    <button onClick={handleUnlinkCalculation} className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors" title="Asingkan pengiraan ini">
                                                        <Unlink className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 w-full sm:w-auto">
                                        <div className="flex items-center bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 px-2 py-1 shadow-sm"><span className="text-[10px] font-bold text-slate-400 mr-1">P</span><DimensionInput value={localDims.length || 0} onChange={val => { setLocalDims({...localDims, length: val}); setIsDimsDirty(true); }} disabled={readOnly} className="w-12 bg-transparent outline-none font-bold text-sm text-center" placeholder="0" /></div>
                                        <div className="flex items-center bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 px-2 py-1 shadow-sm"><span className="text-[10px] font-bold text-slate-400 mr-1">L</span><DimensionInput value={localDims.width || 0} onChange={val => { setLocalDims({...localDims, width: val}); setIsDimsDirty(true); }} disabled={readOnly} className="w-12 bg-transparent outline-none font-bold text-sm text-center" placeholder="0" /></div>
                                        <div className="flex items-center bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 px-2 py-1 shadow-sm"><span className="text-[10px] font-bold text-slate-400 mr-1">T</span><DimensionInput value={localDims.depth || 0} onChange={val => { setLocalDims({...localDims, depth: val}); setIsDimsDirty(true); }} disabled={readOnly} className="w-12 bg-transparent outline-none font-bold text-sm text-center" placeholder="0" /></div>
                                        {isDimsDirty && !readOnly && (<button onClick={handleSaveGlobalDims} className="ml-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1 transition-all" title="Kemaskini Semua Item Terhubung" ><Save className="w-3 h-3" /> Kemaskini</button>)}
                                    </div>
                                </div>
                                {bills.filter(b => b.calculationId === activeBill.calculationId).length > 1 && (
                                    <div className="mt-2 flex items-center gap-1.5 text-[10px] text-emerald-600 font-bold bg-white/50 px-2 py-1 rounded-lg">
                                        <Info className="w-3 h-3" />
                                        Terhubung dengan: {bills.filter(b => b.calculationId === activeBill.calculationId && b.id !== activeBill.id).map(b => parseTitle(b.title).prefix).join(', ')}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="flex-1 p-4">
                         {activeBill.items.length === 0 ? (<div className="h-40 flex flex-col items-center justify-center text-slate-400"><FolderPlus className="w-10 h-10 mb-2 opacity-50" /><p className="text-sm">Tiada item dalam senarai ini.</p></div>) : (
                            <div className="space-y-2">
                                {(() => {
                                    let currentLevel0Collapsed = false; let currentLevel1Collapsed = false;
                                    return activeBill.items.map((item, idx) => {
                                        const level = getItemLevel(item); let isHidden = false;
                                        if (level === 0) { currentLevel1Collapsed = false; currentLevel0Collapsed = !!item.isCollapsed; } 
                                        else if (level === 1) { if (currentLevel0Collapsed) isHidden = true; else currentLevel1Collapsed = !!item.isCollapsed; } 
                                        else { if (currentLevel0Collapsed || currentLevel1Collapsed) isHidden = true; }
                                        return renderItemRow(activeBill, item, idx, isHidden);
                                    });
                                })()}
                            </div>
                         )}
                         {!readOnly && <button onClick={openAddItemModal} className="mt-4 w-full py-3 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-slate-400 font-bold text-sm hover:border-emerald-500 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-all flex items-center justify-center gap-2" ><Plus className="w-4 h-4" /> Tambah Item</button>}
                    </div>
                </>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8"><Layers className="w-16 h-16 mb-4 opacity-20" /><h3 className="text-lg font-bold text-slate-600 dark:text-slate-300">Tiada Senarai Dipilih</h3><p className="text-sm max-w-xs text-center mt-2">Pilih senarai dari navigasi sebelah kiri atau tambah template baru.</p>{!readOnly && <button onClick={handleAddTemplate} className="mt-6 px-6 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-lg">Tambah Template</button>}</div>
            )}
        </div>

        {/* --- MODALS --- */}
        {isAddItemModalOpen && createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setIsAddItemModalOpen(false)}>
              <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl max-w-4xl w-full h-[80vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800 transform scale-100 transition-all animate-slide-up" onClick={e => e.stopPropagation()}>
                  <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 shrink-0">
                      <div className="flex items-center gap-3"><div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><Plus className="w-5 h-5" /></div><div><h3 className="font-bold text-slate-900 dark:text-white">Pilih Item dari Pustaka</h3><p className="text-xs text-slate-500">Klik butang [+] untuk menambah item ke dalam {activeBill?.title}</p></div></div>
                      <button onClick={() => setIsAddItemModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 transition-colors"><X className="w-6 h-6" /></button>
                  </div>
                  <div className="flex-1 flex overflow-hidden">
                      <div className="w-64 bg-slate-50 dark:bg-slate-900/50 border-r border-slate-100 dark:border-slate-800 p-4 space-y-1 overflow-y-auto custom-scrollbar shrink-0">
                          {categories.map(cat => (<button key={cat} onClick={() => setSelectedCategory(cat)} className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${selectedCategory === cat ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'}`}>{cat}</button>))}
                      </div>
                      <div className="flex-1 p-6 overflow-y-auto custom-scrollbar bg-white dark:bg-slate-900">
                          <div className="space-y-6">
                              {libraryGroups.filter(g => g.category === selectedCategory).map(group => (
                                  <div key={group.id} className="space-y-3"><h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-white/5 pb-1">{group.title}</h4>
                                      <div className="grid grid-cols-1 gap-2">
                                          {group.items.map(item => (
                                              <div key={item.id} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-white/5 transition-all hover:border-emerald-300 dark:hover:border-emerald-700 group/item">
                                                  <div className="flex justify-between items-start gap-4">
                                                      <div className="flex-1 min-w-0"><p className="text-sm font-bold text-slate-800 dark:text-white leading-tight">{item.description}</p>
                                                          <div className="mt-2 flex gap-2 flex-wrap">
                                                              {(!item.variants || item.variants.length === 0) ? (<button onClick={() => handleLibraryAddItem(group.id, item.id)} className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-emerald-600 text-[10px] font-bold rounded-lg hover:bg-emerald-600 hover:text-white transition-all shadow-sm"><Plus className="w-3.5 h-3.5" /> Pilih Item</button>) : (
                                                                  item.variants.map(v => (<button key={v.id} onClick={() => handleLibraryAddItem(group.id, item.id, v.id)} className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-emerald-600 text-[10px] font-bold rounded-lg hover:bg-emerald-600 hover:text-white transition-all shadow-sm"><Plus className="w-3.5 h-3.5" /> {v.label}</button>))
                                                              )}
                                                          </div>
                                                      </div>
                                                      <div className="text-right shrink-0">
                                                          {(!item.variants || item.variants.length === 0) && (<><p className="text-[10px] font-bold text-slate-400 uppercase leading-none">Kadar</p><p className="font-mono font-bold text-emerald-600 text-sm mt-1">{formatCurrency(item.rate || 0)}</p></>)}
                                                          <span className="text-[10px] bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-500 font-bold uppercase mt-2 inline-block">{item.unit}</span>
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

        {isTemplateModalOpen && createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setIsTemplateModalOpen(false)}>
              <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl max-w-4xl w-full p-8 border border-slate-200 dark:border-slate-800 transform scale-100 transition-all animate-slide-up relative overflow-hidden" onClick={e => e.stopPropagation()}>
                  <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-emerald-500 to-teal-500"></div>
                  <div className="flex justify-between items-center mb-8">
                      <div><h3 className="text-2xl font-bold text-slate-900 dark:text-white">Template Wizard</h3><p className="text-sm text-slate-500">Pilih template permulaan atau bina secara manual.</p></div>
                      <div className="flex items-center gap-2"><span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step === 1 ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-600'}`}>1</span><div className="w-8 h-0.5 bg-slate-100"></div><span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step === 2 ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'}`}>2</span></div>
                  </div>
                  {step === 1 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                          {bqTemplates.map(tpl => {
                              const IconComp = ICON_MAP[tpl.icon as keyof typeof ICON_MAP] || FileText;
                              const isSelected = selectedTemplate?.id === tpl.id;
                              const colorClass = getColorStyles(tpl.color);

                              return (
                                  <div key={tpl.id} onClick={() => { setSelectedTemplate(tpl); if (tpl.key === 'PERMULAAN_BASIC' || tpl.key === 'PERMULAAN_EMPTY') { handleFinishTemplate(tpl); } else { setStep(2); } }} className={`p-6 rounded-[2rem] border-2 cursor-pointer transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-6 group ${isSelected ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10' : 'border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-black/10 hover:border-emerald-200 dark:hover:border-emerald-800'}`}>
                                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:rotate-12 ${colorClass}`}><IconComp className="w-8 h-8" /></div>
                                      <div className="flex-1 min-w-0"><h4 className="font-bold text-slate-800 dark:text-white text-lg">{tpl.title}</h4><p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{tpl.subtitle}</p></div>
                                      <ChevronRight className={`w-5 h-5 transition-transform ${isSelected ? 'text-emerald-500 translate-x-1' : 'text-slate-300'}`} />
                                  </div>
                              );
                          })}
                      </div>
                  ) : (
                      <div className="space-y-8 animate-fade-in">
                          <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-100 dark:border-white/5 shadow-inner">
                              <div className="flex items-center gap-3 mb-6"><div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md"><MapPin className="w-5 h-5" /></div><div><h4 className="font-bold text-slate-900 dark:text-white">Konfigurasi Lokasi & Dimensi</h4><p className="text-xs text-slate-500">Pilih lokasi projek untuk template ini.</p></div></div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                  <div><label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 pl-1">Pilih Lokasi</label><select value={templateLocation} onChange={(e) => setTemplateLocation(e.target.value)} className={`w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border-2 outline-none transition-all font-bold text-sm ${templateError && !templateLocation ? 'border-red-400 animate-shake' : 'border-slate-100 dark:border-slate-700 focus:border-emerald-500'}`}><option value="">-- Pilih Lokasi --</option>{locationRows.map(row => <option key={row.id} value={row.id}>{row.lokasi || '(Tiada Nama Lokasi)'}</option>)}</select>{templateError && !templateLocation && <p className="text-[10px] text-red-500 font-bold mt-1 ml-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Lokasi diperlukan.</p>}</div>
                                  <div className="grid grid-cols-3 gap-3">
                                      {['P', 'L', 'T'].map((label, idx) => (
                                          <div key={label} className="space-y-2"><label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">{label}</label><div className="relative group"><DimensionInput value={idx === 0 ? templateDims.length : idx === 1 ? templateDims.width : templateDims.depth} onChange={val => setTemplateDims(prev => ({ ...prev, [idx === 0 ? 'length' : idx === 1 ? 'width' : 'depth']: val }))} className="w-full text-center px-2 py-3 rounded-xl bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 focus:border-emerald-500 outline-none font-bold text-lg shadow-sm transition-all" /><div className="absolute inset-0 rounded-xl ring-2 ring-emerald-500 opacity-0 group-focus-within:opacity-20 transition-opacity pointer-events-none"></div></div></div>
                                      ))}
                                  </div>
                              </div>
                              {isDimsModified && (<div className="mt-6 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-2xl border border-orange-200 dark:border-orange-800/50 flex items-center gap-3 animate-pulse"><Info className="w-5 h-5 text-orange-500 shrink-0" /><p className="text-xs text-orange-700 dark:text-orange-300 font-medium">Dimensi telah berubah. Semua item berkaitan untuk lokasi ini akan dikemaskini secara automatik.</p></div>)}
                          </div>
                          <div className="flex gap-4 pt-4"><button onClick={() => setStep(1)} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold rounded-2xl hover:bg-slate-200 transition-all flex items-center justify-center gap-2 shadow-sm"><RotateCcw className="w-5 h-5" /> Kembali</button><button onClick={() => handleFinishTemplate()} className="flex-[2] py-4 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 hover:shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 active:scale-95"><Play className="w-5 h-5" /> Jana Template</button></div>
                      </div>
                  )}
              </div>
          </div>,
          document.body
        )}

        {isLinkModalOpen && createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setIsLinkModalOpen(false)}>
              <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl max-w-md w-full p-8 border border-slate-200 dark:border-slate-800 transform scale-100 transition-all animate-slide-up relative overflow-hidden" onClick={e => e.stopPropagation()}>
                  <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
                  <div className="mb-6">
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <Link className="w-5 h-5 text-emerald-600" />
                          Hubungkan Pengiraan
                      </h3>
                      <p className="text-sm text-slate-500 mt-1">Pilih BIL NO. untuk berkongsi Global Calculation yang sama.</p>
                  </div>
                  
                  <div className="space-y-2 max-h-[40vh] overflow-y-auto custom-scrollbar pr-2 mb-6">
                      {bills
                        .filter(b => b.id !== activeBillId && b.calculationId !== activeBill?.calculationId)
                        .map(b => (
                          <button 
                            key={b.id} 
                            onClick={() => handleLinkCalculation(b.calculationId!)}
                            className="w-full text-left p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-black/20 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-all group"
                          >
                              <div className="flex items-center justify-between">
                                  <div>
                                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-emerald-600 transition-colors">{parseTitle(b.title).prefix}</div>
                                      <div className="text-sm font-bold text-slate-700 dark:text-slate-200">{parseTitle(b.title).content || b.title}</div>
                                  </div>
                                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 transition-all" />
                              </div>
                          </button>
                      ))}
                      {bills.filter(b => b.id !== activeBillId && b.calculationId !== activeBill?.calculationId).length === 0 && (
                          <div className="text-center py-8 text-slate-400">
                              <Info className="w-8 h-8 mx-auto mb-2 opacity-20" />
                              <p className="text-xs">Tiada BIL NO. lain yang tersedia untuk dihubungkan.</p>
                          </div>
                      )}
                  </div>
                  
                  <button onClick={() => setIsLinkModalOpen(false)} className="w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold rounded-xl hover:bg-slate-200 transition-all">
                      Batal
                  </button>
              </div>
          </div>,
          document.body
        )}

        {deleteConfirm?.isOpen && createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setDeleteConfirm(null)}>
              <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-700 transform scale-100 transition-all animate-slide-up relative" onClick={e => e.stopPropagation()}>
                  <div className="flex flex-col items-center text-center pt-2">
                     <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-6 text-red-500 animate-pulse-slow"><div className="w-14 h-14 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center"><AlertTriangle className="w-8 h-8 stroke-[1.5]" /></div></div>
                     <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Padam {deleteConfirm.type === 'BILL' ? 'Senarai' : 'Item'}?</h3>
                     <p className="text-slate-500 dark:text-slate-400 mb-8 text-sm leading-relaxed px-4">Adakah anda pasti mahu memadam <span className="font-bold text-slate-900 dark:text-white block mt-1 p-2 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 break-words">{deleteConfirm.title}</span>{deleteConfirm.type === 'HEADER' && deleteConfirm.count && deleteConfirm.count > 0 && (<span className="mt-2 block text-xs text-red-500 font-bold">Nota: Ini akan memadam {deleteConfirm.count} item di bawahnya.</span>)}</p>
                     <div className="flex gap-3 w-full"><button onClick={() => setDeleteConfirm(null)} className="flex-1 py-3.5 px-4 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-slate-600 transition-all border border-slate-200 dark:border-slate-600 shadow-sm">Batal</button><button onClick={performDelete} className="flex-1 py-3.5 px-4 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 shadow-lg bg-red-600 hover:bg-red-700 shadow-red-600/30">Ya, Padam</button></div>
                  </div>
              </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default BQEditor;
