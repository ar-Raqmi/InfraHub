
import React, { useState, useEffect } from 'react';
import { BQGroup, BQItem, formatCurrency, GlobalDimensions, Project } from '../types';
import { Plus, Trash2, Printer, Save, FileText, ArrowRight, ArrowLeft, Settings, Check, ArrowUp, ArrowDown, Type, Calculator, PlusCircle, StickyNote } from 'lucide-react';

interface BQEditorProps {
  initialData?: BQGroup[];
  initialDims?: GlobalDimensions;
  onSave: (data: BQGroup[], dims: GlobalDimensions) => void;
  projectData: Project;
}

const uuid = () => Math.random().toString(36).substr(2, 9);

// --- PRESET TEMPLATES ---
const LONGKANG_TEMPLATE: BQGroup[] = [
  {
    id: 'bil-1',
    title: 'BIL NO. 1 - KERJA-KERJA PERMULAAN',
    items: [
      { id: uuid(), description: '1.0 INSURAN', unit: '', qty: 0, rate: 0, amount: 0, isHeader: true },
      { id: uuid(), description: 'Menyediakan polisi insuran berikut bagi merangkumi tempoh pekerjaan yang perlu seperti insuran tanggungan awam (Public Liability), insuran pampasan pekerja (Workmen\'s Compensation) dan SOCSO', unit: '', qty: 0, rate: 0, amount: 0, isNote: true },
      { id: uuid(), description: 'Nota: Liputan (coverage) minima insuran bagi pampasan adalah 30% daripada nilai kerja jika sekiranya pemborong tidak dapat mengadakan Nombor Pendaftaran PERKESO. Liputan bagi Insurans Tanggungan Umum adalah seperti berikut :-', unit: '', qty: 0, rate: 0, amount: 0, isNote: true },
      { id: uuid(), description: 'i. Bagi nilai kerja yang kurang RM 25,000.00. Liputan minima adalah RM 10,000.00\nii. Bagi nilai kerja diantara RM25,000.00 hingga RM 50,000.00. Liputan minima adalah RM 25,000.00\niii. Bagi nilai kerja diantara RM50,000.00 hingga RM 100,000.00. Liputan minima adalah RM 50,000.00', unit: 'L/S', qty: 1, rate: 340.00, amount: 340.00 },
      
      { id: uuid(), description: '2.0 PELAN PENGURUSAN LALULINTAS (TRAFFIC MANAGEMENT)', unit: '', qty: 0, rate: 0, amount: 0, isHeader: true },
      { id: uuid(), description: 'Membekal dan menyediakan jentera alat pengangkutan pekerja, papan tanda isyarat lalu lintas sementara...', unit: 'L/S', qty: 1, rate: 1275.00, amount: 1275.00 },

      { id: uuid(), description: '3.0 LAPORAN BERGAMBAR', unit: '', qty: 0, rate: 0, amount: 0, isHeader: true },
      { id: uuid(), description: 'Membekalkan laporan bergambar mengikut proses pembinaan...', unit: 'L/S', qty: 1, rate: 255.00, amount: 255.00 },
    ]
  },
  {
    id: 'bil-2',
    title: 'BIL NO.2- BUTIRAN KERJA BAIKPULIH LONGKANG',
    items: [
      { id: uuid(), description: '1.0 KERJA PENGOREKAN', unit: '', qty: 0, rate: 0, amount: 0, isHeader: true },
      { id: uuid(), description: 'Kerja-kerja menggali dan membuang tembok longkang sedia ada...', unit: '', qty: 0, rate: 0, amount: 0, isNote: true },
      { id: uuid(), description: 'i. Dengan tangan', unit: '', qty: 0, rate: 0, amount: 0, isNote: true },
      // SYNCED ITEMS
      { 
        id: uuid(), description: '', unit: 'M3', qty: 0, rate: 53.40, amount: 0, 
        isCalculation: true, isSynced: true, dimCount: 1,
        includeLength: true, includeWidth: true, includeDepth: true 
      },

      { id: uuid(), description: '2.0 LEAN CONCRETE', unit: '', qty: 0, rate: 0, amount: 0, isHeader: true },
      { id: uuid(), description: 'Kerja-kerja membekal dan memadat konkrit tidak bertetulang...', unit: '', qty: 0, rate: 0, amount: 0, isNote: true },
      { 
        id: uuid(), description: '', unit: 'M2', qty: 0, rate: 27.35, amount: 0, 
        isCalculation: true, isSynced: true, dimCount: 1, 
        includeLength: true, includeWidth: true, includeDepth: false // Area only (P x L)
      },

      { id: uuid(), description: '3.0 REINFORCEMENT', unit: '', qty: 0, rate: 0, amount: 0, isHeader: true },
      { id: uuid(), description: 'Kerja-kerja membekal, memasang, membengkok dan memotong kepingan jejaring (BRC)...', unit: '', qty: 0, rate: 0, amount: 0, isNote: true },
      { 
        id: uuid(), description: '', unit: 'M2', qty: 0, rate: 30.30, amount: 0, 
        isCalculation: true, isSynced: true, dimCount: 1, 
        includeLength: true, includeWidth: true, includeDepth: false // Area only
      },
    ]
  }
];

// --- COMPONENTS ---

// BQ Item Card Component for clean re-rendering and input management
const BQItemCard = ({ 
  item, 
  globalDims, 
  onUpdate, 
  onMove, 
  onDelete, 
  onInsertAfter, 
  index, 
  isLast 
}: { 
  item: BQItem, 
  globalDims: GlobalDimensions,
  onUpdate: (updates: Partial<BQItem>) => void, 
  onMove: (dir: 'up' | 'down') => void, 
  onDelete: () => void, 
  onInsertAfter: () => void,
  index: number,
  isLast: boolean
}) => {
  const isNoteOrHeader = item.isHeader || item.isNote;
  
  // Local state for inputs to allow smooth decimal typing
  const [inputs, setInputs] = useState({
    dimLength: item.dimLength?.toString() || '',
    dimWidth: item.dimWidth?.toString() || '',
    dimDepth: item.dimDepth?.toString() || '',
    dimCount: item.dimCount?.toString() || '',
    qty: item.qty?.toString() || '',
    rate: item.rate?.toString() || '',
    unit: item.unit || ''
  });

  // Sync inputs when item prop changes externally (e.g. calculation update)
  useEffect(() => {
    if (document.activeElement?.tagName !== 'INPUT') {
      setInputs(prev => ({
        ...prev,
        qty: item.qty?.toString() || '',
        rate: item.rate?.toString() || '',
        dimLength: item.dimLength?.toString() || '',
        dimWidth: item.dimWidth?.toString() || '',
        dimDepth: item.dimDepth?.toString() || '',
        dimCount: item.dimCount?.toString() || '',
      }));
    } else {
        if (item.isCalculation) {
             setInputs(prev => ({ ...prev, qty: item.qty?.toString() || '' }));
        }
    }
  }, [item.qty, item.amount, item.dimLength, item.dimWidth, item.dimDepth, item.dimCount, item.rate]);

  const handleInput = (field: keyof typeof inputs, value: string, isNumber = false) => {
     setInputs(prev => ({ ...prev, [field]: value }));
     if (isNumber) {
        const num = parseFloat(value);
        if (!isNaN(num)) {
           onUpdate({ [field]: num });
        } else if (value === '') {
           onUpdate({ [field]: 0 });
        }
     } else {
        onUpdate({ [field]: value });
     }
  };

  const isHeader = item.isHeader;
  const wrapperClass = isHeader ? 'mb-4' : 'ml-4 md:ml-8 mb-4';
  
  let cardClass = "p-4 rounded-xl shadow-sm border flex gap-4 items-start transition-all ";
  if (isHeader) {
     cardClass += "bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600";
  } else if (item.isCalculation) {
     cardClass += "bg-indigo-50/50 border-indigo-200 dark:bg-indigo-900/10 dark:border-indigo-800";
  } else {
     cardClass += "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700";
  }

  return (
    <div className={`relative group transition-all duration-300 ${wrapperClass}`}>
       <div className={cardClass}>
          {/* Left Controls - Type Toggle */}
          <div className="flex flex-col gap-1 pt-1">
            <div className="flex flex-col bg-slate-100 dark:bg-slate-700/50 rounded-lg p-1 gap-1">
                <button 
                    type="button"
                    onClick={() => onUpdate({ isCalculation: false, isHeader: false, isNote: false })}
                    className={`p-1.5 rounded-md transition-all ${!item.isCalculation && !item.isHeader && !item.isNote ? 'bg-white dark:bg-slate-600 shadow-sm text-indigo-600 dark:text-indigo-300' : 'text-slate-400 hover:text-slate-600'}`}
                    title="Item Biasa"
                >
                    <Type className="w-3.5 h-3.5" />
                </button>
                <button 
                    type="button"
                    onClick={() => onUpdate({ isCalculation: false, isHeader: false, isNote: true })}
                    className={`p-1.5 rounded-md transition-all ${item.isNote ? 'bg-white dark:bg-slate-600 shadow-sm text-indigo-600 dark:text-indigo-300' : 'text-slate-400 hover:text-slate-600'}`}
                    title="Nota"
                >
                    <StickyNote className="w-3.5 h-3.5" />
                </button>
                <button 
                    type="button"
                    onClick={() => onUpdate({ isCalculation: false, isHeader: true, isNote: false })}
                    className={`p-1.5 rounded-md transition-all ${item.isHeader ? 'bg-white dark:bg-slate-600 shadow-sm text-indigo-600 dark:text-indigo-300' : 'text-slate-400 hover:text-slate-600'}`}
                    title="Tajuk"
                >
                    <span className="text-[10px] font-bold">H</span>
                </button>
                <button 
                    type="button"
                    onClick={() => onUpdate({ isCalculation: true, isHeader: false, isNote: false })}
                    className={`p-1.5 rounded-md transition-all ${item.isCalculation ? 'bg-white dark:bg-slate-600 shadow-sm text-indigo-600 dark:text-indigo-300' : 'text-slate-400 hover:text-slate-600'}`}
                    title="Kiraan Auto"
                >
                    <Calculator className="w-3.5 h-3.5" />
                </button>
            </div>
          </div>

          <div className="flex-1 grid grid-cols-12 gap-4">
            <div className={isNoteOrHeader ? "col-span-12" : "col-span-8"}>
                <textarea 
                  value={item.description}
                  onChange={e => onUpdate({ description: e.target.value })}
                  className={`w-full bg-transparent resize-none outline-none dark:text-white ${item.isHeader ? 'font-bold uppercase text-slate-900 tracking-wide' : item.isNote ? 'text-slate-600 dark:text-slate-400 italic' : 'font-medium text-sm text-slate-700'}`}
                  rows={item.isHeader ? 1 : 2}
                  placeholder={item.isNote ? "Tulis nota di sini..." : "Keterangan..."}
                />
                
                {/* Advanced Calculation Controls */}
                {item.isCalculation && (
                  <div className="flex flex-col gap-2 mt-3 p-3 bg-white/50 dark:bg-black/20 rounded-lg border border-slate-200 dark:border-slate-700">
                      
                      {/* Formula Toggles */}
                      <div className="flex items-center gap-4 text-xs font-bold text-slate-500 mb-1">
                          <span className="uppercase tracking-wider">Formula:</span>
                          <label className="flex items-center gap-1.5 cursor-pointer hover:text-indigo-600">
                             <input 
                               type="checkbox" 
                               checked={item.includeLength !== false} 
                               onChange={e => onUpdate({ includeLength: e.target.checked })} 
                               className="rounded text-indigo-600 focus:ring-indigo-500"
                             />
                             <span>P (Panjang)</span>
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer hover:text-indigo-600">
                             <input 
                               type="checkbox" 
                               checked={item.includeWidth !== false} 
                               onChange={e => onUpdate({ includeWidth: e.target.checked })}
                               className="rounded text-indigo-600 focus:ring-indigo-500" 
                             />
                             <span>L (Lebar)</span>
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer hover:text-indigo-600">
                             <input 
                               type="checkbox" 
                               checked={item.includeDepth !== false} 
                               onChange={e => onUpdate({ includeDepth: e.target.checked })}
                               className="rounded text-indigo-600 focus:ring-indigo-500" 
                             />
                             <span>T (Tebal)</span>
                          </label>
                      </div>

                      <div className="flex items-center flex-wrap gap-3">
                          {/* Sync Button */}
                          <div 
                              onClick={() => onUpdate({ isSynced: !item.isSynced })}
                              className={`flex items-center gap-1.5 cursor-pointer px-2 py-1 rounded text-xs font-bold transition-all select-none border ${item.isSynced ? 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900 dark:text-indigo-300 dark:border-indigo-700' : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-700 dark:text-slate-400 dark:border-slate-600'}`}
                          >
                            {item.isSynced ? <Check className="w-3 h-3"/> : null} 
                            Sync Global
                          </div>
                          
                          {/* Dimension Inputs */}
                          <div className="flex gap-2 items-center">
                              {/* Only show inputs if the dimension is included in calculation */}
                              {(item.includeLength !== false) && (
                                <div className={`flex items-center gap-1 ${item.isSynced ? 'opacity-50' : ''}`} title={item.isSynced ? `Global: ${globalDims.length}` : ''}>
                                    <span className="text-[10px] font-bold text-slate-400">P</span>
                                    <input 
                                      type="text" 
                                      placeholder={item.isSynced ? globalDims.length.toString() : "P"} 
                                      value={item.isSynced ? '' : inputs.dimLength} 
                                      disabled={item.isSynced}
                                      className="w-12 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded px-1 py-0.5 text-xs disabled:bg-slate-100 dark:disabled:bg-slate-800/50" 
                                      onChange={e => handleInput('dimLength', e.target.value, true)} 
                                    />
                                </div>
                              )}

                              {(item.includeWidth !== false) && (
                                <div className={`flex items-center gap-1 ${item.isSynced ? 'opacity-50' : ''}`} title={item.isSynced ? `Global: ${globalDims.width}` : ''}>
                                    <span className="text-[10px] font-bold text-slate-400">L</span>
                                    <input 
                                      type="text" 
                                      placeholder={item.isSynced ? globalDims.width.toString() : "L"} 
                                      value={item.isSynced ? '' : inputs.dimWidth} 
                                      disabled={item.isSynced}
                                      className="w-12 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded px-1 py-0.5 text-xs disabled:bg-slate-100 dark:disabled:bg-slate-800/50" 
                                      onChange={e => handleInput('dimWidth', e.target.value, true)} 
                                    />
                                </div>
                              )}

                              {(item.includeDepth !== false) && (
                                <div className={`flex items-center gap-1 ${item.isSynced ? 'opacity-50' : ''}`} title={item.isSynced ? `Global: ${globalDims.depth}` : ''}>
                                    <span className="text-[10px] font-bold text-slate-400">T</span>
                                    <input 
                                      type="text" 
                                      placeholder={item.isSynced ? globalDims.depth.toString() : "T"} 
                                      value={item.isSynced ? '' : inputs.dimDepth} 
                                      disabled={item.isSynced}
                                      className="w-12 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded px-1 py-0.5 text-xs disabled:bg-slate-100 dark:disabled:bg-slate-800/50" 
                                      onChange={e => handleInput('dimDepth', e.target.value, true)} 
                                    />
                                </div>
                              )}
                          </div>
                          
                          <div className="h-4 w-px bg-slate-300 dark:bg-slate-600 mx-1"></div>
                          
                          <div className="flex items-center gap-1">
                              <span className="text-[10px] font-bold text-slate-400">Bil</span>
                              <input 
                                type="text" 
                                placeholder="1" 
                                value={inputs.dimCount} 
                                className="w-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded px-1 py-0.5 text-xs text-center" 
                                onChange={e => handleInput('dimCount', e.target.value, true)} 
                              />
                          </div>
                      </div>
                  </div>
                )}
            </div>
            
            {!isNoteOrHeader && (
              <>
                <div className="col-span-1">
                    <input 
                      value={inputs.unit} 
                      onChange={e => handleInput('unit', e.target.value)} 
                      className="w-full bg-slate-50 dark:bg-slate-700 dark:text-white rounded p-2 text-center text-xs" 
                      placeholder="Unit" 
                    />
                </div>
                <div className="col-span-1">
                    <input 
                      value={inputs.qty} 
                      readOnly={item.isCalculation} 
                      onChange={e => handleInput('qty', e.target.value, true)} 
                      className="w-full bg-slate-50 dark:bg-slate-700 dark:text-white rounded p-2 text-center text-xs font-bold" 
                      placeholder="Qty" 
                    />
                </div>
                <div className="col-span-1">
                    <input 
                      value={inputs.rate} 
                      onChange={e => handleInput('rate', e.target.value, true)} 
                      className="w-full bg-slate-50 dark:bg-slate-700 dark:text-white rounded p-2 text-right text-xs" 
                      placeholder="RM" 
                    />
                </div>
                <div className="col-span-1 text-right font-bold text-sm pt-2 dark:text-white">
                    {formatCurrency(item.amount)}
                </div>
              </>
            )}
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button type="button" onClick={(e) => { e.stopPropagation(); onMove('up'); }} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-400 hover:text-indigo-500" title="Gerak Atas">
                  <ArrowUp className="w-4 h-4" />
              </button>
              <button type="button" onClick={(e) => { e.stopPropagation(); onMove('down'); }} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-400 hover:text-indigo-500" title="Gerak Bawah">
                  <ArrowDown className="w-4 h-4" />
              </button>
              <button type="button" onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-slate-400 hover:text-red-500 mt-2" title="Padam">
                  <Trash2 className="w-4 h-4" />
              </button>
          </div>
       </div>

       {/* Insert In-Between Button - Pointer events fix */}
       <div className="h-4 -my-2 relative z-10 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity group/insert pointer-events-none">
          <button type="button" onClick={onInsertAfter} className="bg-indigo-600 text-white rounded-full p-1 shadow-lg transform scale-0 group-hover/insert:scale-100 transition-transform duration-200 pointer-events-auto" title="Masukkan item di sini">
              <Plus className="w-3 h-3" />
          </button>
       </div>
    </div>
  );
};

// --- MAIN COMPONENT ---

const STEPS = ['Pilih Template', 'Tetapan Ukuran', 'Edit BQ', 'Papar & Cetak'];

const BQEditor: React.FC<BQEditorProps> = ({ initialData, initialDims, onSave, projectData }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [groups, setGroups] = useState<BQGroup[]>(initialData || []);
  const [globalDims, setGlobalDims] = useState<GlobalDimensions>(initialDims || { length: 80, width: 0.6, depth: 0.7 });
  const [activeGroupIndex, setActiveGroupIndex] = useState(0);
  
  // Local state for Step 2
  const [dimInputs, setDimInputs] = useState({
     length: globalDims.length.toString(),
     width: globalDims.width.toString(),
     depth: globalDims.depth.toString()
  });

  // Initialize
  useEffect(() => {
    if (initialData && initialData.length > 0) {
      setCurrentStep(2);
    }
  }, [initialData]);

  // Recalculate Logic
  useEffect(() => {
    const newGroups = groups.map(group => ({
      ...group,
      items: group.items.map(item => {
        if (item.isCalculation) {
          // Determine which dimensions to use based on checkboxes (default to true if undefined)
          const useP = item.includeLength !== false;
          const useL = item.includeWidth !== false;
          const useT = item.includeDepth !== false;

          const valP = item.isSynced ? globalDims.length : (item.dimLength || 0);
          const valL = item.isSynced ? globalDims.width : (item.dimWidth || 0);
          const valT = item.isSynced ? globalDims.depth : (item.dimDepth || 0);
          const count = item.dimCount || 1;

          let qty = 1;
          const parts = [];

          if (useP) {
             if (valP > 0) { qty *= valP; parts.push(`${valP}m(P)`); }
          }
          if (useL) {
             if (valL > 0) { qty *= valL; parts.push(`${valL}m(L)`); }
          }
          if (useT) {
             if (valT > 0) { qty *= valT; parts.push(`${valT}m(T)`); }
          }

          if (count > 1) { qty *= count; parts.push(`${count}no`); }

          // If no dimensions are active or all active dims are 0, qty should probably be 0
          if (parts.length === 0) qty = 0;

          return {
             ...item,
             qty: parseFloat(qty.toFixed(2)),
             amount: parseFloat((qty * item.rate).toFixed(2)),
             description: parts.length > 0 ? parts.join(' x ') : item.description // Update description with formula
          };
        }
        return item;
      })
    }));
    
    if (JSON.stringify(newGroups) !== JSON.stringify(groups)) {
       setGroups(newGroups);
    }
  }, [globalDims, groups]);

  const handleTemplateSelect = (type: 'blank' | 'longkang') => {
    if (type === 'longkang') {
       setGroups(JSON.parse(JSON.stringify(LONGKANG_TEMPLATE)));
    } else {
       setGroups([{ id: uuid(), title: 'BIL NO. 1 - BARU', items: [] }]);
    }
    setCurrentStep(1);
  };

  const handleNext = () => {
    if (currentStep === 1) {
       setGlobalDims({
          length: parseFloat(dimInputs.length) || 0,
          width: parseFloat(dimInputs.width) || 0,
          depth: parseFloat(dimInputs.depth) || 0,
       });
    }
    if (currentStep < STEPS.length - 1) setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(prev => prev - 1);
  };

  const updateItem = (gIdx: number, iIdx: number, updates: Partial<BQItem>) => {
    const newGroups = [...groups];
    newGroups[gIdx] = { ...newGroups[gIdx], items: [...newGroups[gIdx].items] };
    newGroups[gIdx].items[iIdx] = { ...newGroups[gIdx].items[iIdx], ...updates };
    setGroups(newGroups);
  };

  const addItem = (gIdx: number) => {
     const newGroups = [...groups];
     newGroups[gIdx] = { ...newGroups[gIdx], items: [...newGroups[gIdx].items] };
     newGroups[gIdx].items.push({
        id: uuid(), description: '', unit: '', qty: 0, rate: 0, amount: 0,
        isCalculation: false, isSynced: false, isHeader: false, isNote: false,
        includeLength: true, includeWidth: true, includeDepth: true
     });
     setGroups(newGroups);
  };
  
  const insertItemAfter = (gIdx: number, iIdx: number) => {
    const newGroups = [...groups];
    newGroups[gIdx] = { ...newGroups[gIdx], items: [...newGroups[gIdx].items] };
    newGroups[gIdx].items.splice(iIdx + 1, 0, {
       id: uuid(), description: '', unit: '', qty: 0, rate: 0, amount: 0,
       isCalculation: false, isSynced: false, isHeader: false, isNote: false,
       includeLength: true, includeWidth: true, includeDepth: true
     });
    setGroups(newGroups);
  };

  const moveItem = (gIdx: number, iIdx: number, direction: 'up' | 'down') => {
     const newGroups = [...groups];
     newGroups[gIdx] = { ...newGroups[gIdx], items: [...newGroups[gIdx].items] };
     const items = newGroups[gIdx].items;
     if (direction === 'up' && iIdx > 0) {
        [items[iIdx], items[iIdx - 1]] = [items[iIdx - 1], items[iIdx]];
     } else if (direction === 'down' && iIdx < items.length - 1) {
        [items[iIdx], items[iIdx + 1]] = [items[iIdx + 1], items[iIdx]];
     }
     setGroups(newGroups);
  };

  const deleteItem = (gIdx: number, iIdx: number) => {
    // FIX: Removed confirm dialog for instant delete to resolve user issue
    const newGroups = [...groups];
    newGroups[gIdx] = { 
        ...newGroups[gIdx], 
        items: newGroups[gIdx].items.filter((_, index) => index !== iIdx)
    };
    setGroups(newGroups);
  };

  // STEP 1: TEMPLATE
  if (currentStep === 0) {
    return (
       <div className="p-8 text-center min-h-[400px] flex flex-col items-center justify-center gap-8">
          <h2 className="text-2xl font-bold text-slate-700 dark:text-slate-300">Pilih Template BQ</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
             <button onClick={() => handleTemplateSelect('blank')} className="p-8 rounded-3xl border-2 border-slate-200 hover:border-indigo-500 hover:bg-slate-50 transition-all group dark:border-slate-700 dark:hover:bg-slate-800">
                <FileText className="w-12 h-12 mx-auto text-slate-400 group-hover:text-indigo-500 mb-4" />
                <h3 className="font-bold text-lg dark:text-white">BQ Kosong</h3>
                <p className="text-sm text-slate-500">Mula dari awal</p>
             </button>
             <button onClick={() => handleTemplateSelect('longkang')} className="p-8 rounded-3xl border-2 border-indigo-200 bg-indigo-50 hover:bg-indigo-100 hover:border-indigo-500 transition-all group relative overflow-hidden dark:bg-indigo-900/20 dark:border-indigo-800 dark:hover:bg-indigo-900/40">
                <div className="absolute top-0 right-0 bg-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-bl-xl">Popular</div>
                <Settings className="w-12 h-12 mx-auto text-indigo-500 mb-4" />
                <h3 className="font-bold text-lg text-indigo-900 dark:text-indigo-300">Template Longkang</h3>
                <p className="text-sm text-indigo-600 dark:text-indigo-400">Preset pengiraan & item</p>
             </button>
          </div>
       </div>
    );
  }

  // STEP 2: VARIABLES
  if (currentStep === 1) {
    return (
      <div className="p-8 min-h-[400px] flex flex-col items-center justify-center max-w-2xl mx-auto">
         <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Tetapan Ukuran Global</h2>
         <p className="text-slate-500 mb-8 text-center">Masukkan ukuran utama. Item yang "sync" akan menggunakan ukuran ini secara automatik.</p>
         
         <div className="bg-indigo-50 dark:bg-indigo-900/20 p-8 rounded-3xl w-full space-y-6 border border-indigo-100 dark:border-indigo-800">
            <div className="flex items-center justify-between gap-4">
               <label className="font-bold text-lg text-slate-700 dark:text-slate-300">Panjang (P)</label>
               <div className="flex items-center gap-2">
                 <input 
                    type="number"
                    step="0.01"
                    value={dimInputs.length} 
                    onChange={e => setDimInputs({...dimInputs, length: e.target.value})}
                    className="w-32 text-right text-2xl font-bold bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                 />
                 <span className="font-bold text-slate-400">m</span>
               </div>
            </div>
            <div className="flex items-center justify-between gap-4">
               <label className="font-bold text-lg text-slate-700 dark:text-slate-300">Lebar (L)</label>
               <div className="flex items-center gap-2">
                 <input 
                    type="number"
                    step="0.01"
                    value={dimInputs.width} 
                    onChange={e => setDimInputs({...dimInputs, width: e.target.value})}
                    className="w-32 text-right text-2xl font-bold bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                 />
                 <span className="font-bold text-slate-400">m</span>
               </div>
            </div>
            <div className="flex items-center justify-between gap-4">
               <label className="font-bold text-lg text-slate-700 dark:text-slate-300">Tebal/Tinggi (T)</label>
               <div className="flex items-center gap-2">
                 <input 
                    type="number"
                    step="0.01"
                    value={dimInputs.depth} 
                    onChange={e => setDimInputs({...dimInputs, depth: e.target.value})}
                    className="w-32 text-right text-2xl font-bold bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                 />
                 <span className="font-bold text-slate-400">m</span>
               </div>
            </div>
         </div>

         <div className="flex gap-4 mt-8 w-full">
            <button onClick={handleBack} className="flex-1 py-3 rounded-xl border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-slate-600 dark:text-slate-300">Kembali</button>
            <button onClick={handleNext} className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center justify-center gap-2">
               Seterusnya <ArrowRight className="w-4 h-4"/>
            </button>
         </div>
      </div>
    );
  }

  // STEP 3: EDIT BQ (Updated with BQItemCard)
  if (currentStep === 2) {
     return (
        <div className="p-4 flex flex-col">
           <div className="flex gap-4 mb-6 overflow-x-auto pb-2 scrollbar-hide">
              {groups.map((g, idx) => (
                 <button 
                   key={g.id} 
                   onClick={() => setActiveGroupIndex(idx)}
                   className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${activeGroupIndex === idx ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                 >
                    {g.title.split('-')[0]}
                 </button>
              ))}
              <button onClick={() => setGroups([...groups, { id: uuid(), title: `BIL NO. ${groups.length + 1} - BARU`, items: [] }])} className="px-3 py-2 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 text-slate-400 hover:border-indigo-500 hover:text-indigo-500">
                 <Plus className="w-4 h-4" />
              </button>
           </div>

           <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
              {groups[activeGroupIndex] && (
                 <div className="space-y-6">
                    <input 
                      value={groups[activeGroupIndex].title}
                      onChange={e => {
                         const newGroups = [...groups];
                         newGroups[activeGroupIndex].title = e.target.value;
                         setGroups(newGroups);
                      }}
                      className="w-full text-xl font-bold bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 outline-none pb-2 text-slate-800 dark:text-white"
                    />
                    
                    {groups[activeGroupIndex].items.map((item, iIdx) => (
                       <BQItemCard 
                          key={item.id}
                          index={iIdx}
                          isLast={iIdx === groups[activeGroupIndex].items.length - 1}
                          item={item}
                          globalDims={globalDims}
                          onUpdate={(updates) => updateItem(activeGroupIndex, iIdx, updates)}
                          onMove={(dir) => moveItem(activeGroupIndex, iIdx, dir)}
                          onDelete={() => deleteItem(activeGroupIndex, iIdx)}
                          onInsertAfter={() => insertItemAfter(activeGroupIndex, iIdx)}
                       />
                    ))}
                    
                    <button onClick={() => addItem(activeGroupIndex)} className="w-full py-4 border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-indigo-500 rounded-xl text-slate-400 hover:text-indigo-500 font-bold transition-all flex items-center justify-center gap-2">
                       <PlusCircle className="w-5 h-5" /> Tambah Item Baru
                    </button>
                 </div>
              )}
           </div>

           <div className="flex gap-4 mt-6">
              <button onClick={handleBack} className="px-6 py-3 rounded-xl border border-slate-300 dark:border-slate-600 font-bold text-slate-600 dark:text-slate-300">Kembali</button>
              <button onClick={() => { onSave(groups, globalDims); handleNext(); }} className="ml-auto px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold flex items-center gap-2">
                 Simpan & Lihat <ArrowRight className="w-4 h-4"/>
              </button>
           </div>
        </div>
     );
  }

  // STEP 4: PREVIEW & PRINT
  if (currentStep === 3) {
     // ... (Print layout code remains same) ...
     return (
        <div className="min-h-screen bg-gray-500 p-8 flex flex-col items-center">
           <div className="fixed top-6 right-6 flex gap-4 no-print z-50">
              <button onClick={() => setCurrentStep(2)} className="px-6 py-3 bg-white text-slate-900 rounded-full font-bold shadow-lg hover:bg-slate-100 flex items-center gap-2">
                 <Settings className="w-4 h-4" /> Edit
              </button>
              <button onClick={() => window.print()} className="px-6 py-3 bg-indigo-600 text-white rounded-full font-bold shadow-lg hover:bg-indigo-700 flex items-center gap-2">
                 <Printer className="w-4 h-4" /> Cetak PDF
              </button>
           </div>
           
           {/* CSS for Print */}
           <style>{`
            .print-container { 
                background: white !important; 
                width: 210mm; 
                min-height: 297mm; 
                padding: 1.5cm; 
                margin-bottom: 2cm; 
                position: relative; 
                color: black !important; 
            }
            .bq-table { 
                width: 100%; 
                border-collapse: collapse; 
                font-family: Arial, sans-serif; 
                font-size: 8pt; 
            }
            .bq-table th, .bq-table td { 
                border: 1px solid black; 
                padding: 4px; 
                color: black !important;
            }
            .dark .print-container, .dark .bq-table td, .dark .bq-table th {
                color: black !important;
                border-color: black !important;
                background-color: white !important;
            }
            @media print {
               @page { size: A4; margin: 0.5cm; }
               .print-container { box-shadow: none !important; margin: 0 !important; width: 100% !important; page-break-after: always; }
               input { border: none !important; background: transparent !important; }
            }
           `}</style>
           
           {/* CONTENT - Rendered similar to original file, condensed for brevity here but should be full in implementation */}
           {/* COVER PAGE 1 */}
           <div className="print-container">
              {/* ... Cover Page Content ... */}
              <div className="flex justify-between items-start mb-8">
                 <div className="w-20 h-20 bg-gray-200 flex items-center justify-center text-xs text-center font-bold text-black">LOGO MPS</div>
                 <div className="text-center font-bold font-arial text-black">
                    <h2 className="text-lg">JABATAN KEJURUTERAAN</h2>
                    <h1 className="text-xl my-2">MAJLIS PERBANDARAN SELAYANG</h1>
                    <p className="text-xs font-normal">Persiaran 3, Bandar Baru Selayang, 68100 Batu Caves, Selangor.</p>
                 </div>
                 <div className="w-20 h-20 bg-gray-200 flex items-center justify-center text-xs text-center font-bold text-black">LOGO SELANGOR</div>
              </div>

              <h2 className="text-center font-bold text-lg underline mb-8 font-arial text-black">CADANGAN KERJA</h2>

              <table className="w-full border-2 border-black font-arial text-sm mb-8 text-black">
                 <tbody>
                    <tr>
                       <td className="border border-black p-2 w-40">Tarikh</td>
                       <td className="border border-black p-2 text-center">{projectData.tarikhBuka || '........................'}</td>
                    </tr>
                    <tr>
                       <td className="border border-black p-2 align-top">Daripada</td>
                       <td className="border border-black p-2 h-24 align-top">
                          <strong>{projectData.pjaId === 1 ? 'ADMIN' : 'MOHAMAD KHAIRUL AMIRIN BIN ZAINAL ABIDIN'}</strong><br/>
                          Penolong Jurutera,<br/>
                          Bahagian Infrastruktur,<br/>
                          Unit Selenggara Infrastruktur.
                       </td>
                    </tr>
                    <tr>
                       <td className="border border-black p-2">Kepada</td>
                       <td className="border border-black p-2">
                          Pengarah<br/>Jabatan Kejuruteraan
                       </td>
                    </tr>
                    <tr>
                       <td className="border border-black p-2 align-top">Tajuk</td>
                       <td className="border border-black p-2 font-bold uppercase h-24 align-top">
                          {projectData.namaProjek}
                       </td>
                    </tr>
                    <tr>
                       <td className="border border-black p-2">Blok Perancangan</td>
                       <td className="border border-black p-2 uppercase">{projectData.bp || '........................'}</td>
                    </tr>
                 </tbody>
              </table>

              <p className="font-arial text-sm mb-4 text-black">Perkara di atas adalah dirujuk.</p>
              
              <div className="flex gap-4 font-arial text-sm mb-8 text-black">
                 <div>2.</div>
                 <p className="text-justify uppercase">
                    {projectData.namaProjek}
                 </p>
              </div>
              
              <p className="font-arial text-sm mb-12 ml-8 text-black">
                 Bersama-sama ini dilampirkan pelan tapak, gambar lokasi aduan serta spesifikasi kerja (BQ).
              </p>

              <div className="font-arial text-sm text-black">
                 <p className="mb-4">Sekian, terima kasih.</p>
                 <p className="font-bold">"KITASELANGOR MAJU BERSAMA"</p>
                 <p className="font-bold">"MALAYSIA MADANI"</p>
                 <p className="font-bold">"BERKHIDMAT UNTUK NEGARA"</p>
                 <p className="font-bold mb-8">"MAMPAN PROGRESIF SEJAHTERA"</p>
                 <p>Saya yang menjalankan amanah,</p>
              </div>

              <div className="mt-16 font-arial text-sm text-black">
                 <p className="text-red-600 font-bold mb-1">&lt; PJA name &gt;</p>
                 <p className="font-bold uppercase">(MOHAMAD KHAIRUL AMIRIN BIN ZAINAL ABIDIN)</p>
                 <p>Penolong Jurutera JA 29,</p>
                 <p>Bahagian Infrastruktur,</p>
                 <p>Unit Selenggara Infrastruktur.</p>
              </div>
           </div>
           
           {/* COVER PAGE 2 */}
           <div className="print-container font-arial text-black">
              <div className="border border-black h-full p-8 relative min-h-[900px]">
                 <h3 className="uppercase font-bold mb-6">ULASAN JURUTERA</h3>
                 <p className="uppercase mb-4 text-justify font-bold text-sm leading-relaxed">{projectData.namaProjek}</p>

                 <div className="grid grid-cols-[150px_1fr] gap-4 mb-8 mt-12">
                    <div className="font-bold">Anggaran Kontrak :</div>
                    <div className="border-b border-black h-6"></div>
                    
                    <div className="font-bold">Tempoh Kontrak :</div>
                    <div className="border-b border-black h-6"></div>
                    
                    <div className="font-bold">Lantikan :</div>
                    <div className="border-b border-black h-6"></div>
                 </div>

                 <div className="grid grid-cols-[150px_1fr] gap-4 mt-20">
                    <div className="font-bold">Tandatangan :</div>
                    <div className="h-20"></div>
                    
                    <div className="font-bold">Tarikh :</div>
                    <div className=""></div>
                 </div>

                 <div className="border-t-2 border-black my-8"></div>

                 <h3 className="uppercase font-bold mb-6">ULASAN PENGARAH :</h3>
                 
                 <p className="mb-2">Rujuk kelulusan Jawatankuasa Sebutharga Majlis Perbandaran Selayang yang bersidang pada ........................... dengan rotasi bagi syarikat :-</p>
                 <div className="border-b border-black h-8 mt-4 w-full"></div>
                 <div className="border-b border-black h-8 mt-4 w-full"></div>

                 <div className="grid grid-cols-[150px_1fr] gap-4 mt-20">
                    <div className="font-bold">Tandatangan :</div>
                    <div className="h-20"></div>
                    
                    <div className="font-bold">Tarikh :</div>
                    <div className=""></div>
                 </div>
              </div>
           </div>

           {/* BQ PAGES */}
           {groups.map((group, idx) => (
              <div key={group.id} className="print-container">
                 {/* Table Header */}
                 <div className="border-2 border-black mb-1 text-[10px] font-bold uppercase font-arial text-black">
                     <div className="p-1 text-center border-b border-black">{projectData.namaProjek}</div>
                     <div className="flex">
                        <div className="flex-1 p-1 border-r border-black">NO ADUAN : {projectData.noAduan}</div>
                        <div className="flex-1 p-1">LOKASI : {group.location || projectData.lokasi}</div>
                     </div>
                 </div>

                 <table className="bq-table text-black">
                    <thead>
                       <tr>
                          <th className="w-[40px] text-center">BIL</th>
                          <th className="text-center">KETERANGAN</th>
                          <th className="w-[60px] text-center">UNIT</th>
                          <th className="w-[60px] text-center">KUANTITI</th>
                          <th className="w-[80px] text-right">KADAR<br/>HARGA<br/>(RM)</th>
                          <th className="w-[80px] text-right">JUMLAH<br/>(RM)</th>
                       </tr>
                    </thead>
                    <tbody>
                       <tr className="font-bold border-b border-black">
                          <td></td>
                          <td className="uppercase underline py-2">{group.title}</td>
                          <td></td><td></td><td></td><td></td>
                       </tr>
                       {group.items.map((item, iIdx) => {
                          const isNoteOrHeader = item.isHeader || item.isNote;
                          return (
                          <tr key={item.id} className="align-top">
                             <td className="text-center font-bold">{item.isHeader ? (iIdx > 0 ? (iIdx/10 + 1).toFixed(1) : '1.0') : ''}</td>
                             <td className="whitespace-pre-wrap pb-2">
                                <span className={item.isHeader ? 'font-bold underline uppercase' : item.isNote ? 'italic' : ''}>{item.description}</span>
                             </td>
                             <td className="text-center">{!isNoteOrHeader ? item.unit : ''}</td>
                             <td className="text-center font-bold">{!isNoteOrHeader && item.qty ? item.qty : ''}</td>
                             <td className="text-right">{!isNoteOrHeader && item.rate ? item.rate.toFixed(2) : ''}</td>
                             <td className="text-right font-bold">{!isNoteOrHeader && item.amount ? item.amount.toFixed(2) : ''}</td>
                          </tr>
                          );
                       })}
                       {Array.from({ length: Math.max(0, 15 - group.items.length) }).map((_, i) => (
                          <tr key={`spacer-${i}`}><td className="h-6"></td><td></td><td></td><td></td><td></td><td></td></tr>
                       ))}
                    </tbody>
                 </table>
                 
                 <div className="absolute bottom-[2cm] left-[1.5cm] right-[1.5cm]">
                     <table className="w-full border-collapse font-arial text-sm font-bold text-black">
                        <tbody>
                           <tr>
                              <td className="text-right pr-4 border-none">TO COLLECTION</td>
                              <td className="w-[80px] border border-black text-right p-1">
                                 {formatCurrency(group.items.reduce((a,b) => a + (b.amount||0), 0)).replace('RM', '')}
                              </td>
                           </tr>
                        </tbody>
                     </table>
                 </div>
              </div>
           ))}
           
           {/* FINAL SUMMARY PAGE */}
           <div className="print-container">
             <table className="bq-table w-full font-bold text-black">
                <thead>
                   <tr>
                      <th className="w-[40px] text-center">BIL</th>
                      <th className="text-center">KETERANGAN</th>
                      <th className="w-[120px] text-center">JUMLAH (RM)</th>
                   </tr>
                </thead>
                <tbody>
                   {groups.map((group, idx) => (
                      <tr key={idx} className="h-10">
                         <td className="text-center">BIL NO. {idx + 1}</td>
                         <td className="uppercase">{group.title}</td>
                         <td className="text-right">
                           {formatCurrency(group.items.reduce((a,b) => a + (b.amount||0), 0)).replace('RM', '')}
                         </td>
                      </tr>
                   ))}
                   <tr className="h-12 border-t-2 border-black">
                      <td colSpan={2} className="text-right pr-4">TO COLLECTION</td>
                      <td className="text-right border-t-2 border-black">
                         {formatCurrency(groups.reduce((acc, g) => acc + g.items.reduce((a,b) => a + (b.amount||0), 0), 0)).replace('RM', '')}
                      </td>
                   </tr>
                </tbody>
             </table>
           </div>

        </div>
     );
  }

  return null;
};

export default BQEditor;
