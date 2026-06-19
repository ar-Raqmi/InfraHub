import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { BQGroup, BQItem, Project, ProjectLocation, formatCurrency, GlobalDimensions, CalculationPart, PresetGroup, PresetItem, BQTemplateDefinition, BQTemplateItemRef, Role } from '../types';
import { apiService } from '../services/apiService';
import { createItem, createHeader } from '../data/bqPresets';
import { Plus, Trash2, MapPin, X, Copy, List, Calculator, Edit3, ArrowRight, ChevronRight, Check, LayoutTemplate, FilePlus, Info, Play, Link, Unlink, FileText, FolderPlus, Layers, RotateCcw, PlusCircle, MinusCircle, AlertTriangle, Settings2, RefreshCw, Save, Ruler, Box, Package, ChevronDown, ChevronUp, GripVertical, Type, FolderOpen, Folder, Download, Loader2, FileInput, ClipboardList, Truck, Wrench, Hammer, CheckSquare, Grid, Zap, Briefcase, Archive, Star, Award, Bookmark, PenTool, Search, History, Clock } from 'lucide-react';

interface BQEditorProps {
    initialData?: BQGroup[];
    onDataChange: (data: BQGroup[]) => void;
    projectData: Project;
    isPrintView?: boolean;
    onPreviewCostChange?: (cost: number) => void;
    locationRows: ProjectLocation[];
    onLocationDimensionsChange?: (locationId: string, dims: GlobalDimensions[]) => void;
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
        emerald: "bg-blue-100 text-blue-600 border-blue-200",
        teal: "bg-cyan-100 text-cyan-600 border-cyan-200",
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
import MoveItemModal from '../components/MoveItemModal';



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
    const isFirstMount = useRef(true);
    const [bills, setBills] = useState<BQGroup[]>(initialData || []);
    const [bqLibrary, setBqLibrary] = useState<PresetGroup[]>([]);
    const [bqTemplates, setBqTemplates] = useState<BQTemplateDefinition[]>([]);
    const [recentItems, setRecentItems] = useState<{ groupId: string, itemId: string, variantId?: string }[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [librarySearchTerm, setLibrarySearchTerm] = useState('');
    const [templateSearchTerm, setTemplateSearchTerm] = useState('');

    // Sync initialData if it changes from outside (e.g., loaded from API after mount)
    useEffect(() => {
        if (!initialData || initialData.length === 0) {
            // Avoid wiping state if we already have bills and incoming data is empty (likely a query reload)
            if (bills.length > 0) return;
        }

        const nextBills = (initialData || []).map(bill => ({
            ...bill,
            items: (bill.items || []).map(item => ({
                ...item,
                qty: Number(item.qty) || 0,
                rate: Number(item.rate) || 0,
                amount: Number(item.amount) || 0,
                calculationParts: (item.calculationParts || []).map(part => ({
                    ...part,
                    length: Number(part.length) || 0,
                    width: Number(part.width) || 0,
                    depth: Number(part.depth) || 0,
                    multiplier: Number(part.multiplier) || 1
                }))
            }))
        }));
        if (JSON.stringify(nextBills) !== JSON.stringify(bills)) {
            setBills(nextBills);
            
            // Check if current activeBillId still exists in new bills
            const stillValid = activeBillId && nextBills.some(b => b.id === activeBillId);
            
            // If not valid or didn't have one, and we have bills, select the first one
            if (!stillValid && nextBills.length > 0) {
                setActiveBillId(nextBills[0].id);
            } else if (nextBills.length === 0) {
                setActiveBillId(null);
            }
        }
    }, [initialData]);

    const [lastAddedItemId, setLastAddedItemId] = useState<string | null>(null);

    const [selectedTemplate, setSelectedTemplate] = useState<BQTemplateDefinition | null>(null);
    const [templateLocations, setTemplateLocations] = useState<string[]>([]);
    const [templateDims, setTemplateDims] = useState<GlobalDimensions>({ length: 0, width: 0, depth: 0 });
    const [step, setStep] = useState(1);
    const [templateError, setTemplateError] = useState(false);

    const [localDimsArray, setLocalDimsArray] = useState<GlobalDimensions[]>([]);
    const [isDimsDirty, setIsDimsDirty] = useState(false);

    const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
    const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
    const [isGlobalLinkModalOpen, setIsGlobalLinkModalOpen] = useState<{ itemId: string, partId: string } | null>(null);
    const [isCaptureModalOpen, setIsCaptureModalOpen] = useState(false);
    const [newTemplateName, setNewTemplateName] = useState('');
    const [newTemplateSubtitle, setNewTemplateSubtitle] = useState('');

    const existingDims = templateLocations.length > 0 ? projectData.locationDimensions?.[templateLocations[0]] : null;
    const isDimsModified = existingDims && (existingDims.length !== templateDims.length || existingDims.width !== templateDims.width || existingDims.depth !== templateDims.depth);

    const [deleteConfirm, setDeleteConfirm] = useState<{
        isOpen: boolean;
        type: 'BILL' | 'ITEM' | 'HEADER';
        billId: string;
        itemId?: string;
        title: string;
        count?: number;
    } | null>(null);

    const [moveTarget, setMoveTarget] = useState<{ billId: string, itemId: string, description: string } | null>(null);

    const currentUser = apiService.getCurrentUser();
    const isAdmin = currentUser?.role === Role.ADMIN;

    useEffect(() => {
        const saved = localStorage.getItem('bq_recent_items');
        if (saved) {
            try {
                setRecentItems(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to load recent items:', e);
            }
        }
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [library, templates] = await Promise.all([
                    apiService.getLibraryGroups(),
                    apiService.getTemplates()
                ]);
                setBqLibrary(library);
                setBqTemplates(templates);
            } catch (err) {
                console.error('Failed to load BQ data:', err);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        // Guard against reporting empty data back to parent during initial mount or reload
        if (isFirstMount.current) {
            isFirstMount.current = false;
            // If we have data on first mount, we can report it (e.g. recovered dims)
            // But if it's empty, and the parent likely has data coming, we skip reporting.
            if (bills.length === 0) return;
        }

        if (bills.length === 0 && (initialData && initialData.length > 0)) {
            return;
        }
        onDataChange(bills);
    }, [bills]);

    useEffect(() => {
        if (bills.length > 0 && !activeBillId) { setActiveBillId(bills[0].id); }
    }, [bills]);

    useEffect(() => {
        if (!activeBillId) return;
        const bill = bills.find(b => b.id === activeBillId);
        if (!bill) return;

        if (bill.calculationId && projectData.globalCalculations?.[bill.calculationId]) {
            const rawDims = projectData.globalCalculations[bill.calculationId];
            if (Array.isArray(rawDims)) {
                setLocalDimsArray(rawDims);
            } else {
                setLocalDimsArray([rawDims]);
            }
        } else if (bill && (bill.locationIds?.length || bill.locationId)) {
            const primaryLocId = bill.locationIds?.[0] || bill.locationId;
            if (primaryLocId && projectData.locationDimensions?.[primaryLocId]) {
                const locDims = projectData.locationDimensions[primaryLocId];
                setLocalDimsArray(Array.isArray(locDims) ? locDims : [locDims]);
            } else {
                setLocalDimsArray([{ length: 0, width: 0, depth: 0, label: 'Kiraan 1' }]);
            }
        } else {
            // Attempt to recover from items if calculationId exists but global data is missing
            let recovered = false;
            if (bill.calculationId) {
                // Look for any item using this calculationId in any bill
                for (const b of bills) {
                    if (b.calculationId === bill.calculationId) {
                        const itemWithParts = b.items.find(i => i.isGlobal && i.calculationParts && i.calculationParts.length > 0);
                        if (itemWithParts) {
                            const recoveredDims: GlobalDimensions[] = [];
                            itemWithParts.calculationParts!.forEach(p => {
                                if (p.isGlobal && p.globalIndex !== undefined) {
                                    recoveredDims[p.globalIndex] = {
                                        length: Number(p.length) || 0,
                                        width: Number(p.width) || 0,
                                        depth: Number(p.depth) || 0,
                                        label: p.label || `Kiraan ${p.globalIndex + 1}`
                                    };
                                }
                            });
                            if (recoveredDims.length > 0) {
                                // Fill gaps with zeros if any
                                for (let i = 0; i < recoveredDims.length; i++) {
                                    if (!recoveredDims[i]) recoveredDims[i] = { length: 0, width: 0, depth: 0, label: `Kiraan ${i + 1}` };
                                }
                                setLocalDimsArray(recoveredDims);
                                recovered = true;
                                break;
                            }
                        }
                    }
                }
            }
            if (!recovered) {
                setLocalDimsArray([{ length: 0, width: 0, depth: 0, label: 'Kiraan 1' }]);
            }
        }
        setIsDimsDirty(false);
    }, [activeBillId, bills, projectData.globalCalculations, projectData.locationDimensions]);

    useEffect(() => {
        const primaryLoc = templateLocations[0];
        if (primaryLoc && projectData.locationDimensions?.[primaryLoc]) {
            setTemplateDims(projectData.locationDimensions[primaryLoc]);
        } else if (primaryLoc && !projectData.locationDimensions?.[primaryLoc]) {
            setTemplateDims({ length: 0, width: 0, depth: 0 });
        }
    }, [templateLocations, projectData.locationDimensions]);

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
        const isInsurans = (b: BQGroup) => b.title.toUpperCase().includes('INSURANS');
        const isPermulaan = (b: BQGroup) => 
            b.title.toUpperCase().includes('PERMULAAN') || 
            b.title.toUpperCase().includes('AWALAN') || 
            b.id.toLowerCase().includes('permulaan') || 
            b.id.toLowerCase().includes('awalan');

        const insuransBills = currentBills.filter(isInsurans);
        const permulaanBills = currentBills.filter(b => isPermulaan(b) && !isInsurans(b));
        const otherBills = currentBills.filter(b => !isInsurans(b) && !isPermulaan(b));
        const sortedBills = [...insuransBills, ...permulaanBills, ...otherBills];

        let counter = 1;
        return sortedBills.map(bill => {
            const { content } = parseTitle(bill.title);
            const displayContent = content.trim() || 'BUTIRAN KERJA';
            const newTitle = `BIL NO. ${counter} - ${displayContent.toUpperCase()}`;
            counter++;
            return { ...bill, title: newTitle };
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
        setTemplateLocations([]);
        setTemplateDims({ length: 0, width: 0, depth: 0 });
        setTemplateSearchTerm('');
        setTemplateError(false);
        setIsTemplateModalOpen(true);
    };

    const openAddItemModal = () => {
        if (readOnly) return;
        setSelectedCategory('HISTORY');
        setLibrarySearchTerm('');
        setIsAddItemModalOpen(true);
    };

    const handleClearHistory = () => {
        setRecentItems([]);
        localStorage.removeItem('bq_recent_items');
        if (onShowToast) onShowToast("Sejarah telah dipadam.", "info");
    };

    const toggleCollapse = (billId: string, itemId: string) => {
        setBills(prev => prev.map(b => {
            if (b.id !== billId) return b;
            return { ...b, items: b.items.map(item => item.id === itemId ? { ...item, isCollapsed: !item.isCollapsed } : item) };
        }));
    };

    const toggleAllCollapse = () => {
        if (!activeBillId) return;
        const bill = bills.find(b => b.id === activeBillId);
        if (!bill) return;

        // Determine if we should collapse or expand. 
        // If any header is currently expanded, we collapse all.
        const hasExpanded = bill.items.some(item => item.type === 'HEADER' && !item.isCollapsed);
        const newState = hasExpanded;

        setBills(prev => prev.map(b => {
            if (b.id !== activeBillId) return b;
            return {
                ...b,
                items: b.items.map(item =>
                    item.type === 'HEADER' ? { ...item, isCollapsed: newState } : item
                )
            };
        }));
    };

    const recalculateQtyFromParts = (parts: CalculationPart[]): number => {
        return parts.reduce((acc, part) => {
            let product = 1;
            if (part.hasLength) product *= (part.length || 0);
            if (part.hasWidth) product *= (part.width || 0);
            if (part.hasDepth) product *= (part.depth || 0);
            const res = product * (part.multiplier || 0);
            return acc + (isNaN(res) ? 0 : res);
        }, 0);
    };

    const handleLibraryAddItem = (groupId: string, itemId?: string, variantId?: string) => {
        if (!activeBillId || readOnly) return;
        const group = bqLibrary.find(g => g.id === groupId);
        if (!group || !itemId) return;

        // Add to recent items
        setRecentItems(prev => {
            const newItem = { groupId, itemId, variantId };
            const filtered = prev.filter(i => !(i.groupId === groupId && i.itemId === itemId && i.variantId === variantId));
            const updated = [newItem, ...filtered].slice(0, 10);
            localStorage.setItem('bq_recent_items', JSON.stringify(updated));
            return updated;
        });

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

            const dArray = localDimsArray;
            if (dArray.length > 0) {
                itemsToAdd.forEach(newItem => {
                    if (newItem.type === 'ITEM' && newItem.calculationParts && newItem.isGlobal) {
                        // Create a part for EACH global dimension
                        const basePart = newItem.calculationParts[0] || {
                            id: Math.random().toString(36).substr(2, 9),
                            label: '',
                            length: 0, width: 0, depth: 0, multiplier: 1,
                            hasLength: false, hasWidth: false, hasDepth: false
                        };

                        const newParts: CalculationPart[] = dArray.map((gDim, idx) => ({
                            ...basePart,
                            id: `${basePart.id}-${idx}`,
                            label: gDim.label || `Kiraan ${idx + 1}`,
                            isGlobal: true,
                            globalIndex: idx,
                            length: basePart.hasLength ? gDim.length : basePart.length,
                            width: basePart.hasWidth ? gDim.width : basePart.width,
                            depth: basePart.hasDepth ? gDim.depth : basePart.depth
                        }));

                        newItem.calculationParts = newParts;
                        const qty = recalculateQtyFromParts(newParts);
                        newItem.qty = parseFloat(qty.toFixed(2));
                        newItem.amount = parseFloat((qty * newItem.rate).toFixed(2));
                    }
                });
            }
            if (itemsToAdd.length > 0) { const lastItem = itemsToAdd[itemsToAdd.length - 1]; setLastAddedItemId(lastItem.id); }
            newItems.splice(insertionIndex, 0, ...itemsToAdd);
            return { ...b, items: newItems };
        }));
        if (onShowToast) onShowToast(`Item ditambah`, 'success');
    };

    const updateBillsWithNewDimensions = (calculationId: string, newDimsArray: GlobalDimensions[]) => {
        const updatedBills = bills.map(bill => {
            if (bill.calculationId !== calculationId) return bill;
            const updatedItems = bill.items.map(item => {
                if (!item.calculationParts) return item;
                const newParts = item.calculationParts.map(part => {
                    if (!part.isGlobal || part.globalIndex === undefined) return part;
                    const gDim = newDimsArray[part.globalIndex];
                    if (!gDim) return part;
                    return {
                        ...part,
                        length: part.hasLength ? gDim.length : part.length,
                        width: part.hasWidth ? gDim.width : part.width,
                        depth: part.hasDepth ? gDim.depth : part.depth
                    };
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
        if (onLocationDimensionsChange) { onLocationDimensionsChange(bill.calculationId, localDimsArray as any); }
        updateBillsWithNewDimensions(bill.calculationId, localDimsArray);
        setIsDimsDirty(false);
    };

    const updateBillLocations = (billId: string, locationIds: string[]) => {
        if (readOnly) return;
        setBills(prev => prev.map(b => b.id === billId ? { ...b, locationIds } : b));
    };

    const handleLinkCalculation = (targetCalcId: string) => {
        if (readOnly) return;
        setBills(prev => prev.map(b => {
            if (b.id !== activeBillId) return b;
            const newBill = { ...b, calculationId: targetCalcId };
            // Immediately sync dimensions if target already has them
            const rawTargetDims = projectData.globalCalculations?.[targetCalcId] || { length: 0, width: 0, depth: 0 };
            const targetDimsArray = Array.isArray(rawTargetDims) ? rawTargetDims : [rawTargetDims];
            setLocalDimsArray(targetDimsArray);
            const firstDim = targetDimsArray[0];
            const updatedItems = newBill.items.map(item => {
                if (!item.isGlobal || !item.calculationParts) return item;
                const newParts = item.calculationParts.map(part => {
                    // Default link to index 0 if it was global but didn't have globalIndex
                    const gIndex = part.globalIndex !== undefined ? part.globalIndex : 0;
                    const gDim = targetDimsArray[gIndex] || firstDim;
                    return {
                        ...part,
                        isGlobal: true,
                        globalIndex: gIndex,
                        length: part.hasLength ? gDim.length : part.length,
                        width: part.hasWidth ? gDim.width : part.width,
                        depth: part.hasDepth ? gDim.depth : part.depth
                    };
                });
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
        if (isMultistep && templateLocations.length === 0) { setTemplateError(true); if (onShowToast) onShowToast("Sila pilih sekurang-kurangnya satu lokasi.", "error"); return; }

        const newGroups: BQGroup[] = [];
        if (tpl.bills && tpl.bills.length > 0) {
            tpl.bills.forEach((billDef, bIdx) => {
                const billCalcId = `calc-${Math.random().toString(36).substr(2, 9)}`;
                if (isMultistep && templateLocations.length > 0) {
                    if (onLocationDimensionsChange) onLocationDimensionsChange(billCalcId, [templateDims]);
                }

                const bill: BQGroup = {
                    id: `bil-${Date.now()}-${bIdx}`,
                    calculationId: billCalcId,
                    title: `BIL NO. 999 - ${billDef.title.toUpperCase()}`,
                    locationIds: tpl.key === 'PERMULAAN_BASIC' || tpl.key === 'PERMULAAN_EMPTY' ? [] : [...templateLocations],
                    items: []
                };
                if (tpl.key === 'PERMULAAN_BASIC' || tpl.key === 'PERMULAAN_EMPTY') { bill.items.push(createHeader('ALL QUANTITY ARE PROVISIONAL')); }

                // New Logic to handle both full objects and legacy refs
                let lastGroupId = '';
                let lastItemId = '';

                billDef.items.forEach(itemOrRef => {
                    // Check if it's a full BQItem (snapshot) or a legacy ref
                    const isFullItem = (itemOrRef as BQItem).type !== undefined;

                    if (isFullItem) {
                        // FULL ITEM SNAPSHOT (Standard Mode)
                        const itemSnapshot = itemOrRef as BQItem;
                        const newItem = { ...itemSnapshot, id: Math.random().toString(36).substr(2, 9) };

                        // 1. Sync with Library if source exists
                        if (newItem.sourceItemId) {
                            const group = bqLibrary.find(g => g.id === newItem.sourceGroupId);
                            const libItem = group?.items.find(i => i.id === newItem.sourceItemId);
                            if (libItem) {
                                if (newItem.sourceVariantId) {
                                    const libVariant = libItem.variants?.find(v => v.id === newItem.sourceVariantId);
                                    if (libVariant) {
                                        newItem.rate = libVariant.rate;
                                        newItem.unit = libVariant.unit;
                                        // Optional: Update description/label if changed in library? Keeping template desc is safer for context.
                                    }
                                } else {
                                    newItem.rate = libItem.rate || 0;
                                    newItem.unit = libItem.unit || '';
                                }
                            }
                        }

                        // 2. Apply Global Dimensions from Import Step
                        const currentTplDims = (tpl.key === 'PERMULAAN_BASIC' || tpl.key === 'PERMULAAN_EMPTY') ? null : templateDims;
                        if (newItem.isGlobal && currentTplDims) {
                            newItem.calculationParts = newItem.calculationParts?.map(p => ({
                                ...p,
                                length: p.hasLength ? currentTplDims.length : p.length,
                                width: p.hasWidth ? currentTplDims.width : p.width,
                                depth: p.hasDepth ? currentTplDims.depth : p.depth
                            }));
                            const qty = recalculateQtyFromParts(newItem.calculationParts || []);
                            newItem.qty = parseFloat(qty.toFixed(2));
                            newItem.amount = parseFloat((qty * newItem.rate).toFixed(2));
                        }

                        bill.items.push(newItem);

                    } else {
                        // LEGACY REF MODE (Backwards Compatibility)
                        const ref = itemOrRef as BQTemplateItemRef;
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
                    }
                });
                newGroups.push(bill);
            });
        } else if (tpl.key === 'EMPTY') {
            const billCalcId = `calc-${Math.random().toString(36).substr(2, 9)}`;
            if (templateLocations.length > 0 && onLocationDimensionsChange) onLocationDimensionsChange(billCalcId, [templateDims]);
            newGroups.push({ id: `bil-${Date.now()}`, calculationId: billCalcId, title: `BIL NO. 999 - BUTIRAN KERJA-KERJA`, locationIds: [...templateLocations], items: [] });
        }
        const newBills = [...bills, ...newGroups];
        const renumberedBills = resequenceTitles(newBills);
        setBills(renumberedBills);
        if (renumberedBills.length > 0 && newGroups.length > 0) setActiveBillId(newGroups[0].id);
        setIsTemplateModalOpen(false);
    };

    const handleCaptureTemplate = async () => {
        if (!activeBillId || !newTemplateName.trim()) return;
        const bill = bills.find(b => b.id === activeBillId);
        if (!bill) return;

        const sanitizedItems: BQItem[] = bill.items.map(item => {
            // Clone item
            const newItem = { ...item };

            // Reset numeric values
            newItem.qty = 0;
            newItem.amount = 0;

            // Reset Calculation Parts but keep logic flags
            if (newItem.calculationParts) {
                newItem.calculationParts = newItem.calculationParts.map(p => ({
                    ...p,
                    length: 0,
                    width: 0,
                    depth: 0,
                    multiplier: p.multiplier // Keep multiplier? Probably safe to reset to 1, but keeping user logic is better.
                }));
            }

            // Reset legacy dims just in case
            if (newItem.dimLength) newItem.dimLength = 0;
            if (newItem.dimWidth) newItem.dimWidth = 0;
            if (newItem.dimDepth) newItem.dimDepth = 0;

            // SYNC: Ensure rate/unit matches library if linked
            if (newItem.sourceItemId) {
                const group = bqLibrary.find(g => g.id === newItem.sourceGroupId);
                const libItem = group?.items.find(i => i.id === newItem.sourceItemId);
                if (libItem) {
                    if (newItem.sourceVariantId) {
                        const libVariant = libItem.variants?.find(v => v.id === newItem.sourceVariantId);
                        if (libVariant) {
                            newItem.rate = libVariant.rate;
                            newItem.unit = libVariant.unit;
                        }
                    } else {
                        newItem.rate = libItem.rate || 0;
                        newItem.unit = libItem.unit || '';
                    }
                }
            }

            return newItem;
        });

        const newTemplate: BQTemplateDefinition = {
            id: `tpl-${Date.now()}`,
            key: 'CUSTOM',
            title: newTemplateName.trim().toUpperCase(),
            subtitle: newTemplateSubtitle.trim() || 'Template Tersuai',
            icon: 'bookmark',
            color: 'indigo',
            bills: [
                {
                    id: `tb-${Date.now()}`,
                    title: parseTitle(bill.title).content || bill.title, // Strip "BIL NO X" prefix
                    items: sanitizedItems
                }
            ],
            groupRefs: [] // Not used for custom templates
        };

        // Optimistic update
        const updatedTemplates = [...bqTemplates, newTemplate];
        setBqTemplates(updatedTemplates);
        await apiService.saveTemplates(updatedTemplates);

        setIsCaptureModalOpen(false);
        setNewTemplateName('');
        setNewTemplateSubtitle('');
        if (onShowToast) onShowToast("Template berjaya disimpan!", "success");
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
            return {
                ...bill, items: bill.items.map(item => {
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
            return {
                ...bill, items: bill.items.map(item => {
                    if (item.id !== itemId) return item;
                    const newPart: CalculationPart = { id: Math.random().toString(36).substr(2, 9), label: '', length: 0, width: 0, depth: 0, multiplier: 1, hasLength: false, hasWidth: false, hasDepth: false };
                    if (item.isGlobal && localDimsArray.length > 0) {
                        const gDim = localDimsArray[0];
                        newPart.isGlobal = true;
                        newPart.globalIndex = 0;
                        newPart.length = gDim.length;
                        newPart.width = gDim.width;
                        newPart.depth = gDim.depth;
                    }
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
            return {
                ...bill, items: bill.items.map(item => {
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
            return {
                ...bill, items: bill.items.map(item => {
                    if (item.id !== itemId) return item;
                    const existingParts = item.calculationParts || [];
                    const partToUpdate = existingParts.find(p => p.id === partId);

                    if (partToUpdate?.isGlobal && partToUpdate.globalIndex !== undefined) {
                        const gDim = localDimsArray[partToUpdate.globalIndex];
                        if (gDim) {
                            if (updates.hasLength === true) updates.length = gDim.length;
                            if (updates.hasWidth === true) updates.width = gDim.width;
                            if (updates.hasDepth === true) updates.depth = gDim.depth;
                        }
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
            return {
                ...bill, items: bill.items.map(item => {
                    if (item.id !== itemId) return item;
                    const newMode = !item.isCustomCalc;
                    let calcStr = item.customCalc || '';
                    if (newMode && !calcStr && item.calculationParts) {
                        calcStr = item.calculationParts.map(p => {
                            const parts = []; if (p.hasLength) parts.push(`${p.length}(Qty/P)`); if (p.hasWidth) parts.push(`${p.width}(L)`); if (p.hasDepth) parts.push(`${p.depth}(T)`); if (p.multiplier !== 1) parts.push(`x ${p.multiplier}`); return parts.join(' x ');
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
            return {
                ...bill, items: bill.items.map(item => {
                    if (item.id !== itemId) return item;
                    const newGlobal = !item.isGlobal;
                    let newItems = { ...item, isGlobal: newGlobal };
                    if (newGlobal && item.calculationParts) {
                        const firstDim = localDimsArray[0] || { length: 0, width: 0, depth: 0 };
                        const newParts = item.calculationParts.map(part => ({
                            ...part,
                            isGlobal: true,
                            globalIndex: 0,
                            length: part.hasLength ? firstDim.length : part.length,
                            width: part.hasWidth ? firstDim.width : part.width,
                            depth: part.hasDepth ? firstDim.depth : part.depth
                        }));
                        newItems.calculationParts = newParts;
                        const qty = recalculateQtyFromParts(newParts);
                        newItems.qty = parseFloat(qty.toFixed(2));
                        newItems.amount = parseFloat((qty * newItems.rate).toFixed(2));
                    } else if (!newGlobal && item.calculationParts) {
                        const newParts = item.calculationParts.map(part => ({ ...part, isGlobal: false, globalIndex: undefined }));
                        newItems.calculationParts = newParts;
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
        const isTopBill = (b: BQGroup) => 
            b.title.toUpperCase().includes('INSURANS') || 
            b.title.toUpperCase().includes('PERMULAAN') || 
            b.title.toUpperCase().includes('AWALAN') || 
            b.id.toLowerCase().includes('permulaan') || 
            b.id.toLowerCase().includes('awalan');

        const permulaan = bills.filter(isTopBill);
        const locationBills = bills.filter(b => (b.locationIds?.length || b.locationId) && !isTopBill(b));
        const otherBills = bills.filter(b => !(b.locationIds?.length || b.locationId) && !isTopBill(b));

        const uniqueLocIds = Array.from(new Set(locationBills.flatMap(b => b.locationIds || (b.locationId ? [b.locationId] : []))));
        const currentIndex = uniqueLocIds.indexOf(locId);
        if (currentIndex === -1) return;
        const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        if (newIndex < 0 || newIndex >= uniqueLocIds.length) return;
        const temp = uniqueLocIds[currentIndex];
        uniqueLocIds[currentIndex] = uniqueLocIds[newIndex];
        uniqueLocIds[newIndex] = temp;
        let reorderedLocationBills: BQGroup[] = [];
        uniqueLocIds.forEach(id => {
            const billsForThisLoc = locationBills.filter(b => (b.locationIds || (b.locationId ? [b.locationId] : [])).includes(id));
            reorderedLocationBills = [...reorderedLocationBills, ...billsForThisLoc];
        });
        // Remove duplicates that might occur if a bill is in multiple locations
        reorderedLocationBills = Array.from(new Set(reorderedLocationBills));
        const finalBills = [...permulaan, ...reorderedLocationBills, ...otherBills];
        setBills(resequenceTitles(finalBills));
    };

    const handleSplitBill = (billId: string, splitItemIndex: number) => {
        if (readOnly) return;
        setBills(prevBills => {
            const billIndex = prevBills.findIndex(b => b.id === billId);
            if (billIndex === -1) return prevBills;

            const sourceBill = prevBills[billIndex];
            const itemsToMove = sourceBill.items.slice(splitItemIndex);
            const remainingItems = sourceBill.items.slice(0, splitItemIndex);

            const { prefix, content } = parseTitle(sourceBill.title);
            const match = prefix.match(/BIL NO\.\s*(\d+)/i);
            const currentNo = match ? parseInt(match[1]) : 0;

            const cleanContent = content.replace(/\s+SAMBUNGAN$/i, "");
            const newTitle = `BIL NO. ${currentNo + 1} - ${cleanContent} SAMBUNGAN`;

            const newBill: BQGroup = {
                ...sourceBill,
                id: `bill-split-${Math.random().toString(36).substr(2, 9)}`,
                title: newTitle,
                items: itemsToMove,
            };

            let newData = [...prevBills];
            newData[billIndex] = { ...sourceBill, items: remainingItems };
            newData.splice(billIndex + 1, 0, newBill);

            const renumbered = resequenceTitles(newData);
            setTimeout(() => setActiveBillId(newBill.id), 0);
            return renumbered;
        });
    };

    const moveItemToDifferentBill = (sourceBillId: string, targetBillId: string, itemId: string) => {
        if (readOnly) return;
        setBills(prevBills => {
            const sourceBillIndex = prevBills.findIndex(b => b.id === sourceBillId);
            const targetBillIndex = prevBills.findIndex(b => b.id === targetBillId);
            if (sourceBillIndex === -1 || targetBillIndex === -1) return prevBills;

            const sourceBill = prevBills[sourceBillIndex];
            const targetBill = prevBills[targetBillIndex];

            const items = [...sourceBill.items];
            const index = items.findIndex(i => i.id === itemId);
            if (index === -1) return prevBills;

            const itemToMove = items[index];
            const currentLevel = getItemLevel(itemToMove);

            // Find all children/sub-items if this is a header
            let blockEnd = index + 1;
            while (blockEnd < items.length && getItemLevel(items[blockEnd]) > currentLevel) blockEnd++;

            const block = items.slice(index, blockEnd);

            // Remove block from source bill
            const nextSourceItems = [...items.slice(0, index), ...items.slice(blockEnd)];

            // Add block to target bill
            const nextTargetItems = [...targetBill.items, ...block];

            const nextBills = [...prevBills];
            nextBills[sourceBillIndex] = { ...sourceBill, items: nextSourceItems };
            nextBills[targetBillIndex] = { ...targetBill, items: nextTargetItems };

            if (onShowToast) onShowToast("Item berjaya dipindahkan.", "success");
            return nextBills;
        });
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
        const isGlobal = part.isGlobal;
        const inputClassBase = "w-12 outline-none text-right font-bold text-sm transition-colors";
        const inputClass = isGlobal || readOnly ? `${inputClassBase} bg-transparent text-slate-400 cursor-not-allowed` : `${inputClassBase} bg-blue-50/50  text-blue-700  border-b border-blue-300  rounded-sm`;

        const gDimLabel = isGlobal && part.globalIndex !== undefined ? (localDimsArray[part.globalIndex]?.label || `Kiraan ${part.globalIndex + 1}`) : '';

        return (
            <div key={part.id} className={`flex flex-wrap items-center gap-2 text-xs p-1.5 rounded-lg border mb-1 last:mb-0 transition-colors ${isGlobal ? 'bg-blue-50/30 border-blue-100' : 'bg-white border-slate-200'}`}>
                {!readOnly && (
                    <button
                        onClick={() => setIsGlobalLinkModalOpen({ itemId: item.id, partId: part.id })}
                        className={`p-1 rounded transition-colors ${isGlobal ? 'text-blue-600 bg-blue-100' : 'text-slate-300 hover:text-blue-500 hover:bg-blue-50'}`}
                        title={isGlobal ? `Terhubung dengan: ${gDimLabel}` : "Hubungkan dengan Global Calculation"}
                    >
                        {isGlobal ? <Link className="w-3 h-3" /> : <Unlink className="w-3 h-3" />}
                    </button>
                )}
                <input type="text" value={part.label || ''} onChange={(e) => updateCalculationPart(bill.id, item.id, part.id, { label: e.target.value })} disabled={readOnly} className="w-16 bg-transparent border-b border-dashed border-slate-300  focus:border-blue-500 outline-none text-slate-500 placeholder-slate-400 text-[10px]" placeholder="Label" />
                <div className={`flex items-center gap-1 rounded px-1.5 py-0.5 border transition-colors ${part.hasLength ? 'bg-blue-50 border-blue-200' : 'bg-transparent border-transparent opacity-60'}`}><input type="checkbox" checked={part.hasLength} onChange={(e) => updateCalculationPart(bill.id, item.id, part.id, { hasLength: e.target.checked })} disabled={readOnly} className="w-3 h-3 rounded text-blue-600" /><span className="text-[10px] font-bold text-slate-500">Qty/P</span>{part.hasLength && (<DimensionInput value={part.length || 0} onChange={val => updateCalculationPart(bill.id, item.id, part.id, { length: val })} className={inputClass} placeholder="0" disabled={isGlobal || readOnly} />)}</div>
                {part.hasLength && (part.hasWidth || part.hasDepth) && <span className="text-slate-300">×</span>}
                <div className={`flex items-center gap-1 rounded px-1.5 py-0.5 border transition-colors ${part.hasWidth ? 'bg-blue-50 border-blue-200' : 'bg-transparent border-transparent opacity-60'}`}><input type="checkbox" checked={part.hasWidth} onChange={(e) => updateCalculationPart(bill.id, item.id, part.id, { hasWidth: e.target.checked })} disabled={readOnly} className="w-3 h-3 rounded text-blue-600" /><span className="text-[10px] font-bold text-slate-500">L</span>{part.hasWidth && (<DimensionInput value={part.width || 0} onChange={val => updateCalculationPart(bill.id, item.id, part.id, { width: val })} className={inputClass} placeholder="0" disabled={isGlobal || readOnly} />)}</div>
                {part.hasWidth && part.hasDepth && <span className="text-slate-300">×</span>}
                <div className={`flex items-center gap-1 rounded px-1.5 py-0.5 border transition-colors ${part.hasDepth ? 'bg-blue-50 border-blue-200' : 'bg-transparent border-transparent opacity-60'}`}><input type="checkbox" checked={part.hasDepth} onChange={(e) => updateCalculationPart(bill.id, item.id, part.id, { hasDepth: e.target.checked })} disabled={readOnly} className="w-3 h-3 rounded text-blue-600" /><span className="text-[10px] font-bold text-slate-500">T</span>{part.hasDepth && (<DimensionInput value={part.depth || 0} onChange={val => updateCalculationPart(bill.id, item.id, part.id, { depth: val })} className={inputClass} placeholder="0" disabled={isGlobal || readOnly} />)}</div>
                <span className="text-slate-300">×</span>
                <div className={`flex items-center gap-1 rounded px-1.5 py-0.5 border border-transparent ${part.multiplier !== 1 ? 'bg-orange-50  border-orange-200' : 'opacity-60'}`}><DimensionInput value={part.multiplier || 0} onChange={val => updateCalculationPart(bill.id, item.id, part.id, { multiplier: val })} disabled={readOnly} className="w-8 bg-transparent outline-none text-center font-bold text-slate-700  placeholder-slate-400" placeholder="1" /></div>

                {/* Individual Row Result with Full Breakdown */}
                <div className="ml-auto flex items-center gap-2 md:gap-3 pl-2 border-l border-slate-100">

                    <span className="hidden md:inline text-[10px] text-slate-400 font-mono">{item.unit}</span>
                    <div className="text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded min-w-[30px] text-center">
                        {(() => {
                            let product = 1;
                            if (part.hasLength) product *= part.length;
                            if (part.hasWidth) product *= part.width;
                            if (part.hasDepth) product *= part.depth;
                            const qty = product * part.multiplier;
                            return qty % 1 === 0 ? qty : qty.toFixed(2);
                        })()}
                    </div>
                    <div className="hidden md:block text-[10px] text-slate-400">x {formatCurrency(item.rate)}</div>
                    <div className="text-[10px] font-mono font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 min-w-[60px] text-right">
                        {(() => {
                            let product = 1;
                            if (part.hasLength) product *= part.length;
                            if (part.hasWidth) product *= part.width;
                            if (part.hasDepth) product *= part.depth;
                            const qty = product * part.multiplier;
                            return formatCurrency(qty * item.rate);
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
        if (item.type === 'HEADER') {
            const isLevel0 = hierarchyLevel === 0;
            return (
                <div key={item.id} className={`flex items-center gap-2 py-3 border-b border-slate-100 ${isLevel0 ? 'bg-slate-100' : 'bg-slate-50/50'} px-4 -mx-4 group`}>
                    <span className="text-xs font-black text-slate-400 min-w-[30px]">{autoNumber}</span>
                    <button onClick={() => toggleCollapse(bill.id, item.id)} className="p-1 rounded hover:bg-slate-200  text-slate-400 transition-colors">{item.isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}</button>
                    <AutoResizeTextarea value={item.description} onChange={(e) => updateItem(bill.id, item.id, { description: e.target.value })} disabled={readOnly} className={`w-full bg-transparent outline-none text-slate-800  text-sm ${isLevel0 ? 'font-bold uppercase' : 'font-semibold pl-1'}`} placeholder="TAJUK..." minHeight={24} />
                    {!readOnly && (
                        <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                            {isLevel0 && (
                                <button
                                    onClick={() => setMoveTarget({ billId: bill.id, itemId: item.id, description: item.description })}
                                    className="text-[10px] bg-white border border-slate-200 hover:border-blue-500 rounded px-2 py-1 text-slate-500 hover:text-blue-600 font-bold transition-colors mr-1 flex items-center gap-1 shrink-0"
                                    title="Pindah ke Bil No. lain"
                                >
                                    <FolderOpen className="w-3.5 h-3.5" /> Pindah
                                </button>
                            )}
                            <button onClick={() => moveItem(bill.id, item.id, 'up')} disabled={index === 0} className="text-slate-400 hover:text-blue-500 p-1 rounded hover:bg-blue-50  disabled:opacity-30"><ChevronUp className="w-4 h-4" /></button>
                            <button onClick={() => moveItem(bill.id, item.id, 'down')} className="text-slate-400 hover:text-blue-500 p-1 rounded hover:bg-blue-50  disabled:opacity-30"><ChevronDown className="w-4 h-4" /></button>
                            <button onClick={() => requestDeleteItem(bill.id, item, index)} className="text-slate-400 hover:text-red-500 p-1 rounded hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
                        </div>
                    )}
                </div>
            );
        }
        const paddingLeftClass = 'pl-10';
        const isRecentlyAdded = lastAddedItemId === item.id;
        return (
            <div key={item.id} id={`bq-item-${item.id}`} className={`py-4 border-b border-slate-100  last:border-0 group hover:bg-slate-50  px-2 rounded-xl transition-colors duration-700 ${isRecentlyAdded ? 'bg-blue-50/80  ring-2 ring-blue-500' : ''}`}>
                <div className="flex justify-between items-start gap-3 mb-2">
                    <div className="text-xs font-black text-slate-400 mt-1.5 min-w-[30px]">{autoNumber}</div>
                    <div className={`flex-1 ${paddingLeftClass}`}><AutoResizeTextarea value={item.description} onChange={(e) => updateItem(bill.id, item.id, { description: e.target.value })} disabled={readOnly} className="w-full bg-transparent outline-none text-sm font-medium text-slate-800" minHeight={40} />{item.variant && <div className="text-xs text-slate-500 italic mt-1">{item.variant}</div>}</div>
                    <div className="flex flex-col items-end gap-1"><div className="flex items-center gap-1 text-xs text-slate-400"><span>Kadar:</span><DimensionInput value={item.rate} onChange={(val) => updateItem(bill.id, item.id, { rate: val })} disabled={readOnly} className="w-20 text-right bg-transparent border-b border-slate-200 focus:border-blue-500 outline-none text-slate-700  font-mono" /></div><span className="text-xs bg-slate-100  px-2 py-0.5 rounded text-slate-500">{item.unit}</span></div>
                </div>
                <div className={`flex flex-col sm:flex-row items-start gap-3 bg-slate-50  p-2 rounded-lg ml-12`}>
                    <div className="flex flex-col gap-1 mt-0.5">
                        <button onClick={() => toggleGlobal(bill.id, item.id)} disabled={readOnly} className={`p-1.5 rounded-md transition-colors border ${item.isGlobal ? 'bg-blue-100 text-blue-600 border-blue-200' : 'bg-white  text-slate-400 border-slate-200  hover:border-slate-300'} ${readOnly ? 'cursor-not-allowed opacity-50' : ''}`}>
                            {item.isGlobal ? <Link className="w-4 h-4" /> : <Unlink className="w-4 h-4" />}
                        </button>
                        <button onClick={() => toggleCustomCalc(bill.id, item.id)} disabled={readOnly} className={`p-1.5 rounded-md transition-colors border ${item.isCustomCalc ? 'bg-indigo-100 text-indigo-600 border-indigo-200' : 'bg-white  text-slate-400 border-slate-200  hover:text-indigo-500'} ${readOnly ? 'cursor-not-allowed opacity-50' : ''}`}>
                            {item.isCustomCalc ? <List className="w-4 h-4" /> : <Type className="w-4 h-4" />}
                        </button>
                    </div>
                    {item.isCustomCalc ? (
                        <div className="flex-1 w-full flex items-center gap-2">
                            <input type="text" value={item.customCalc || ''} onChange={(e) => updateItem(bill.id, item.id, { customCalc: e.target.value })} disabled={readOnly} className="flex-1 text-xs bg-white  border border-slate-200  rounded px-2 py-1 font-mono text-slate-600" placeholder="e.g. 80 x 0.5 x 2" />
                            <div className="flex items-center gap-1 bg-white  rounded px-2 py-1 border border-slate-200">
                                <span className="text-[10px] font-bold text-slate-400">QTY</span>
                                <DimensionInput value={item.qty} onChange={(val) => updateItem(bill.id, item.id, { qty: val })} disabled={readOnly} className="w-16 text-right text-sm font-bold bg-transparent outline-none" />
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 w-full">
                            <div className="space-y-1">
                                {(item.calculationParts || []).map((part, pIdx) => renderCalculationPartRow(bill, item, part, pIdx))}
                            </div>
                            {!readOnly && (
                                <div className="flex items-center justify-between mt-2">
                                    <button onClick={() => addCalculationPart(bill.id, item.id)} className="text-[10px] flex items-center gap-1 text-blue-600 hover:text-blue-700 font-bold px-2 py-1 rounded hover:bg-blue-50">
                                        <PlusCircle className="w-3 h-3" /> Tambah Kiraan
                                    </button>
                                    <div className="font-mono font-bold text-blue-600 text-sm border-l border-slate-200  pr-2 px-2">= {item.qty}</div>
                                </div>
                            )}
                        </div>
                    )}
                    <div className="flex flex-col items-end gap-2 w-full sm:w-auto border-t sm:border-t-0 border-slate-200  pt-2 sm:pt-0 pl-2 border-l-0 sm:border-l">
                        <div className="text-right w-24">
                            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Jumlah</div>
                            <div className="font-bold text-slate-900">{formatCurrency(item.amount)}</div>
                        </div>
                        {!readOnly && (
                            <div className="mt-auto flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => moveItem(bill.id, item.id, 'up')} disabled={index === 0} className="p-1 text-slate-300 hover:text-blue-500 hover:bg-blue-50  rounded-lg transition-colors disabled:opacity-30">
                                    <ChevronUp className="w-4 h-4" />
                                </button>
                                <button onClick={() => moveItem(bill.id, item.id, 'down')} className="p-1 text-slate-300 hover:text-blue-500 hover:bg-blue-50  rounded-lg transition-colors disabled:opacity-30">
                                    <ChevronDown className="w-4 h-4" />
                                </button>
                                <button onClick={() => requestDeleteItem(bill.id, item, index)} className="p-1 text-slate-300 hover:text-red-500 hover:bg-red-50  rounded-lg transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const renderSidebarItem = (b: BQGroup, index: number, total: number, moveFn: (id: string, dir: 'up' | 'down') => void, deleteFn: (b: BQGroup) => void) => {
        const isActive = activeBillId === b.id;
        const { prefix, content } = parseTitle(b.title);
        return (
            <div key={b.id} onClick={() => setActiveBillId(b.id)} className={`w-full text-left p-3 rounded-xl text-xs transition-colors relative group cursor-pointer border ${isActive ? 'bg-gradient-to-br from-blue-500 to-cyan-600 text-white shadow-lg shadow-blue-500/20 border-blue-500 ring-1 ring-blue-500' : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200 hover:border-blue-300'}`}>
                <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                        {prefix && <div className={`text-[9px] font-black tracking-widest uppercase mb-1 ${isActive ? 'text-blue-100' : 'text-slate-400 group-hover:text-blue-600'}`}>{prefix}</div>}
                        <div className={`font-bold leading-snug line-clamp-2 ${isActive ? 'text-white' : 'text-slate-700'}`}>{content || b.title}</div>
                        <div className={`mt-2 text-[9px] font-mono flex items-center gap-2 ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>
                            <span className="bg-white/20 px-1.5 py-0.5 rounded">{b.items.length} items</span>
                        </div>
                    </div>
                    {!readOnly && (
                        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2 bg-white/90 rounded-lg p-0.5 shadow-sm">
                            <button onClick={(e) => { e.stopPropagation(); moveFn(b.id, 'up'); }} disabled={index === 0} className="p-1 hover:bg-slate-100 rounded disabled:opacity-30 text-slate-500"><ChevronUp className="w-3 h-3" /></button>
                            <button onClick={(e) => { e.stopPropagation(); moveFn(b.id, 'down'); }} disabled={index === total - 1} className="p-1 hover:bg-slate-100 rounded disabled:opacity-30 text-slate-500"><ChevronDown className="w-3 h-3" /></button>
                            <button type="button" onClick={(e) => { e.stopPropagation(); deleteFn(b); }} className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors mt-1"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const activeBillIndex = bills.findIndex(b => b.id === activeBillId);
    const activeBill = bills[activeBillIndex];

    const isTopBill = (b: BQGroup) => 
        b.title.toUpperCase().includes('INSURANS') || 
        b.title.toUpperCase().includes('PERMULAAN') || 
        b.title.toUpperCase().includes('AWALAN') || 
        b.id.toLowerCase().includes('permulaan') || 
        b.id.toLowerCase().includes('awalan');

    const billsByLocation: Record<string, BQGroup[]> = {};
    const permulaanBills: BQGroup[] = [];
    const otherBills: BQGroup[] = [];
    bills.forEach(pBill => {
        const b = { ...pBill };
        // Normalize locationIds for local processing
        const locs = b.locationIds || (b.locationId ? [b.locationId] : []);

        if (isTopBill(b)) {
            permulaanBills.push(b);
        } else if (locs.length > 0) {
            locs.forEach(lId => {
                if (!billsByLocation[lId]) billsByLocation[lId] = [];
                billsByLocation[lId].push(b);
            });
        } else {
            otherBills.push(b);
        }
    });

    const sortedLocationIds = Array.from(new Set(bills.filter(b => !isTopBill(b)).flatMap(b => b.locationIds || (b.locationId ? [b.locationId] : [])))) as string[];
    const categories = Array.from(new Set(bqLibrary.map(g => g.category)));

    const libraryGroups = (() => {
        const searchLower = librarySearchTerm.toLowerCase();
        const recentGroupIds = Array.from(new Set(recentItems.map(ri => ri.groupId)));
        const recentGroupsData = recentGroupIds.map(id => bqLibrary.find(g => g.id === id)).filter(Boolean) as PresetGroup[];

        if (librarySearchTerm) {
            // Global Search: Matches Group Title OR Item Description OR Variant Label (Item Selection)
            const matchesSearch = (g: PresetGroup) => 
                g.title.toLowerCase().includes(searchLower) ||
                g.items.some(item => 
                    item.description.toLowerCase().includes(searchLower) ||
                    (item.variants && item.variants.some(v => v.label.toLowerCase().includes(searchLower)))
                );

            const matchedRecent = recentGroupsData.filter(matchesSearch);
            const matchedLibrary = bqLibrary.filter(g =>
                matchesSearch(g) &&
                !matchedRecent.some(rg => rg.id === g.id)
            );

            // Filter items within each group to show only matching items,
            // unless the group title itself matches the search query.
            const filterGroupItems = (g: PresetGroup) => {
                const titleMatches = g.title.toLowerCase().includes(searchLower);
                if (titleMatches) {
                    return g;
                }
                return {
                    ...g,
                    items: g.items
                        .map(item => {
                            const descMatches = item.description.toLowerCase().includes(searchLower);
                            if (descMatches || !item.variants) {
                                return item;
                            }
                            const matchingVariants = item.variants.filter(v => v.label.toLowerCase().includes(searchLower));
                            if (matchingVariants.length > 0) {
                                return { ...item, variants: matchingVariants };
                            }
                            return null;
                        })
                        .filter(Boolean) as PresetItem[]
                };
            };

            return [
                ...matchedRecent.map(g => ({ ...filterGroupItems(g), isHistoryMatch: true })),
                ...matchedLibrary.map(g => filterGroupItems(g))
            ];
        }

        // Category View
        if (selectedCategory === 'HISTORY') {
            return recentGroupsData;
        }

        return bqLibrary.filter(g => g.category === selectedCategory);
    })();

    if (isPrintView) return null;

    return (
        <div className={`flex flex-col md:flex-row gap-4 items-start`}>
            {/* Editor Sidebar */}
            <div className="w-full md:w-72 flex flex-col gap-2 shrink-0 sticky top-24 max-h-[calc(100vh-8rem)]">
                <div className="bg-white/80  p-3 rounded-xl border border-slate-200  shadow-sm flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">Navigasi BQ</span>
                    {!readOnly && <button onClick={handleAddTemplate} className="p-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors" title="Tambah Template"><Plus className="w-4 h-4" /></button>}
                </div>
                <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-2 bg-white/40  rounded-xl p-2">
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
                                    {!readOnly && (<div className="flex items-center gap-0.5 opacity-0 group-hover/header:opacity-100 transition-opacity"><button onClick={(e) => { e.stopPropagation(); moveLocation(locId, 'up'); }} disabled={index === 0} className="p-1 hover:bg-slate-200  rounded disabled:opacity-30"><ChevronUp className="w-3 h-3" /></button><button onClick={(e) => { e.stopPropagation(); moveLocation(locId, 'down'); }} disabled={index === sortedLocationIds.length - 1} className="p-1 hover:bg-slate-200  rounded disabled:opacity-30"><ChevronDown className="w-3 h-3" /></button></div>)}
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
            <div className="flex-1 bg-white  rounded-xl shadow-inner flex flex-col w-full min-w-0">
                {activeBill ? (
                    <>
                        <div className="p-4 border-b border-slate-100  bg-slate-50/50  sticky top-20 z-20">
                            <div className="flex items-center justify-between mb-2">
                                <input value={activeBill.title} onChange={(e) => updateBillTitle(activeBill.id, e.target.value)} disabled={readOnly} className={`text-lg font-bold bg-transparent outline-none w-full text-slate-800  uppercase ${readOnly ? 'cursor-not-allowed' : ''}`} />
                                <div className="flex items-center gap-3">
                                    {!readOnly && isAdmin && (
                                        <button onClick={() => setIsCaptureModalOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors text-[10px] font-bold">
                                            <Bookmark className="w-3.5 h-3.5" />
                                            Template
                                        </button>
                                    )}
                                    <div className="text-right text-xs text-slate-400 shrink-0">Total: <span className="text-blue-600 font-bold text-sm">{formatCurrency(activeBill.items.reduce((s, i) => s + (i.amount || 0), 0))}</span></div>
                                </div>
                            </div>
                            {!isTopBill(activeBill) && (
                                <div className="flex flex-wrap items-center gap-2 mb-3 px-1">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-1 flex items-center gap-1"><MapPin className="w-3 h-3" /> Lokasi:</span>
                                    {locationRows.filter(r => r.lokasi).map(r => {
                                        const billLocs = activeBill.locationIds || (activeBill.locationId ? [activeBill.locationId] : []);
                                        const isSelected = billLocs.includes(r.id);
                                        return (
                                            <button
                                                key={r.id}
                                                onClick={() => {
                                                    if (isSelected) {
                                                        updateBillLocations(activeBill.id, billLocs.filter(id => id !== r.id));
                                                    } else {
                                                        updateBillLocations(activeBill.id, [...billLocs, r.id]);
                                                    }
                                                }}
                                                disabled={readOnly}
                                                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all border shrink-0 ${isSelected ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-white text-slate-400 border-slate-100 hover:border-blue-500 hover:text-blue-600'} ${readOnly ? 'cursor-not-allowed opacity-50' : ''}`}
                                            >
                                                {r.lokasi}
                                            </button>
                                        );
                                    })}
                                    {locationRows.filter(r => r.lokasi).length === 0 && <span className="text-[10px] text-slate-400 italic">Tiada lokasi ditakrifkan</span>}
                                </div>
                            )}
                            {activeBill && (
                                <div className={`mt-2 p-3 rounded-xl border transition-colors ${isDimsDirty ? 'bg-orange-50 border-orange-200' : 'bg-blue-50/50 border-blue-100'}`}>

                                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                                        <div className="flex items-center gap-2">
                                            {activeBill.items.some(i => i.type === 'HEADER') && (
                                                <button
                                                    onClick={toggleAllCollapse}
                                                    className="p-1.5 bg-white border border-slate-200 text-slate-500 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
                                                    title={activeBill.items.some(item => item.type === 'HEADER' && !item.isCollapsed) ? "Collapse All" : "Expand All"}
                                                >
                                                    {activeBill.items.some(item => item.type === 'HEADER' && !item.isCollapsed) ? (
                                                        <ChevronUp className="w-3.5 h-3.5" />
                                                    ) : (
                                                        <ChevronDown className="w-3.5 h-3.5" />
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="flex-1 p-4">
                            {activeBill.items.length === 0 ? (<div className="h-40 flex flex-col items-center justify-center text-slate-400"><FolderPlus className="w-10 h-10 mb-2 opacity-50" /><p className="text-sm">Tiada item dalam senarai ini.</p></div>) : (
                                <div className="space-y-2">
                                    {(() => {
                                        let currentLevel0Collapsed = false;
                                        let currentLevel1Collapsed = false;
                                        let totalWorkItemCount = 0;
                                        let pendingWarnings: { count: number, splitIdx: number }[] = [];
                                        const items: React.ReactNode[] = [];

                                        const renderWarning = (num: number, splitIdx: number) => {
                                            const isAmber = num === 8;
                                            const bgColor = isAmber ? 'bg-amber-50' : 'bg-red-50';
                                            const borderColor = isAmber ? 'border-amber-200' : 'border-red-200';
                                            const textColor = isAmber ? 'text-amber-600' : 'text-red-600';
                                            const dotColor = isAmber ? 'bg-amber-200' : 'bg-red-200';
                                            const text = isAmber
                                                ? 'Pecahan halaman mungkin berlaku di sini, disarankan untuk memulakan BIL NO baru'
                                                : 'Pecahan halaman disahkan berlaku di sini';

                                            return (
                                                <div key={`page-break-warning-${num}`} className="py-6 flex flex-col items-center gap-4">
                                                    <div className={`w-full flex items-center gap-4 ${isAmber ? 'animate-pulse' : ''}`}>
                                                        <div className={`flex-1 h-px ${dotColor}`}></div>
                                                        <div className={`flex items-center gap-2 px-4 py-1.5 ${bgColor} border ${borderColor} rounded-full text-[10px] font-bold ${textColor} uppercase tracking-widest shadow-sm`}>
                                                            <AlertTriangle className="w-3.5 h-3.5" />
                                                            {text}
                                                        </div>
                                                        <div className={`flex-1 h-px ${dotColor}`}></div>
                                                    </div>
                                                    {!readOnly && splitIdx !== -1 && (
                                                        <button
                                                            onClick={() => handleSplitBill(activeBill.id, splitIdx)}
                                                            className={`px-4 py-2 ${isAmber ? 'bg-amber-600 hover:bg-amber-700' : 'bg-red-600 hover:bg-red-700'} text-white text-[10px] font-bold rounded-lg shadow-md flex items-center gap-2 transition-all hover:scale-105`}
                                                        >
                                                            <PlusCircle className="w-4 h-4" />
                                                            Mula BIL NO baru dari "{activeBill.items[splitIdx].description}"
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        };

                                        let lastLevel0Index = -1;
                                        let lastLevel1Index = -1;
                                        activeBill.items.forEach((item, idx) => {
                                            const level = getItemLevel(item);
                                            if (level === 0) {
                                                lastLevel0Index = idx;
                                                lastLevel1Index = -1;
                                            } else if (level === 1) {
                                                lastLevel1Index = idx;
                                            }

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

                                            const currentSplitIdx = lastLevel0Index !== -1 ? lastLevel0Index : lastLevel1Index;

                                            // If this item is visible AND we have pending warnings from previously collapsed items,
                                            // render them before this item if it's a header.
                                            if (!isHidden && level < 2 && pendingWarnings.length > 0) {
                                                pendingWarnings.forEach(w => items.push(renderWarning(w.count, w.splitIdx)));
                                                pendingWarnings = [];
                                            }

                                            const renderedRow = renderItemRow(activeBill, item, idx, isHidden);
                                            if (renderedRow) {
                                                items.push(renderedRow);
                                            }

                                            // Count actual work items (not headers/notes)
                                            if (item.type === 'ITEM') {
                                                totalWorkItemCount++;

                                                // Page break indicators
                                                if (totalWorkItemCount === 8 || totalWorkItemCount === 9) {
                                                    if (isHidden) {
                                                        pendingWarnings.push({ count: totalWorkItemCount, splitIdx: currentSplitIdx });
                                                    } else {
                                                        items.push(renderWarning(totalWorkItemCount, currentSplitIdx));
                                                    }
                                                }
                                            }
                                        });

                                        // Render any remaining pending warnings at the end
                                        pendingWarnings.forEach(w => items.push(renderWarning(w.count, w.splitIdx)));

                                        return items;
                                    })()}
                                </div>
                            )}
                            {!readOnly && <button onClick={openAddItemModal} className="mt-4 w-full py-3 border-2 border-dashed border-slate-200  rounded-xl text-slate-400 font-bold text-sm hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50  transition-colors flex items-center justify-center gap-2" ><Plus className="w-4 h-4" /> Tambah Item</button>}
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8"><Layers className="w-16 h-16 mb-4 opacity-20" /><h3 className="text-lg font-bold text-slate-600">Tiada Senarai Dipilih</h3><p className="text-sm max-w-xs text-center mt-2">Pilih senarai dari navigasi sebelah kiri atau tambah template baru.</p>{!readOnly && <button onClick={handleAddTemplate} className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg">Tambah Template</button>}</div>
                )}
            </div>

            {/* --- MODALS --- */}
            {isAddItemModalOpen && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60  animate-fade-in" onClick={() => setIsAddItemModalOpen(false)}>
                    <div className="bg-white  rounded-[2.5rem] shadow-2xl max-w-4xl w-full h-[80vh] flex flex-col overflow-hidden border border-slate-200  transform scale-100 transition-colors animate-slide-up" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-slate-100  flex justify-between items-center bg-white  shrink-0">
                            <div className="flex items-center gap-3"><div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Plus className="w-5 h-5" /></div><div><h3 className="font-bold text-slate-900">Pilih Item dari Pustaka</h3><p className="text-xs text-slate-500">Klik butang [+] untuk menambah item ke dalam {activeBill?.title}</p></div></div>
                            <button onClick={() => setIsAddItemModalOpen(false)} className="p-2 hover:bg-slate-100  rounded-full text-slate-400 transition-colors"><X className="w-6 h-6" /></button>
                        </div>
                        <div className="flex-1 flex overflow-hidden">
                            <div className="w-64 bg-slate-50 border-r border-slate-100 p-4 space-y-1 overflow-y-auto custom-scrollbar shrink-0">
                                <button onClick={() => setSelectedCategory('HISTORY')} className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-colors mb-2 flex items-center gap-2 ${selectedCategory === 'HISTORY' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-blue-50'}`}>
                                    <History className="w-3.5 h-3.5" />
                                    Sejarah
                                </button>
                                <div className="h-px bg-slate-200 my-2 mx-2"></div>
                                {categories.map(cat => (<button key={cat} onClick={() => setSelectedCategory(cat)} className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-colors ${selectedCategory === cat ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-blue-50'}`}>{cat}</button>))}
                            </div>

                            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar bg-white">
                                <div className="space-y-6">
                                    {/* Search Bar */}
                                    <div className="sticky top-0 bg-white z-10 pb-4 mb-2 border-b border-slate-50 flex items-center justify-between gap-4">
                                        <div className="relative group flex-1">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                            <input
                                                type="text"
                                                placeholder="Cari kumpulan item (cth: Longkang, Cerucuk)..."
                                                value={librarySearchTerm}
                                                onChange={(e) => setLibrarySearchTerm(e.target.value)}
                                                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm focus:border-blue-500 focus:bg-white outline-none transition-all"
                                            />
                                            {librarySearchTerm && (
                                                <button
                                                    onClick={() => setLibrarySearchTerm('')}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 rounded-full text-slate-400 transition-colors"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            )}
                                        </div>
                                        {!librarySearchTerm && selectedCategory === 'HISTORY' && recentItems.length > 0 && (
                                            <button
                                                onClick={handleClearHistory}
                                                className="flex items-center gap-1.5 px-3 py-2 text-red-500 hover:bg-red-50 rounded-xl text-xs font-bold transition-colors shrink-0 border border-transparent hover:border-red-100"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" /> Padam Sejarah
                                            </button>
                                        )}
                                    </div>

                                    {libraryGroups.length > 0 ? (
                                        libraryGroups.map(group => (
                                            <div key={group.id} className="space-y-3">
                                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1 flex items-center gap-1.5">
                                                    {(selectedCategory === 'HISTORY' || (group as any).isHistoryMatch) && <Clock className="w-3 h-3 text-blue-500" />}
                                                    {group.title}
                                                </h4>
                                                <div className="grid grid-cols-1 gap-2">
                                                    {group.items.map(item => (
                                                        <div key={`${group.id}-${item.id}`} className="p-3 bg-slate-50  rounded-2xl border border-slate-100  transition-colors hover:border-blue-300  group/item">
                                                            <div className="flex justify-between items-start gap-4">
                                                                <div className="flex-1 min-w-0"><p className="text-sm font-bold text-slate-800  leading-tight">{item.description}</p>
                                                                    <div className="mt-2 flex gap-2 flex-wrap">
                                                                        {(!(item as any).variants || (item as any).variants.length === 0) ? (
                                                                            <button
                                                                                onClick={() => handleLibraryAddItem((item as any).sourceGroupId || group.id, item.id)}
                                                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-white  border border-slate-200  text-blue-600 text-[10px] font-bold rounded-lg hover:bg-blue-600 hover:text-white transition-colors shadow-sm"
                                                                            >
                                                                                <Plus className="w-3.5 h-3.5" /> Pilih Item
                                                                            </button>
                                                                        ) : (
                                                                            (item as any).variants.map((v: any) => (
                                                                                <button
                                                                                    key={v.id}
                                                                                    onClick={() => handleLibraryAddItem((item as any).sourceGroupId || group.id, item.id, v.id)}
                                                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white  border border-slate-200  text-blue-600 text-[10px] font-bold rounded-lg hover:bg-blue-600 hover:text-white transition-colors shadow-sm"
                                                                                >
                                                                                    <Plus className="w-3.5 h-3.5" /> {v.label}
                                                                                </button>
                                                                            ))
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <div className="text-right shrink-0">
                                                                    {(!item.variants || item.variants.length === 0) && (<><p className="text-[10px] font-bold text-slate-400 uppercase leading-none">Kadar</p><p className="font-mono font-bold text-blue-600 text-sm mt-1">{formatCurrency(item.rate || 0)}</p></>)}
                                                                    <span className="text-[10px] bg-slate-200  px-1.5 py-0.5 rounded text-slate-500 font-bold uppercase mt-2 inline-block">{item.unit}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                                            <Search className="w-12 h-12 mb-4 opacity-10" />
                                            <p className="text-sm font-medium">Tiada item dijumpai untuk "{librarySearchTerm}"</p>
                                            <button onClick={() => setLibrarySearchTerm('')} className="mt-2 text-xs text-blue-600 font-bold hover:underline">Kosongkan carian</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {isTemplateModalOpen && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60  animate-fade-in" onClick={() => setIsTemplateModalOpen(false)}>
                    <div className="bg-white  rounded-[2.5rem] shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col border border-slate-200  transform scale-100 transition-colors animate-slide-up relative overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-blue-500 to-cyan-500"></div>
                        <div className="p-8 pb-4 shrink-0">
                            <div className="flex justify-between items-center">
                                <div><h3 className="text-2xl font-bold text-slate-900">Template Wizard</h3><p className="text-sm text-slate-500">Pilih template permulaan atau bina secara manual.</p></div>
                                <div className="flex items-center gap-2"><span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step === 1 ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-600'}`}>1</span><div className="w-8 h-0.5 bg-slate-100"></div><span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step === 2 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>2</span></div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto px-8 pb-8 custom-scrollbar">
                            {step === 1 ? (
                                <div className="space-y-6 animate-fade-in">
                                    <div className="sticky top-0 bg-white z-10 pb-4 mb-2">
                                        <div className="relative group">
                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                            <input
                                                type="text"
                                                placeholder="Cari template..."
                                                value={templateSearchTerm}
                                                onChange={(e) => setTemplateSearchTerm(e.target.value)}
                                                className="w-full pl-12 pr-10 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-[1.25rem] text-sm focus:border-blue-500 focus:bg-white outline-none transition-all shadow-sm"
                                                autoFocus
                                            />
                                            {templateSearchTerm && (
                                                <button
                                                    onClick={() => setTemplateSearchTerm('')}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 hover:bg-slate-200 rounded-full text-slate-400 transition-colors"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {(() => {
                                            const filtered = bqTemplates.filter(tpl =>
                                                tpl.title.toLowerCase().includes(templateSearchTerm.toLowerCase()) ||
                                                tpl.subtitle.toLowerCase().includes(templateSearchTerm.toLowerCase())
                                            );

                                            if (filtered.length === 0) {
                                                return (
                                                    <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-400">
                                                        <Search className="w-16 h-16 mb-4 opacity-10" />
                                                        <p className="text-lg font-medium text-slate-500">Tiada template dijumpai</p>
                                                        <p className="text-sm">Cuba carian lain atau semak ejaan anda.</p>
                                                        <button onClick={() => setTemplateSearchTerm('')} className="mt-4 text-blue-600 font-bold hover:underline">Kosongkan carian</button>
                                                    </div>
                                                );
                                            }

                                            return filtered.map(tpl => {
                                                const IconComp = ICON_MAP[tpl.icon as keyof typeof ICON_MAP] || FileText;
                                                const isSelected = selectedTemplate?.id === tpl.id;
                                                const colorClass = getColorStyles(tpl.color);

                                                return (
                                                    <div key={tpl.id} onClick={() => { setSelectedTemplate(tpl); if (tpl.key === 'PERMULAAN_BASIC' || tpl.key === 'PERMULAAN_EMPTY') { handleFinishTemplate(tpl); } else { setStep(2); } }} className={`p-6 rounded-[2rem] border-2 cursor-pointer transition-colors hover:scale-[1.02] flex items-center gap-6 group ${isSelected ? 'border-blue-500 bg-blue-50/50' : 'border-slate-100 bg-slate-50/30 hover:border-blue-200'}`}>
                                                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:rotate-12 ${colorClass}`}><IconComp className="w-8 h-8" /></div>
                                                        <div className="flex-1 min-w-0"><h4 className="font-bold text-slate-800  text-lg">{tpl.title}</h4><p className="text-xs text-slate-500  mt-1">{tpl.subtitle}</p></div>
                                                        <ChevronRight className={`w-5 h-5 transition-transform ${isSelected ? 'text-blue-500 translate-x-1' : 'text-slate-300'}`} />
                                                    </div>
                                                );
                                            });
                                        })()}
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-8 animate-fade-in">
                                    <div className="bg-slate-50  p-6 rounded-3xl border border-slate-100  shadow-inner">
                                        <div className="flex items-center gap-3 mb-6"><div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md"><MapPin className="w-5 h-5" /></div><div><h4 className="font-bold text-slate-900">Konfigurasi Lokasi</h4><p className="text-xs text-slate-500">Pilih lokasi projek untuk template ini.</p></div></div>
                                        <div className="grid grid-cols-1 gap-8">
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 pl-1">Pilih Lokasi-lokasi</label>
                                                <div className={`grid grid-cols-2 gap-2 p-3 rounded-xl bg-white border-2 transition-colors ${templateError && templateLocations.length === 0 ? 'border-red-400 animate-shake' : 'border-slate-100 focus-within:border-blue-500'}`}>
                                                    {locationRows.filter(r => r.lokasi).map(row => {
                                                        const isSelected = templateLocations.includes(row.id);
                                                        return (
                                                            <button
                                                                key={row.id}
                                                                onClick={() => {
                                                                    if (isSelected) {
                                                                        setTemplateLocations(prev => prev.filter(id => id !== row.id));
                                                                    } else {
                                                                        setTemplateLocations(prev => [...prev, row.id]);
                                                                    }
                                                                }}
                                                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all border-2 ${isSelected ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-100' : 'bg-slate-50 text-slate-500 border-slate-100 hover:border-blue-200'}`}
                                                            >
                                                                <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center border ${isSelected ? 'bg-white border-white' : 'bg-white border-slate-300'}`}>
                                                                    {isSelected && <Check className="w-2.5 h-2.5 text-blue-600 stroke-[4]" />}
                                                                </div>
                                                                <span className="truncate">{row.lokasi}</span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                                {templateError && templateLocations.length === 0 && <p className="text-[10px] text-red-500 font-bold mt-1 ml-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Sekurang-kurangnya satu lokasi diperlukan.</p>}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-4 pt-4">
                                        <button onClick={() => setStep(1)} className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-colors flex items-center justify-center gap-2 shadow-sm">
                                            <RotateCcw className="w-5 h-5" /> Kembali
                                        </button>
                                        <button onClick={() => handleFinishTemplate()} className="flex-[2] py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 hover:shadow-xl shadow-blue-500/20 transition-colors flex items-center justify-center gap-2">
                                            <Play className="w-5 h-5" /> Jana Template
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}
            {isLinkModalOpen && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60  animate-fade-in" onClick={() => setIsLinkModalOpen(false)}>
                    <div className="bg-white  rounded-[2.5rem] shadow-2xl max-w-md w-full p-8 border border-slate-200  transform scale-100 transition-colors animate-slide-up relative overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-cyan-500"></div>
                        <div className="mb-6">
                            <h3 className="text-xl font-bold text-slate-900  flex items-center gap-2">
                                <Link className="w-5 h-5 text-blue-600" />
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
                                        className="w-full text-left p-4 rounded-2xl border border-slate-100  bg-slate-50/50  hover:border-blue-500 hover:bg-blue-50  transition-colors group"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-blue-600 transition-colors">{parseTitle(b.title).prefix}</div>
                                                <div className="text-sm font-bold text-slate-700">{parseTitle(b.title).content || b.title}</div>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
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

                        <button onClick={() => setIsLinkModalOpen(false)} className="w-full py-3 bg-slate-100  text-slate-600  font-bold rounded-xl hover:bg-slate-200 transition-colors">
                            Batal
                        </button>
                    </div>
                </div>,
                document.body
            )}

            {isGlobalLinkModalOpen && createPortal(
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 animate-fade-in" onClick={() => setIsGlobalLinkModalOpen(null)}>
                    <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-sm w-full p-8 border border-slate-200 animate-slide-up relative overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-cyan-500"></div>
                        <div className="mb-6">
                            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                <Link className="w-5 h-5 text-blue-600" />
                                Pilih Global Calculation
                            </h3>
                            <p className="text-sm text-slate-500 mt-1">Hubungkan baris kiraan ini dengan salah satu set Global Calculation.</p>
                        </div>
                        <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar mb-6">
                            <button
                                onClick={() => {
                                    updateCalculationPart(activeBillId!, isGlobalLinkModalOpen.itemId, isGlobalLinkModalOpen.partId, { isGlobal: false, globalIndex: undefined });
                                    setIsGlobalLinkModalOpen(null);
                                }}
                                className="w-full text-left p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:border-red-500 hover:bg-red-50 transition-all group flex items-center justify-between"
                            >
                                <span className="font-bold text-slate-700">Tiada Hubungan (Manual)</span>
                                <Unlink className="w-4 h-4 text-slate-300 group-hover:text-red-500" />
                            </button>

                            <div className="h-px bg-slate-100 my-2"></div>

                            {localDimsArray.map((dims, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => {
                                        updateCalculationPart(activeBillId!, isGlobalLinkModalOpen.itemId, isGlobalLinkModalOpen.partId, { isGlobal: true, globalIndex: idx, length: dims.length, width: dims.width, depth: dims.depth });
                                        setIsGlobalLinkModalOpen(null);
                                    }}
                                    className="w-full text-left p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:border-blue-500 hover:bg-blue-50 transition-all group flex items-center justify-between"
                                >
                                    <div>
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-blue-600 transition-colors">Set Global {idx + 1}</div>
                                        <div className="font-bold text-slate-700">{dims.label || `Kiraan ${idx + 1}`}</div>
                                        <div className="text-[10px] text-slate-400 mt-1 font-mono">P:{dims.length} L:{dims.width} T:{dims.depth}</div>
                                    </div>
                                    <Link className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
                                </button>
                            ))}
                        </div>
                        <button onClick={() => setIsGlobalLinkModalOpen(null)} className="w-full py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors">
                            Batal
                        </button>
                    </div>
                </div>,
                document.body
            )}

            {isCaptureModalOpen && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60  animate-fade-in" onClick={() => setIsCaptureModalOpen(false)}>
                    <div className="bg-white  rounded-[2rem] shadow-2xl max-w-md w-full p-8 border border-slate-200  transform scale-100 transition-colors animate-slide-up relative" onClick={e => e.stopPropagation()}>
                        <div className="mb-6">
                            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-4">
                                <Bookmark className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900">Simpan Template</h3>
                            <p className="text-sm text-slate-500 mt-1">Simpan struktur dan item dalam senarai ini sebagai template untuk kegunaan masa depan.</p>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 pl-1">Nama Template</label>
                                <input
                                    type="text"
                                    value={newTemplateName}
                                    onChange={(e) => setNewTemplateName(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border-2 border-slate-100 focus:border-indigo-500 outline-none font-bold text-sm transition-colors"
                                    placeholder="cth: TEMPLATE LONGKANG V2"
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 pl-1">Keterangan (Pilihan)</label>
                                <input
                                    type="text"
                                    value={newTemplateSubtitle}
                                    onChange={(e) => setNewTemplateSubtitle(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border-2 border-slate-100 focus:border-indigo-500 outline-none text-sm transition-colors"
                                    placeholder="cth: Khas untuk kawasan berbukit..."
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-8">
                            <button onClick={() => setIsCaptureModalOpen(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors">Batal</button>
                            <button onClick={handleCaptureTemplate} disabled={!newTemplateName.trim()} className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed">Simpan</button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {deleteConfirm?.isOpen && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50  animate-fade-in" onClick={() => setDeleteConfirm(null)}>
                    <div className="bg-white  rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-200  transform scale-100 transition-colors animate-slide-up relative" onClick={e => e.stopPropagation()}>
                        <div className="flex flex-col items-center text-center pt-2">
                            <div className="w-20 h-20 bg-red-50  rounded-full flex items-center justify-center mb-6 text-red-500"><div className="w-14 h-14 bg-red-100  rounded-full flex items-center justify-center"><AlertTriangle className="w-8 h-8 stroke-[1.5]" /></div></div>
                            <h3 className="text-xl font-bold text-slate-900  mb-2">Padam {deleteConfirm.type === 'BILL' ? 'Senarai' : 'Item'}?</h3>
                            <p className="text-slate-500  mb-8 text-sm leading-relaxed px-4">Adakah anda pasti mahu memadam <span className="font-bold text-slate-900  block mt-1 p-2 bg-slate-50  rounded-lg border border-slate-200  break-words">{deleteConfirm.title}</span>{deleteConfirm.type === 'HEADER' && deleteConfirm.count && deleteConfirm.count > 0 && (<span className="mt-2 block text-xs text-red-500 font-bold">Nota: Ini akan memadam {deleteConfirm.count} item di bawahnya.</span>)}</p>
                            <div className="flex gap-3 w-full"><button onClick={() => setDeleteConfirm(null)} className="flex-1 py-3.5 px-4 bg-white  text-slate-700  rounded-xl font-bold hover:bg-slate-50  transition-colors border border-slate-200  shadow-sm">Batal</button><button onClick={performDelete} className="flex-1 py-3.5 px-4 rounded-xl font-bold text-white transition-colors flex items-center justify-center gap-2 shadow-lg bg-red-600 hover:bg-red-700 shadow-red-600/30">Ya, Padam</button></div>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {moveTarget && (
                <MoveItemModal
                    isOpen={!!moveTarget}
                    onClose={() => setMoveTarget(null)}
                    description={moveTarget.description}
                    bills={bills}
                    currentBillId={moveTarget.billId}
                    onMove={(targetBillId) => moveItemToDifferentBill(moveTarget.billId, targetBillId, moveTarget.itemId)}
                    themeColor="blue"
                />
            )}
        </div>
    );
};

export default BQEditor;