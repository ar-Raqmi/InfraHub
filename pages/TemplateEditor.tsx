import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  BQTemplateDefinition, 
  BQTemplateBillDefinition, 
  BQItem, 
  PresetGroup, 
  PresetItem 
} from '../types';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  X, 
  ChevronUp, 
  ChevronDown, 
  Edit3, 
  FolderPlus, 
  Search, 
  PlusCircle, 
  Settings2, 
  Save, 
  Clock, 
  LayoutGrid, 
  Library
} from 'lucide-react';
import { formatCurrency } from '../types';

interface TemplateEditorProps {
  template: BQTemplateDefinition;
  onClose: () => void;
  onSave: (updatedTemplate: BQTemplateDefinition) => void;
  libraryGroups: PresetGroup[];
}

export const TemplateEditor: React.FC<TemplateEditorProps> = ({
  template,
  onClose,
  onSave,
  libraryGroups
}) => {
  const [editedTemplate, setEditedTemplate] = useState<BQTemplateDefinition>({
    ...template,
    bills: template.bills ? JSON.parse(JSON.stringify(template.bills)) : []
  });
  
  const [activeBillId, setActiveBillId] = useState<string>(
    editedTemplate.bills.length > 0 ? editedTemplate.bills[0].id : ''
  );
  
  // Library Modal state
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [librarySearchTerm, setLibrarySearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('HISTORY');
  const [recentItems, setRecentItems] = useState<any[]>(() => {
    const saved = localStorage.getItem('bq_recent_items');
    return saved ? JSON.parse(saved) : [];
  });

  const categories = Array.from(new Set(libraryGroups.map(g => g.category)));
  const activeBill = editedTemplate.bills.find(b => b.id === activeBillId);

  // Helper: Get unique IDs
  const generateUniqueId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // --- BILL SECTION ACTIONS ---
  const handleAddBill = () => {
    const title = prompt("Masukkan Nama Seksyen Bil (e.g. BIL NO. 2: KABEL):");
    if (!title) return;
    
    const newBill: BQTemplateBillDefinition = {
      id: generateUniqueId('bill'),
      title: title.toUpperCase(),
      items: []
    };
    
    const updated = {
      ...editedTemplate,
      bills: [...editedTemplate.bills, newBill]
    };
    setEditedTemplate(updated);
    setActiveBillId(newBill.id);
  };

  const handleRenameBill = (billId: string) => {
    const bill = editedTemplate.bills.find(b => b.id === billId);
    if (!bill) return;
    
    const title = prompt("Kemaskini Nama Seksyen Bil:", bill.title);
    if (!title) return;
    
    setEditedTemplate({
      ...editedTemplate,
      bills: editedTemplate.bills.map(b => 
        b.id === billId ? { ...b, title: title.toUpperCase() } : b
      )
    });
  };

  const handleDeleteBill = (billId: string) => {
    if (!confirm("Adakah anda pasti untuk memadam seksyen Bil ini beserta semua kandungannya?")) return;
    
    const newBills = editedTemplate.bills.filter(b => b.id !== billId);
    setEditedTemplate({
      ...editedTemplate,
      bills: newBills
    });
    
    if (activeBillId === billId) {
      setActiveBillId(newBills.length > 0 ? newBills[0].id : '');
    }
  };

  const handleMoveBill = (index: number, direction: 'up' | 'down') => {
    const newBills = [...editedTemplate.bills];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newBills.length) return;
    
    // Swap
    const temp = newBills[index];
    newBills[index] = newBills[targetIdx];
    newBills[targetIdx] = temp;
    
    setEditedTemplate({
      ...editedTemplate,
      bills: newBills
    });
  };

  // --- ITEM ACTIONS ---
  const handleUpdateItem = (billId: string, itemId: string, updates: Partial<BQItem>) => {
    setEditedTemplate({
      ...editedTemplate,
      bills: editedTemplate.bills.map(b => {
        if (b.id !== billId) return b;
        return {
          ...b,
          items: b.items.map(item => 
            item.id === itemId ? { ...item, ...updates } as any : item
          )
        };
      })
    });
  };

  const handleDeleteItem = (billId: string, itemId: string) => {
    setEditedTemplate({
      ...editedTemplate,
      bills: editedTemplate.bills.map(b => {
        if (b.id !== billId) return b;
        return {
          ...b,
          items: b.items.filter(item => item.id !== itemId)
        };
      })
    });
  };

  const handleMoveItem = (billId: string, index: number, direction: 'up' | 'down') => {
    setEditedTemplate({
      ...editedTemplate,
      bills: editedTemplate.bills.map(b => {
        if (b.id !== billId) return b;
        const newItems = [...b.items];
        const targetIdx = direction === 'up' ? index - 1 : index + 1;
        if (targetIdx < 0 || targetIdx >= newItems.length) return b;
        
        const temp = newItems[index];
        newItems[index] = newItems[targetIdx];
        newItems[targetIdx] = temp;
        
        return { ...b, items: newItems };
      })
    });
  };

  const handleAddManualHeader = (billId: string) => {
    const title = prompt("Masukkan Tajuk Header:");
    if (!title) return;
    
    const newItem: BQItem = {
      id: generateUniqueId('item'),
      type: 'HEADER',
      description: title.toUpperCase(),
      unit: '',
      rate: 0
    };
    
    setEditedTemplate({
      ...editedTemplate,
      bills: editedTemplate.bills.map(b => 
        b.id === billId ? { ...b, items: [...b.items, newItem] } : b
      )
    });
  };

  const handleAddManualNote = (billId: string) => {
    const note = prompt("Masukkan Nota:");
    if (!note) return;
    
    const newItem: BQItem = {
      id: generateUniqueId('item'),
      type: 'NOTE',
      description: note,
      unit: '',
      rate: 0
    };
    
    setEditedTemplate({
      ...editedTemplate,
      bills: editedTemplate.bills.map(b => 
        b.id === billId ? { ...b, items: [...b.items, newItem] } : b
      )
    });
  };

  const handleAddManualItem = (billId: string) => {
    const desc = prompt("Masukkan Penerangan Item:");
    if (!desc) return;
    const unit = prompt("Masukkan Unit (e.g. Nos, M, Lot):") || 'Nos';
    const rateStr = prompt("Masukkan Kadar Harga (RM):") || '0';
    const rate = parseFloat(rateStr) || 0;
    
    const newItem: BQItem = {
      id: generateUniqueId('item'),
      type: 'ITEM',
      description: desc,
      unit: unit,
      rate: rate
    };
    
    setEditedTemplate({
      ...editedTemplate,
      bills: editedTemplate.bills.map(b => 
        b.id === billId ? { ...b, items: [...b.items, newItem] } : b
      )
    });
  };

  // --- LIBRARY SELECTION ACTIONS ---
  const handleSelectLibraryItem = (group: PresetGroup, item: PresetItem, variantId?: string) => {
    if (!activeBill) return;
    
    const variant = variantId ? item.variants?.find(v => v.id === variantId) : undefined;
    
    // Check if we need to add the Group Header first
    const itemsToAdd: BQItem[] = [];
    const hasGroupHeader = activeBill.items.some(
      it => it.type === 'HEADER' && it.description === group.title.toUpperCase()
    );
    
    if (!hasGroupHeader) {
      itemsToAdd.push({
        id: generateUniqueId('item'),
        type: 'HEADER',
        description: group.title.toUpperCase(),
        unit: '',
        rate: 0
      });
    }
    
    // Add parent description header if variant is chosen and it's not present
    if (variant) {
      const hasParentHeader = activeBill.items.some(
        it => it.type === 'HEADER' && it.description === item.description
      );
      if (!hasParentHeader) {
        itemsToAdd.push({
          id: generateUniqueId('item'),
          type: 'HEADER',
          description: item.description,
          unit: '',
          rate: 0
        });
      }
    }
    
    const newItem: BQItem = {
      id: generateUniqueId('item'),
      type: 'ITEM',
      description: variant ? '' : item.description,
      variant: variant ? variant.label : undefined,
      unit: variant ? variant.unit : (item.unit || 'Nos'),
      rate: variant ? variant.rate : (item.rate || 0),
      isGlobal: false
    };
    
    // Save to history
    const historyItem = {
      groupId: group.id,
      itemId: item.id,
      variantId
    };
    const updatedHistory = [historyItem, ...recentItems.filter(ri => !(ri.groupId === group.id && ri.itemId === item.id && ri.variantId === variantId))].slice(0, 10);
    setRecentItems(updatedHistory);
    localStorage.setItem('bq_recent_items', JSON.stringify(updatedHistory));
    
    itemsToAdd.push(newItem);
    
    setEditedTemplate({
      ...editedTemplate,
      bills: editedTemplate.bills.map(b => 
        b.id === activeBillId ? { ...b, items: [...b.items, ...itemsToAdd] } : b
      )
    });
  };

  // --- FILTERED LIBRARY GROUPS ---
  const filteredLibraryGroups = (() => {
    const searchLower = librarySearchTerm.toLowerCase();
    const recentGroupIds = Array.from(new Set(recentItems.map(ri => ri.groupId)));
    const recentGroupsData = recentGroupIds.map(id => libraryGroups.find(g => g.id === id)).filter(Boolean) as PresetGroup[];

    if (librarySearchTerm) {
      const matchesSearch = (g: PresetGroup) => 
        g.title.toLowerCase().includes(searchLower) ||
        g.items.some(item => 
          item.description.toLowerCase().includes(searchLower) ||
          (item.variants && item.variants.some(v => v.label.toLowerCase().includes(searchLower)))
        );

      const matchedRecent = recentGroupsData.filter(matchesSearch);
      const matchedLibrary = libraryGroups.filter(g =>
        matchesSearch(g) && !matchedRecent.some(rg => rg.id === g.id)
      );

      const filterGroupItems = (g: PresetGroup) => {
        const titleMatches = g.title.toLowerCase().includes(searchLower);
        if (titleMatches) return g;
        return {
          ...g,
          items: g.items
            .map(item => {
              const descMatches = item.description.toLowerCase().includes(searchLower);
              if (descMatches || !item.variants) return item;
              const matchingVariants = item.variants.filter(v => v.label.toLowerCase().includes(searchLower));
              if (matchingVariants.length > 0) return { ...item, variants: matchingVariants };
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

    if (selectedCategory === 'HISTORY') {
      return recentGroupsData;
    }

    return libraryGroups.filter(g => g.category === selectedCategory);
  })();

  return (
    <div className="bg-slate-900 min-h-screen text-slate-100 p-6 md:p-8 animate-fade-in relative z-10 flex flex-col rounded-[2.5rem]">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-800 pb-6 mb-8 shrink-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={onClose} 
            className="p-3 bg-slate-800 hover:bg-slate-700 rounded-2xl text-slate-400 hover:text-white transition-colors"
            title="Kembali ke Tetapan"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] font-black rounded uppercase tracking-wider">
                Pembina Template
              </span>
              <span className="text-[10px] font-mono text-slate-500">#{editedTemplate.key}</span>
            </div>
            <h1 className="text-2xl font-bold text-white mt-1 uppercase tracking-tight">{editedTemplate.title}</h1>
            <p className="text-xs text-slate-400">{editedTemplate.subtitle || 'Tiada keterangan disediakan'}</p>
          </div>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
          <button 
            onClick={onClose} 
            className="flex-1 md:flex-none px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-colors text-xs"
          >
            Batal
          </button>
          <button 
            onClick={() => onSave(editedTemplate)} 
            className="flex-1 md:flex-none px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/25 transition-all hover:scale-102 flex items-center justify-center gap-2 text-xs"
          >
            <Save className="w-4 h-4" /> Simpan Template
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-8 overflow-hidden min-h-0">
        {/* Sidebar: List of Bill Sections in Template */}
        <div className="w-full lg:w-80 flex flex-col gap-6 shrink-0 bg-slate-850 p-6 rounded-3xl border border-slate-800 overflow-y-auto">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Seksyen Bil</h3>
            <button 
              onClick={handleAddBill} 
              className="text-xs flex items-center gap-1 text-blue-400 hover:text-blue-300 font-bold"
            >
              <FolderPlus className="w-4 h-4" /> Tambah Bil
            </button>
          </div>
          
          <div className="space-y-2 flex-1">
            {editedTemplate.bills.map((bill, index) => {
              const isActive = activeBillId === bill.id;
              return (
                <div 
                  key={bill.id} 
                  onClick={() => setActiveBillId(bill.id)} 
                  className={`w-full text-left p-4 rounded-2xl text-xs transition-colors relative group cursor-pointer border ${
                    isActive 
                      ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/15' 
                      : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border-slate-750 hover:border-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0 pr-12">
                      <div className={`text-[9px] font-black tracking-widest uppercase mb-1 ${isActive ? 'text-blue-200' : 'text-slate-500'}`}>
                        BIL NO. {index + 1}
                      </div>
                      <div className="font-bold leading-snug break-words uppercase">{bill.title}</div>
                      <div className={`mt-2 text-[9px] font-mono ${isActive ? 'text-blue-100' : 'text-slate-500'}`}>
                        {bill.items.length} items
                      </div>
                    </div>
                    
                    <div className="absolute top-3 right-3 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/90 rounded-lg p-1 border border-slate-700">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleMoveBill(index, 'up'); }} 
                        disabled={index === 0} 
                        className="p-1 hover:bg-slate-800 rounded disabled:opacity-30 text-slate-400"
                        title="Alih ke atas"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleMoveBill(index, 'down'); }} 
                        disabled={index === editedTemplate.bills.length - 1} 
                        className="p-1 hover:bg-slate-800 rounded disabled:opacity-30 text-slate-400"
                        title="Alih ke bawah"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleRenameBill(bill.id); }} 
                        className="p-1 hover:bg-slate-800 text-blue-400 hover:text-blue-300 rounded"
                        title="Ubah nama"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteBill(bill.id); }} 
                        className="p-1 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded mt-1"
                        title="Padam Bil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {editedTemplate.bills.length === 0 && (
              <div className="text-center py-12 text-slate-500 border border-dashed border-slate-800 rounded-3xl">
                Tiada seksyen Bil
              </div>
            )}
          </div>
        </div>

        {/* Center/Right: BQ Items in Selected Bill */}
        <div className="flex-1 bg-slate-850 p-6 md:p-8 rounded-3xl border border-slate-800 overflow-y-auto flex flex-col min-h-0">
          {activeBill ? (
            <>
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-800 pb-6 mb-6 shrink-0">
                <div>
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Kandungan Seksyen
                  </span>
                  <h3 className="text-lg font-bold text-white uppercase">{activeBill.title}</h3>
                </div>
                
                <div className="flex gap-2 flex-wrap">
                  <button 
                    onClick={() => handleAddManualHeader(activeBill.id)} 
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-[10px] uppercase tracking-wider flex items-center gap-1.5 transition-colors border border-slate-750"
                  >
                    + Header
                  </button>
                  <button 
                    onClick={() => handleAddManualNote(activeBill.id)} 
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-[10px] uppercase tracking-wider flex items-center gap-1.5 transition-colors border border-slate-750"
                  >
                    + Nota
                  </button>
                  <button 
                    onClick={() => handleAddManualItem(activeBill.id)} 
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-[10px] uppercase tracking-wider flex items-center gap-1.5 transition-colors border border-slate-750"
                  >
                    + Item Manual
                  </button>
                  <button 
                    onClick={() => setIsLibraryOpen(true)} 
                    className="px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 hover:text-blue-300 border border-blue-500/30 font-bold rounded-xl text-[10px] uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    <Library className="w-3.5 h-3.5" /> Ambil dari Pustaka
                  </button>
                </div>
              </div>
              
              <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
                {activeBill.items.map((item, idx) => {
                  if (item.type === 'HEADER') {
                    return (
                      <div key={item.id} className="flex items-center gap-3 py-3 px-4 bg-slate-800 border border-slate-750 rounded-2xl group">
                        <span className="text-[10px] font-black text-slate-500 w-[20px]">{idx + 1}</span>
                        <input 
                          type="text" 
                          value={item.description} 
                          onChange={(e) => handleUpdateItem(activeBill.id, item.id, { description: e.target.value.toUpperCase() })} 
                          className="flex-1 bg-transparent border-0 outline-none text-white font-bold uppercase text-xs" 
                          placeholder="TAJUK/HEADER..." 
                        />
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-850 p-1 rounded-xl border border-slate-700">
                          <button onClick={() => handleMoveItem(activeBill.id, idx, 'up')} disabled={idx === 0} className="p-1 hover:bg-slate-800 text-slate-400 disabled:opacity-30"><ChevronUp className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleMoveItem(activeBill.id, idx, 'down')} disabled={idx === activeBill.items.length - 1} className="p-1 hover:bg-slate-800 text-slate-400 disabled:opacity-30"><ChevronDown className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleDeleteItem(activeBill.id, item.id)} className="p-1 hover:bg-red-950/30 text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    );
                  }
                  
                  if (item.type === 'NOTE') {
                    return (
                      <div key={item.id} className="flex items-center gap-3 py-3 px-4 bg-slate-800/60 border border-slate-750/50 rounded-2xl group border-dashed">
                        <span className="text-[10px] font-black text-slate-500 w-[20px]">{idx + 1}</span>
                        <textarea 
                          value={item.description} 
                          onChange={(e) => handleUpdateItem(activeBill.id, item.id, { description: e.target.value })} 
                          className="flex-1 bg-transparent border-0 outline-none text-slate-400 text-xs italic resize-none" 
                          placeholder="Nota..." 
                          rows={1}
                        />
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-850 p-1 rounded-xl border border-slate-700">
                          <button onClick={() => handleMoveItem(activeBill.id, idx, 'up')} disabled={idx === 0} className="p-1 hover:bg-slate-800 text-slate-400 disabled:opacity-30"><ChevronUp className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleMoveItem(activeBill.id, idx, 'down')} disabled={idx === activeBill.items.length - 1} className="p-1 hover:bg-slate-800 text-slate-400 disabled:opacity-30"><ChevronDown className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleDeleteItem(activeBill.id, item.id)} className="p-1 hover:bg-red-950/30 text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={item.id} className="p-4 bg-slate-800 border border-slate-750 rounded-2xl group hover:border-slate-700 transition-all">
                      <div className="flex justify-between items-start gap-4">
                        <div className="text-[10px] font-black text-slate-500 mt-1">{idx + 1}</div>
                        <div className="flex-1">
                          <textarea 
                            value={item.description} 
                            onChange={(e) => handleUpdateItem(activeBill.id, item.id, { description: e.target.value })} 
                            className="w-full bg-transparent border-0 outline-none text-xs font-semibold text-slate-200 resize-none pl-1" 
                            rows={2}
                          />
                          {item.variant && (
                            <div className="text-[10px] text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 w-fit mt-1 ml-1 font-bold">
                              {item.variant}
                            </div>
                          )}
                        </div>
                        
                        <div className="text-right shrink-0 flex flex-col items-end gap-1.5">
                          <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold">
                            <span>Kadar:</span>
                            <input 
                              type="number" 
                              value={item.rate} 
                              onChange={(e) => handleUpdateItem(activeBill.id, item.id, { rate: parseFloat(e.target.value) || 0 })} 
                              className="w-20 text-right bg-slate-850 border border-slate-700 rounded px-1.5 py-0.5 outline-none text-slate-200 font-mono text-[10px]" 
                            />
                          </div>
                          
                          <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold">
                            <span>Unit:</span>
                            <input 
                              type="text" 
                              value={item.unit} 
                              onChange={(e) => handleUpdateItem(activeBill.id, item.id, { unit: e.target.value })} 
                              className="w-14 text-center bg-slate-850 border border-slate-700 rounded px-1.5 py-0.5 outline-none text-slate-200 font-mono text-[10px]" 
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity mt-2 bg-slate-850/50 p-1 rounded-xl border border-slate-750 w-fit ml-auto">
                        <button onClick={() => handleMoveItem(activeBill.id, idx, 'up')} disabled={idx === 0} className="p-1 hover:bg-slate-800 text-slate-400 disabled:opacity-30"><ChevronUp className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleMoveItem(activeBill.id, idx, 'down')} disabled={idx === activeBill.items.length - 1} className="p-1 hover:bg-slate-800 text-slate-400 disabled:opacity-30"><ChevronDown className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDeleteItem(activeBill.id, item.id)} className="p-1 hover:bg-red-950/30 text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  );
                })}
                
                {activeBill.items.length === 0 && (
                  <div className="text-center py-20 text-slate-500 border border-dashed border-slate-800 rounded-3xl">
                    Sila tambah BQ item atau Ambil dari Pustaka BQ
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
              <LayoutGrid className="w-16 h-16 mb-4 opacity-20" />
              <h3 className="text-lg font-bold text-slate-400">Tiada Seksyen Bil Dipilih</h3>
              <p className="text-xs mt-1">Sila pilih seksyen bil dari sidebar kiri atau tambah seksyen baru.</p>
            </div>
          )}
        </div>
      </div>

      {/* --- BQ LIBRARY MODAL --- */}
      {isLibraryOpen && activeBill && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 animate-fade-in" onClick={() => setIsLibraryOpen(false)}>
          <div className="bg-slate-900 text-slate-100 rounded-[2.5rem] shadow-2xl max-w-4xl w-full h-[80vh] flex flex-col overflow-hidden border border-slate-800 transform scale-100 transition-colors animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20">
                  <Library className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white">Ambil Item dari Pustaka</h3>
                  <p className="text-xs text-slate-400">Klik butang [+] untuk menambah item ke dalam template</p>
                </div>
              </div>
              <button onClick={() => setIsLibraryOpen(false)} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors"><X className="w-6 h-6" /></button>
            </div>
            
            <div className="flex-1 flex overflow-hidden">
              {/* Category sidebar inside modal */}
              <div className="w-64 bg-slate-950 border-r border-slate-800 p-4 space-y-1 overflow-y-auto custom-scrollbar shrink-0">
                <button 
                  onClick={() => setSelectedCategory('HISTORY')} 
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-colors mb-2 flex items-center gap-2 ${
                    selectedCategory === 'HISTORY' 
                      ? 'bg-blue-600 text-white shadow-md' 
                      : 'text-slate-400 hover:bg-slate-900'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" /> Sejarah Pilihan
                </button>
                <div className="h-px bg-slate-800 my-2 mx-2"></div>
                {categories.map(cat => (
                  <button 
                    key={cat} 
                    onClick={() => setSelectedCategory(cat)} 
                    className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                      selectedCategory === cat 
                        ? 'bg-blue-600 text-white shadow-md' 
                        : 'text-slate-400 hover:bg-slate-900'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Main library items inside modal */}
              <div className="flex-1 p-6 overflow-y-auto custom-scrollbar bg-slate-900">
                <div className="space-y-6">
                  {/* Search Bar */}
                  <div className="sticky top-0 bg-slate-900 z-10 pb-4 mb-2 border-b border-slate-850 flex items-center justify-between gap-4">
                    <div className="relative group flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                      <input
                        type="text"
                        placeholder="Cari kumpulan item (cth: Longkang, Cerucuk)..."
                        value={librarySearchTerm}
                        onChange={(e) => setLibrarySearchTerm(e.target.value)}
                        className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-sm focus:border-blue-500 focus:bg-slate-950 outline-none text-slate-200 transition-all"
                      />
                      {librarySearchTerm && (
                        <button
                          onClick={() => setLibrarySearchTerm('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-800 rounded-full text-slate-400 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  {filteredLibraryGroups.length > 0 ? (
                    filteredLibraryGroups.map(group => (
                      <div key={group.id} className="space-y-3">
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-1 flex items-center gap-1.5">
                          {(selectedCategory === 'HISTORY' || (group as any).isHistoryMatch) && <Clock className="w-3 h-3 text-blue-500" />}
                          {group.title}
                        </h4>
                        <div className="grid grid-cols-1 gap-2">
                          {group.items.map(item => (
                            <div key={`${group.id}-${item.id}`} className="p-4 bg-slate-950 border border-slate-850 rounded-2xl transition-colors hover:border-blue-500 group/item">
                              <div className="flex justify-between items-start gap-4">
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-bold text-slate-200 leading-snug">{item.description}</p>
                                  <div className="mt-2.5 flex gap-2 flex-wrap">
                                    {(!item.variants || item.variants.length === 0) ? (
                                      <button
                                        onClick={() => handleSelectLibraryItem(group, item)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 hover:border-blue-500 text-blue-400 hover:text-white text-[10px] font-bold rounded-lg transition-colors shadow-sm"
                                      >
                                        <Plus className="w-3.5 h-3.5" /> Pilih Item
                                      </button>
                                    ) : (
                                      item.variants.map((v: any) => (
                                        <button
                                          key={v.id}
                                          onClick={() => handleSelectLibraryItem(group, item, v.id)}
                                          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 hover:border-blue-500 text-blue-400 hover:text-white text-[10px] font-bold rounded-lg transition-colors shadow-sm"
                                        >
                                          <Plus className="w-3.5 h-3.5" /> {v.label}
                                        </button>
                                      ))
                                    )}
                                  </div>
                                </div>
                                
                                <div className="text-right shrink-0">
                                  {(!item.variants || item.variants.length === 0) && (
                                    <>
                                      <p className="text-[9px] font-black text-slate-500 uppercase leading-none">Kadar</p>
                                      <p className="font-mono font-bold text-blue-400 text-xs mt-1">{formatCurrency(item.rate || 0)}</p>
                                    </>
                                  )}
                                  <span className="text-[9px] bg-slate-900 px-1.5 py-0.5 rounded text-slate-400 border border-slate-800 font-bold uppercase mt-2 inline-block">
                                    {item.unit || 'Nos'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                      <Search className="w-12 h-12 mb-4 opacity-10" />
                      <p className="text-xs font-medium">Tiada item dijumpai untuk "{librarySearchTerm}"</p>
                      <button onClick={() => setLibrarySearchTerm('')} className="mt-2 text-xs text-blue-400 font-bold hover:underline">Kosongkan carian</button>
                    </div>
                  )}
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
