
import React, { useState, useEffect } from 'react';
import { BQGroup, BQItem, formatCurrency } from '../types';
import { Plus, Trash2, Printer, Save, ArrowLeftRight, Calculator } from 'lucide-react';

interface BQPelarasanEditorProps {
  originalData: BQGroup[];
  initialPelarasanData?: BQGroup[];
  onSave: (data: BQGroup[]) => void;
  projectName: string;
}

const uuid = () => Math.random().toString(36).substr(2, 9);

const BQPelarasanEditor: React.FC<BQPelarasanEditorProps> = ({ originalData, initialPelarasanData, onSave, projectName }) => {
  // If initialPelarasanData is empty/undefined, we deep copy originalData to start
  const [pelarasanGroups, setPelarasanGroups] = useState<BQGroup[]>([]);

  useEffect(() => {
    if (initialPelarasanData && initialPelarasanData.length > 0) {
      setPelarasanGroups(initialPelarasanData);
    } else {
      // Deep copy original data to initialize pelarasan
      setPelarasanGroups(JSON.parse(JSON.stringify(originalData)));
    }
  }, [initialPelarasanData, originalData]);

  const updateItem = (groupId: string, itemId: string, field: keyof BQItem, value: any) => {
    setPelarasanGroups(pelarasanGroups.map(g => {
      if (g.id === groupId) {
        const newItems = g.items.map(i => {
          if (i.id === itemId) {
            const updated = { ...i, [field]: value };
            if (field === 'qty' || field === 'rate') {
              updated.amount = Number(updated.qty || 0) * Number(updated.rate || 0);
            }
            return updated;
          }
          return i;
        });
        return { ...g, items: newItems };
      }
      return g;
    }));
  };

  const addVariationItem = (groupId: string) => {
    setPelarasanGroups(pelarasanGroups.map(g => {
      if (g.id === groupId) {
        return {
          ...g,
          items: [...g.items, { 
            id: uuid(), 
            description: 'KERJA TAMBAHAN (VO)', 
            unit: 'UNIT', 
            qty: 1, 
            rate: 0, 
            amount: 0 
          }]
        };
      }
      return g;
    }));
  }

  // Helper to find original item for comparison
  const getOriginalItem = (groupId: string, itemId: string): BQItem | undefined => {
    const group = originalData.find(g => g.id === groupId);
    if (!group) return undefined;
    return group.items.find(i => i.id === itemId);
  };

  const calculateTotal = (groups: BQGroup[]) => {
    return groups.reduce((total, group) => {
      return total + group.items.reduce((gTotal, item) => gTotal + (item.amount || 0), 0);
    }, 0);
  };

  const originalTotal = calculateTotal(originalData);
  const adjustedTotal = calculateTotal(pelarasanGroups);
  const variance = adjustedTotal - originalTotal;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center no-print bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-800 gap-4">
        <div>
           <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
             <Calculator className="w-5 h-5 text-blue-600"/> BQ Pelarasan (Adjustment)
           </h2>
           <p className="text-sm text-slate-500 dark:text-slate-400">Edit kuantiti/kadar baru untuk pengiraan akaun akhir.</p>
        </div>
        <div className="flex flex-wrap gap-4 text-left md:text-right w-full md:w-auto justify-between md:justify-end">
            <div>
                <p className="text-xs text-slate-500 uppercase font-bold">Kos Asal</p>
                <p className="font-mono font-bold text-slate-700 dark:text-slate-300">{formatCurrency(originalTotal)}</p>
            </div>
            <div>
                <p className="text-xs text-blue-500 uppercase font-bold">Kos Pelarasan</p>
                <p className="font-mono font-bold text-blue-600 dark:text-blue-400">{formatCurrency(adjustedTotal)}</p>
            </div>
            <div>
                <p className="text-xs text-slate-500 uppercase font-bold">Beza</p>
                <p className={`font-mono font-bold ${variance > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                    {variance > 0 ? '+' : ''}{formatCurrency(variance)}
                </p>
            </div>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 p-2 md:p-6 shadow-sm border border-slate-200 dark:border-zinc-800 min-h-[50vh] md:min-h-[600px] overflow-x-auto rounded-2xl">
        
        {pelarasanGroups.map((group) => {
           // We map over pelarasanGroups because it might have MORE items (VOs) than original
           const originalGroup = originalData.find(g => g.id === group.id);

           return (
            <div key={group.id} className="mb-8">
              <div className="bg-slate-100 dark:bg-zinc-800 p-3 font-bold text-sm uppercase text-slate-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 mb-[-1px]">
                  {group.title}
              </div>
              
              <table className="w-full border-collapse border border-zinc-300 dark:border-zinc-700 text-xs md:text-sm min-w-[900px]">
                <thead>
                  <tr className="bg-slate-50 dark:bg-zinc-800/50 text-slate-600 dark:text-zinc-400">
                    <th className="border border-zinc-300 dark:border-zinc-700 p-2 w-10 text-center" rowSpan={2}>BIL</th>
                    <th className="border border-zinc-300 dark:border-zinc-700 p-2 text-left min-w-[200px]" rowSpan={2}>KETERANGAN</th>
                    <th className="border border-zinc-300 dark:border-zinc-700 p-2 text-center" rowSpan={2}>UNIT</th>
                    
                    {/* Original Columns - Gray Background */}
                    <th colSpan={3} className="border border-zinc-300 dark:border-zinc-700 p-1 text-center bg-gray-100 dark:bg-zinc-800">ASAL (BQ)</th>
                    
                    {/* Adjusted Columns - Blue Background */}
                    <th colSpan={3} className="border border-zinc-300 dark:border-zinc-700 p-1 text-center bg-blue-50 dark:bg-blue-900/20">PELARASAN (TAPAK)</th>
                    
                    <th className="border border-zinc-300 dark:border-zinc-700 p-2 w-24 text-right" rowSpan={2}>BEZA (+/-)</th>
                  </tr>
                  <tr className="bg-slate-50 dark:bg-zinc-800/50 text-[10px] uppercase font-bold text-slate-500">
                      <th className="border border-zinc-300 dark:border-zinc-700 p-1 w-16 text-center bg-gray-100 dark:bg-zinc-800">QTY</th>
                      <th className="border border-zinc-300 dark:border-zinc-700 p-1 w-20 text-right bg-gray-100 dark:bg-zinc-800">KADAR</th>
                      <th className="border border-zinc-300 dark:border-zinc-700 p-1 w-24 text-right bg-gray-100 dark:bg-zinc-800">JUMLAH</th>
                      
                      <th className="border border-zinc-300 dark:border-zinc-700 p-1 w-16 text-center bg-blue-50 dark:bg-blue-900/20">QTY</th>
                      <th className="border border-zinc-300 dark:border-zinc-700 p-1 w-20 text-right bg-blue-50 dark:bg-blue-900/20">KADAR</th>
                      <th className="border border-zinc-300 dark:border-zinc-700 p-1 w-24 text-right bg-blue-50 dark:bg-blue-900/20">JUMLAH</th>
                  </tr>
                </thead>
                <tbody>
                  {group.items.map((item, iIndex) => {
                    const originalItem = getOriginalItem(group.id, item.id);
                    const isNewItem = !originalItem;
                    const diff = (item.amount || 0) - (originalItem?.amount || 0);

                    return (
                        <tr key={item.id} className={`${item.isHeader ? 'font-bold bg-slate-50 dark:bg-zinc-800/30' : ''} hover:bg-slate-50 dark:hover:bg-zinc-800/50`}>
                            {/* Meta */}
                            <td className="border border-zinc-300 dark:border-zinc-700 p-2 text-center align-top text-slate-900 dark:text-zinc-300">
                                {item.isHeader ? (iIndex + 1) / 10 : (isNewItem ? 'VO' : '')} 
                            </td>
                            <td className="border border-zinc-300 dark:border-zinc-700 p-2 align-top text-slate-900 dark:text-zinc-100">
                                {isNewItem ? (
                                    <textarea 
                                        value={item.description}
                                        onChange={(e) => updateItem(group.id, item.id, 'description', e.target.value)}
                                        className="w-full bg-transparent resize-none focus:outline-none text-blue-600 dark:text-blue-400"
                                        rows={2}
                                    />
                                ) : item.description}
                            </td>
                            <td className="border border-zinc-300 dark:border-zinc-700 p-2 text-center align-top text-slate-900 dark:text-zinc-100">
                                {item.unit}
                            </td>

                            {/* Original Data (Read Only) */}
                            <td className="border border-zinc-300 dark:border-zinc-700 p-2 text-center bg-gray-50 dark:bg-zinc-800/50 text-slate-500">
                                {originalItem?.qty ?? '-'}
                            </td>
                            <td className="border border-zinc-300 dark:border-zinc-700 p-2 text-right bg-gray-50 dark:bg-zinc-800/50 text-slate-500">
                                {originalItem && !originalItem.isHeader ? originalItem.rate.toFixed(2) : '-'}
                            </td>
                            <td className="border border-zinc-300 dark:border-zinc-700 p-2 text-right bg-gray-50 dark:bg-zinc-800/50 text-slate-500">
                                {originalItem && !originalItem.isHeader ? originalItem.amount.toFixed(2) : '-'}
                            </td>

                            {/* Adjusted Data (Editable) */}
                            <td className="border border-zinc-300 dark:border-zinc-700 p-2 bg-blue-50/30 dark:bg-blue-900/10">
                                {!item.isHeader && (
                                    <input 
                                        type="number" 
                                        value={item.qty} 
                                        onChange={(e) => updateItem(group.id, item.id, 'qty', parseFloat(e.target.value))} 
                                        className="w-full text-center bg-transparent focus:outline-none text-blue-700 dark:text-blue-300 font-bold border-b border-blue-200 dark:border-blue-800 focus:border-blue-500"
                                    />
                                )}
                            </td>
                            <td className="border border-zinc-300 dark:border-zinc-700 p-2 bg-blue-50/30 dark:bg-blue-900/10">
                                {!item.isHeader && (
                                    <input 
                                        type="number" 
                                        value={item.rate} 
                                        onChange={(e) => updateItem(group.id, item.id, 'rate', parseFloat(e.target.value))} 
                                        className="w-full text-right bg-transparent focus:outline-none text-blue-700 dark:text-blue-300 border-b border-blue-200 dark:border-blue-800 focus:border-blue-500"
                                    />
                                )}
                            </td>
                            <td className="border border-zinc-300 dark:border-zinc-700 p-2 text-right bg-blue-50/30 dark:bg-blue-900/10 font-bold text-blue-700 dark:text-blue-300">
                                {!item.isHeader ? item.amount.toFixed(2) : ''}
                            </td>

                            {/* Variance */}
                            <td className={`border border-zinc-300 dark:border-zinc-700 p-2 text-right font-mono ${diff !== 0 ? (diff > 0 ? 'text-red-500' : 'text-emerald-500') : 'text-slate-300'}`}>
                                {!item.isHeader && diff !== 0 ? (diff > 0 ? `+${diff.toFixed(2)}` : diff.toFixed(2)) : ''}
                            </td>
                        </tr>
                    )
                  })}

                  {/* Add VO Item Row */}
                  <tr className="no-print">
                      <td colSpan={10} className="border border-zinc-300 dark:border-zinc-700 p-2 text-center cursor-pointer hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors" onClick={() => addVariationItem(group.id)}>
                         <div className="flex items-center justify-center gap-1 text-xs text-blue-600 font-bold">
                             <Plus className="w-3 h-3"/> Tambah Item VO (Variation Order)
                         </div>
                      </td>
                  </tr>

                </tbody>
              </table>
            </div>
          );
        })}
      </div>
      
      <div className="flex justify-end gap-2 no-print">
         <button onClick={() => onSave(pelarasanGroups)} className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg font-bold">
            <Save className="h-4 w-4" /> Simpan Pelarasan
         </button>
      </div>
    </div>
  );
};

export default BQPelarasanEditor;
