
import React, { useState, useEffect, useRef } from 'react';
import { BQGroup, BQItem, formatCurrency, GlobalDimensions, Project } from '../types';
import { Trash2, Type, Calculator, PlusCircle, StickyNote, MoveUp, MoveDown, Download, Loader2, FileText, Eraser } from 'lucide-react';
import { mockService } from '../services/mockService';

interface BQEditorProps {
  initialData?: BQGroup[];
  initialDims?: GlobalDimensions;
  onDataChange: (data: BQGroup[], dims: GlobalDimensions) => void;
  onGroupChange: (index: number) => void;
  projectData: Project;
  isPrintView?: boolean;
  onPreviewCostChange?: (cost: number) => void;
}

const uuid = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 11);
};

// --- PRESET TEMPLATES ---
const getLongkangTemplate = (): BQGroup[] => [
  {
    id: uuid(),
    title: 'BIL NO. 1 - KERJA-KERJA PERMULAAN',
    items: [
      { id: uuid(), description: 'ALL QUANTITY ARE PROVISIONAL', unit: '', qty: 0, rate: 0, amount: 0, isHeader: true },
      { id: uuid(), description: 'BIL NO. 1 - KERJA-KERJA PERMULAAN', unit: '', qty: 0, rate: 0, amount: 0, isHeader: true },
      { id: uuid(), description: '1.0 INSURAN', unit: '', qty: 0, rate: 0, amount: 0, isHeader: true },
      { id: uuid(), description: 'Menyediakan polisi insuran berikut bagi merangkumi tempoh pekerjaan yang perlu seperti insuran tanggungan awam (Public Liability), insuran pampasan pekerja (Workmen\'s Compensation) dan SOCSO', unit: '', qty: 0, rate: 0, amount: 0, isNote: true },
      { id: uuid(), description: 'Nota: Liputan (coverage ) minima insuran bagi pampasan adalah 30% daripada nilai kerja jika sekiranya pemborong tidak dapat mengadakan Nombor Pendaftaran PERKESO. Liputan bagi Insurans Tanggungan Umum adalah seperti berikut :-', unit: '', qty: 0, rate: 0, amount: 0, isNote: true },
      { id: uuid(), description: 'i. Bagi nilai kerja yang kurang RM 25,000.00. Liputan minima adalah RM 10,000.00\nii. Bagi nilai kerja diantara RM25,000.00 hingga RM 50,000.00. Liputan minima adalah RM 25,000.00\niii. Bagi nilai kerja diantara RM50,000.00 hingga RM 100,000.00. Liputan minima adalah RM 50,000.00', unit: 'L/S', qty: 1, rate: 340.00, amount: 340.00 },
      { id: uuid(), description: 'Bagi perkara di atas, Kontraktor adalah dikehendaki mengemukakan Nota Liputan (Cover Note) bagi polisi-polisi insuran dan resit-resit premium yang telah dibayar, bagi tujuan memulakan kerja.', unit: '', qty: 0, rate: 0, amount: 0, isNote: true },
      
      { id: uuid(), description: '2.0 PELAN PENGURUSAN LALULINTAS (TRAFFIC MANAGEMENT)', unit: '', qty: 0, rate: 0, amount: 0, isHeader: true },
      { id: uuid(), description: 'Membekal dan menyediakan jentera alat pengangkutan pekerja, papan tanda isyarat lalu lintas sementara, papan tanda \'Awas kerja-kerja sedang dilaksanakan di hadapan, segala kesulitan amat dikesali\', papan tanda projek mudah alih yang merangkumi maklumat nama kontraktor, no untuk dihubungi, tarikh mula, tarikh siap serta lampu waktu malam dan kawalan lalu lintas yang mencukupi pada setiap masa mengikut arahan Pegawai Penguatkuasa termasuk pengurusan lalulintas (Traffic Management).', unit: 'L/S', qty: 1, rate: 1275.00, amount: 1275.00 },

      { id: uuid(), description: '3.0 LAPORAN BERGAMBAR', unit: '', qty: 0, rate: 0, amount: 0, isHeader: true },
      { id: uuid(), description: 'Membekalkan laporan bergambar mengikut proses pembinaan pada waktu sebelum mula kerja, semasa kerja dan selepas siap kerja serta soft copy dalam bentuk thumb drive.', unit: 'L/S', qty: 1, rate: 255.00, amount: 255.00 },
    ]
  },
  {
    id: uuid(),
    title: 'BIL NO. 2 - BUTIRAN KERJA BAIKPULIH LONGKANG',
    location: 'JALAN 9/27 TAMAN SRI GOMBAK',
    items: [
      { id: uuid(), description: 'BIL NO. 2 - BUTIRAN KERJA BAIKPULIH LONGKANG', unit: '', qty: 0, rate: 0, amount: 0, isHeader: true },
      { id: uuid(), description: '1.0 KERJA PENGOREKAN', unit: '', qty: 0, rate: 0, amount: 0, isHeader: true },
      { id: uuid(), description: 'Kerja-kerja menggali dan membuang tembok longkang sedia ada tidak melebihi 1500mm ukuran termasuk membuang sisa di tempat yang dibenarkan oleh pegawai penguasa.', unit: '', qty: 0, rate: 0, amount: 0, isNote: true },
      { id: uuid(), description: 'i. Dengan tangan', unit: '', qty: 0, rate: 0, amount: 0, isNote: true },
      { 
        id: uuid(), description: '80M(P) X 0.6M(L) X 0.7M(T)', unit: 'M3', qty: 33.6, rate: 53.40, amount: 1794.24, 
        isCalculation: true, isSynced: true, dimCount: 1,
        includeLength: true, includeWidth: true, includeDepth: true 
      },

      { id: uuid(), description: '2.0 LEAN CONCRETE', unit: '', qty: 0, rate: 0, amount: 0, isHeader: true },
      { id: uuid(), description: 'Kerja-kerja membekal dan memadat konkrit tidak bertetulang (Site Mixed) gred 15 (1:2:4-9mm) 75mm purata tebal lantai atau batu baur (ikut kesesuaian tanah) untuk tapak asas longkang. (Lean Concrete)', unit: '', qty: 0, rate: 0, amount: 0, isNote: true },
      { 
        id: uuid(), description: '80M(P) X 0.6M(L)', unit: 'M2', qty: 48, rate: 27.35, amount: 1312.80, 
        isCalculation: true, isSynced: true, dimCount: 1, 
        includeLength: true, includeWidth: true, includeDepth: false 
      },

      { id: uuid(), description: '3.0 REINFORCEMENT', unit: '', qty: 0, rate: 0, amount: 0, isHeader: true },
      { id: uuid(), description: 'Kerja-kerja membekal, memasang, membengkok dan memotong kepingan jejaring (BRC) No. B7 atau tetulang keluli dikimpal berbentuk jejaring 100mm x 200mm, beratnya 4.53kg setiap meter persegi. (BRC B7)', unit: '', qty: 0, rate: 0, amount: 0, isNote: true },
      { 
        id: uuid(), description: '80M(P) X 0.6M(L)', unit: 'M2', qty: 48, rate: 30.30, amount: 1454.40, 
        isCalculation: true, isSynced: true, dimCount: 1, 
        includeLength: true, includeWidth: true, includeDepth: false 
      },
      { 
        id: uuid(), description: '80M(P) X 0.7M(T) X 2', unit: 'M2', qty: 112, rate: 30.30, amount: 3393.60, 
        isCalculation: true, isSynced: true, dimCount: 2, 
        includeLength: true, includeWidth: false, includeDepth: true 
      },

      { id: uuid(), description: '4.0 FORMWORK', unit: '', qty: 0, rate: 0, amount: 0, isHeader: true },
      { id: uuid(), description: 'Kerja-kerja membekal, memotong dan memasang acuan konkrit daripada papan tidak berketam pada muka-muka yang pugak (Vertical) termasuk kerja-kerja menanggal dan membuang.', unit: '', qty: 0, rate: 0, amount: 0, isNote: true },
      { id: uuid(), description: 'i. 2 kali penggunaan - (21m ke atas)', unit: '', qty: 0, rate: 0, amount: 0, isNote: true },
      { 
        id: uuid(), description: '80M(P) X 0.7M(T) X 2', unit: 'M2', qty: 112, rate: 28.05, amount: 3141.60, 
        isCalculation: true, isSynced: true, dimCount: 2, 
        includeLength: true, includeWidth: false, includeDepth: true 
      },

      { id: uuid(), description: '5.0 KONKRIT', unit: '', qty: 0, rate: 0, amount: 0, isHeader: true },
      { id: uuid(), description: 'Kerja-kerja membekal, menuang dan memadat konkrit Ready Mixed/tuang disitu gred 20 bertetulang tuang disitu untuk lantai dan tembok longkang tebal 100mm/150mm/ Ready Mixed/tuang disitu.', unit: '', qty: 0, rate: 0, amount: 0, isNote: true },
      { id: uuid(), description: 'i. 100mm tebal (Tuang Disitu)', unit: '', qty: 0, rate: 0, amount: 0, isNote: true },
      { 
        id: uuid(), description: '80M(P) X 0.6M(L)', unit: 'M2', qty: 48, rate: 46.01, amount: 2208.48, 
        isCalculation: true, isSynced: true, dimCount: 1, 
        includeLength: true, includeWidth: true, includeDepth: false 
      },
      { 
        id: uuid(), description: '80M(P) X 0.7M(T) X 2', unit: 'M2', qty: 112, rate: 46.01, amount: 5153.12, 
        isCalculation: true, isSynced: true, dimCount: 2, 
        includeLength: true, includeWidth: false, includeDepth: true 
      },

      { id: uuid(), description: '6.0 LONGKANG JENIS TEMBIKAR (CLAY)', unit: '', qty: 0, rate: 0, amount: 0, isHeader: true },
      { id: uuid(), description: 'Kerja-kerja membekal dan memasang longkang jenis separuh bulatan jenis tembikar bergilap (HRGW) dan di sambung dengan simen motar 1:3 saiz :-', unit: '', qty: 0, rate: 0, amount: 0, isNote: true },
      { 
        id: uuid(), description: '225mm', unit: 'M', qty: 80, rate: 17.70, amount: 1416.00, 
        isCalculation: true, isSynced: true, dimCount: 1, 
        includeLength: true, includeWidth: false, includeDepth: false 
      },

      { id: uuid(), description: '7.0 KERJA-KERJA AKHIR', unit: '', qty: 0, rate: 0, amount: 0, isHeader: true },
      { id: uuid(), description: 'Kerja-kerja akhir pembersihan sisa bahan binaan dan dibuang ke tempat yang dibenarkan.', unit: '', qty: 0, rate: 0, amount: 0, isNote: true },
      { id: uuid(), description: 'Nilai Kerja RM20,000.01 sehingga RM50,000.00.', unit: 'L/S', qty: 1, rate: 425.00, amount: 425.00 },
    ]
  },
  {
    id: uuid(),
    title: 'BIL NO. 3 - BUTIRAN KERJA BAIKPULIH LONGKANG',
    location: 'JALAN 9/27 TAMAN SRI GOMBAK',
    items: [
      { id: uuid(), description: 'BIL NO. 3 - BUTIRAN KERJA BAIKPULIH LONGKANG', unit: '', qty: 0, rate: 0, amount: 0, isHeader: true },
      { id: uuid(), description: '1.0 MEMBUAT KERJA-KERJA KONKRIT SEDIA ADA', unit: '', qty: 0, rate: 0, amount: 0, isHeader: true },
      { id: uuid(), description: 'Memecah atau merobohkan konkrit sedia ada dan membaiki semula mana-mana bahagian rosak, tidak melebihi 300mm tebal.', unit: '', qty: 0, rate: 0, amount: 0, isNote: true },
      { id: uuid(), description: 'i. Dengan tetulang', unit: 'M3', qty: 2, rate: 384.70, amount: 769.40 },

      { id: uuid(), description: '2.0 FORMWORK', unit: '', qty: 0, rate: 0, amount: 0, isHeader: true },
      { id: uuid(), description: 'Kerja-kerja membekal, memotong dan memasang acuan konkrit daripada papan tidak berketam pada muka-muka yang pugak (Vertical) termasuk kerja-kerja menanggal dan membuang.', unit: 'M2', qty: 13, rate: 68.11, amount: 885.43 },

      { id: uuid(), description: '3.0 REINFORCEMENT', unit: '', qty: 0, rate: 0, amount: 0, isHeader: true },
      { id: uuid(), description: 'Kerja-kerja membekal, memasang, membengkok dan memotong tetulang keluli Y10 yang diikat rapi berbentuk segiempat bersaiz 200mm x 200mm beserta Concrete Spacer, beratnya 6.16kg setiap meter persegi sebanyak 2 lapisan.', unit: 'M2', qty: 13, rate: 101.80, amount: 1323.40 },

      { id: uuid(), description: '4.0 KONKRIT', unit: '', qty: 0, rate: 0, amount: 0, isHeader: true },
      { id: uuid(), description: 'Kerja-kerja membekal, menuang dan memadat konkrit Ready Mixed/tuang disitu gred 20 bertetulang tuang disitu untuk lantai dan tembok longkang tebal 100mm/150mm/ Ready Mixed/tuang disitu.', unit: '', qty: 0, rate: 0, amount: 0, isNote: true },
      { id: uuid(), description: 'i. 100mm tebal (Tuang Disitu)', unit: 'M2', qty: 13, rate: 46.01, amount: 598.13 },
    ]
  }
];

// --- COMPONENTS ---
// Auto-expanding Textarea Component
const AutoTextArea = ({ value, onChange, className, placeholder, rows = 1 }: any) => {
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = 'auto';
      textAreaRef.current.style.height = textAreaRef.current.scrollHeight + 'px';
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e);
  };

  return (
    <textarea
      ref={textAreaRef}
      value={value}
      onChange={handleChange}
      className={className}
      placeholder={placeholder}
      rows={rows}
      style={{ overflow: 'hidden' }}
    />
  );
};

// Updated Item Card
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
  onDelete: (e: React.MouseEvent) => void, 
  onInsertAfter: () => void,
  index: number,
  isLast: boolean
}) => {
  const isNoteOrHeader = item.isHeader || item.isNote;
  
  const [inputs, setInputs] = useState({
    dimLength: item.dimLength?.toString() || '',
    dimWidth: item.dimWidth?.toString() || '',
    dimDepth: item.dimDepth?.toString() || '',
    dimCount: item.dimCount?.toString() || '',
    qty: item.qty?.toString() || '',
    rate: item.rate?.toString() || '',
    unit: item.unit || ''
  });

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
        unit: item.unit || ''
      }));
    } else {
        if (item.isCalculation) {
             setInputs(prev => ({ ...prev, qty: item.qty?.toString() || '' }));
        }
    }
  }, [item]);

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
  
  let cardClass = "p-4 rounded-2xl flex gap-4 items-start transition-all border ";
  if (isHeader) {
     cardClass += "bg-gradient-to-r from-slate-700 to-slate-800 border-slate-600 shadow-md text-white";
  } else if (item.isCalculation) {
     cardClass += "bg-indigo-50 dark:bg-[#162032] border-indigo-200 dark:border-indigo-900/50 shadow-inner";
  } else {
     cardClass += "bg-white dark:bg-[#1e293b] border-slate-200 dark:border-slate-700 shadow-sm";
  }

  const inputStyle = "bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg p-2 text-xs w-full text-center outline-none transition-all placeholder-slate-400 dark:placeholder-slate-600";
  const labelStyle = "text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-wider mb-1 block text-center";

  return (
    <div className={`relative group transition-all duration-300 ${wrapperClass}`}>
       <div className={cardClass}>
          {/* Controls */}
          <div className="flex flex-col gap-1 pt-1">
            <div className="flex flex-col bg-slate-100 dark:bg-[#0f172a] rounded-lg p-1 gap-1 border border-slate-200 dark:border-slate-700">
                <button 
                    type="button"
                    onClick={() => onUpdate({ isCalculation: false, isHeader: false, isNote: false })}
                    className={`p-1.5 rounded-md transition-all ${!item.isCalculation && !item.isHeader && !item.isNote ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    title="Item Biasa"
                >
                    <Type className="w-3.5 h-3.5" />
                </button>
                <button 
                    type="button"
                    onClick={() => onUpdate({ isCalculation: false, isHeader: false, isNote: true })}
                    className={`p-1.5 rounded-md transition-all ${item.isNote ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    title="Nota"
                >
                    <StickyNote className="w-3.5 h-3.5" />
                </button>
                <button 
                    type="button"
                    onClick={() => onUpdate({ isCalculation: false, isHeader: true, isNote: false })}
                    className={`p-1.5 rounded-md transition-all ${item.isHeader ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    title="Tajuk"
                >
                    <span className="text-[10px] font-bold">H</span>
                </button>
                <button 
                    type="button"
                    onClick={() => onUpdate({ isCalculation: true, isHeader: false, isNote: false })}
                    className={`p-1.5 rounded-md transition-all ${item.isCalculation ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    title="Kiraan Auto"
                >
                    <Calculator className="w-3.5 h-3.5" />
                </button>
            </div>
          </div>

          <div className="flex-1 grid grid-cols-12 gap-4">
            <div className={isNoteOrHeader ? "col-span-12" : "col-span-6"}>
                <AutoTextArea 
                  value={item.description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onUpdate({ description: e.target.value })}
                  className={`w-full bg-transparent resize-none outline-none border-b border-transparent focus:border-indigo-500 transition-colors ${item.isHeader ? 'font-bold uppercase tracking-wide text-white' : item.isNote ? 'text-slate-500 dark:text-slate-400 italic' : 'font-medium text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600'}`}
                  rows={item.isHeader ? 1 : 2}
                  placeholder={item.isNote ? "Tulis nota di sini..." : "Keterangan..."}
                />
                
                {/* Advanced Calculation Controls */}
                {item.isCalculation && (
                  <div className="flex flex-col gap-2 mt-3 p-3 bg-white dark:bg-[#0f172a] rounded-xl border border-slate-200 dark:border-slate-700/50">
                      
                      {/* Formula Toggles */}
                      <div className="flex items-center gap-4 text-xs font-bold text-slate-500 mb-1">
                          <span className="uppercase tracking-wider text-[10px] text-indigo-500 dark:text-indigo-400">Formula:</span>
                          <label className="flex items-center gap-1.5 cursor-pointer hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
                            <input 
                              type="checkbox" 
                              checked={item.includeLength !== false} // Default true
                              onChange={(e) => onUpdate({ includeLength: e.target.checked })}
                              className="w-3 h-3 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            P
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
                            <input 
                              type="checkbox" 
                              checked={item.includeWidth !== false} // Default true
                              onChange={(e) => onUpdate({ includeWidth: e.target.checked })}
                              className="w-3 h-3 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            L
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
                            <input 
                              type="checkbox" 
                              checked={item.includeDepth !== false} // Default true
                              onChange={(e) => onUpdate({ includeDepth: e.target.checked })}
                              className="w-3 h-3 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            T
                          </label>
                      </div>

                      {/* Dimension Inputs */}
                      <div className="grid grid-cols-4 gap-2">
                        <div>
                          <label className={labelStyle}>Panjang</label>
                          <div className="relative">
                              <input 
                                type="number" 
                                value={item.isSynced ? (globalDims.length || 0) : inputs.dimLength} 
                                onChange={(e) => handleInput('dimLength', e.target.value, true)}
                                className={`${inputStyle} ${item.isSynced ? 'bg-slate-100 dark:bg-slate-800/50 text-slate-500' : ''}`}
                                placeholder="0.00"
                                disabled={item.isSynced}
                              />
                              {item.isSynced && <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div></div>}
                          </div>
                        </div>
                        <div>
                          <label className={labelStyle}>Lebar</label>
                          <input 
                            type="number" 
                            value={item.isSynced ? (globalDims.width || 0) : inputs.dimWidth} 
                            onChange={(e) => handleInput('dimWidth', e.target.value, true)}
                            className={`${inputStyle} ${item.isSynced ? 'bg-slate-100 dark:bg-slate-800/50 text-slate-500' : ''}`}
                            placeholder="0.00"
                            disabled={item.isSynced}
                          />
                        </div>
                        <div>
                          <label className={labelStyle}>Tinggi</label>
                          <input 
                            type="number" 
                            value={item.isSynced ? (globalDims.depth || 0) : inputs.dimDepth} 
                            onChange={(e) => handleInput('dimDepth', e.target.value, true)}
                            className={`${inputStyle} ${item.isSynced ? 'bg-slate-100 dark:bg-slate-800/50 text-slate-500' : ''}`}
                            placeholder="0.00"
                            disabled={item.isSynced}
                          />
                        </div>
                        <div>
                          <label className={labelStyle}>Bil.</label>
                          <input 
                            type="number" 
                            value={inputs.dimCount} 
                            onChange={(e) => handleInput('dimCount', e.target.value, true)}
                            className={inputStyle}
                            placeholder="1"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-1">
                          <label className="flex items-center gap-2 text-[10px] font-bold text-slate-500 dark:text-slate-400 cursor-pointer bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors w-full justify-center">
                            <input 
                              type="checkbox" 
                              checked={item.isSynced || false} 
                              onChange={(e) => onUpdate({ isSynced: e.target.checked })}
                              className="w-3 h-3 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            Guna Ukuran Global
                          </label>
                      </div>

                  </div>
                )}
            </div>

            {!isNoteOrHeader && (
              <>
                <div className="col-span-1">
                    <label className={labelStyle}>Unit</label>
                    <input type="text" value={inputs.unit} onChange={(e) => handleInput('unit', e.target.value)} className={inputStyle} placeholder="Unit" />
                </div>
                <div className="col-span-1">
                    <label className={labelStyle}>Qty</label>
                    <input 
                        type="number" 
                        value={inputs.qty} 
                        // If calculation is on, qty is read-only derived
                        readOnly={item.isCalculation}
                        onChange={(e) => handleInput('qty', e.target.value, true)} 
                        className={`${inputStyle} ${item.isCalculation ? 'bg-indigo-50 dark:bg-indigo-900/20 font-bold text-indigo-600' : ''}`} 
                        placeholder="0" 
                    />
                </div>
                <div className="col-span-2">
                    <label className={labelStyle}>Kadar</label>
                    <input type="number" value={inputs.rate} onChange={(e) => handleInput('rate', e.target.value, true)} className={inputStyle} placeholder="0.00" />
                </div>
                <div className="col-span-2">
                    <label className={labelStyle}>Jumlah</label>
                    <div className="h-[34px] flex items-center justify-end px-3 font-bold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs border border-slate-200 dark:border-slate-700">
                      {formatCurrency(item.amount)}
                    </div>
                </div>
              </>
            )}
          </div>
          
          {/* Actions - Enhanced for Mobile Visibility */}
          <div className="flex flex-col gap-1 pt-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
            <button type="button" onClick={() => onMove('up')} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400" title="Naik"><MoveUp className="w-3.5 h-3.5" /></button>
            <button type="button" onClick={() => onMove('down')} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400" title="Turun"><MoveDown className="w-3.5 h-3.5" /></button>
            <button type="button" onClick={onInsertAfter} className="p-1.5 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-900/30 rounded-lg text-slate-400" title="Tambah Bawah"><PlusCircle className="w-3.5 h-3.5" /></button>
            <button type="button" onClick={onDelete} className="p-1.5 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30 rounded-lg text-slate-400" title="Padam"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
       </div>
    </div>
  );
};

// --- PRINT LAYOUT COMPONENTS ---
const PrintPage = ({ children }: { children: React.ReactNode }) => (
  <div className="print-page relative w-[210mm] min-h-[297mm] mx-auto bg-white shadow-lg print:shadow-none print:w-full print:h-full overflow-hidden flex flex-col p-[20mm] box-border text-black mb-8 print:mb-0">
     {children}
  </div>
);

const PrintHeader = () => (
  <div className="text-center mb-8 font-arial">
      <div className="flex justify-between items-start mb-6">
        <div className="w-32 h-24 border border-black flex items-center justify-center text-xs font-bold p-2 text-center">
           LOGO MPS
        </div>
        <div className="flex-1 px-4">
           <h1 className="font-bold text-lg uppercase leading-tight">JABATAN KEJURUTERAAN</h1>
           <h2 className="font-bold text-xl uppercase mt-1">MAJLIS PERBANDARAN SELAYANG</h2>
           <p className="text-xs mt-2">Persiaran 3, Bandar Baru Selayang, 68100 Batu Caves, Selangor.</p>
        </div>
        <div className="w-24 h-24 border border-black flex items-center justify-center text-xs font-bold p-2 text-center bg-gray-200">
           LOGO SELANGOR
        </div>
      </div>
      <h3 className="font-bold text-lg underline uppercase mt-4">CADANGAN KERJA</h3>
  </div>
);

const BQEditor: React.FC<BQEditorProps> = ({ initialData, initialDims, onDataChange, onGroupChange, projectData, isPrintView, onPreviewCostChange }) => {
  const [groups, setGroups] = useState<BQGroup[]>(initialData || []);
  const [globalDims, setGlobalDims] = useState<GlobalDimensions>(initialDims || { length: 0, width: 0, depth: 0 });
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  useEffect(() => {
    if (initialData) {
         setGroups(prev => {
             // Only update if data actually changed to avoid loop
             if (JSON.stringify(prev) !== JSON.stringify(initialData)) {
                 return initialData;
             }
             return prev;
         });
      }
  }, [initialData]);

  // Recalculate logic
  useEffect(() => {
    const updatedGroups = groups.map(group => ({
      ...group,
      items: group.items.map(item => {
        if (item.isCalculation) {
          const L = item.isSynced ? (globalDims.length || 0) : (item.dimLength || 0);
          const W = item.isSynced ? (globalDims.width || 0) : (item.dimWidth || 0);
          const D = item.isSynced ? (globalDims.depth || 0) : (item.dimDepth || 0);
          const Count = item.dimCount || 1;
          
          let calculatedQty = Count;
          if (item.includeLength !== false) calculatedQty *= L;
          if (item.includeWidth !== false) calculatedQty *= W;
          if (item.includeDepth !== false) calculatedQty *= D;
          
          // Round to 2 decimals
          const qty = Math.round(calculatedQty * 100) / 100;
          const amount = Math.round((qty * (item.rate || 0)) * 100) / 100;
          
          return { ...item, qty, amount };
        } else {
          const amount = Math.round(((item.qty || 0) * (item.rate || 0)) * 100) / 100;
          return { ...item, amount };
        }
      })
    }));

    // Detect if changes actually happened to avoid loop
    const currentJson = JSON.stringify(groups);
    const newJson = JSON.stringify(updatedGroups);
    if (currentJson !== newJson) {
        setGroups(updatedGroups);
        onDataChange(updatedGroups, globalDims);
    }
  }, [globalDims, groups]);

  // --- ACTIONS ---
  const updateGlobalDim = (field: keyof GlobalDimensions, value: number) => {
    const newDims = { ...globalDims, [field]: value };
    setGlobalDims(newDims);
    onDataChange(groups, newDims);
  };

  const handleUpdateItem = (groupIndex: number, itemIndex: number, updates: Partial<BQItem>) => {
     const newGroups = [...groups];
     // Deep copy group and items array for immutability
     newGroups[groupIndex] = { ...newGroups[groupIndex], items: [...newGroups[groupIndex].items] };
     
     newGroups[groupIndex].items[itemIndex] = { ...newGroups[groupIndex].items[itemIndex], ...updates };
     
     // Recalculate immediately for simple updates (like rate changes)
     const item = newGroups[groupIndex].items[itemIndex];
     if (!item.isCalculation) {
        item.amount = Math.round(((item.qty || 0) * (item.rate || 0)) * 100) / 100;
     }

     setGroups(newGroups);
     onDataChange(newGroups, globalDims);
  };

  const handleAddItem = (groupIndex: number, indexToInsertAfter = -1) => {
    const newGroups = [...groups];
    // Deep copy for immutability
    newGroups[groupIndex] = { ...newGroups[groupIndex], items: [...newGroups[groupIndex].items] };
    
    const newItem: BQItem = {
        id: uuid(),
        description: '',
        unit: '',
        qty: 0,
        rate: 0,
        amount: 0,
        isCalculation: false
    };
    
    if (indexToInsertAfter !== -1) {
        newGroups[groupIndex].items.splice(indexToInsertAfter + 1, 0, newItem);
    } else {
        newGroups[groupIndex].items.push(newItem);
    }
    setGroups(newGroups);
    onDataChange(newGroups, globalDims);
  };

  const handleDeleteItem = (groupIndex: number, itemIndex: number, e: React.MouseEvent) => {
    e.stopPropagation();
    // Removed preventDefault()
    
    // Removed confirmation for immediate action as requested by user
    const newGroups = [...groups];
    // Deep copy the group before modifying to ensure state change detection
    newGroups[groupIndex] = { ...newGroups[groupIndex], items: [...newGroups[groupIndex].items] };
    newGroups[groupIndex].items.splice(itemIndex, 1);
    
    setGroups(newGroups);
    onDataChange(newGroups, globalDims);
  };

  const handleMoveItem = (groupIndex: number, itemIndex: number, direction: 'up' | 'down') => {
    const newGroups = [...groups];
    // Deep copy for immutability
    newGroups[groupIndex] = { ...newGroups[groupIndex], items: [...newGroups[groupIndex].items] };
    
    const items = newGroups[groupIndex].items;
    if (direction === 'up' && itemIndex > 0) {
        [items[itemIndex], items[itemIndex - 1]] = [items[itemIndex - 1], items[itemIndex]];
    } else if (direction === 'down' && itemIndex < items.length - 1) {
        [items[itemIndex], items[itemIndex + 1]] = [items[itemIndex + 1], items[itemIndex]];
    }
    setGroups(newGroups);
    onDataChange(newGroups, globalDims);
  };

  const loadTemplate = () => {
    const template = getLongkangTemplate();
    
    // Check if user has entered any dimensions. If all are 0, use template defaults.
    // Otherwise, preserve user's input.
    const hasUserDims = (globalDims.length > 0 || globalDims.width > 0 || globalDims.depth > 0);
    const dimsToUse = hasUserDims ? globalDims : { length: 80, width: 0.6, depth: 0.7 };
    
    if (!hasUserDims) {
        setGlobalDims(dimsToUse);
    }
    
    // Force update both local state and parent state
    setGroups(template);
    onDataChange(template, dimsToUse);
  };
  
  const clearAll = (e: React.MouseEvent) => {
     e.stopPropagation();
     // Removed preventDefault()
     
     // Removed confirmation for immediate action as requested
     setGroups([]);
     onDataChange([], globalDims);
  };

  const handleDownloadPDF = async () => {
    setIsGeneratingPdf(true);
    
    // Use a small timeout to allow UI to render the print layout if needed
    setTimeout(async () => {
        const element = document.getElementById('pdf-content-root');
        if (element) {
            const clone = element.cloneNode(true) as HTMLElement;
            
            // RESET ROOT STYLES for PDF Generation
            clone.style.width = '210mm';
            clone.style.minHeight = '297mm';
            clone.style.margin = '0 auto';
            clone.style.padding = '0';
            clone.style.position = 'static'; 
            clone.style.backgroundColor = 'white';

            // Fix individual pages
            const pages = clone.querySelectorAll('.print-page');
            pages.forEach((page) => {
                const p = page as HTMLElement;
                p.classList.remove('mx-auto', 'shadow-lg', 'my-8'); 
                p.style.margin = '0'; 
                p.style.marginBottom = '0';
                p.style.boxShadow = 'none';
                p.style.width = '210mm'; 
                p.style.minHeight = '297mm'; 
                
                // Ensure padding is consistent and box-sizing is border-box to prevent overflow
                p.style.padding = '20mm'; 
                p.style.boxSizing = 'border-box';
                p.style.backgroundColor = 'white';
            });
            
            // Create a temporary container to hold the clone for capture
            // We use a fixed container slightly wider than A4 to ensure no scrollbars appear in capture
            const container = document.createElement('div');
            container.style.position = 'fixed';
            container.style.top = '-10000px';
            container.style.left = '0';
            container.style.zIndex = '-9999';
            container.style.width = '215mm'; // Slightly wider than 210mm
            container.style.display = 'flex';
            container.style.justifyContent = 'center'; // Center the content
            container.style.backgroundColor = '#fff';
            
            container.appendChild(clone);
            document.body.appendChild(container);

            const opt = {
                margin: 0,
                filename: `BQ_${projectData.namaProjek || 'Projek'}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { 
                    scale: 2, 
                    useCORS: true, 
                    scrollY: 0,
                    // Remove x,y, scrollX to allow auto-capture of the element
                    windowWidth: document.body.scrollWidth,
                }, 
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };

            try {
                // @ts-ignore
                await window.html2pdf().set(opt).from(clone).save();
            } catch (err) {
                console.error(err);
                alert("Ralat menjana PDF.");
            } finally {
                document.body.removeChild(container);
                setIsGeneratingPdf(false);
            }
        } else {
            setIsGeneratingPdf(false);
            alert("Ralat: Tidak dapat menjana PDF. Elemen tidak ditemui.");
        }
    }, 100);
  };

  // --- RENDER MODES ---

  if (isPrintView) {
      // Calculate totals for preview
      const totalCost = groups.reduce((acc, g) => acc + g.items.reduce((s, i) => s + (i.amount || 0), 0), 0);
      if (onPreviewCostChange && totalCost !== undefined) {
         // Use a timeout to avoid render loop warning
         setTimeout(() => onPreviewCostChange(totalCost), 0);
      }
      
      // Pagination Helper: Split items into pages
      const getGroupPages = (items: BQItem[]) => {
          const pages: BQItem[][] = [];
          
          // First page usually takes fewer items due to group title headers
          const FIRST_PAGE_ITEMS = 12; 
          // Subsequent pages can take more items
          const NEXT_PAGE_ITEMS = 18;
          
          let remainingItems = [...items];
          let isFirstPage = true;
          
          while (remainingItems.length > 0) {
              const limit = isFirstPage ? FIRST_PAGE_ITEMS : NEXT_PAGE_ITEMS;
              const chunk = remainingItems.splice(0, limit);
              pages.push(chunk);
              isFirstPage = false;
          }
          
          return pages.length > 0 ? pages : [[]]; // Ensure at least one page if empty
      };

      // Get PJA User Name
      const pjaUser = mockService.getUsers().find(u => u.id === projectData.pjaId);
      const preparerName = pjaUser ? pjaUser.fullName.toUpperCase() : 'MOHAMAD KHAIRUL AMIRIN BIN ZAINAL ABIDIN';

      return (
        <div className="flex flex-col items-center bg-gray-100 min-h-screen py-8">
            {/* Toolbar */}
            <div className="sticky top-20 z-50 flex gap-4 mb-8 bg-white/80 backdrop-blur-md p-2 rounded-2xl shadow-lg border border-gray-200">
                <button type="button" onClick={handleDownloadPDF} disabled={isGeneratingPdf} className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50">
                    {isGeneratingPdf ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                    <span>{isGeneratingPdf ? 'Sedang Menjana...' : 'Muat Turun PDF'}</span>
                </button>
            </div>

            <div id="pdf-content-root" className="w-[210mm] bg-white shadow-2xl">
                
                {/* 1. COVER PAGE - CONTRACT INFO */}
                <PrintPage>
                    <PrintHeader />
                    
                    <div className="border-2 border-black flex-1 flex flex-col font-arial text-sm">
                        {/* Title Row */}
                        <div className="flex border-b border-black">
                            <div className="w-32 p-2 border-r border-black font-bold bg-gray-100">Tarikh</div>
                            <div className="flex-1 p-2 font-bold">{projectData.tarikhBuka}</div>
                        </div>

                        {/* From Row */}
                        <div className="flex border-b border-black flex-1">
                            <div className="w-32 p-2 border-r border-black font-bold bg-gray-100">Daripada</div>
                            <div className="flex-1 p-2">
                                <p className="font-bold">{preparerName}</p>
                                <p>Penolong Jurutera,</p>
                                <p>Bahagian Infrastruktur,</p>
                                <p>Unit Selenggara Infrastruktur.</p>
                            </div>
                        </div>

                        {/* To Row */}
                        <div className="flex border-b border-black h-24">
                            <div className="w-32 p-2 border-r border-black font-bold bg-gray-100">Kepada</div>
                            <div className="flex-1 p-2">
                                <p className="font-bold">Pengarah</p>
                                <p>Jabatan Kejuruteraan</p>
                            </div>
                        </div>

                         {/* Project Title Row */}
                         <div className="flex border-b border-black h-32">
                            <div className="w-32 p-2 border-r border-black font-bold bg-gray-100">Tajuk</div>
                            <div className="flex-1 p-2 uppercase font-bold">
                                {projectData.namaProjek}
                            </div>
                        </div>

                        {/* File Ref Row */}
                        <div className="flex">
                            <div className="w-32 p-2 border-r border-black font-bold bg-gray-100">Blok Perancangan</div>
                            <div className="flex-1 p-2">
                                {projectData.bp || '.........................'}
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 font-arial text-sm space-y-4">
                        <p>Perkara di atas adalah dirujuk.</p>
                        <p>2.</p>
                        <p className="pl-8">Bersama-sama ini dilampirkan pelan tapak, gambar lokasi aduan serta spesifikasi kerja (BQ).</p>
                        <div className="mt-8 space-y-1 font-bold">
                            <p>Sekian, terima kasih.</p>
                            <p className="mt-4">"KITASELANGOR MAJU BERSAMA"</p>
                            <p>"MALAYSIA MADANI"</p>
                            <p>"BERKHIDMAT UNTUK NEGARA"</p>
                            <p>"MAMPAN PROGRESIF SEJAHTERA"</p>
                        </div>
                        <p className="mt-8">Saya yang menjalankan amanah,</p>
                        <div className="mt-12 font-bold">
                            <p>({preparerName})</p>
                            <p className="font-normal">Penolong Jurutera JA 29,</p>
                            <p className="font-normal">Bahagian Infrastruktur,</p>
                            <p className="font-normal">Unit Selenggara Infrastruktur.</p>
                        </div>
                    </div>
                </PrintPage>

                {/* 2. SIGNATURE PAGE */}
                <PrintPage>
                    <div className="border border-black h-full p-8 flex flex-col justify-between font-arial text-sm">
                        
                        {/* Engineer Review */}
                        <div className="space-y-6">
                            <h3 className="font-bold underline">ULASAN JURUTERA</h3>
                            
                            <div className="space-y-4 mt-8">
                                <div className="flex items-end gap-4">
                                    <div className="font-bold w-40">Anggaran Kontrak :</div>
                                    <div className="flex-1 border-b border-black"></div>
                                </div>
                                <div className="flex items-end gap-4">
                                    <div className="font-bold w-40">Tempoh Kontrak :</div>
                                    <div className="flex-1 border-b border-black"></div>
                                </div>
                                <div className="flex items-end gap-4">
                                    <div className="font-bold w-40">Lantikan :</div>
                                    <div className="flex-1 border-b border-black"></div>
                                </div>
                            </div>

                            <div className="mt-12 space-y-12">
                                <div className="font-bold">Tandatangan :</div>
                                <div className="font-bold">Tarikh :</div>
                            </div>
                            
                             <div className="border-b-2 border-black mt-8"></div>
                        </div>

                         {/* Director Review */}
                         <div className="space-y-6">
                            <h3 className="font-bold underline uppercase">ULASAN PENGARAH :</h3>
                            <p>Rujuk kelulusan Jawatankuasa Sebutharga Majlis Perbandaran Selayang yang bersidang pada .............................. dengan rotasi bagi syarikat :-</p>
                            
                            <div className="space-y-4 mt-8">
                                <div className="w-full border-b border-black h-8"></div>
                                <div className="w-full border-b border-black h-8"></div>
                            </div>

                            <div className="mt-12 space-y-12">
                                <div className="font-bold">Tandatangan :</div>
                                <div className="font-bold">Tarikh :</div>
                            </div>
                        </div>

                    </div>
                </PrintPage>
                
                {/* 3. BQ CONTENT PAGES - WITH PAGINATION */}
                {groups.map((group, gIndex) => {
                    const groupPages = getGroupPages(group.items);
                    
                    return groupPages.map((pageItems, pIndex) => {
                        const isFirstPageOfGroup = pIndex === 0;
                        const isLastPageOfGroup = pIndex === groupPages.length - 1;
                        // For item numbering: we need the running index
                        // Calculate items before this page
                        let itemsBefore = 0;
                        for(let i=0; i<pIndex; i++) itemsBefore += groupPages[i].length;

                        return (
                            <PrintPage key={`${group.id}-page-${pIndex}`}>
                                 {/* Header Table - Repeats on every page */}
                                 <div className="border-2 border-black text-xs font-bold font-arial mb-2">
                                     <div className="flex border-b border-black">
                                        <div className="w-1/2 p-2 border-r border-black">NO ADUAN : {projectData.noAduan}</div>
                                        <div className="w-1/2 p-2">LOKASI : {group.location || projectData.lokasi}</div>
                                     </div>
                                 </div>
        
                                 {/* Items Table */}
                                 <div className="flex-1 border-2 border-black flex flex-col font-arial text-xs">
                                     {/* Table Header - Repeats on every page */}
                                     <div className="flex border-b-2 border-black bg-gray-100 font-bold text-center">
                                         <div className="w-10 p-2 border-r border-black flex items-center justify-center">BIL</div>
                                         <div className="flex-1 p-2 border-r border-black flex items-center justify-center">KETERANGAN</div>
                                         <div className="w-14 p-2 border-r border-black flex items-center justify-center">UNIT</div>
                                         <div className="w-16 p-2 border-r border-black flex items-center justify-center">KUANTITI</div>
                                         <div className="w-20 p-2 border-r border-black flex items-center justify-center">KADAR HARGA (RM)</div>
                                         <div className="w-24 p-2 flex items-center justify-center">JUMLAH (RM)</div>
                                     </div>
        
                                     {/* Group Title Row - ONLY on First Page of Group */}
                                     {isFirstPageOfGroup && (
                                        <div className="flex border-b border-black font-bold bg-gray-50">
                                            <div className="w-10 p-2 border-r border-black"></div>
                                            <div className="flex-1 p-2 border-r border-black uppercase">{group.title}</div>
                                            <div className="w-14 border-r border-black"></div>
                                            <div className="w-16 border-r border-black"></div>
                                            <div className="w-20 border-r border-black"></div>
                                            <div className="w-24"></div>
                                        </div>
                                     )}
        
                                     {/* Items for this page */}
                                     {pageItems.map((item, localIndex) => {
                                         const globalItemIndex = itemsBefore + localIndex;
                                         return (
                                             <div key={item.id} className="flex border-b border-black min-h-[32px]">
                                                <div className="w-10 p-1 border-r border-black text-center flex items-start justify-center pt-2">
                                                    {!item.isHeader && !item.isNote && `${gIndex + 1}.${globalItemIndex + 1}`}
                                                    {item.isHeader && <span className="font-bold">{gIndex + 1}.{globalItemIndex + 1}</span>}
                                                </div>
                                                <div className="flex-1 p-2 border-r border-black whitespace-pre-wrap">
                                                    <span className={`${item.isHeader ? 'font-bold' : item.isNote ? 'italic' : ''} ${item.description === 'ALL QUANTITY ARE PROVISIONAL' ? 'text-red-600 font-bold underline' : ''}`}>
                                                        {item.description}
                                                    </span>
                                                </div>
                                                <div className="w-14 p-2 border-r border-black text-center flex items-center justify-center">
                                                    {item.unit}
                                                </div>
                                                <div className="w-16 p-2 border-r border-black text-center flex items-center justify-center font-bold">
                                                    {item.qty && item.qty > 0 ? item.qty : ''}
                                                </div>
                                                <div className="w-20 p-2 border-r border-black text-right flex items-center justify-end">
                                                    {item.rate && item.rate > 0 ? item.rate.toFixed(2) : ''}
                                                </div>
                                                <div className="w-24 p-2 text-right flex items-center justify-end font-bold">
                                                    {item.amount && item.amount > 0 ? formatCurrency(item.amount).replace('RM', '') : ''}
                                                </div>
                                             </div>
                                         );
                                     })}
                                     
                                     {/* Group Total Row - ONLY on Last Page of Group */}
                                     {isLastPageOfGroup && (
                                         <div className="mt-auto border-t-2 border-black flex font-bold bg-gray-100">
                                             <div className="flex-1 p-2 text-right border-r border-black">TO COLLECTION</div>
                                             <div className="w-24 p-2 text-right">
                                                 {formatCurrency(group.items.reduce((acc, item) => acc + (item.amount || 0), 0)).replace('RM', '')}
                                             </div>
                                         </div>
                                     )}
                                 </div>
                            </PrintPage>
                        );
                    });
                })}

                {/* 4. GRAND SUMMARY PAGE */}
                <PrintPage>
                    <div className="border-2 border-black flex-1 flex flex-col font-arial text-xs">
                        <div className="flex border-b-2 border-black bg-gray-100 font-bold text-center">
                            <div className="w-16 p-2 border-r border-black">BIL</div>
                            <div className="flex-1 p-2 border-r border-black">KETERANGAN</div>
                            <div className="w-32 p-2">JUMLAH (RM)</div>
                        </div>

                        {groups.map((group, index) => {
                            const groupTotal = group.items.reduce((acc, item) => acc + (item.amount || 0), 0);
                            return (
                                <div key={group.id} className="flex border-b border-black min-h-[40px] font-bold">
                                    <div className="w-16 p-2 border-r border-black text-center flex items-center justify-center">
                                        BIL NO. <br/> {index + 1}
                                    </div>
                                    <div className="flex-1 p-2 border-r border-black flex items-center uppercase">
                                        {group.title}
                                    </div>
                                    <div className="w-32 p-2 text-right flex items-center justify-end">
                                        {formatCurrency(groupTotal).replace('RM', '')}
                                    </div>
                                </div>
                            );
                        })}

                        <div className="border-t-2 border-black flex font-bold bg-gray-100 text-sm">
                             <div className="flex-1 p-3 text-right border-r border-black uppercase">TO COLLECTION</div>
                             <div className="w-32 p-3 text-right">
                                 {formatCurrency(totalCost).replace('RM', '')}
                             </div>
                        </div>

                        <div className="mt-4 px-2 space-y-4">
                            <div className="text-xs">
                                <p>Sebelum kerja-kerja dimulakan pemborong dikehendaki melawat tapak bersama dengan Penolong Jurutera kawasan untuk mempastikan tempat dan menyelesaikan masalah berbangkit di tapak sebelum memulakan kerja. Kontraktor adalah dikecualikan daripada mengemukakkan Bon Perlaksanaan. Walaubagaimanapun, tempoh tanggungan kecacatan seperti di bawah juga dikenakan kepada kontraktor dan syarat ini hendaklah dinyatakan dalam surat tawaran.</p>
                                <p className="font-bold">( Rujuk Kementerian Kewangan Surat Pekeliling Perbendaharaan Bil 3 Tahun 2007)</p>
                            </div>

                            <div className="grid grid-cols-2 gap-8 text-xs font-bold mt-4">
                                <div>
                                    <div className="flex justify-between border-b border-black py-1">
                                        <span>Nilai Projek</span>
                                    </div>
                                    <div className="py-1">RM 10,000 - RM 100,000</div>
                                    <div className="py-1">Melebihi RM 100,000</div>
                                </div>
                                 <div>
                                    <div className="flex justify-between border-b border-black py-1">
                                        <span>Tempoh Tanggungan Kecacatan</span>
                                    </div>
                                    <div className="py-1">6 Bulan dari tarikh kerja diperakukan siap</div>
                                    <div className="py-1">12 bulan dari tarikh kerja diperakukan siap</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-12 mt-12 text-xs font-bold uppercase">
                                 <div className="border-t border-black pt-2 text-center">
                                    Disediakan oleh
                                 </div>
                                 <div className="border-t border-black pt-2 text-center">
                                    Disemak oleh,
                                 </div>
                            </div>
                        </div>

                    </div>
                </PrintPage>
            </div>
        </div>
      );
  }

  // --- EDIT VIEW ---
  return (
    <div className="p-4 md:p-8">
       {/* Toolbar for Editor */}
       <div className="mb-6 flex justify-end gap-2">
            {groups.length > 0 && (
                <>
                    <button 
                        type="button"
                        onClick={clearAll} 
                        className="px-4 py-2 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 rounded-xl font-bold hover:bg-red-100 dark:hover:bg-red-900/30 transition-all flex items-center gap-2 text-sm"
                    >
                        <Eraser className="w-4 h-4" />
                        Padam Semua
                    </button>
                    {/* GUNA TEMPLATE BUTTON REMOVED WHEN ITEMS EXIST */}
                </>
            )}
       </div>

       {/* Global Dimensions Card */}
       <div className="mb-8 p-6 rounded-2xl bg-indigo-50 dark:bg-[#162032] border border-indigo-100 dark:border-indigo-900/50 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                 <Calculator className="w-6 h-6" />
              </div>
              <div>
                 <h4 className="font-bold text-slate-900 dark:text-white">Ukuran Global (Meter)</h4>
                 <p className="text-xs text-slate-500 dark:text-slate-400">Ukuran ini akan digunakan untuk item "Auto Calculation"</p>
              </div>
           </div>
           
           <div className="flex gap-4">
               {['length', 'width', 'depth'].map((dim) => (
                   <div key={dim} className="relative group">
                       <label className="absolute -top-2 left-3 bg-indigo-50 dark:bg-[#162032] px-1 text-[10px] font-bold text-indigo-500 uppercase tracking-wider">
                           {dim === 'length' ? 'Panjang' : dim === 'width' ? 'Lebar' : 'Tinggi'}
                       </label>
                       <input 
                           type="number" 
                           value={globalDims[dim as keyof GlobalDimensions] || ''}
                           onChange={(e) => updateGlobalDim(dim as keyof GlobalDimensions, parseFloat(e.target.value) || 0)}
                           className="w-24 px-3 py-3 rounded-xl bg-white dark:bg-[#0f172a] border border-indigo-200 dark:border-indigo-900 focus:ring-2 focus:ring-indigo-500 text-center font-bold text-indigo-600 dark:text-indigo-400 outline-none shadow-sm"
                           placeholder="0.00"
                       />
                   </div>
               ))}
           </div>
       </div>

       {/* Groups */}
       {groups.map((group, groupIndex) => (
           <div key={group.id} className="mb-10 animate-fade-in-up" style={{ animationDelay: `${groupIndex * 100}ms` }}>
               
               {/* Group Header */}
               <div className="flex items-center justify-between mb-4 sticky top-[72px] z-20 bg-white/90 dark:bg-[#0f172a]/90 backdrop-blur-md p-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                   <div className="w-full">
                       <input 
                           type="text" 
                           value={group.title}
                           onChange={(e) => {
                               const newGroups = [...groups];
                               // Deep copy group
                               newGroups[groupIndex] = { ...newGroups[groupIndex], title: e.target.value };
                               setGroups(newGroups);
                               onDataChange(newGroups, globalDims);
                           }}
                           className="bg-transparent text-lg font-bold text-slate-800 dark:text-white w-full outline-none px-2 mb-1"
                           placeholder="Tajuk Bil..."
                       />
                       <input 
                           type="text" 
                           value={group.location || ''}
                           onChange={(e) => {
                               const newGroups = [...groups];
                               // Deep copy group
                               newGroups[groupIndex] = { ...newGroups[groupIndex], location: e.target.value };
                               setGroups(newGroups);
                               onDataChange(newGroups, globalDims);
                           }}
                           className="bg-transparent text-xs font-medium text-slate-500 dark:text-slate-400 w-full outline-none px-2"
                           placeholder="Lokasi Khusus (Pilihan)..."
                       />
                   </div>
                   <div className="flex items-center gap-2 shrink-0 ml-2">
                       <div className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-bold text-slate-500">
                           {group.items.length} Item
                       </div>
                       <div className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-lg text-xs font-bold">
                           {formatCurrency(group.items.reduce((acc, i) => acc + (i.amount || 0), 0))}
                       </div>
                       <button onClick={(e) => {
                          e.stopPropagation();
                          // Direct delete group
                          const newGroups = [...groups];
                          newGroups.splice(groupIndex, 1);
                          setGroups(newGroups);
                          onDataChange(newGroups, globalDims);
                       }} className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-colors">
                           <Trash2 className="w-4 h-4" />
                       </button>
                   </div>
               </div>

               {/* Items List */}
               <div className="space-y-4">
                   {group.items.map((item, itemIndex) => (
                       <BQItemCard 
                           key={item.id}
                           item={item}
                           globalDims={globalDims}
                           index={itemIndex}
                           isLast={itemIndex === group.items.length - 1}
                           onUpdate={(updates) => handleUpdateItem(groupIndex, itemIndex, updates)}
                           onMove={(dir) => handleMoveItem(groupIndex, itemIndex, dir)}
                           onDelete={(e) => handleDeleteItem(groupIndex, itemIndex, e)}
                           onInsertAfter={() => handleAddItem(groupIndex, itemIndex)}
                       />
                   ))}
               </div>

               {/* Add Item Button */}
               <button 
                   onClick={() => handleAddItem(groupIndex)}
                   className="mt-4 w-full py-3 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 text-slate-400 hover:text-indigo-500 hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-all flex items-center justify-center gap-2 font-bold text-sm group"
               >
                   <PlusCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                   Tambah Item Baru
               </button>
           </div>
       ))}

       {/* Add Group Button (Restored) - Only visible if groups exist */}
       {groups.length > 0 && (
           <button 
               onClick={() => {
                   const newGroups = [...groups, { id: uuid(), title: `BIL NO. ${groups.length + 1}`, items: [] }];
                   setGroups(newGroups);
                   onDataChange(newGroups, globalDims);
               }}
               className="w-full py-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl flex items-center justify-center gap-2 text-slate-500 font-bold hover:text-indigo-600 hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-all mb-10"
           >
               <PlusCircle className="w-5 h-5" />
               Tambah Kumpulan Baru
           </button>
       )}

       {/* Empty State Actions */}
       {groups.length === 0 && (
           <div className="text-center py-12">
               <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                   <StickyNote className="w-8 h-8 text-slate-400" />
               </div>
               <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">Tiada Data BQ</h3>
               <p className="text-slate-500 dark:text-slate-400 mb-6">Mula dengan menambah kumpulan atau guna template.</p>
               <div className="flex justify-center gap-4">
                   <button onClick={() => {
                       const newGroups = [...groups, { id: uuid(), title: 'BIL NO. 1', items: [] }];
                       setGroups(newGroups);
                       onDataChange(newGroups, globalDims);
                   }} className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all">
                       Tambah Kumpulan
                   </button>
                   <button onClick={loadTemplate} className="px-6 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold hover:bg-slate-300 dark:hover:bg-slate-600 transition-all">
                       Guna Template Longkang
                   </button>
               </div>
           </div>
       )}
    </div>
  );
};

export default BQEditor;
