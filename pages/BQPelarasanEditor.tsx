

import React, { useState, useEffect, useRef } from 'react';
import { BQGroup, BQItem, formatCurrency, GlobalDimensions, Project } from '../types';
import { Download, Loader2, Lock, Unlock } from 'lucide-react';

interface BQPelarasanEditorProps {
  originalData: BQGroup[];
  pelarasanData: BQGroup[];
  globalDims: GlobalDimensions;
  onDataChange: (data: BQGroup[], dims: GlobalDimensions) => void;
  projectData: Project;
  isPrintView?: boolean;
}

// --- UTILS ---

// Auto-expanding Textarea Component (Exact same style as BQEditor)
const AutoTextArea = ({ value, onChange, className, placeholder, rows = 1, disabled }: any) => {
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = 'auto';
      textAreaRef.current.style.height = textAreaRef.current.scrollHeight + 'px';
    }
  }, [value]);

  return (
    <textarea
      ref={textAreaRef}
      value={value}
      onChange={onChange}
      className={className}
      placeholder={placeholder}
      rows={rows}
      disabled={disabled}
      style={{ overflow: 'hidden' }}
    />
  );
};

// Helper to calculate item totals
const calculateItem = (item: BQItem, dims: GlobalDimensions): BQItem => {
  if (item.isCalculation) {
    const L = item.isSynced ? (dims.length || 0) : (item.dimLength || 0);
    const W = item.isSynced ? (dims.width || 0) : (item.dimWidth || 0);
    const D = item.isSynced ? (dims.depth || 0) : (item.dimDepth || 0);
    const Count = item.dimCount || 1;
    
    let calculatedQty = Count;
    if (item.includeLength !== false) calculatedQty *= L;
    if (item.includeWidth !== false) calculatedQty *= W;
    if (item.includeDepth !== false) calculatedQty *= D;
    
    const qty = Math.round(calculatedQty * 100) / 100;
    const amount = Math.round((qty * (item.rate || 0)) * 100) / 100;
    
    return { ...item, qty, amount };
  } else {
    const amount = Math.round(((item.qty || 0) * (item.rate || 0)) * 100) / 100;
    return { ...item, amount };
  }
};

// Component for Item Comparison
const ComparisonItemRow = ({ 
    originalItem, 
    adjustedItem, 
    globalDims,
    onUpdate 
}: { 
    originalItem?: BQItem, 
    adjustedItem: BQItem, 
    globalDims: GlobalDimensions,
    onUpdate: (updates: Partial<BQItem>) => void 
}) => {
    
    const [isLocked, setIsLocked] = useState(true);

    const toggleLock = () => {
        setIsLocked(!isLocked);
    };

    const handleInput = (field: keyof BQItem, value: any) => {
        const numValue = parseFloat(value);
        const finalValue = isNaN(numValue) ? value : numValue;
        
        // Critical Fix: If user manually changes dimensions, we MUST disable sync
        // to ensure the manual value is used in calculation instead of Global Dims.
        if (field === 'dimLength' || field === 'dimWidth' || field === 'dimDepth') {
            onUpdate({ [field]: finalValue, isSynced: false });
        } else {
            onUpdate({ [field]: finalValue });
        }
    };

    // Determine status color for Adjusted Row
    let containerClass = "border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1e293b]";
    let amountColor = "text-slate-900 dark:text-white";

    if (originalItem) {
        const origAmt = originalItem.amount || 0;
        const adjAmt = adjustedItem.amount || 0;
        
        if (adjAmt < origAmt) {
            // Lower Cost (Savings) -> RED
            containerClass = "border-red-400 dark:border-red-500 bg-red-50 dark:bg-red-900/10";
            amountColor = "text-red-600 dark:text-red-400";
        } else if (adjAmt > origAmt) {
            // Higher Cost (Increase) -> BLUE
            containerClass = "border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/10";
            amountColor = "text-blue-600 dark:text-blue-400";
        }
    }

    const isHeaderOrNote = adjustedItem.isHeader || adjustedItem.isNote;
    const isOriginalHeaderOrNote = originalItem?.isHeader || originalItem?.isNote;

    // Standard Styles from BQEditor
    const inputStyle = "bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg p-2 text-xs w-full text-center outline-none transition-all placeholder-slate-400 dark:placeholder-slate-600";
    const labelStyle = "text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-wider mb-1 block text-center";

    return (
        <div className={`mb-6 rounded-2xl border-2 transition-all duration-300 overflow-hidden shadow-sm ${containerClass}`}>
            
            {/* 1. ORIGINAL ROW (READ ONLY REFERENCE) */}
            {originalItem && (
                <div className="bg-slate-100/80 dark:bg-slate-800/80 p-4 border-b border-slate-200 dark:border-slate-700/50">
                     <div className="flex gap-4">
                         {/* Control Placeholder to align with Lock Button */}
                         <div className="w-[30px] pt-1 flex flex-col items-center">
                            <span className="text-[10px] font-bold text-slate-400">ASAL</span>
                         </div>

                         <div className="flex-1 grid grid-cols-12 gap-4 opacity-70">
                             <div className={isOriginalHeaderOrNote ? "col-span-12" : "col-span-6"}>
                                 <div className={`text-sm ${originalItem.isHeader ? 'font-bold uppercase' : originalItem.isNote ? 'italic text-slate-500' : 'text-slate-700 dark:text-slate-300'}`}>
                                     {originalItem.description}
                                 </div>
                             </div>

                             {!isOriginalHeaderOrNote && (
                                <>
                                    <div className="col-span-1 text-center">
                                        <label className={labelStyle}>Unit</label>
                                        <div className="text-xs font-medium text-slate-600 dark:text-slate-400">{originalItem.unit}</div>
                                    </div>
                                    <div className="col-span-1 text-center">
                                        <label className={labelStyle}>Qty</label>
                                        <div className="text-xs font-bold text-slate-600 dark:text-slate-400">{originalItem.qty}</div>
                                    </div>
                                    <div className="col-span-2 text-center">
                                        <label className={labelStyle}>Kadar</label>
                                        <div className="text-xs font-medium text-slate-600 dark:text-slate-400">{originalItem.rate?.toFixed(2)}</div>
                                    </div>
                                    <div className="col-span-2 text-center">
                                        <label className={labelStyle}>Jumlah</label>
                                        <div className="text-xs font-bold text-slate-600 dark:text-slate-400">{formatCurrency(originalItem.amount)}</div>
                                    </div>
                                </>
                             )}
                         </div>
                     </div>
                </div>
            )}

            {/* 2. ADJUSTED ROW (EDITABLE) */}
            <div className="p-4">
                 <div className="flex gap-4 items-start">
                     {/* Lock Control */}
                     <div className="flex flex-col gap-1 pt-1 w-[30px] shrink-0">
                         <button 
                            onClick={toggleLock} 
                            className={`p-1.5 rounded-lg transition-colors flex items-center justify-center ${isLocked ? 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-300' : 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-200'}`}
                            title={isLocked ? "Buka Kunci untuk Edit" : "Kunci ke Nilai Asal"}
                         >
                            {isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                         </button>
                     </div>

                     <div className="flex-1 grid grid-cols-12 gap-4">
                         {/* Description */}
                         <div className={isHeaderOrNote ? "col-span-12" : "col-span-6"}>
                            <AutoTextArea 
                                value={adjustedItem.description}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInput('description', e.target.value)}
                                disabled={isLocked}
                                rows={adjustedItem.isHeader ? 1 : 2}
                                className={`w-full bg-transparent resize-none outline-none border-b border-transparent focus:border-indigo-500 transition-colors ${adjustedItem.isHeader ? 'font-bold uppercase tracking-wide text-slate-900 dark:text-white' : adjustedItem.isNote ? 'text-slate-500 dark:text-slate-400 italic' : 'font-medium text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600'}`}
                                placeholder={adjustedItem.isNote ? "Tulis nota di sini..." : "Keterangan..."}
                            />

                            {/* Detailed Calculation Fields (Only if unlocked & isCalculation) */}
                            {!isLocked && adjustedItem.isCalculation && (
                                <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 grid grid-cols-4 gap-2 animate-slide-down">
                                     <div>
                                        <label className="text-[9px] font-bold text-slate-400 block mb-1 text-center">PANJANG</label>
                                        <input type="number" value={adjustedItem.dimLength || ''} onChange={(e) => handleInput('dimLength', e.target.value)} className={`${inputStyle} text-center font-mono`} placeholder="0" />
                                     </div>
                                     <div>
                                        <label className="text-[9px] font-bold text-slate-400 block mb-1 text-center">LEBAR</label>
                                        <input type="number" value={adjustedItem.dimWidth || ''} onChange={(e) => handleInput('dimWidth', e.target.value)} className={`${inputStyle} text-center font-mono`} placeholder="0" />
                                     </div>
                                     <div>
                                        <label className="text-[9px] font-bold text-slate-400 block mb-1 text-center">TINGGI</label>
                                        <input type="number" value={adjustedItem.dimDepth || ''} onChange={(e) => handleInput('dimDepth', e.target.value)} className={`${inputStyle} text-center font-mono`} placeholder="0" />
                                     </div>
                                     <div>
                                        <label className="text-[9px] font-bold text-slate-400 block mb-1 text-center">BIL</label>
                                        <input type="number" value={adjustedItem.dimCount || ''} onChange={(e) => handleInput('dimCount', e.target.value)} className={`${inputStyle} text-center font-mono`} placeholder="1" />
                                     </div>
                                </div>
                            )}
                         </div>

                         {!isHeaderOrNote && (
                             <>
                                <div className="col-span-1">
                                    <label className={labelStyle}>Unit</label>
                                    <input type="text" value={adjustedItem.unit} onChange={(e) => handleInput('unit', e.target.value)} disabled={isLocked} className={`${inputStyle} text-center`} placeholder="Unit" />
                                </div>
                                <div className="col-span-1">
                                    <label className={labelStyle}>Qty</label>
                                    <input 
                                        type="number" 
                                        value={adjustedItem.qty} 
                                        onChange={(e) => handleInput('qty', e.target.value)} 
                                        disabled={isLocked || adjustedItem.isCalculation} 
                                        className={`${inputStyle} font-bold text-center ${adjustedItem.isCalculation && !isLocked ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-indigo-200' : ''}`} 
                                        placeholder="0"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className={labelStyle}>Kadar</label>
                                    <input type="number" value={adjustedItem.rate} onChange={(e) => handleInput('rate', e.target.value)} disabled={isLocked} className={`${inputStyle} text-right`} placeholder="0.00" />
                                </div>
                                <div className="col-span-2">
                                    <label className={labelStyle}>Jumlah</label>
                                    <div className={`h-[34px] flex items-center justify-end px-3 font-bold bg-white/50 dark:bg-slate-800 rounded-lg text-xs border border-transparent ${amountColor}`}>
                                        {formatCurrency(adjustedItem.amount)}
                                    </div>
                                </div>
                             </>
                         )}
                     </div>
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
  
const PrintHeader = ({ title }: { title: string }) => (
    <div className="text-center mb-6 font-arial">
        <div className="flex justify-between items-start mb-4">
          <div className="w-32 h-20 border border-black flex items-center justify-center text-xs font-bold p-2 text-center">LOGO MPS</div>
          <div className="flex-1 px-4">
             <h1 className="font-bold text-lg uppercase leading-tight">JABATAN KEJURUTERAAN</h1>
             <h2 className="font-bold text-xl uppercase mt-1">MAJLIS PERBANDARAN SELAYANG</h2>
          </div>
          <div className="w-24 h-20 border border-black flex items-center justify-center text-xs font-bold p-2 text-center bg-gray-200">LOGO SELANGOR</div>
        </div>
        <h3 className="font-bold text-lg underline uppercase">{title}</h3>
    </div>
);


const BQPelarasanEditor: React.FC<BQPelarasanEditorProps> = ({ originalData, pelarasanData, globalDims, onDataChange, projectData, isPrintView }) => {
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

    // Calculate item changes on mount or when dims change
    useEffect(() => {
        const updatedGroups = pelarasanData.map(group => ({
            ...group,
            items: group.items.map(item => calculateItem(item, globalDims))
        }));
        
        // Deep compare to avoid infinite loop (simple JSON stringify is sufficient for this data structure)
        if (JSON.stringify(updatedGroups) !== JSON.stringify(pelarasanData)) {
            onDataChange(updatedGroups, globalDims);
        }
    }, [globalDims]); // React to Global Dims changes

    const handleUpdateItem = (groupIndex: number, itemIndex: number, updates: Partial<BQItem>) => {
        const newGroups = [...pelarasanData];
        // Deep copy group structure
        newGroups[groupIndex] = { ...newGroups[groupIndex], items: [...newGroups[groupIndex].items] };
        
        let newItem = { ...newGroups[groupIndex].items[itemIndex], ...updates };
        
        // If dimensions or qty changed, recalculate
        newItem = calculateItem(newItem, globalDims);
        
        newGroups[groupIndex].items[itemIndex] = newItem;
        onDataChange(newGroups, globalDims);
    };

    // PDF GENERATION
    const handleDownloadPDF = async () => {
        setIsGeneratingPdf(true);
        setTimeout(async () => {
            const element = document.getElementById('pdf-pelarasan-root');
            if (element) {
                const clone = element.cloneNode(true) as HTMLElement;
                
                // RESET ROOT STYLES for PDF Generation
                clone.style.width = '210mm';
                clone.style.minHeight = '297mm';
                clone.style.margin = '0 auto';
                clone.style.padding = '0';
                clone.style.position = 'static'; 
                clone.style.backgroundColor = 'white';
    
                const pages = clone.querySelectorAll('.print-page');
                pages.forEach((page) => {
                    const p = page as HTMLElement;
                    p.classList.remove('mx-auto', 'shadow-lg', 'my-8'); 
                    p.style.margin = '0'; 
                    p.style.marginBottom = '0';
                    p.style.boxShadow = 'none';
                    p.style.width = '210mm'; 
                    p.style.minHeight = '297mm'; 
                    p.style.padding = '20mm'; 
                    p.style.boxSizing = 'border-box';
                    p.style.backgroundColor = 'white';
                });
                
                const container = document.createElement('div');
                container.style.position = 'fixed';
                container.style.top = '-10000px';
                container.style.left = '0';
                container.style.zIndex = '-9999';
                container.style.width = '215mm'; 
                container.style.display = 'flex';
                container.style.justifyContent = 'center';
                container.style.backgroundColor = '#fff';
                
                container.appendChild(clone);
                document.body.appendChild(container);
    
                const opt = {
                    margin: 0,
                    filename: `Pelarasan_${projectData.noFail}.pdf`,
                    image: { type: 'jpeg', quality: 0.98 },
                    html2canvas: { scale: 2, useCORS: true, scrollY: 0, windowWidth: document.body.scrollWidth }, 
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
            }
            setIsGeneratingPdf(false);
        }, 100);
    };

    if (isPrintView) {
        // Calculate Totals
        const totalOriginal = originalData.reduce((acc, g) => acc + g.items.reduce((s, i) => s + (i.amount || 0), 0), 0);
        const totalAdjusted = pelarasanData.reduce((acc, g) => acc + g.items.reduce((s, i) => s + (i.amount || 0), 0), 0);
        const totalLAD = projectData.ladAmount || 0; 
        const finalPayable = totalAdjusted - totalLAD;

        return (
            <div className="flex flex-col items-center bg-gray-100 min-h-screen py-8">
                 <div className="sticky top-20 z-50 flex gap-4 mb-8 bg-white/80 backdrop-blur-md p-2 rounded-2xl shadow-lg border border-gray-200">
                    <button type="button" onClick={handleDownloadPDF} disabled={isGeneratingPdf} className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50">
                        {isGeneratingPdf ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                        <span>{isGeneratingPdf ? 'Sedang Menjana...' : 'Muat Turun Laporan Pelarasan'}</span>
                    </button>
                </div>

                <div id="pdf-pelarasan-root" className="w-[210mm] bg-white shadow-2xl">
                    
                    {/* SUMMARY PAGE */}
                    <PrintPage>
                        <PrintHeader title="LAPORAN PELARASAN MUKTAMAD" />
                        
                        <div className="border-2 border-black flex-1 flex flex-col font-arial text-sm">
                            {/* Project Info */}
                            <div className="p-4 border-b-2 border-black bg-gray-50">
                                <table className="w-full">
                                    <tbody>
                                        <tr>
                                            <td className="font-bold w-32 py-1">Tajuk Projek</td>
                                            <td className="uppercase">: {projectData.namaProjek}</td>
                                        </tr>
                                        <tr>
                                            <td className="font-bold w-32 py-1">No. Fail</td>
                                            <td>: {projectData.noFail}</td>
                                        </tr>
                                        <tr>
                                            <td className="font-bold w-32 py-1">Kontraktor</td>
                                            <td>: {projectData.namaSyarikat}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* Comparison Table */}
                            <div className="flex bg-gray-100 font-bold border-b border-black text-center text-xs">
                                <div className="w-12 p-2 border-r border-black">BIL</div>
                                <div className="flex-1 p-2 border-r border-black">KETERANGAN</div>
                                <div className="w-32 p-2 border-r border-black">KOS ASAL (RM)</div>
                                <div className="w-32 p-2 border-r border-black">PELARASAN (RM)</div>
                                <div className="w-32 p-2">BEZA (RM)</div>
                            </div>

                            {pelarasanData.map((group, idx) => {
                                // Find matching original group
                                const originalGroup = originalData.find(g => g.id === group.id);
                                const groupTotalOriginal = originalGroup ? originalGroup.items.reduce((acc, i) => acc + (i.amount || 0), 0) : 0;
                                const groupTotalAdjusted = group.items.reduce((acc, i) => acc + (i.amount || 0), 0);
                                const diff = groupTotalAdjusted - groupTotalOriginal;
                                
                                return (
                                    <div key={group.id} className="flex border-b border-black text-xs">
                                        <div className="w-12 p-2 border-r border-black text-center">{idx + 1}</div>
                                        <div className="flex-1 p-2 border-r border-black uppercase font-bold">{group.title}</div>
                                        <div className="w-32 p-2 border-r border-black text-right">{formatCurrency(groupTotalOriginal).replace('RM', '')}</div>
                                        <div className="w-32 p-2 border-r border-black text-right">{formatCurrency(groupTotalAdjusted).replace('RM', '')}</div>
                                        <div className={`w-32 p-2 text-right font-bold ${diff < 0 ? 'text-red-600' : diff > 0 ? 'text-blue-600' : ''}`}>
                                            {formatCurrency(diff).replace('RM', '')}
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Spacer */}
                            <div className="flex-1 border-b border-black"></div>

                            {/* Totals */}
                            <div className="text-sm font-bold">
                                <div className="flex border-b border-black bg-gray-50">
                                    <div className="flex-1 p-2 text-right border-r border-black">JUMLAH KOS ASAL</div>
                                    <div className="w-64 p-2 text-right">{formatCurrency(totalOriginal)}</div>
                                </div>
                                <div className="flex border-b border-black bg-gray-50">
                                    <div className="flex-1 p-2 text-right border-r border-black">JUMLAH KOS PELARASAN</div>
                                    <div className="w-64 p-2 text-right text-blue-600">{formatCurrency(totalAdjusted)}</div>
                                </div>
                                
                                {totalLAD > 0 && (
                                    <div className="flex border-b border-black text-red-600">
                                        <div className="flex-1 p-2 text-right border-r border-black">
                                            TOLAK: LAD ({projectData.ladDays || 0} HARI)
                                        </div>
                                        <div className="w-64 p-2 text-right">
                                            - {formatCurrency(totalLAD)}
                                        </div>
                                    </div>
                                )}

                                <div className="flex border-b border-black bg-indigo-50 text-base">
                                    <div className="flex-1 p-3 text-right border-r border-black uppercase">BAYARAN MUKTAMAD</div>
                                    <div className="w-64 p-3 text-right">{formatCurrency(finalPayable)}</div>
                                </div>
                            </div>
                        </div>
                    </PrintPage>
                </div>
            </div>
        );
    }

    // EDITOR VIEW
    return (
        <div className="p-4 md:p-8">
            <div className="mb-6 flex items-center justify-between">
                <div>
                   <h2 className="text-xl font-bold text-slate-800 dark:text-white">Semakan & Pelarasan</h2>
                   <p className="text-sm text-slate-500 dark:text-slate-400">Bandingkan dengan data asal dan kemaskini kuantiti di tapak.</p>
                </div>
            </div>

            {pelarasanData.map((group, groupIndex) => {
                const originalGroup = originalData.find(g => g.id === group.id);

                return (
                    <div key={group.id} className="mb-12 animate-fade-in-up">
                        <div className="flex items-center gap-3 mb-6 pb-2 border-b border-slate-200 dark:border-slate-700">
                             <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 flex items-center justify-center font-bold text-sm">
                                 {groupIndex + 1}
                             </div>
                             <h3 className="font-bold text-lg text-slate-900 dark:text-white uppercase">{group.title}</h3>
                        </div>

                        <div>
                            {group.items.map((item, itemIndex) => {
                                // Find matching original item by ID
                                const originalItem = originalGroup?.items.find(i => i.id === item.id);
                                
                                return (
                                    <ComparisonItemRow 
                                        key={item.id}
                                        originalItem={originalItem}
                                        adjustedItem={item}
                                        globalDims={globalDims}
                                        onUpdate={(updates) => handleUpdateItem(groupIndex, itemIndex, updates)}
                                    />
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default BQPelarasanEditor;