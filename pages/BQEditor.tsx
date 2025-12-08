
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { BQGroup, BQItem, Project, ProjectLocation, formatCurrency, GlobalDimensions, CalculationPart } from '../types';
import { BQ_LIBRARY, PresetGroup, PresetItem, PresetVariant, generateLongkangTemplate, generatePermulaanTemplate, generatePermulaanEmptyTemplate, generateEmptyBillWithLocation, createItem, createHeader } from '../data/bqPresets';
import { Plus, Trash2, MapPin, X, Copy, List, Calculator, Edit3, ArrowRight, ChevronRight, Check, LayoutTemplate, FilePlus, Info, Play, Link, Unlink, FileText, FolderPlus, Layers, RotateCcw, PlusCircle, MinusCircle, AlertTriangle, Settings2, RefreshCw, Save, Ruler, Box, Package, ChevronDown, ChevronUp, GripVertical, Type, FolderOpen, Folder } from 'lucide-react';

interface BQEditorProps {
  initialData?: BQGroup[];
  onDataChange: (data: BQGroup[]) => void;
  projectData: Project;
  isPrintView?: boolean;
  onPreviewCostChange?: (cost: number) => void;
  locationRows: ProjectLocation[];
  onLocationDimensionsChange?: (locationId: string, dims: GlobalDimensions) => void;
  onShowToast?: (message: string, type: 'success' | 'error' | 'info') => void;
}

// Helper to format float nicely (remove trailing zeros if int)
const fmt = (n: number | undefined) => {
    if (n === undefined || n === null) return '-';
    return Number.isInteger(n) ? n.toString() : n.toFixed(2);
};

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

// --- CUSTOM COMPONENTS ---

const AutoResizeTextarea = ({ 
    value, 
    onChange, 
    className, 
    placeholder,
    autoFocus,
    minHeight = 24
}: {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    className?: string;
    placeholder?: string;
    autoFocus?: boolean;
    minHeight?: number;
}) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const adjustHeight = () => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.max(textareaRef.current.scrollHeight, minHeight)}px`;
        }
    };

    useEffect(() => {
        adjustHeight();
    }, [value]);

    return (
        <textarea
            ref={textareaRef}
            value={value}
            onChange={onChange}
            className={`${className} resize-none overflow-hidden block`}
            placeholder={placeholder}
            rows={1}
            autoFocus={autoFocus}
            style={{ minHeight: `${minHeight}px` }}
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
        // If they match numerically, ignore to preserve formats like "0."
        if (parsedLocal === value) return;
        
        // If local is empty/NaN and parent is 0, ignore (allow empty field to stay empty)
        if (isNaN(parsedLocal) && value === 0) return;

        // Sync from parent (e.g. data loaded or preset changed)
        setLocalValue(value?.toString() || '');
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVal = e.target.value;
        setLocalValue(newVal);
        
        const parsed = parseFloat(newVal);
        if (!isNaN(parsed)) {
            onChange(parsed);
        } else {
            onChange(0); // Treat empty/invalid as 0
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

const BQEditor: React.FC<BQEditorProps> = ({ 
    initialData, 
    onDataChange, 
    isPrintView, 
    locationRows,
    projectData,
    onLocationDimensionsChange,
    onShowToast
}) => {
  const [activeBillId, setActiveBillId] = useState<string | null>(null);

  const [bills, setBills] = useState<BQGroup[]>(() => {
    if (initialData && initialData.length > 0) return initialData;
    return []; 
  });

  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  
  // ADD ITEM MODAL STATE
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [lastAddedItemId, setLastAddedItemId] = useState<string | null>(null);

  // Template Wizard State
  type TemplateType = 'PERMULAAN_BASIC' | 'PERMULAAN_EMPTY' | 'LONGKANG' | 'EMPTY' | null;
  const [templateType, setTemplateType] = useState<TemplateType>(null);
  const [templateLocation, setTemplateLocation] = useState<string>('');
  const [templateDims, setTemplateDims] = useState<GlobalDimensions>({ length: 0, width: 0, depth: 0 });
  const [step, setStep] = useState(1);
  const [templateError, setTemplateError] = useState(false);

  // INLINE GLOBAL DIMENSION STATE
  const [localDims, setLocalDims] = useState<GlobalDimensions>({ length: 0, width: 0, depth: 0 });
  const [isDimsDirty, setIsDimsDirty] = useState(false);

  // Determine if dims exist for selected location (Wizard)
  const existingDims = templateLocation ? projectData.locationDimensions?.[templateLocation] : null;
  const isDimsModified = existingDims && (existingDims.length !== templateDims.length || existingDims.width !== templateDims.width || existingDims.depth !== templateDims.depth);

  // DELETE MODAL STATE
  const [deleteConfirm, setDeleteConfirm] = useState<{
      isOpen: boolean;
      type: 'BILL' | 'ITEM' | 'HEADER';
      billId: string;
      itemId?: string;
      title: string;
      count?: number; // Count of items to be deleted (children)
  } | null>(null);

  // Initial Sync
  useEffect(() => {
    if (initialData && initialData !== bills) {
       // Only update if length differs significantly to avoid loops, 
       // but strictly we should rely on local state unless prop forces reset
    }
  }, [initialData]);

  // Propagate Changes
  useEffect(() => {
    onDataChange(bills);
  }, [bills]);

  // Set initial active bill
  useEffect(() => {
      if (bills.length > 0 && !activeBillId) {
          setActiveBillId(bills[0].id);
      }
  }, [bills]);

  // SYNC LOCAL DIMS WHEN ACTIVE BILL CHANGES
  useEffect(() => {
      if (!activeBillId) return;
      const bill = bills.find(b => b.id === activeBillId);
      if (bill && bill.locationId && projectData.locationDimensions?.[bill.locationId]) {
          setLocalDims(projectData.locationDimensions[bill.locationId]);
      } else {
          setLocalDims({ length: 0, width: 0, depth: 0 });
      }
      setIsDimsDirty(false);
  }, [activeBillId, bills, projectData.locationDimensions]);

  // When location changes in modal, load existing dims if any
  useEffect(() => {
    if (templateLocation && projectData.locationDimensions?.[templateLocation]) {
        setTemplateDims(projectData.locationDimensions[templateLocation]);
    } else if (templateLocation && !projectData.locationDimensions?.[templateLocation]) {
        // Reset if no existing dims for this location
        setTemplateDims({ length: 0, width: 0, depth: 0 });
    }
  }, [templateLocation, projectData.locationDimensions]);

  // Effect to scroll to last added item when modal closes
  useEffect(() => {
    if (!isAddItemModalOpen && lastAddedItemId) {
      const element = document.getElementById(`bq-item-${lastAddedItemId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Clear highlight after animation
        const timer = setTimeout(() => {
          setLastAddedItemId(null);
        }, 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [isAddItemModalOpen, lastAddedItemId]);

  // --- HELPERS ---

  // Helper to parse title for sidebar display
  const parseTitle = (title: string) => {
      const match = title.match(/^(BIL NO\.\s*\d+)\s*[-–]\s*(.*)$/i);
      if (match) {
          return { prefix: match[1].toUpperCase(), content: match[2].trim() };
      }
      // Try to catch just "BIL NO. X" if description is missing
      const matchOnlyPrefix = title.match(/^(BIL NO\.\s*\d+)$/i);
      if (matchOnlyPrefix) {
          return { prefix: matchOnlyPrefix[1].toUpperCase(), content: '' };
      }
      return { prefix: '', content: title };
  };

  // Resequence "BIL NO. X" titles
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

  // --- HIERARCHY HELPERS ---
  const isUppercase = (text: string) => text === text.toUpperCase() && /[A-Z]/.test(text);

  const getItemLevel = (item: BQItem): 0 | 1 | 2 => {
      if (item.type === 'HEADER') {
          return isUppercase(item.description) ? 0 : 1;
      }
      return 2; // Item
  };

  const getAutoNumber = (items: BQItem[], currentIndex: number) => {
      let sectionIndex = 0;
      let itemIndex = 0;
      let variantIndex = 0;
      let lastHeaderType: 'NONE' | 'SECTION' | 'ITEM_PARENT' = 'NONE';

      for (let i = 0; i <= currentIndex; i++) {
          const item = items[i];
          const level = getItemLevel(item);

          if (level === 0) { // Section Header
              sectionIndex++;
              itemIndex = 0;
              variantIndex = 0;
              lastHeaderType = 'SECTION';
          } else if (level === 1) { // Sub Header
              itemIndex++;
              variantIndex = 0;
              lastHeaderType = 'ITEM_PARENT';
          } else { // Item
              if (lastHeaderType === 'ITEM_PARENT') {
                  variantIndex++;
              } else {
                  itemIndex++; // Standard item directly under section
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

  // --- ACTIONS ---

  const handleAddTemplate = () => {
    setStep(1);
    setTemplateType(null);
    setTemplateLocation('');
    setTemplateDims({ length: 0, width: 0, depth: 0 });
    setTemplateError(false);
    setIsTemplateModalOpen(true);
  };

  const openAddItemModal = () => {
      const categories = Array.from(new Set(BQ_LIBRARY.map(g => g.category)));
      if (categories.length > 0) setSelectedCategory(categories[0]);
      setIsAddItemModalOpen(true);
  };

  const toggleCollapse = (billId: string, itemId: string) => {
      setBills(prev => prev.map(b => {
          if (b.id !== billId) return b;
          return {
              ...b,
              items: b.items.map(item => item.id === itemId ? { ...item, isCollapsed: !item.isCollapsed } : item)
          };
      }));
  };

  const handleLibraryAddItem = (groupId: string, itemId?: string, variantId?: string) => {
      if (!activeBillId) return;

      const group = BQ_LIBRARY.find(g => g.id === groupId);
      if (!group) return;
      if (!itemId) return;

      setBills(prev => prev.map(b => {
          if (b.id !== activeBillId) return b;
          
          let newItems = [...b.items];
          const libraryItem = group.items.find(i => i.id === itemId)!;
          const groupHeaderDesc = group.title; // Level 0 Title

          // 1. Find if Level 0 Header exists
          let level0Index = -1;
          // Search backwards to find the *last* instance of this group if multiple exist
          for (let i = newItems.length - 1; i >= 0; i--) {
              if (getItemLevel(newItems[i]) === 0 && newItems[i].description === groupHeaderDesc) {
                  level0Index = i;
                  break;
              }
          }

          let insertionIndex = newItems.length; // Default: Append to end
          let needsGroupHeader = true;

          if (level0Index !== -1) {
              needsGroupHeader = false;
              // Found the group. Now find where to insert within this group.
              // The group ends at the next Level 0 header or end of list.
              let groupEndIndex = newItems.length;
              for (let i = level0Index + 1; i < newItems.length; i++) {
                  if (getItemLevel(newItems[i]) === 0) {
                      groupEndIndex = i;
                      break;
                  }
              }
              insertionIndex = groupEndIndex; // Default insert at end of group
          }

          // Prepare items to add
          const itemsToAdd: BQItem[] = [];

          if (needsGroupHeader) {
              itemsToAdd.push(createHeader(groupHeaderDesc));
          }

          // Level 1 Header Logic
          if (variantId) {
              const parentDesc = libraryItem.description;
              let needsParentHeader = true;
              
              // If we found the group, check if parent header exists inside it
              if (!needsGroupHeader) {
                  // Search range: level0Index to insertionIndex (end of group)
                  for (let i = level0Index + 1; i < insertionIndex; i++) {
                      if (getItemLevel(newItems[i]) === 1 && newItems[i].description === parentDesc) {
                          needsParentHeader = false;
                          // If found, we should insert AFTER this header and its children
                          // Find end of this parent block
                          let parentBlockEnd = insertionIndex;
                          for (let j = i + 1; j < insertionIndex; j++) {
                              if (getItemLevel(newItems[j]) <= 1) { // Next header (0 or 1) ends this block
                                  parentBlockEnd = j;
                                  break;
                              }
                          }
                          insertionIndex = parentBlockEnd;
                          break; // Found specific parent, stop searching
                      }
                  }
              }

              if (needsParentHeader) {
                  itemsToAdd.push(createHeader(parentDesc));
              }

              const newItem = createItem(groupId, itemId, variantId);
              itemsToAdd.push(newItem);

          } else {
              // Standard Item (No Variant)
              // If we are in existing group, insertionIndex is already set to end of that group
              const newItem = createItem(groupId, itemId);
              itemsToAdd.push(newItem);
          }

          // Apply global dims logic to itemsToAdd
          if (b.locationId && projectData.locationDimensions?.[b.locationId]) {
               const d = projectData.locationDimensions[b.locationId];
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

          if (itemsToAdd.length > 0) {
              const lastItem = itemsToAdd[itemsToAdd.length-1];
              setLastAddedItemId(lastItem.id);
          }

          // Insert items
          newItems.splice(insertionIndex, 0, ...itemsToAdd);

          return { ...b, items: newItems };
      }));

      if (onShowToast) onShowToast(`Item ditambah`, 'success');
  };

  const updateBillsWithNewDimensions = (locationId: string, newDims: GlobalDimensions) => {
      const updatedBills = bills.map(bill => {
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
      setBills(updatedBills);
  };

  const handleSaveGlobalDims = () => {
      const bill = bills.find(b => b.id === activeBillId);
      if (!bill || !bill.locationId) return;
      if (onLocationDimensionsChange) {
          onLocationDimensionsChange(bill.locationId, localDims);
      }
      updateBillsWithNewDimensions(bill.locationId, localDims);
      setIsDimsDirty(false);
  };

  const handleFinishTemplate = (typeOverride?: TemplateType) => {
      const typeToUse = typeOverride || templateType;
      if (!typeToUse) return;
      
      let newGroups: BQGroup[] = [];

      if (typeToUse === 'PERMULAAN_BASIC') {
          newGroups = generatePermulaanTemplate();
      } else if (typeToUse === 'PERMULAAN_EMPTY') {
          newGroups = generatePermulaanEmptyTemplate();
      } else if (typeToUse === 'LONGKANG' || typeToUse === 'EMPTY') {
          if (!templateLocation) {
              setTemplateError(true);
              if (onShowToast) {
                  onShowToast("Sila pilih lokasi terlebih dahulu.", "error");
              }
              return;
          }
          if (onLocationDimensionsChange) {
              onLocationDimensionsChange(templateLocation, templateDims);
          }
          if (isDimsModified) {
              updateBillsWithNewDimensions(templateLocation, templateDims);
          }
          if (typeToUse === 'LONGKANG') {
             const startNo = 999; 
             newGroups = generateLongkangTemplate(startNo, templateLocation, templateDims);
          } else if (typeToUse === 'EMPTY') {
             newGroups = generateEmptyBillWithLocation(999, templateLocation);
          }
      }

      const newBills = [...bills, ...newGroups];
      const renumberedBills = resequenceTitles(newBills);
      setBills(renumberedBills);

      if (renumberedBills.length > 0) {
           if (newGroups.length > 0) {
               setActiveBillId(newGroups[0].id);
           }
      }
      setIsTemplateModalOpen(false);
  };

  // --- SMART DELETE ---
  const requestDeleteBill = (bill: BQGroup) => {
      setDeleteConfirm({
          isOpen: true,
          type: 'BILL',
          billId: bill.id,
          title: bill.title
      });
  };

  const requestDeleteItem = (billId: string, item: BQItem, index: number) => {
      // Check if it has children
      const bill = bills.find(b => b.id === billId);
      if (!bill) return;

      let childCount = 0;
      const currentLevel = getItemLevel(item);
      
      // If it's a header, scan for children
      if (item.type === 'HEADER') {
          for (let i = index + 1; i < bill.items.length; i++) {
              if (getItemLevel(bill.items[i]) > currentLevel) {
                  childCount++;
              } else {
                  break;
              }
          }
      }

      setDeleteConfirm({
          isOpen: true,
          type: item.type === 'HEADER' ? 'HEADER' : 'ITEM',
          billId: billId,
          itemId: item.id,
          title: item.description,
          count: childCount
      });
  };

  const performDelete = () => {
      if (!deleteConfirm) return;
      if (deleteConfirm.type === 'BILL') {
          const filteredBills = bills.filter(b => b.id !== deleteConfirm.billId);
          const renumberedBills = resequenceTitles(filteredBills);
          setBills(renumberedBills);
          if (activeBillId === deleteConfirm.billId) {
              setActiveBillId(renumberedBills.length > 0 ? renumberedBills[0].id : null);
          }
      } else if (deleteConfirm.type === 'ITEM' || deleteConfirm.type === 'HEADER') {
          setBills(prevBills => prevBills.map(bill => {
              if (bill.id !== deleteConfirm.billId) return bill;
              
              if (deleteConfirm.type === 'HEADER') {
                  // Delete header AND its children
                  const itemIndex = bill.items.findIndex(i => i.id === deleteConfirm.itemId);
                  if (itemIndex === -1) return bill;
                  
                  const headerItem = bill.items[itemIndex];
                  const currentLevel = getItemLevel(headerItem);
                  
                  let nextHeaderIndex = itemIndex + 1;
                  while (nextHeaderIndex < bill.items.length && getItemLevel(bill.items[nextHeaderIndex]) > currentLevel) {
                      nextHeaderIndex++;
                  }
                  
                  const newItems = [...bill.items];
                  newItems.splice(itemIndex, nextHeaderIndex - itemIndex);
                  return { ...bill, items: newItems };
              } else {
                  // Single Item
                  return { ...bill, items: bill.items.filter(i => i.id !== deleteConfirm.itemId) };
              }
          }));
      }
      setDeleteConfirm(null);
  };

  const updateBillTitle = (billId: string, newTitle: string) => {
      setBills(bills.map(b => b.id === billId ? { ...b, title: newTitle.toUpperCase() } : b));
  };

  const updateItem = (billId: string, itemId: string, updates: Partial<BQItem>) => {
      setBills(bills.map(bill => {
          if (bill.id !== billId) return bill;
          return {
              ...bill,
              items: bill.items.map(item => {
                  if (item.id !== itemId) return item;
                  const newItem = { ...item, ...updates };
                  newItem.amount = parseFloat((newItem.qty * newItem.rate).toFixed(2));
                  return newItem;
              })
          };
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

  const addCalculationPart = (billId: string, itemId: string) => {
      setBills(bills.map(bill => {
          if (bill.id !== billId) return bill;
          return {
              ...bill,
              items: bill.items.map(item => {
                  if (item.id !== itemId) return item;
                  
                  const newPart: CalculationPart = {
                      id: Math.random().toString(36).substr(2, 9),
                      label: '',
                      length: 0,
                      width: 0,
                      depth: 0,
                      multiplier: 1,
                      hasLength: false,
                      hasWidth: false,
                      hasDepth: false
                  };

                  const existingParts = item.calculationParts || [];
                  if (existingParts.length > 0) {
                      const last = existingParts[existingParts.length - 1];
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
      }));
  };

  const removeCalculationPart = (billId: string, itemId: string, partId: string) => {
      setBills(bills.map(bill => {
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
      }));
  };

  const updateCalculationPart = (billId: string, itemId: string, partId: string, updates: Partial<CalculationPart>) => {
      setBills(bills.map(bill => {
          if (bill.id !== billId) return bill;
          return {
              ...bill,
              items: bill.items.map(item => {
                  if (item.id !== itemId) return item;

                  // Force sync with localDims if item is Global and we are enabling a dimension
                  if (item.isGlobal) {
                      if (updates.hasLength === true) updates.length = localDims.length;
                      if (updates.hasWidth === true) updates.width = localDims.width;
                      if (updates.hasDepth === true) updates.depth = localDims.depth;
                  }

                  let newItemUnit = item.unit; 

                  const newParts = (item.calculationParts || []).map(p => {
                      if (p.id !== partId) return p;
                      const updatedPart = { ...p, ...updates };

                       // --- AUTO UNIT UPDATE LOGIC ---
                      if ('hasLength' in updates || 'hasWidth' in updates || 'hasDepth' in updates) {
                          const metricUnits = ['m', 'm2', 'm²', 'm3', 'm³', '', 'meter'];
                          // Only apply auto-unit if existing unit is metric or empty
                          if (metricUnits.includes(item.unit.toLowerCase().trim())) {
                               const dimCount = [updatedPart.hasLength, updatedPart.hasWidth, updatedPart.hasDepth].filter(Boolean).length;
                               if (dimCount === 1) newItemUnit = 'm';
                               else if (dimCount === 2) newItemUnit = 'm²';
                               else if (dimCount === 3) newItemUnit = 'm³';
                          }
                      }

                      return updatedPart;
                  });

                  const newQty = recalculateQtyFromParts(newParts);
                   return {
                      ...item,
                      unit: newItemUnit,
                      calculationParts: newParts,
                      qty: parseFloat(newQty.toFixed(2)),
                      amount: parseFloat((newQty * item.rate).toFixed(2))
                  };
              })
          };
      }));
  };

  const toggleCustomCalc = (billId: string, itemId: string) => {
     setBills(bills.map(bill => {
        if (bill.id !== billId) return bill;
        return {
            ...bill,
            items: bill.items.map(item => {
                if (item.id !== itemId) return item;
                const newMode = !item.isCustomCalc;
                let calcStr = item.customCalc || '';
                if (newMode && !calcStr && item.calculationParts) {
                    calcStr = item.calculationParts.map(p => {
                        const parts = [];
                        if (p.hasLength) parts.push(`${p.length}m(P)`);
                        if (p.hasWidth) parts.push(`${p.width}m(L)`);
                        if (p.hasDepth) parts.push(`${p.depth}m(T)`);
                        if (p.multiplier !== 1) parts.push(`x ${p.multiplier}`);
                        return parts.join(' x ');
                    }).join(' + ');
                }
                return {
                    ...item,
                    isCustomCalc: newMode,
                    customCalc: calcStr
                };
            })
        };
     }));
  };

  const toggleGlobal = (billId: string, itemId: string) => {
    setBills(bills.map(bill => {
        if (bill.id !== billId) return bill;
        return {
            ...bill,
            items: bill.items.map(item => {
                if (item.id !== itemId) return item;
                
                const newGlobal = !item.isGlobal;
                let newItems = { ...item, isGlobal: newGlobal };

                // If turning ON global, sync immediately to reset any manual changes
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
    }));
  };

  // --- SMART MOVE LOGIC ---
  const moveLocation = (locId: string, direction: 'up' | 'down') => {
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
      uniqueLocIds.forEach(id => {
          const billsForThisLoc = locationBills.filter(b => b.locationId === id);
          reorderedLocationBills = [...reorderedLocationBills, ...billsForThisLoc];
      });

      const finalBills = [...permulaan, ...reorderedLocationBills, ...otherBills];
      setBills(resequenceTitles(finalBills));
  };

  const moveBill = (billId: string, direction: 'up' | 'down') => {
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

  const moveItem = (billId: string, itemId: string, direction: 'up' | 'down') => {
      setBills(prevBills => prevBills.map(bill => {
          if (bill.id !== billId) return bill;
          
          const items = [...bill.items];
          const index = items.findIndex(i => i.id === itemId);
          if (index === -1) return bill;

          const itemToMove = items[index];
          const currentLevel = getItemLevel(itemToMove);

          // IDENTIFY BLOCK RANGE (The item + its children)
          let blockEnd = index + 1;
          while (blockEnd < items.length && getItemLevel(items[blockEnd]) > currentLevel) {
              blockEnd++;
          }
          const block = items.slice(index, blockEnd);

          if (direction === 'up') {
              if (index === 0) return bill; // Can't move up if at top
              
              // Find start of previous sibling block
              let prevSiblingIndex = index - 1;
              while (prevSiblingIndex >= 0) {
                  const level = getItemLevel(items[prevSiblingIndex]);
                  if (level === currentLevel) break; // Found sibling start
                  if (level < currentLevel) return bill; // Hit parent, can't move past parent scope
                  prevSiblingIndex--;
              }
              
              if (prevSiblingIndex < 0) return bill;

              // Insert block before previous sibling
              // Remove block from current position first
              const remaining = items.filter((_, i) => i < index || i >= blockEnd);
              // Calculate new insertion point (which is prevSiblingIndex)
              // But wait, removing changes indices. `remaining` already lacks the block.
              // `prevSiblingIndex` is valid in the *original* array. 
              
              // Construct: [0...prevSiblingIndex-1] + [block] + [prevSibling...index-1] + [blockEnd...end]
              const beforePrev = items.slice(0, prevSiblingIndex);
              const prevBlock = items.slice(prevSiblingIndex, index);
              const afterBlock = items.slice(blockEnd);
              
              return { ...bill, items: [...beforePrev, ...block, ...prevBlock, ...afterBlock] };

          } else {
              // DOWN
              if (blockEnd >= items.length) return bill; // Can't move down if at bottom
              
              // Check if next item is within scope (same level or higher level means sibling, lower level means child?)
              // Actually, we look for the next item of same level.
              // If we hit a lower level (parent), we stop (can't move out of parent scope)
              
              const nextItem = items[blockEnd];
              if (getItemLevel(nextItem) < currentLevel) return bill; // Hit parent/grandparent boundary
              
              // Find the end of the next sibling block
              let nextSiblingEnd = blockEnd + 1;
              while (nextSiblingEnd < items.length && getItemLevel(items[nextSiblingEnd]) > currentLevel) {
                  nextSiblingEnd++;
              }
              
              // Swap blocks
              // [0...index] + [nextSiblingBlock] + [block] + [nextSiblingEnd...]
              const before = items.slice(0, index);
              const nextBlock = items.slice(blockEnd, nextSiblingEnd);
              const after = items.slice(nextSiblingEnd);
              
              return { ...bill, items: [...before, ...nextBlock, ...block, ...after] };
          }
      }));
  };

  // --- RENDER HELPERS ---

  const renderCalculationPartRow = (bill: BQGroup, item: BQItem, part: CalculationPart, index: number) => {
      // Determine input state based on Global Link
      const isGlobal = item.isGlobal;
      
      // Styling for inputs: Readonly vs Editable
      const inputClassBase = "w-12 outline-none text-right font-bold text-sm transition-all";
      const inputClass = isGlobal 
         ? `${inputClassBase} bg-transparent text-slate-400 cursor-not-allowed` 
         : `${inputClassBase} bg-emerald-50/50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-b border-emerald-300 dark:border-emerald-700/50 rounded-sm`;

      return (
        <div key={part.id} className="flex flex-wrap items-center gap-2 text-xs bg-white dark:bg-slate-700/50 p-1.5 rounded-lg border border-slate-200 dark:border-slate-600 mb-1 last:mb-0">
             
             {/* Label (Optional) */}
             <input 
                type="text"
                value={part.label || ''}
                onChange={(e) => updateCalculationPart(bill.id, item.id, part.id, { label: e.target.value })}
                className="w-16 bg-transparent border-b border-dashed border-slate-300 dark:border-slate-500 focus:border-emerald-500 outline-none text-slate-500 placeholder-slate-400 text-[10px]"
                placeholder="Label"
             />

            {/* Length (P) Toggle */}
            <div className={`flex items-center gap-1 rounded px-1.5 py-0.5 border transition-all ${part.hasLength ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' : 'bg-transparent border-transparent opacity-60'}`}>
                <input 
                    type="checkbox"
                    checked={part.hasLength}
                    onChange={(e) => updateCalculationPart(bill.id, item.id, part.id, { hasLength: e.target.checked })}
                    className="w-3 h-3 rounded text-emerald-600"
                />
                <span className="text-[10px] font-bold text-slate-500">P</span>
                {part.hasLength && (
                    <input 
                        type="number" 
                        value={part.length || ''} 
                        onChange={e => updateCalculationPart(bill.id, item.id, part.id, { length: parseFloat(e.target.value) })} 
                        className={inputClass}
                        placeholder="0"
                        disabled={isGlobal}
                    />
                )}
            </div>
            
            {part.hasLength && (part.hasWidth || part.hasDepth) && <span className="text-slate-300">×</span>}

            {/* Width (L) Toggle */}
            <div className={`flex items-center gap-1 rounded px-1.5 py-0.5 border transition-all ${part.hasWidth ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' : 'bg-transparent border-transparent opacity-60'}`}>
                <input 
                    type="checkbox"
                    checked={part.hasWidth}
                    onChange={(e) => updateCalculationPart(bill.id, item.id, part.id, { hasWidth: e.target.checked })}
                    className="w-3 h-3 rounded text-emerald-600"
                />
                <span className="text-[10px] font-bold text-slate-500">L</span>
                {part.hasWidth && (
                    <input 
                        type="number" 
                        value={part.width || ''} 
                        onChange={e => updateCalculationPart(bill.id, item.id, part.id, { width: parseFloat(e.target.value) })} 
                        className={inputClass}
                        placeholder="0"
                        disabled={isGlobal}
                    />
                )}
            </div>

            {part.hasWidth && part.hasDepth && <span className="text-slate-300">×</span>}

            {/* Depth (T) Toggle */}
            <div className={`flex items-center gap-1 rounded px-1.5 py-0.5 border transition-all ${part.hasDepth ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' : 'bg-transparent border-transparent opacity-60'}`}>
                <input 
                    type="checkbox"
                    checked={part.hasDepth}
                    onChange={(e) => updateCalculationPart(bill.id, item.id, part.id, { hasDepth: e.target.checked })}
                    className="w-3 h-3 rounded text-emerald-600"
                />
                <span className="text-[10px] font-bold text-slate-500">T</span>
                {part.hasDepth && (
                    <input 
                        type="number" 
                        value={part.depth || ''} 
                        onChange={e => updateCalculationPart(bill.id, item.id, part.id, { depth: parseFloat(e.target.value) })} 
                        className={inputClass}
                        placeholder="0"
                        disabled={isGlobal}
                    />
                )}
            </div>

            <span className="text-slate-300">×</span>
            
            {/* Multiplier */}
            <div className={`flex items-center gap-1 rounded px-1.5 py-0.5 border border-transparent ${part.multiplier !== 1 ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200' : 'opacity-60'}`}>
                <input 
                    type="number" 
                    value={part.multiplier || ''} 
                    onChange={e => updateCalculationPart(bill.id, item.id, part.id, { multiplier: parseFloat(e.target.value) })} 
                    className="w-8 bg-transparent outline-none text-center font-bold text-slate-700 dark:text-slate-300 placeholder-slate-400" 
                    placeholder="1" 
                />
            </div>

            {/* Remove Row Btn */}
            <button onClick={() => removeCalculationPart(bill.id, item.id, part.id)} className="ml-auto p-1 text-slate-300 hover:text-red-500">
                <MinusCircle className="w-4 h-4" />
            </button>
        </div>
      );
  };

  const renderItemRow = (bill: BQGroup, item: BQItem, index: number, isHidden: boolean) => {
    if (isHidden) return null;

    // Dynamic Numbering
    const autoNumber = getAutoNumber(bill.items, index);
    const hierarchyLevel = getItemLevel(item); // 0, 1, 2

    if (item.type === 'HEADER') {
      const isLevel0 = hierarchyLevel === 0;
      
      if (isPrintView) {
          return (
              <tr key={item.id} className="break-inside-avoid">
                  <td className="py-2 pr-2 text-center align-top font-bold">{autoNumber}</td>
                  <td className={`py-2 font-bold ${isLevel0 ? 'uppercase underline' : ''}`} colSpan={4}>
                      {item.description}
                  </td>
              </tr>
          );
      }
      return (
          <div key={item.id} className={`flex items-center gap-2 py-3 border-b border-slate-100 dark:border-white/5 ${isLevel0 ? 'bg-slate-100 dark:bg-white/10' : 'bg-slate-50/50 dark:bg-white/5'} px-4 -mx-4 group`}>
              <span className="text-xs font-black text-slate-400 min-w-[30px]">{autoNumber}</span>
              
              {/* COLLAPSE TOGGLE */}
              <button 
                onClick={() => toggleCollapse(bill.id, item.id)}
                className="p-1 rounded hover:bg-slate-200 dark:hover:bg-white/10 text-slate-400 transition-colors"
              >
                  {item.isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              <AutoResizeTextarea
                  value={item.description}
                  onChange={(e) => updateItem(bill.id, item.id, { description: e.target.value })}
                  className={`w-full bg-transparent outline-none text-slate-800 dark:text-slate-200 text-sm ${isLevel0 ? 'font-bold uppercase' : 'font-semibold pl-1'}`}
                  placeholder="TAJUK..."
                  minHeight={24}
              />
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => moveItem(bill.id, item.id, 'up')} disabled={index === 0} className="text-slate-400 hover:text-emerald-500 p-1 rounded hover:bg-emerald-50 dark:hover:bg-emerald-900/20 disabled:opacity-30"><ChevronUp className="w-4 h-4" /></button>
                  <button onClick={() => moveItem(bill.id, item.id, 'down')} className="text-slate-400 hover:text-emerald-500 p-1 rounded hover:bg-emerald-50 dark:hover:bg-emerald-900/20 disabled:opacity-30"><ChevronDown className="w-4 h-4" /></button>
                  <button onClick={() => requestDeleteItem(bill.id, item, index)} className="text-slate-400 hover:text-red-500 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20"><Trash2 className="w-4 h-4" /></button>
              </div>
          </div>
      );
    }

    // ITEM ROW
    const paddingLeftClass = 'pl-10'; // Indent for items

    if (isPrintView) {
        const calcRows = item.isCustomCalc && item.customCalc 
            ? [item.customCalc] 
            : (item.calculationParts || []).map(p => {
                const parts = [];
                if (p.hasLength) parts.push(`${fmt(p.length)}m(P)`);
                if (p.hasWidth) parts.push(`${fmt(p.width)}m(L)`);
                if (p.hasDepth) parts.push(`${fmt(p.depth)}m(T)`);
                if (p.multiplier !== 1) parts.push(`x ${p.multiplier}`);
                if (p.label) return `${parts.join(' x ')} (${p.label})`;
                return parts.join(' x ');
            });
        return (
            <tr key={item.id} className="border-b border-slate-200 break-inside-avoid">
                <td className="py-2 pr-2 text-center align-top w-12">{autoNumber}</td>
                <td className="py-2 pr-4 align-top">
                    <div className="whitespace-pre-wrap pl-4">{item.description}</div>
                    {item.variant && <div className="text-slate-600 dark:text-slate-400 mt-1 pl-4">{item.variant}</div>}
                    {calcRows.length > 0 && (
                        <div className="text-[10px] text-emerald-600 font-mono mt-1 font-bold space-y-0.5 pl-4">
                            {calcRows.map((row, i) => <div key={i}>{row}</div>)}
                        </div>
                    )}
                </td>
                <td className="py-2 px-2 text-center align-top w-16">{item.unit}</td>
                <td className="py-2 px-2 text-center align-top w-16 font-bold">{item.qty}</td>
                <td className="py-2 pl-4 text-right align-top w-28 text-sm">{formatCurrency(item.rate)}</td>
                <td className="py-2 pl-4 text-right align-top w-32 font-bold">{formatCurrency(item.amount)}</td>
            </tr>
        );
    }

    const isRecentlyAdded = lastAddedItemId === item.id;
    return (
        <div 
            key={item.id} 
            id={`bq-item-${item.id}`}
            className={`py-4 border-b border-slate-100 dark:border-white/5 last:border-0 group hover:bg-slate-50 dark:hover:bg-white/5 px-2 rounded-xl transition-all duration-700 ${isRecentlyAdded ? 'bg-emerald-50/80 dark:bg-emerald-900/20 ring-2 ring-emerald-500' : ''}`}
        >
            <div className="flex justify-between items-start gap-3 mb-2">
                <div className="text-xs font-black text-slate-400 mt-1.5 min-w-[30px]">{autoNumber}</div>
                <div className={`flex-1 ${paddingLeftClass}`}>
                    <AutoResizeTextarea
                        value={item.description}
                        onChange={(e) => updateItem(bill.id, item.id, { description: e.target.value })}
                        className="w-full bg-transparent outline-none text-sm font-medium text-slate-800 dark:text-white"
                        minHeight={40}
                    />
                    {item.variant && <div className="text-xs text-slate-500 italic mt-1">{item.variant}</div>}
                </div>
                <div className="flex flex-col items-end gap-1">
                     <div className="flex items-center gap-1 text-xs text-slate-400">
                         <span>Kadar:</span>
                         <input 
                            type="number"
                            value={item.rate}
                            onChange={(e) => updateItem(bill.id, item.id, { rate: parseFloat(e.target.value) })}
                            className="w-20 text-right bg-transparent border-b border-slate-200 focus:border-emerald-500 outline-none text-slate-700 dark:text-slate-300 font-mono"
                         />
                     </div>
                     <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-500">{item.unit}</span>
                </div>
            </div>

            <div className={`flex flex-col sm:flex-row items-start gap-3 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg ml-12`}>
                <div className="flex flex-col gap-1 mt-0.5">
                    {/* GLOBAL LINK BUTTON */}
                    <button
                        onClick={() => toggleGlobal(bill.id, item.id)}
                        className={`p-1.5 rounded-md transition-colors border ${item.isGlobal ? 'bg-emerald-100 text-emerald-600 border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-800/50' : 'bg-white dark:bg-slate-700 text-slate-400 border-slate-200 dark:border-slate-600 hover:border-slate-300'}`}
                        title={item.isGlobal ? "Global Calculation (Linked)" : "Manual Calculation (Unlinked)"}
                    >
                        {item.isGlobal ? <Link className="w-4 h-4" /> : <Unlink className="w-4 h-4" />}
                    </button>

                    {/* MODE TOGGLE BUTTON */}
                    <button
                        onClick={() => toggleCustomCalc(bill.id, item.id)}
                        className={`p-1.5 rounded-md transition-colors border ${item.isCustomCalc ? 'bg-indigo-100 text-indigo-600 border-indigo-200' : 'bg-white dark:bg-slate-700 text-slate-400 border-slate-200 dark:border-slate-600 hover:text-indigo-500'}`}
                        title={item.isCustomCalc ? "Switch to Row Mode" : "Switch to Text Mode"}
                    >
                        {item.isCustomCalc ? <List className="w-4 h-4" /> : <Type className="w-4 h-4" />}
                    </button>
                </div>

                {item.isCustomCalc ? (
                    <div className="flex-1 w-full flex items-center gap-2">
                         <input 
                            type="text"
                            value={item.customCalc || ''}
                            onChange={(e) => updateItem(bill.id, item.id, { customCalc: e.target.value })}
                            className="flex-1 text-xs bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded px-2 py-1 font-mono text-slate-600 dark:text-slate-300"
                            placeholder="e.g. 80 x 0.5 x 2"
                         />
                         <div className="flex items-center gap-1 bg-white dark:bg-slate-700 rounded px-2 py-1 border border-slate-200 dark:border-slate-600">
                             <span className="text-[10px] font-bold text-slate-400">QTY</span>
                             <input 
                                type="number"
                                value={item.qty}
                                onChange={(e) => updateItem(bill.id, item.id, { qty: parseFloat(e.target.value) })}
                                className="w-16 text-right text-sm font-bold bg-transparent outline-none"
                             />
                         </div>
                    </div>
                ) : (
                    <div className="flex-1 w-full">
                        <div className="space-y-1">
                            {(item.calculationParts || []).map((part, pIdx) => renderCalculationPartRow(bill, item, part, pIdx))}
                        </div>
                        <div className="flex items-center justify-between mt-2">
                             <button onClick={() => addCalculationPart(bill.id, item.id)} className="text-[10px] flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-bold px-2 py-1 rounded hover:bg-emerald-50">
                                <PlusCircle className="w-3 h-3" /> Tambah Kiraan
                             </button>
                             <div className="font-mono font-bold text-emerald-600 text-sm border-l border-slate-200 dark:border-slate-700 pl-2">
                                = {item.qty}
                            </div>
                        </div>
                    </div>
                )}
                
                <div className="flex flex-col items-end gap-2 w-full sm:w-auto border-t sm:border-t-0 border-slate-200 dark:border-slate-700 pt-2 sm:pt-0 pl-2 border-l-0 sm:border-l">
                    <div className="text-right w-24">
                        <div className="text-[10px] text-slate-400 uppercase tracking-wider">Jumlah</div>
                        <div className="font-bold text-slate-900 dark:text-white">{formatCurrency(item.amount)}</div>
                    </div>
                    <div className="mt-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => moveItem(bill.id, item.id, 'up')} disabled={index === 0} className="p-1 text-slate-300 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors disabled:opacity-30"><ChevronUp className="w-4 h-4" /></button>
                        <button onClick={() => moveItem(bill.id, item.id, 'down')} className="p-1 text-slate-300 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors disabled:opacity-30"><ChevronDown className="w-4 h-4" /></button>
                        <button onClick={() => requestDeleteItem(bill.id, item, index)} className="p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                </div>
            </div>
        </div>
    );
  };

  const renderSidebarItem = (b: BQGroup, index: number, total: number, moveFn: (id: string, dir: 'up'|'down') => void, deleteFn: (b: BQGroup) => void) => {
    const isActive = activeBillId === b.id;
    const { prefix, content } = parseTitle(b.title);
    
    return (
        <div
            key={b.id}
            onClick={() => setActiveBillId(b.id)}
            className={`w-full text-left p-3 rounded-xl text-xs transition-all relative group cursor-pointer border ${
                isActive 
                ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20 border-emerald-500 ring-1 ring-emerald-500 dark:from-slate-800 dark:to-slate-900 dark:border-slate-700 dark:ring-slate-700' 
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700'
            }`}
        >
            <div className="flex justify-between items-start gap-2">
                <div className="flex-1 min-w-0">
                    {prefix && <div className={`text-[9px] font-black tracking-widest uppercase mb-1 ${isActive ? 'text-emerald-100' : 'text-slate-400 group-hover:text-emerald-600'}`}>{prefix}</div>}
                    <div className={`font-bold leading-snug line-clamp-2 ${isActive ? 'text-white' : 'text-slate-700 dark:text-slate-200'}`}>{content || b.title}</div>
                    <div className={`mt-2 text-[9px] font-mono flex items-center gap-2 ${isActive ? 'text-emerald-100' : 'text-slate-400'}`}><span className="bg-white/20 px-1.5 py-0.5 rounded">{b.items.length} items</span></div>
                </div>
                <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2 bg-white/90 dark:bg-slate-900/90 rounded-lg p-0.5 shadow-sm backdrop-blur-sm">
                     <button onClick={(e) => { e.stopPropagation(); moveFn(b.id, 'up'); }} disabled={index === 0} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded disabled:opacity-30 text-slate-500"><ChevronUp className="w-3 h-3" /></button>
                    <button onClick={(e) => { e.stopPropagation(); moveFn(b.id, 'down'); }} disabled={index === total - 1} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded disabled:opacity-30 text-slate-500"><ChevronDown className="w-3 h-3" /></button>
                    <button type="button" onClick={(e) => { e.stopPropagation(); deleteFn(b); }} className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors mt-1"><Trash2 className="w-3 h-3" /></button>
                </div>
            </div>
        </div>
    );
  };

  const activeBillIndex = bills.findIndex(b => b.id === activeBillId);
  const activeBill = bills[activeBillIndex];

  // Bills by Location grouping logic...
  const billsByLocation: Record<string, BQGroup[]> = {};
  const permulaanBills: BQGroup[] = [];
  const otherBills: BQGroup[] = [];
  bills.forEach(b => {
      if (b.title.includes('PERMULAAN') || b.id.includes('permulaan')) { permulaanBills.push(b); } 
      else if (b.locationId) { if (!billsByLocation[b.locationId]) billsByLocation[b.locationId] = []; billsByLocation[b.locationId].push(b); } 
      else { otherBills.push(b); }
  });
  const sortedLocationIds = Array.from(new Set(bills.filter(b => b.locationId && !b.title.includes('PERMULAAN') && !b.id.includes('permulaan')).map(b => b.locationId!)));
  const categories = Array.from(new Set(BQ_LIBRARY.map(g => g.category)));
  const libraryGroups = selectedCategory ? BQ_LIBRARY.filter(g => g.category === selectedCategory) : [];

  return (
    <div className={`flex flex-col md:flex-row ${isPrintView ? '' : 'gap-4'} h-full min-h-[600px]`}>
        {!isPrintView && (
            <div className="w-full md:w-72 flex flex-col gap-2 shrink-0 md:h-[600px] sticky top-4">
                <div className="bg-white/80 dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">Navigasi BQ</span>
                    <button onClick={handleAddTemplate} className="p-1 bg-emerald-100 text-emerald-600 rounded hover:bg-emerald-200 transition-colors" title="Tambah Template"><Plus className="w-4 h-4" /></button>
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
                                    <div className="flex items-center gap-0.5 opacity-0 group-hover/header:opacity-100 transition-opacity">
                                        <button onClick={(e) => { e.stopPropagation(); moveLocation(locId, 'up'); }} disabled={index === 0} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded disabled:opacity-30"><ChevronUp className="w-3 h-3" /></button>
                                        <button onClick={(e) => { e.stopPropagation(); moveLocation(locId, 'down'); }} disabled={index === sortedLocationIds.length - 1} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded disabled:opacity-30"><ChevronDown className="w-3 h-3" /></button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    {groupBills.map((b, idx) => renderSidebarItem(b, idx, groupBills.length, moveBill, requestDeleteBill))}
                                </div>
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
        )}

        <div className="flex-1 bg-white dark:bg-slate-900 rounded-xl shadow-inner flex flex-col h-full min-h-[500px]">
            {activeBill ? (
                <>
                    <div className="p-4 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-800/50 sticky top-0 z-10 backdrop-blur-sm">
                        <div className="flex items-center justify-between mb-2">
                             <input 
                                value={activeBill.title}
                                onChange={(e) => updateBillTitle(activeBill.id, e.target.value)}
                                className="text-lg font-bold bg-transparent outline-none w-full text-slate-800 dark:text-white uppercase"
                            />
                            <div className="text-right text-xs text-slate-400 shrink-0 ml-4">
                                Total: <span className="text-emerald-600 font-bold text-sm">{formatCurrency(activeBill.items.reduce((s,i) => s + i.amount, 0))}</span>
                            </div>
                        </div>

                        {!isPrintView && activeBill.locationId && (
                            <div className={`mt-2 p-3 rounded-xl border transition-all ${isDimsDirty ? 'bg-orange-50 border-orange-200 dark:bg-orange-900/10 dark:border-orange-800/50' : 'bg-blue-50/50 border-blue-100 dark:bg-blue-900/10 dark:border-blue-800/30'}`}>
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase">
                                        <Ruler className="w-4 h-4" />
                                        Global Calculation
                                    </div>
                                    <div className="flex items-center gap-2 w-full sm:w-auto">
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
                                                className="ml-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1 transition-all"
                                                title="Kemaskini Semua Item"
                                            >
                                                <Save className="w-3 h-3" /> Kemaskini
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex-1 p-4">
                         {activeBill.items.length === 0 ? (
                             <div className="h-40 flex flex-col items-center justify-center text-slate-400">
                                 <FolderPlus className="w-10 h-10 mb-2 opacity-50" />
                                 <p className="text-sm">Tiada item dalam senarai ini.</p>
                             </div>
                         ) : (
                            isPrintView ? (
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="border-b-2 border-slate-800 text-left">
                                            <th className="py-2 w-12 text-center">Bil</th>
                                            <th className="py-2">Keterangan</th>
                                            <th className="py-2 w-16 text-center">Unit</th>
                                            <th className="py-2 w-16 text-center">Kuantiti</th>
                                            <th className="py-2 w-28 text-right">Kadar (RM)</th>
                                            <th className="py-2 w-32 text-right">Jumlah (RM)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {activeBill.items.map((item, idx) => renderItemRow(activeBill, item, idx, false))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="space-y-2">
                                    {(() => {
                                        // RENDER LOGIC WITH COLLAPSE STATE
                                        // Iterate and decide if visible based on active collapsed headers
                                        let currentLevel0Collapsed = false;
                                        let currentLevel1Collapsed = false;
                                        
                                        return activeBill.items.map((item, idx) => {
                                            const level = getItemLevel(item);
                                            
                                            // Determine visibility
                                            let isHidden = false;
                                            
                                            if (level === 0) {
                                                // It's a Level 0 Header
                                                // Reset lower level collapse state when we hit a new major section
                                                currentLevel1Collapsed = false;
                                                // Update current Level 0 state from this item
                                                currentLevel0Collapsed = !!item.isCollapsed;
                                                // Header itself is visible
                                            } else if (level === 1) {
                                                // It's a Level 1 Header
                                                // If current Level 0 is collapsed, this header is hidden
                                                if (currentLevel0Collapsed) isHidden = true;
                                                // Otherwise it's visible, and we update Level 1 state
                                                else {
                                                    currentLevel1Collapsed = !!item.isCollapsed;
                                                }
                                            } else {
                                                // It's an Item (Level 2)
                                                // Hidden if EITHER parent level is collapsed
                                                if (currentLevel0Collapsed || currentLevel1Collapsed) isHidden = true;
                                            }
                                            
                                            return renderItemRow(activeBill, item, idx, isHidden);
                                        });
                                    })()}
                                </div>
                            )
                         )}
                         
                         {!isPrintView && (
                             <button 
                                onClick={openAddItemModal}
                                className="mt-4 w-full py-3 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-slate-400 font-bold text-sm hover:border-emerald-500 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-all flex items-center justify-center gap-2"
                             >
                                 <Plus className="w-4 h-4" /> Tambah Item
                             </button>
                         )}
                    </div>
                </>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8">
                    <Layers className="w-16 h-16 mb-4 opacity-20" />
                    <h3 className="text-lg font-bold text-slate-600 dark:text-slate-300">Tiada Senarai Dipilih</h3>
                    <p className="text-sm max-w-xs text-center mt-2">Pilih senarai dari navigasi sebelah kiri atau tambah template baru.</p>
                    <button onClick={handleAddTemplate} className="mt-6 px-6 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-lg">
                        Tambah Template
                    </button>
                </div>
            )}
        </div>

        {/* --- ADD ITEM LIBRARY MODAL --- */}
        {isAddItemModalOpen && createPortal(
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setIsAddItemModalOpen(false)}>
                <div 
                    className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-4xl w-full flex flex-col h-[80vh] border border-slate-200 dark:border-slate-700"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-3">
                             <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20"><Box className="w-5 h-5" /></div>
                             <div>
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Pustaka Item BQ</h2>
                                <p className="text-xs text-slate-500 font-medium">Pilih kategori dan item untuk ditambah ke dalam senarai</p>
                             </div>
                        </div>
                        <button onClick={() => setIsAddItemModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full"><X className="w-5 h-5"/></button>
                    </div>
                    <div className="flex flex-1 overflow-hidden">
                        <div className="w-1/3 border-r border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-black/20 overflow-y-auto p-4 custom-scrollbar">
                            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-2">Kategori</h3>
                            <div className="space-y-1">
                                {categories.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setSelectedCategory(cat)}
                                        className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-between ${
                                            selectedCategory === cat 
                                            ? 'bg-emerald-600 text-white shadow-md' 
                                            : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-white/5 hover:text-emerald-600'
                                        }`}
                                    >
                                        <span>{cat}</span>
                                        {selectedCategory === cat && <ChevronRight className="w-4 h-4" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-slate-900 custom-scrollbar">
                             {selectedCategory ? (
                                 <div className="space-y-6">
                                     {libraryGroups.map(group => (
                                         <div key={group.id} className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow duration-300">
                                             <div className="bg-slate-50 dark:bg-slate-800 px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between group/header cursor-default">
                                                 <div className="flex items-center gap-2">
                                                     <Package className="w-4 h-4 text-emerald-600" />
                                                     <span className="font-bold text-sm text-slate-800 dark:text-white uppercase">{group.title}</span>
                                                 </div>
                                             </div>
                                             <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                                 {group.items.map(item => (
                                                     <div key={item.id} className="p-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group/item">
                                                         <div className="flex justify-between items-start mb-2"><p className="text-sm text-slate-700 dark:text-slate-300 font-medium leading-relaxed pr-8">{item.description}</p></div>
                                                         <div className="flex flex-wrap gap-2 mt-3">
                                                             {(!item.variants || item.variants.length === 0) && (
                                                                 <button onClick={() => handleLibraryAddItem(group.id, item.id)} className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg hover:border-emerald-500 hover:text-emerald-600 transition-colors text-xs font-bold text-slate-600 dark:text-slate-400 shadow-sm">
                                                                     <PlusCircle className="w-3 h-3" /> Standard
                                                                     {item.rate ? <span className="ml-1 opacity-60">({formatCurrency(item.rate)})</span> : ''}
                                                                 </button>
                                                             )}
                                                             {item.variants?.map(v => (
                                                                 <button key={v.id} onClick={() => handleLibraryAddItem(group.id, item.id, v.id)} className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg hover:border-emerald-500 hover:text-emerald-600 transition-colors text-xs font-bold text-slate-600 dark:text-slate-400 shadow-sm">
                                                                     <PlusCircle className="w-3 h-3" /> {v.label}
                                                                     <span className="ml-1 opacity-60">({formatCurrency(v.rate)})</span>
                                                                 </button>
                                                             ))}
                                                         </div>
                                                     </div>
                                                 ))}
                                             </div>
                                         </div>
                                     ))}
                                 </div>
                             ) : (
                                 <div className="flex flex-col items-center justify-center h-full text-slate-400"><Box className="w-16 h-16 mb-4 opacity-20" /><p>Sila pilih kategori di sebelah kiri.</p></div>
                             )}
                        </div>
                    </div>
                </div>
            </div>,
            document.body
        )}

        {/* --- ADD TEMPLATE WIZARD MODAL --- */}
        {isTemplateModalOpen && createPortal(
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[90vh]">
                    <div className="p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                        <div>
                             <h2 className="text-xl font-bold text-slate-900 dark:text-white">Tambah Template BQ</h2>
                             <p className="text-sm text-slate-500">Langkah {step} dari {(templateType === 'LONGKANG' || templateType === 'EMPTY') ? 2 : 1}</p>
                        </div>
                        <button onClick={() => setIsTemplateModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full"><X className="w-5 h-5"/></button>
                    </div>

                    <div className="p-6 flex-1 overflow-y-auto">
                        
                        {/* STEP 1: CHOOSE TYPE */}
                        {step === 1 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <button onClick={() => handleFinishTemplate('PERMULAAN_BASIC')} className="p-6 rounded-2xl border-2 border-slate-100 hover:border-emerald-500 hover:bg-emerald-50 dark:border-slate-700 dark:hover:border-emerald-500 dark:hover:bg-emerald-900/20 text-left transition-all group">
                                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><FileText className="w-6 h-6" /></div>
                                    <h3 className="font-bold text-slate-800 dark:text-white">Basic Insurans</h3>
                                    <p className="text-xs text-slate-500 mt-1">Permulaan (Standard)</p>
                                </button>
                                <button onClick={() => handleFinishTemplate('PERMULAAN_EMPTY')} className="p-6 rounded-2xl border-2 border-slate-100 hover:border-blue-500 hover:bg-blue-50 dark:border-slate-700 dark:hover:border-blue-500 dark:hover:bg-blue-900/20 text-left transition-all group">
                                    <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><Edit3 className="w-6 h-6" /></div>
                                    <h3 className="font-bold text-slate-800 dark:text-white">Empty Insurans</h3>
                                    <p className="text-xs text-slate-500 mt-1">Permulaan (Manual Fill)</p>
                                </button>
                                <button onClick={() => { setTemplateType('LONGKANG'); setStep(2); }} className="p-6 rounded-2xl border-2 border-slate-100 hover:border-emerald-500 hover:bg-emerald-50 dark:border-slate-700 dark:hover:border-emerald-500 dark:hover:bg-emerald-900/20 text-left transition-all group">
                                    <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><LayoutTemplate className="w-6 h-6" /></div>
                                    <h3 className="font-bold text-slate-800 dark:text-white">Longkang</h3>
                                    <p className="text-xs text-slate-500 mt-1">Template Longkang, Jalan & Penutup</p>
                                </button>
                                <button onClick={() => { setTemplateType('EMPTY'); setStep(2); }} className="p-6 rounded-2xl border-2 border-slate-100 hover:border-slate-400 hover:bg-slate-50 dark:border-slate-700 dark:hover:border-slate-500 dark:hover:bg-slate-800 text-left transition-all group">
                                    <div className="w-12 h-12 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><Plus className="w-6 h-6" /></div>
                                    <h3 className="font-bold text-slate-800 dark:text-white">Kosong (Lokasi)</h3>
                                    <p className="text-xs text-slate-500 mt-1">Bill kosong dengan tetapan lokasi</p>
                                </button>
                            </div>
                        )}

                        {/* STEP 2: CONFIGURE LONGKANG/EMPTY */}
                        {step === 2 && (templateType === 'LONGKANG' || templateType === 'EMPTY') && (
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Pilih Lokasi</label>
                                    <select 
                                        value={templateLocation} 
                                        onChange={(e) => {
                                            setTemplateLocation(e.target.value);
                                            if(e.target.value) setTemplateError(false);
                                        }}
                                        className={`w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border outline-none focus:ring-2 focus:ring-emerald-500 ${templateError ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-200 dark:border-slate-700'}`}
                                    >
                                        <option value="">-- Sila Pilih Lokasi --</option>
                                        {locationRows.filter(l => l.lokasi).map(l => (
                                            <option key={l.id} value={l.id}>{l.lokasi}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className={`p-4 rounded-xl border transition-all ${isDimsModified ? 'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800' : 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800'}`}>
                                    <h4 className={`font-bold mb-4 flex items-center gap-2 ${isDimsModified ? 'text-orange-700 dark:text-orange-400' : 'text-blue-700 dark:text-blue-400'}`}>
                                        {isDimsModified ? <AlertTriangle className="w-5 h-5" /> : <Calculator className="w-4 h-4" />} 
                                        {existingDims ? (isDimsModified ? 'Update Global Calculation' : 'Global Calculation Detected') : 'Setup Global Calculation'}
                                    </h4>
                                    <p className={`text-xs mb-4 ${isDimsModified ? 'text-orange-800/80 dark:text-orange-300/80' : 'text-blue-600/70'}`}>
                                        {isDimsModified ? "AMARAN: Mengubah dimensi ini akan mengemaskini SEMUA item sedia ada dalam lokasi ini yang menggunakan kiraan global." : "Masukkan dimensi global. Item-item template akan dikira secara automatik berdasarkan formula yang ditetapkan."}
                                    </p>
                                    {existingDims && !isDimsModified && (
                                         <div className="mb-4 flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-bold bg-white/50 dark:bg-black/20 p-2 rounded"><Check className="w-4 h-4" /> Dimensi sedia ada telah dimuatkan.</div>
                                    )}
                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase">Panjang (P)</label>
                                            <div className="flex items-center mt-1 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2">
                                                <DimensionInput value={templateDims.length || 0} onChange={val => setTemplateDims({...templateDims, length: val})} className="w-full bg-transparent outline-none font-bold text-lg" placeholder="0" />
                                                <span className="text-xs text-slate-400 font-bold ml-1">m</span>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase">Lebar (L)</label>
                                            <div className="flex items-center mt-1 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2">
                                                <DimensionInput value={templateDims.width || 0} onChange={val => setTemplateDims({...templateDims, width: val})} className="w-full bg-transparent outline-none font-bold text-lg" placeholder="0" />
                                                <span className="text-xs text-slate-400 font-bold ml-1">m</span>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase">Tinggi (T)</label>
                                            <div className="flex items-center mt-1 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2">
                                                <DimensionInput value={templateDims.depth || 0} onChange={val => setTemplateDims({...templateDims, depth: val})} className="w-full bg-transparent outline-none font-bold text-lg" placeholder="0" />
                                                <span className="text-xs text-slate-400 font-bold ml-1">m</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="p-6 border-t border-slate-100 dark:border-white/5 flex justify-end gap-3">
                        {step > 1 && (
                             <button onClick={() => setStep(step - 1)} className="px-4 py-2 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition-colors">Kembali</button>
                        )}
                        <button 
                            onClick={() => handleFinishTemplate()}
                            disabled={step === 1} 
                            className={`px-6 py-2 text-white font-bold rounded-xl transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${isDimsModified ? 'bg-orange-500 hover:bg-orange-600' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                        >
                            {isDimsModified ? <RefreshCw className="w-4 h-4"/> : null}
                            {step === 2 ? (isDimsModified ? 'Kemaskini & Jana' : 'Jana Template') : 'Seterusnya'}
                        </button>
                    </div>
                </div>
            </div>,
            document.body
        )}

        {/* --- DELETE CONFIRMATION MODAL --- */}
        {deleteConfirm && createPortal(
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setDeleteConfirm(null)}>
                <div 
                    className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-sm w-full p-6 border border-slate-200 dark:border-slate-700 transform scale-100 transition-all animate-slide-up relative" 
                    onClick={e => e.stopPropagation()}
                >
                    <button onClick={() => setDeleteConfirm(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"><X className="w-5 h-5"/></button>
                    <div className="flex flex-col items-center text-center pt-2">
                        <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4 text-red-500 animate-pulse-slow">
                            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center"><AlertTriangle className="w-6 h-6 stroke-[2]" /></div>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 font-jakarta">
                            {deleteConfirm.type === 'BILL' ? 'Padam Senarai BQ?' : (deleteConfirm.type === 'HEADER' ? 'Padam Tajuk & Item?' : 'Padam Item?')}
                        </h3>
                        <div className="text-slate-500 dark:text-slate-400 mb-6 text-sm leading-relaxed px-2">
                            <p className="mb-2">Adakah anda pasti mahu memadam:</p>
                            <div className="font-bold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-900 p-2 rounded-lg border border-slate-100 dark:border-slate-700 text-xs text-left max-h-20 overflow-y-auto mb-2 break-words">
                                {deleteConfirm.title || 'Item tanpa tajuk'}
                            </div>
                            {deleteConfirm.type === 'HEADER' && deleteConfirm.count && deleteConfirm.count > 0 && (
                                <p className="text-red-500 font-bold text-xs mt-2 flex items-center justify-center gap-1">
                                    <AlertTriangle className="w-3 h-3" />
                                    Amaran: {deleteConfirm.count} item di bawah tajuk ini akan turut dipadam.
                                </p>
                            )}
                        </div>
                        <div className="flex gap-3 w-full">
                            <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 px-4 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-slate-600 transition-all border border-slate-200 dark:border-slate-600 text-sm">Batal</button>
                            <button onClick={performDelete} className="flex-1 py-2.5 px-4 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 shadow-lg bg-red-600 hover:bg-red-700 shadow-red-600/30 text-sm"><Trash2 className="w-4 h-4" /> Padam</button>
                        </div>
                    </div>
                </div>
            </div>,
            document.body
        )}
    </div>
  );
};

export default BQEditor;
