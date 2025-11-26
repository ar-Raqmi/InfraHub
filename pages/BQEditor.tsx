
import React, { useState, useEffect } from 'react';
import { BQGroup, BQItem, formatCurrency } from '../types';
import { Plus, Trash2, Printer, Save, ChevronDown, ChevronUp } from 'lucide-react';

interface BQEditorProps {
  initialData?: BQGroup[];
  onSave: (data: BQGroup[]) => void;
  projectName: string;
  noFail: string;
  projectLocation: string;
}

const uuid = () => Math.random().toString(36).substr(2, 9);

const BQEditor: React.FC<BQEditorProps> = ({ initialData, onSave, projectName, noFail, projectLocation }) => {
  const [groups, setGroups] = useState<BQGroup[]>(initialData || []);

  useEffect(() => {
    if (groups.length === 0) {
      setGroups([{
        id: uuid(),
        title: 'BIL NO. 1 - KERJA-KERJA PERMULAAN',
        location: projectLocation,
        items: [
          { id: uuid(), description: '1.0 INSURAN', unit: '', qty: 0, rate: 0, amount: 0, isHeader: true },
          { id: uuid(), description: 'Menyediakan polisi insuran...', unit: 'L/S', qty: 1, rate: 0, amount: 0, isHeader: false }
        ]
      }]);
    }
  }, []);

  const addGroup = () => {
    setGroups([...groups, {
      id: uuid(),
      title: `BIL NO. ${groups.length + 1} - KERJA BARU`,
      location: projectLocation,
      items: [{ id: uuid(), description: '1.0 KERJA BARU', unit: '', qty: 0, rate: 0, amount: 0, isHeader: true }]
    }]);
  };

  const removeGroup = (groupId: string) => {
    if(confirm("Adakah anda pasti mahu memadam kumpulan ini?")) {
      setGroups(groups.filter(g => g.id !== groupId));
    }
  }

  const addItem = (groupId: string) => {
    setGroups(groups.map(g => {
      if (g.id === groupId) {
        return {
          ...g,
          items: [...g.items, { id: uuid(), description: '', unit: '', qty: 1, rate: 0, amount: 0 }]
        };
      }
      return g;
    }));
  };

  const updateItem = (groupId: string, itemId: string, field: keyof BQItem, value: any) => {
    setGroups(groups.map(g => {
      if (g.id === groupId) {
        const newItems = g.items.map(i => {
          if (i.id === itemId) {
            const updated = { ...i, [field]: value };
            if (field === 'qty' || field === 'rate') {
              updated.amount = Number(updated.qty || 0) * Number(updated.rate || 0);
            }
            if (field === 'isHeader' && value === true) {
              updated.qty = 0; updated.rate = 0; updated.amount = 0; updated.unit = '';
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

  const deleteItem = (groupId: string, itemId: string) => {
    setGroups(groups.map(g => {
      if (g.id === groupId) {
        return { ...g, items: g.items.filter(i => i.id !== itemId) };
      }
      return g;
    }));
  };

  const moveGroup = (index: number, direction: 'up' | 'down') => {
    const newGroups = [...groups];
    if (direction === 'up' && index > 0) {
      [newGroups[index], newGroups[index - 1]] = [newGroups[index - 1], newGroups[index]];
    } else if (direction === 'down' && index < newGroups.length - 1) {
      [newGroups[index], newGroups[index + 1]] = [newGroups[index + 1], newGroups[index]];
    }
    setGroups(newGroups);
  };

  const calculateTotal = () => {
    return groups.reduce((total, group) => {
      return total + group.items.reduce((gTotal, item) => gTotal + (item.amount || 0), 0);
    }, 0);
  };

  const handlePrint = () => window.print();

  return (
    <div className="space-y-6 dark:text-zinc-200">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center no-print gap-4">
        <div>
           <h2 className="text-lg font-bold text-slate-900 dark:text-white">Bangunkan BQ</h2>
           <p className="text-sm text-slate-500 dark:text-slate-400">Edit, simpan, dan cetak BQ untuk kontrak.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button onClick={handlePrint} className="flex-1 sm:flex-none justify-center flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-xl hover:bg-slate-900 transition-all shadow-lg">
            <Printer className="h-4 w-4" /> Export PDF
          </button>
          <button onClick={() => onSave(groups)} className="flex-1 sm:flex-none justify-center flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg">
            <Save className="h-4 w-4" /> Simpan BQ
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 p-4 md:p-8 shadow-sm border border-slate-200 dark:border-zinc-800 min-h-[50vh] md:min-h-[800px] overflow-x-auto print:shadow-none print:border-none print:p-0 print:w-full rounded-2xl">
        
        {/* Header for Print */}
        <div className="mb-6 border-2 border-black p-4 text-center hidden print:block">
          <h1 className="font-bold text-xl uppercase mb-2">{projectName}</h1>
          <div className="flex justify-between border-t border-black pt-2 text-sm font-bold">
             <div>NO ADUAN: {noFail}</div>
             <div>LOKASI: {projectLocation}</div>
          </div>
        </div>

        {groups.map((group, gIndex) => {
           const groupTotal = group.items.reduce((acc, curr) => acc + (curr.amount || 0), 0);
           
           return (
            <div key={group.id} className="mb-8 break-inside-avoid print:mb-4">
              <div className="flex justify-end gap-2 mb-2 no-print">
                 <button onClick={() => moveGroup(gIndex, 'up')} disabled={gIndex === 0} className="p-1 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded disabled:opacity-30"><ChevronUp className="h-4 w-4"/></button>
                 <button onClick={() => moveGroup(gIndex, 'down')} disabled={gIndex === groups.length-1} className="p-1 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded disabled:opacity-30"><ChevronDown className="h-4 w-4"/></button>
                 <button onClick={() => removeGroup(group.id)} className="text-red-500 text-xs hover:underline flex items-center gap-1"><Trash2 className="h-3 w-3"/> Padam Group</button>
              </div>

              <table className="bq-table w-full border-collapse border border-zinc-300 dark:border-zinc-700 text-sm min-w-[700px]">
                <thead>
                  <tr className="bg-slate-100 dark:bg-zinc-800 bq-header print:bg-gray-200">
                    <th className="border border-zinc-300 dark:border-zinc-700 p-2 w-12 text-center text-slate-900 dark:text-zinc-200">BIL</th>
                    <th className="border border-zinc-300 dark:border-zinc-700 p-2 text-left text-slate-900 dark:text-zinc-200">KETERANGAN</th>
                    <th className="border border-zinc-300 dark:border-zinc-700 p-2 w-20 text-center text-slate-900 dark:text-zinc-200">UNIT</th>
                    <th className="border border-zinc-300 dark:border-zinc-700 p-2 w-20 text-center text-slate-900 dark:text-zinc-200">KUANTITI</th>
                    <th className="border border-zinc-300 dark:border-zinc-700 p-2 w-28 text-right text-slate-900 dark:text-zinc-200">KADAR (RM)</th>
                    <th className="border border-zinc-300 dark:border-zinc-700 p-2 w-32 text-right text-slate-900 dark:text-zinc-200">JUMLAH (RM)</th>
                    <th className="border border-zinc-300 dark:border-zinc-700 p-2 w-10 no-print bg-white dark:bg-zinc-900 border-none"></th>
                  </tr>
                </thead>
                <tbody>
                  {/* Group Title Row */}
                  <tr className="font-bold bg-slate-50 dark:bg-zinc-800/50 print:bg-white">
                    <td className="border border-zinc-300 dark:border-zinc-700 p-2 bg-slate-800 dark:bg-slate-700 text-white print:bg-white print:text-black"></td>
                    <td className="border border-zinc-300 dark:border-zinc-700 p-2 uppercase" colSpan={5}>
                      <input 
                        value={group.title}
                        onChange={(e) => {
                          const newGroups = [...groups]; newGroups[gIndex].title = e.target.value; setGroups(newGroups);
                        }}
                        className="w-full bg-transparent font-bold focus:outline-none uppercase text-slate-900 dark:text-zinc-100"
                        placeholder="TAJUK GROUP / BILL"
                      />
                      <input 
                         value={group.location || ''}
                         onChange={(e) => {
                            const newGroups = [...groups]; newGroups[gIndex].location = e.target.value; setGroups(newGroups);
                         }}
                         className="w-full bg-transparent text-xs font-normal text-slate-500 dark:text-zinc-400 focus:outline-none print:hidden"
                         placeholder="Lokasi (jika berlainan)..."
                      />
                    </td>
                    <td className="border-none p-2 no-print"></td>
                  </tr>

                  {/* Items */}
                  {group.items.map((item, iIndex) => (
                    <tr key={item.id} className={item.isHeader ? 'font-bold' : ''}>
                      <td className="border border-zinc-300 dark:border-zinc-700 p-2 text-center align-top text-slate-900 dark:text-zinc-300">
                        {item.isHeader ? (iIndex + 1) / 10 : ''} 
                      </td>
                      <td className="border border-zinc-300 dark:border-zinc-700 p-2 align-top">
                        <textarea 
                          value={item.description}
                          onChange={(e) => updateItem(group.id, item.id, 'description', e.target.value)}
                          className={`w-full bg-transparent resize-none focus:outline-none overflow-hidden text-slate-900 dark:text-zinc-100 ${item.isHeader ? 'font-bold underline' : ''}`}
                          rows={Math.max(2, item.description.split('\n').length)}
                          placeholder="Keterangan item..."
                        />
                        <div className="flex gap-2 mt-1 no-print">
                           <label className="text-[10px] uppercase font-bold flex items-center gap-1 text-slate-400 cursor-pointer hover:text-blue-600">
                             <input type="checkbox" checked={!!item.isHeader} onChange={(e) => updateItem(group.id, item.id, 'isHeader', e.target.checked)} />
                             Jadikan Sub-Tajuk
                           </label>
                        </div>
                      </td>
                      <td className="border border-zinc-300 dark:border-zinc-700 p-2 align-top text-center">
                        <input value={item.unit} onChange={(e) => updateItem(group.id, item.id, 'unit', e.target.value)} className="w-full text-center focus:outline-none bg-transparent text-slate-900 dark:text-zinc-100" />
                      </td>
                      <td className="border border-zinc-300 dark:border-zinc-700 p-2 align-top text-center">
                         {!item.isHeader && (
                          <input type="number" value={item.qty || ''} onChange={(e) => updateItem(group.id, item.id, 'qty', parseFloat(e.target.value))} className="w-full text-center focus:outline-none bg-transparent text-slate-900 dark:text-zinc-100" />
                         )}
                      </td>
                      <td className="border border-zinc-300 dark:border-zinc-700 p-2 align-top text-right">
                        {!item.isHeader && (
                          <input type="number" value={item.rate || ''} onChange={(e) => updateItem(group.id, item.id, 'rate', parseFloat(e.target.value))} className="w-full text-right focus:outline-none bg-transparent text-slate-900 dark:text-zinc-100" />
                        )}
                      </td>
                      <td className="border border-zinc-300 dark:border-zinc-700 p-2 align-top text-right font-mono text-slate-900 dark:text-zinc-100">
                        {!item.isHeader && (item.amount > 0 ? item.amount.toFixed(2) : '0.00')}
                      </td>
                      <td className="border-none p-2 text-center no-print align-middle">
                        <button onClick={() => deleteItem(group.id, item.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}

                  {/* Add Item */}
                  <tr className="no-print">
                    <td colSpan={7} className="border border-zinc-300 dark:border-zinc-700 p-2 text-center bg-slate-50 dark:bg-zinc-800/50 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer" onClick={() => addItem(group.id)}>
                      <div className="text-blue-600 font-medium text-xs flex items-center justify-center gap-1">
                        <Plus className="h-3 w-3" /> Tambah Item
                      </div>
                    </td>
                  </tr>

                  {/* Total */}
                  <tr className="font-bold bg-slate-100 dark:bg-zinc-800 print:bg-gray-100">
                    <td className="border border-zinc-300 dark:border-zinc-700 p-2"></td>
                    <td className="border border-zinc-300 dark:border-zinc-700 p-2 text-right text-slate-900 dark:text-zinc-100" colSpan={4}>TO COLLECTION</td>
                    <td className="border border-zinc-300 dark:border-zinc-700 p-2 text-right text-slate-900 dark:text-zinc-100">{formatCurrency(groupTotal)}</td>
                    <td className="border-none p-2 no-print"></td>
                  </tr>
                </tbody>
              </table>
            </div>
          );
        })}

        <button onClick={addGroup} className="no-print w-full py-4 border-2 border-dashed border-slate-300 dark:border-zinc-700 rounded-xl text-slate-500 hover:border-blue-500 hover:text-blue-500 transition-all mb-8 flex items-center justify-center gap-2 font-medium">
           <Plus className="h-5 w-5" /> Tambah Kumpulan Kerja (Bill) Baru
        </button>

        <div className="flex justify-end mt-8 border-t-2 border-slate-900 dark:border-zinc-600 pt-4 break-inside-avoid text-slate-900 dark:text-zinc-100">
           <div className="w-full md:w-1/2 lg:w-1/3">
              <div className="flex justify-between font-bold text-xl border-b border-slate-900 dark:border-zinc-600 pb-2 mb-2">
                <span>JUMLAH KESELURUHAN:</span>
                <span>{formatCurrency(calculateTotal())}</span>
              </div>
              <p className="text-xs text-center mt-8 pt-8 border-t border-slate-900 dark:border-zinc-600 w-1/2 mx-auto">Tandatangan & Cop Kontraktor</p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default BQEditor;
